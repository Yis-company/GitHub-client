import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"

const project = resolve(import.meta.dirname, "..")

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "github-client-turbo-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ["scripts", "patches"]) mkdirSync(join(root, dir))
  for (const file of ["turbo.json", "tsconfig.json", "scripts/turbo.mjs"]) {
    copyFileSync(join(project, file), join(root, file))
  }
  const env = {
    ...process.env,
    TMPDIR: root,
    BUN_INSTALL_CACHE_DIR: join(root, "bun-cache"),
    TURBO_TOKEN: "",
    TURBO_TELEMETRY_DISABLED: "1",
  }
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR"]) {
    delete env[key]
  }
  const run = (command, args, overrides = {}) =>
    spawnSync(command, args, { cwd: root, env: { ...env, ...overrides }, encoding: "utf8" })
  const ok = (command, args, overrides) => {
    const result = run(command, args, overrides)
    assert.equal(result.status, 0, result.stderr || result.error?.message)
    return result.stdout
  }
  return { root, run, ok }
}

test("wrapper pins the project namespace, isolates runtime, forwards arguments and failures", (t) => {
  const f = fixture(t)
  mkdirSync(join(f.root, "node_modules/turbo"), { recursive: true })
  writeFileSync(join(f.root, "node_modules/turbo/package.json"), '{"main":"index.cjs"}')
  writeFileSync(
    join(f.root, "node_modules/turbo/index.cjs"),
    "console.log(JSON.stringify({args:process.argv.slice(2),api:process.env.TURBO_API,team:process.env.TURBO_TEAM,teamId:process.env.TURBO_TEAMID,runtime:process.env.GITHUB_CLIENT_CACHE_RUNTIME,hasToken:!!process.env.TURBO_TOKEN})); process.exit(Number(process.env.FIXTURE_EXIT||0))",
  )
  const base = {
    TURBO_API: "https://wrong.invalid",
    TURBO_TEAM: "another-project",
    TURBO_TEAMID: "team_wrong",
    GITHUB_CLIENT_CACHE_RUNTIME: "stale",
  }
  const result = JSON.parse(
    f.ok(process.execPath, ["scripts/turbo.mjs", "test", "--", "--reporter=dot"], base),
  )
  assert.equal(result.api, "https://turbo-cache.yitam.dev")
  assert.equal(result.team, "github-client")
  assert.equal(result.teamId, undefined)
  assert.equal(result.hasToken, false)
  assert.deepEqual(result.args, ["run", "test", "--cache=local:rw", "--", "--reporter=dot"])
  assert.deepEqual(JSON.parse(result.runtime), {
    node: process.version,
    abi: process.versions.modules,
    platform: process.platform,
    arch: process.arch,
    bun: f.ok("bun", ["--version"]).trim(),
  })
  // A synthetic marker tests forwarding; it is never sent to any remote service.
  const configured = JSON.parse(
    f.ok(process.execPath, ["scripts/turbo.mjs", "typecheck"], { TURBO_TOKEN: "fixture-marker" }),
  )
  assert.deepEqual(configured.args, ["run", "typecheck"])
  assert.equal(configured.hasToken, true)
  assert.equal(
    f.run(process.execPath, ["scripts/turbo.mjs", "typecheck"], { FIXTURE_EXIT: "23" }).status,
    23,
  )
})

