import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")

function git(...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" })
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    throw result.error ?? new Error(result.stderr.trim())
  }
  return result
}

if ((!process.env.CI || process.env.CI === "false") && existsSync(resolve(root, ".git"))) {
  const configured = git("config", "--get", "core.hooksPath")
  const hooksPath = configured.stdout.trim()
  if (configured.status === 0 && hooksPath !== ".githooks") {
    throw new Error("Existing core.hooksPath preserved. Integrate .githooks/pre-push manually.")
  }

  if (configured.status !== 0) {
    const directory = resolve(root, git("rev-parse", "--git-path", "hooks").stdout.trim())
    if (existsSync(directory) && readdirSync(directory).some((name) => !name.endsWith(".sample"))) {
      throw new Error("Existing Git hooks preserved. Integrate .githooks/pre-push manually.")
    }
  }

  chmodSync(resolve(root, ".githooks/pre-push"), 0o755)
  const installed = git("config", "--local", "core.hooksPath", ".githooks")
  if (installed.status !== 0) throw new Error(installed.stderr.trim())
  console.log("Installed .githooks/pre-push")
}
