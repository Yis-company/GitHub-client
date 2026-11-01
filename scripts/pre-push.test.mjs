import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, join, resolve } from "node:path"
import test from "node:test"

const project = resolve(import.meta.dirname, "..")
const { scripts } = JSON.parse(readFileSync(join(project, "package.json"), "utf8"))
const gitName = process.platform === "win32" ? "git.exe" : "git"
const gitBinary = process.env.PATH.split(delimiter)
  .map((directory) => join(directory, gitName))
  .find(existsSync)
assert.ok(gitBinary, "Git must be available on PATH")

function fixture(t, git = true) {
  const root = mkdtempSync(join(tmpdir(), "github-client-hooks-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const env = {
    ...process.env,
    CI: "",
    TMPDIR: root,
    BUN_INSTALL_CACHE_DIR: join(root, "bun-cache"),
    TURBO_TOKEN: "",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(root, "no-global-config"),
  }
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR"]) {
    delete env[key]
  }
  const run = (command, args, overrides = {}) =>
    spawnSync(command, args, { cwd: root, encoding: "utf8", env: { ...env, ...overrides } })
  const ok = (command, args, overrides) => {
    const result = run(command, args, overrides)
    assert.equal(result.status, 0, result.stderr || result.error?.message)
    return result.stdout.trim()
  }
  mkdirSync(join(root, "scripts"))
  mkdirSync(join(root, ".githooks"))
  copyFileSync(join(project, "scripts/install-hooks.mjs"), join(root, "scripts/install-hooks.mjs"))
  copyFileSync(join(project, ".githooks/pre-push"), join(root, ".githooks/pre-push"))
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "hook-fixture",
      scripts: {
        prepare: scripts.prepare,
        "check:push": scripts["check:push"],
        lint: "node check.mjs lint",
        typecheck: "node check.mjs typecheck",
        test: "node check.mjs test",
      },
    }),
  )
  if (git) ok(gitBinary, ["init", "-b", "main"])
  return { root, run, ok }
}

test("fresh Bun install activates the hook and installation is repeatable", (t) => {
  const f = fixture(t)
  f.ok("bun", ["install", "--offline"])
  assert.equal(f.ok(gitBinary, ["config", "--local", "--get", "core.hooksPath"]), ".githooks")
  f.ok(process.execPath, ["scripts/install-hooks.mjs"])
  assert.equal(f.ok(gitBinary, ["config", "--local", "--get", "core.hooksPath"]), ".githooks")
})

test("CI and source archives leave Git configuration alone", (t) => {
  const f = fixture(t)
  f.ok(process.execPath, ["scripts/install-hooks.mjs"], { CI: "true" })
  assert.equal(f.run(gitBinary, ["config", "--get", "core.hooksPath"]).status, 1)
  const archive = fixture(t, false)
  archive.ok(process.execPath, ["scripts/install-hooks.mjs"])
  assert.equal(existsSync(join(archive.root, ".git")), false)
})

test("custom hooksPath and existing default hooks are preserved", (t) => {
  const custom = fixture(t)
  custom.ok(gitBinary, ["config", "core.hooksPath", "personal-hooks"])
  assert.notEqual(custom.run(process.execPath, ["scripts/install-hooks.mjs"]).status, 0)
  assert.equal(custom.ok(gitBinary, ["config", "--get", "core.hooksPath"]), "personal-hooks")

  const existing = fixture(t)
  const hook = join(existing.root, ".git/hooks/pre-commit")
  writeFileSync(hook, "personal hook\n")
  assert.notEqual(existing.run(process.execPath, ["scripts/install-hooks.mjs"]).status, 0)
  assert.equal(readFileSync(hook, "utf8"), "personal hook\n")
  assert.equal(existing.run(gitBinary, ["config", "--get", "core.hooksPath"]).status, 1)
})

test("real local Git pushes block each failing check and permit passing checks", async (t) => {
  const f = fixture(t)
  writeFileSync(
    join(f.root, "check.mjs"),
    'import {appendFileSync} from "node:fs"; const name=process.argv[2]; appendFileSync("checked",name+"\\n"); process.exit(process.env.FAIL_CHECK===name ? 29 : 0)',
  )
  f.ok(gitBinary, ["config", "user.name", "Hook fixture"])
  f.ok(gitBinary, ["config", "user.email", "fixture@example.invalid"])
  f.ok(gitBinary, ["add", "package.json", "check.mjs"])
  f.ok(gitBinary, ["commit", "-m", "fixture initial"])
  f.ok(gitBinary, ["init", "--bare", "remote.git"])
  f.ok(gitBinary, ["push", "./remote.git", "HEAD:refs/heads/main"])
  const before = f.ok(gitBinary, ["--git-dir=remote.git", "rev-parse", "refs/heads/main"])
  writeFileSync(join(f.root, "change"), "next\n")
  f.ok(gitBinary, ["add", "change"])
  f.ok(gitBinary, ["commit", "-m", "fixture next"])
  f.ok("bun", ["install", "--offline"])

  for (const [index, check] of ["lint", "typecheck", "test"].entries()) {
    await t.test(`${check} failure leaves the local remote unchanged`, () => {
      writeFileSync(join(f.root, "checked"), "")
      const pushed = f.run(gitBinary, ["push", "./remote.git", "HEAD:refs/heads/main"], {
        FAIL_CHECK: check,
      })
      assert.notEqual(pushed.status, 0)
      assert.equal(
        f.ok(gitBinary, ["--git-dir=remote.git", "rev-parse", "refs/heads/main"]),
        before,
      )
      assert.deepEqual(
        readFileSync(join(f.root, "checked"), "utf8").trim().split("\n"),
        ["lint", "typecheck", "test"].slice(0, index + 1),
      )
    })
  }

  await t.test("missing Bun blocks a push", () => {
    const emptyPath = join(f.root, "empty-path")
    mkdirSync(emptyPath)
    const pushed = f.run(gitBinary, ["push", "./remote.git", "HEAD:refs/heads/main"], {
      PATH: emptyPath,
    })
    assert.notEqual(pushed.status, 0)
    assert.match(pushed.stderr, /bun: (?:command )?not found/)
    assert.equal(f.ok(gitBinary, ["--git-dir=remote.git", "rev-parse", "refs/heads/main"]), before)
  })

  f.ok(gitBinary, ["push", "./remote.git", "HEAD:refs/heads/main"], { FAIL_CHECK: "" })
  assert.equal(
    f.ok(gitBinary, ["--git-dir=remote.git", "rev-parse", "refs/heads/main"]),
    f.ok(gitBinary, ["rev-parse", "HEAD"]),
  )
})