test("native Turbo restores local artifacts and invalidates all declared inputs", (t) => {
  const f = fixture(t)
  mkdirSync(join(f.root, "packages/core"), { recursive: true })
  mkdirSync(join(f.root, "apps/desktop"), { recursive: true })
  writeFileSync(
    join(f.root, "package.json"),
    JSON.stringify({
      name: "cache-fixture",
      private: true,
      packageManager: "bun@1.4.4",
      workspaces: ["apps/*", "packages/*"],
    }),
  )
  writeFileSync(
    join(f.root, "packages/core/package.json"),
    JSON.stringify({
      name: "@github-client/core",
      scripts: {
        typecheck: 'node -e "if(process.env.TURBO_TOKEN)process.exit(99)"',
        test: 'node -e "if(process.env.TURBO_TOKEN)process.exit(99)"',
      },
    }),
  )
  writeFileSync(join(f.root, "packages/core/source.txt"), "core one")
  writeFileSync(
    join(f.root, "apps/desktop/package.json"),
    JSON.stringify({
      name: "@github-client/desktop",
      dependencies: { "@github-client/core": "workspace:*" },
      scripts: { build: "node build.cjs" },
    }),
  )
  writeFileSync(join(f.root, "apps/desktop/source.txt"), "app one")
  writeFileSync(join(f.root, "apps/desktop/.env.local"), "VITE_FIXTURE=one")
  writeFileSync(join(f.root, ".gitignore"), "node_modules\n.turbo\ndist\n.env*\n")
  writeFileSync(
    join(f.root, "apps/desktop/build.cjs"),
    'const fs=require("node:fs"); if(process.env.TURBO_TOKEN) process.exit(99); fs.mkdirSync("dist",{recursive:true}); fs.writeFileSync("dist/artifact.txt",fs.readFileSync("source.txt","utf8")+fs.readFileSync("../../packages/core/source.txt","utf8")); console.log("fixture executed")',
  )
  f.ok("bun", ["install", "--offline", "--ignore-scripts"])
  symlinkSync(
    join(project, "node_modules/turbo"),
    join(f.root, "node_modules/turbo"),
    process.platform === "win32" ? "junction" : "dir",
  )
  const turbo = (...args) => f.ok(process.execPath, ["scripts/turbo.mjs", ...args])
  const dry = (overrides) =>
    JSON.parse(f.ok(process.execPath, ["scripts/turbo.mjs", "build", "--dry-run=json"], overrides))
  const hash = (overrides) =>
    dry(overrides).tasks.find((task) => task.taskId === "@github-client/desktop#build").hash
  const before = hash()
  const built = turbo("build")
  assert.match(built, /cache miss/)
  const output = join(f.root, "apps/desktop/dist/artifact.txt")
  assert.equal(readFileSync(output, "utf8"), "app onecore one")
  rmSync(output)
  const reused = turbo("build")
  assert.match(reused, /cache hit/)
  assert.equal(readFileSync(output, "utf8"), "app onecore one")

  const invalidate = (file, content) => {
    const path = join(f.root, file)
    const original = readFileSync(path, "utf8")
    writeFileSync(path, content)
    assert.notEqual(hash(), before, `${file} must invalidate the build`)
    writeFileSync(path, original)
    assert.equal(hash(), before, `${file} restoration must restore the key`)
  }
  invalidate("apps/desktop/source.txt", "app two")
  invalidate("packages/core/source.txt", "core two")
  invalidate("tsconfig.json", '{"compilerOptions":{"strict":false}}')
  invalidate(
    "scripts/turbo.mjs",
    `${readFileSync(join(f.root, "scripts/turbo.mjs"), "utf8")}\n// changed input\n`,
  )
  invalidate("apps/desktop/.env.local", "VITE_FIXTURE=two")
  writeFileSync(join(f.root, "patches/fixture.patch"), "patch input")
  assert.notEqual(hash(), before, "root dependency patches must invalidate the build")
  rmSync(join(f.root, "patches/fixture.patch"))
  assert.notEqual(hash({ VITE_FIXTURE: "two" }), before, "build environment must invalidate")
  assert.notEqual(hash({ NODE_ENV: "production" }), before, "NODE_ENV must invalidate")
  assert.notEqual(hash({ CI: "github-client-fixture" }), before, "CI mode must invalidate")
  const runtime = JSON.parse(
    f.ok(process.execPath, ["scripts/turbo.mjs", "build", "--dry-run=json"]),
  ).globalCacheInputs.environmentVariables.configured
  assert.ok(runtime.some((value) => value.startsWith("GITHUB_CLIENT_CACHE_RUNTIME=")))
  assert.notEqual(
    JSON.parse(
      f.ok(process.execPath, ["node_modules/turbo/bin/turbo", "run", "build", "--dry-run=json"], {
        GITHUB_CLIENT_CACHE_RUNTIME: "another-runtime",
      }),
    ).tasks.find((task) => task.taskId === "@github-client/desktop#build").hash,
    before,
    "actual runtime identity contributes to the native Turbo key",
  )
  const build = dry().tasks.find((task) => task.taskId === "@github-client/desktop#build")
  assert.deepEqual(build.outputs, ["dist/**"])
  // Exercise strict task filtering with a synthetic token and remote I/O explicitly disabled.
  f.ok(
    process.execPath,
    [
      "scripts/turbo.mjs",
      "build",
      "typecheck",
      "test",
      "--cache=local:rw",
      "--cache-dir=token-fixture-cache",
    ],
    { TURBO_TOKEN: "fixture-marker" },
  )
})
