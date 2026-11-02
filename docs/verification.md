# Verification receipts

Use existing root scripts for install, lint, types, tests and build. Keep each
check's output and exit status separate, especially when comparing two revisions.
Run this recipe in Bash from the repository root; it records selected metadata,
not the process environment. Logs and browser artifacts stay in ignored `logs/`.

```bash
mkdir -p logs
receipt_dir=$(mktemp -d "$PWD/logs/verification.XXXXXX")
{
  printf 'cwd=%s\nsha=%s\n' "$PWD" "$(git rev-parse HEAD)"
  if [[ -n $(git status --porcelain) ]]; then echo 'dirty=true'; else echo 'dirty=false'; fi
  node --version
  bun --version
  cargo --version
  printf 'browser_workers=requested: config/default; effective: see browser log\n'
} > "$receipt_dir/metadata.txt"

check() {
  local name=$1
  shift
  # Names must be unique within this receipt directory.
  [[ ! -e "$receipt_dir/$name.log" ]] || return 2
  printf '%q ' "$@" > "$receipt_dir/$name.command"
  printf '\n' >> "$receipt_dir/$name.command"
  local statuses
  if "$@" 2>&1 | tee "$receipt_dir/$name.log"; then
    statuses=("${PIPESTATUS[@]}")
  else
    statuses=("${PIPESTATUS[@]}")
  fi
  printf 'command_exit=%s\nlog_exit=%s\n' "${statuses[0]}" "${statuses[1]}" \
    > "$receipt_dir/$name.status"
  if (( statuses[0] != 0 )); then return "${statuses[0]}"; fi
  return "${statuses[1]}"
}

check install bun install --frozen-lockfile &&
check lint bun run lint &&
check types bun run typecheck &&
check tests bun run test &&
check build bun run build
```

Put `~/.cargo/bin` on PATH when needed.
`bun install` runs the existing hook installer; a personal-hook conflict is a
failure to resolve deliberately, not permission to bypass or replace the hook.
If overriding browser workers, put the exact flag in the recorded command and
update the requested-worker metadata; the browser log reports effective workers.
The recipe preserves a failing command's code even when logging succeeds. A
logging failure also fails the check; both codes remain in its status file.

## Browser diagnostics

```bash
if check browser bun --cwd apps/desktop test:e2e; then
  browser_status=0
else
  browser_status=$?
fi
# Copy before any subsequent browser run overwrites these directories.
for directory in test-results playwright-report; do
  if [[ -d "apps/desktop/$directory" ]]; then
    cp -R "apps/desktop/$directory" "$receipt_dir/$directory"
  fi
done
printf 'browser_exit=%s\n' "$browser_status"
(exit "$browser_status")
```

The final subshell returns the browser status after preserving artifacts,
without closing an interactive shell. A later copy or report command must not
turn a failing test result into a pass. A run with no completed tests may have
only the command log, without a browser trace.

Failed tests retain `trace.zip`, a screenshot and failure context under
`apps/desktop/test-results/`; the HTML report is under
`apps/desktop/playwright-report/` and never opens a browser automatically. Inspect
a copied trace with `bunx playwright show-trace <trace.zip>` or a copied report
with `bunx playwright show-report <report-directory>` when browser work is wanted.
CI uploads both directories when the E2E step fails, retaining them for seven
days. Local file inspection proves artifact generation and selection; verify
upload/download separately on an authorized CI run. Tests use synthetic GitHub
fixtures; keep real tokens and environment dumps out of receipts and traces.

## Linux credential compatibility

Install the normal Tauri system libraries, plus `dbus` and `gnome-keyring`.
The launcher requires Bash, Cargo, `dbus-run-session`, `gdbus` (GLib tools),
`gnome-keyring-daemon`, `setsid` and `timeout` on PATH.

```bash
check credentials bash scripts/check-credential-compat.sh
```

The launcher compiles the named integration test, then creates a private D-Bus
session, foreground Secret Service daemon and temporary HOME/XDG directories.
The test verifies private directories and the actual service owner's PID,
working directory and control directory before opening an entry. It writes a
synthetic credential with the pinned legacy backend, then reads, updates and
deletes it through the production keyring dependency. It also checks missing
entries. The ordinary native test command skips this real-service scenario;
directly running the ignored test without its launcher refuses to access entries.

The private session has a 120-second limit after compilation. The launcher
cleans up its own session process group and generated directory on exit or
interruption. It never replaces or stops the desktop's keyring daemon. This
proves backend compatibility on Linux, not full Tauri commands or other OSes.

## External Monitor handoff

The local retrospective at `.codex/retros/2026-10-26--2026-11-01/report.md` and
its `evidence/monitor-calls.json` ledger record 19 Claude 2.1.314 Monitor calls,
including duplicate waits. These review artifacts remain in the workspace. Requested
string timeouts of 1800000/3000000 returned `timeoutMs: 300000`; the cause is not
established. The retrospective recorded installed version 2.1.316 without
replaying it. This repository does not own the harness implementation; this
follow-up remains unresolved.

Source session, October 30, 2026 (Monitor call identifiers are in the ledger):

<t3-thread://v2/4be3ac2c-c0f2-43eb-ba1a-62cfdbc4edff/mcp:launch:35b8a34479e38245d9ac4f519255f531e459f21721330e631fa84951138a3d3a>

The harness owner should establish the supported schema/version, reject invalid
timeout arguments or report the effective cap, and reuse task completion events
or reject/reuse a duplicate wait. Verify with a harmless disposable task that
supported durations, invalid-input handling and duplicate waits behave correctly.
Changing installed binaries, another repository or global steering needs a
separate scope; this handoff does not authorize external messages or issue writes.
