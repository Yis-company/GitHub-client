# Pre-push checks and Turbo cache

Use the root Bun scripts so cached work includes the actual Node version/ABI,
Bun version, OS and architecture. Run `bun run check:push` to execute the same
checks as the Git hook:

1. `bun run lint`: Biome lint, formatting and import checks, without writes.
2. `bun run typecheck`: all three workspace TypeScript checks through Turbo.
3. `bun run test`: uncached hook/cache tooling fixtures, then core `vitest run`
   through Turbo. Desktop and UI have no unit-test command.

The guard does not build or start a server. Playwright, Rust Clippy, native tests
and changeset validation retain their existing CI coverage. Tauri packaging and
release publication remain outside this cache rollout. `bun run format` writes
files and is never run by the hook. Desktop's compiler may update local
incremental metadata without rewriting source.

## Hook installation

A normal `bun install` runs `prepare` and installs the executable
`.githooks/pre-push` using repository-local `core.hooksPath`. After an install
with `--ignore-scripts`, run `bun run hooks:install` explicitly. Installation is
repeatable and skips CI and source archives without `.git` metadata.

The installer refuses to replace another `core.hooksPath` or disable existing
non-sample default hooks. If it reports a conflict, integrate this pre-push guard
with your personal hook setup deliberately. Missing tools or failed checks make
the hook fail; it never fixes source automatically. Biome still checks the same
working tree, including eligible untracked files, so unrelated local files may
need attention before a push.

## Personal remote cache

Project configuration uses `https://turbo-cache.yitam.dev`, team `github-client`.
This is the Yis/personal service, separate from CargoKing. The wrapper overrides
inherited API/team environment settings to keep this project's namespace fixed.
The service uses static bearer authentication: team names separate artifact
paths within one shared trust domain, not access-control boundaries.

Provide the existing personal-service token as `TURBO_TOKEN` through your secure
environment/secret manager, then use `bun run typecheck`, `bun run test` or
`bun run build`. Do not commit it, put it in a command-line flag, save it in
`.turbo/config.json`, or copy another project's plaintext credentials. No login,
custom authentication, signing or hashing is required.

Without a nonempty exported `TURBO_TOKEN`, the wrapper explicitly selects
`--cache=local:rw`. Fork and Dependabot CI steps also receive no token. A configured
but invalid token may cause Turbo to warn and continue with local execution;
neither a configured endpoint nor a successful check proves remote reuse.

Only the existing CI web typecheck/test steps reference the repository
`TURBO_TOKEN` secret. Creating or updating that GitHub secret is a separate
operation. Lint, dependency installation, Playwright and release steps do not
receive it from this wiring. Use root scripts rather than direct `bunx turbo`
commands, which bypass runtime identity and the explicit local fallback.

## Cache contract

| Work | Inputs | Restored output |
| --- | --- | --- |
| Frontend build | Default package inputs and dependency graph, `.env*`, `VITE_*`, shared files and runtime/environment identity | Desktop `dist/**` only |
| Workspace types | Default package inputs and `^typecheck`, shared files and runtime/environment identity | Logs/status only |
| Core unit tests | Core source/tests/local SQLite fixtures, dependency inputs, shared files and runtime/environment identity | Logs/status only |

Shared inputs include root `tsconfig.json`, `patches/**`, and the wrapper itself;
Turbo also accounts for package manifests and the Bun lockfile. `NODE_ENV` and
`CI` contribute to keys. Native SQLite-dependent tests cannot share results
across different Node ABIs, OSes, architectures or Bun versions.

TypeScript `.tsbuildinfo` files are optional local accelerators, not restored
artifacts. Do not cache `node_modules`, temporary databases, Rust targets,
Tauri binaries, installers, updater bundles or signing material. Root Biome is
deliberately uncached because it checks the broad working tree and Git ignore
state. Dev/watch tasks remain uncached. No integration/E2E, migration, deployment
or publication task is added to Turbo.

## Verification

`node --test scripts/*.test.mjs` tests fresh offline Bun installation, existing
hook preservation, failure propagation through real pushes to a temporary local
bare repository, runtime/namespace/fallback handling, native Turbo artifact
restoration, and input invalidation. Fixtures use disposable directories and
separate Bun/Turbo caches; they never push to an external remote or use a real
remote-cache token. These tooling tests also run with `bun run test`.

For authenticated remote validation, obtain the existing token securely and use
an isolated deterministic Turbo fixture in team `github-client`. Use a unique
ordinary source marker and new local cache directories for each run. First
upload the artifact; remove only its fixture output, then repeat identical
inputs with an empty local cache. Require an explicit remote hit and exact
artifact restoration. Change an input and require a miss and changed artifact.
Do not wipe an existing cache or invoke real application/release operations.

Keep these evidence levels separate: source configuration, local hook/check
execution, authenticated remote reuse, and actual CI execution. Missing
credentials prevent authenticated validation. Preserve sanitized task counts,
cache source, exit codes and restored output evidence; do not publish raw Turbo
run summaries, which can include environment metadata.

Turbo 2.11.10 includes `TURBO_*` among its built-in task passthrough variables.
Each task explicitly excludes `TURBO_TOKEN` via `passThroughEnv`, keeping the
token available to the cache client without exposing it to workspace commands.
The fixture verifies this with a synthetic marker and remote I/O disabled.
