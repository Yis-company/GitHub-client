import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const { remoteCache } = JSON.parse(readFileSync(resolve(root, "turbo.json"), "utf8"))
const bun = spawnSync("bun", ["--version"], { encoding: "utf8" })
if (bun.error || bun.status !== 0)
  throw new Error("Bun is required. Run with the project's Bun install.")

const env = {
  ...process.env,
  TURBO_API: remoteCache.apiUrl,
  TURBO_TEAM: remoteCache.teamSlug,
  GITHUB_CLIENT_CACHE_RUNTIME: JSON.stringify({
    node: process.version,
    abi: process.versions.modules,
    platform: process.platform,
    arch: process.arch,
    bun: bun.stdout.trim(),
  }),
}
delete env.TURBO_TEAMID

const args = process.argv.slice(2)
const separator = args.indexOf("--")
const options = separator === -1 ? args : args.slice(0, separator)
const passthrough = separator === -1 ? [] : args.slice(separator)
const cache = env.TURBO_TOKEN?.trim() ? [] : ["--cache=local:rw"]
const result = spawnSync(
  process.execPath,
  [createRequire(import.meta.url).resolve("turbo"), "run", ...options, ...cache, ...passthrough],
  { cwd: root, env, stdio: "inherit" },
)
if (result.error) throw result.error
process.exit(result.status ?? 1)
