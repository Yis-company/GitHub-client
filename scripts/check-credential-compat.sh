#!/usr/bin/env bash
# Isolation and local verification receipts: docs/verification.md
set -euo pipefail

for tool in cargo dbus-run-session gnome-keyring-daemon gdbus setsid timeout; do
  command -v "$tool" >/dev/null || { printf 'Missing prerequisite: %s\n' "$tool" >&2; exit 1; }
done
[[ $(uname -s) == Linux ]] || { printf 'This compatibility check requires Linux.\n' >&2; exit 1; }

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
export GITHUB_CLIENT_KEYRING_MANIFEST="$root/apps/desktop/src-tauri/Cargo.toml"
# Compile before starting the disposable service; retain the caller's toolchain caches.
cargo test --locked --manifest-path "$GITHUB_CLIENT_KEYRING_MANIFEST" --test credential_compat --no-run
export CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}"
export RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
umask 077
GITHUB_CLIENT_KEYRING_FIXTURE=$(mktemp -d "${TMPDIR:-/tmp}/github-client-keyring.XXXXXX")
export GITHUB_CLIENT_KEYRING_FIXTURE
session_pid=
cleanup() {
  result=$?
  trap - EXIT INT TERM
  if [[ -n $session_pid ]]; then
    # This group was created by setsid below and contains only this fixture's children.
    kill -- "-$session_pid" 2>/dev/null || true
    wait "$session_pid" 2>/dev/null || true
  fi
  rm -rf -- "$GITHUB_CLIENT_KEYRING_FIXTURE"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for directory in home runtime data config cache control; do
  mkdir "$GITHUB_CLIENT_KEYRING_FIXTURE/$directory"
done
export HOME="$GITHUB_CLIENT_KEYRING_FIXTURE/home"
export XDG_RUNTIME_DIR="$GITHUB_CLIENT_KEYRING_FIXTURE/runtime"
export XDG_DATA_HOME="$GITHUB_CLIENT_KEYRING_FIXTURE/data"
export XDG_CONFIG_HOME="$GITHUB_CLIENT_KEYRING_FIXTURE/config"
export XDG_CACHE_HOME="$GITHUB_CLIENT_KEYRING_FIXTURE/cache"
unset DBUS_SESSION_BUS_ADDRESS DBUS_SESSION_BUS_PID GNOME_KEYRING_CONTROL GNOME_KEYRING_PID SSH_AUTH_SOCK
unset GITHUB_TOKEN GH_TOKEN TURBO_TOKEN

# Expand these variables only inside the private session.
# shellcheck disable=SC2016
setsid timeout --kill-after=5s 120s dbus-run-session -- bash -euo pipefail -c '
  cd "$GITHUB_CLIENT_KEYRING_FIXTURE"
  gnome-keyring-daemon --foreground --unlock --components=secrets \
    --control-directory "$GITHUB_CLIENT_KEYRING_FIXTURE/control" \
    < <(printf %s synthetic-fixture-password) > daemon.log 2>&1 &
  daemon_pid=$!
  printf "%s\n" "$daemon_pid" > daemon.pid
  stop_daemon() { kill "$daemon_pid" 2>/dev/null || true; wait "$daemon_pid" 2>/dev/null || true; }
  trap stop_daemon EXIT
  trap "exit 130" INT
  trap "exit 143" TERM
  service_ready() {
    local alias collection locked
    gdbus call --session --timeout 1 --dest org.freedesktop.DBus \
      --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.GetConnectionUnixProcessID \
      org.freedesktop.secrets >/dev/null 2>&1 || return 1
    alias=$(gdbus call --session --timeout 1 --dest org.freedesktop.secrets \
      --object-path /org/freedesktop/secrets --method org.freedesktop.Secret.Service.ReadAlias \
      default 2>/dev/null) || return 1
    [[ $alias =~ /org/freedesktop/secrets/collection/[[:alnum:]_]+ ]] || return 1
    collection=${BASH_REMATCH[0]}
    locked=$(gdbus call --session --timeout 1 --dest org.freedesktop.secrets \
      --object-path "$collection" --method org.freedesktop.DBus.Properties.Get \
      org.freedesktop.Secret.Collection Locked 2>/dev/null) || return 1
    [[ $locked == "(<false>,)" ]]
  }
  deadline=$((SECONDS + 15))
  until service_ready; do
    if ! kill -0 "$daemon_pid" 2>/dev/null || (( SECONDS >= deadline )); then
      printf "Disposable Secret Service did not become ready.\n" >&2
      cat daemon.log >&2
      exit 1
    fi
    sleep 0.1
  done
  cargo test --locked --manifest-path "$GITHUB_CLIENT_KEYRING_MANIFEST" --test credential_compat \
    -- --ignored --exact legacy_credentials_remain_accessible --nocapture
' &
session_pid=$!
wait "$session_pid"
