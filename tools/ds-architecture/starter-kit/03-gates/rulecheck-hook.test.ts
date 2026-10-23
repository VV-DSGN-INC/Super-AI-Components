/**
 * Behaviour of the PostToolUse hook: what it says for a clean file, for a
 * violation the edit wrote, for a hit the edit did not touch, for a scan that
 * could not run, and for a path outside the project.
 *
 * The hook imports `./rulecheck.mjs`, which lives in `02-rules/` here and sits
 * beside the hook in a target. The test builds that target layout in a temp
 * directory: both scripts copied side by side, plus a throwaway git project
 * with one rule. Nothing outside the temp directory is read or written.
 *
 * Keep this file next to `rulecheck-hook.mjs`, or fix the paths below.
 */
import { spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

const here = path.dirname(fileURLToPath(import.meta.url))

type Hook = { main: (stdin: string, env: Record<string, string>, cwd: string) => string | null }

const RULE = {
  catalogueVersion: 1,
  layer: "test",
  rules: [
    {
      id: "T-1",
      title: "No gradients",
      severity: "blocker",
      detect: { method: "grep", pattern: "bg-gradient-", flags: "", scope: ["src"], include: [".tsx"], exempt: [] },
      fix: "Use a flat token.",
      why: "test rule",
    },
  ],
}

let tmp: string
let proj: string
let hook: Hook

const git = (...args: string[]) =>
  spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", ...args], {
    cwd: proj,
    encoding: "utf8",
  })
const write = (rel: string, text: string) => {
  mkdirSync(path.dirname(path.join(proj, rel)), { recursive: true })
  writeFileSync(path.join(proj, rel), text)
}
const run = (file: string) =>
  hook.main(JSON.stringify({ tool_input: { file_path: file } }), { CLAUDE_PROJECT_DIR: proj }, proj)

beforeAll(async () => {
  tmp = realpathSync(mkdtempSync(path.join(tmpdir(), "rulecheck-hook-")))
  mkdirSync(path.join(tmp, "scripts"))
  copyFileSync(path.join(here, "rulecheck-hook.mjs"), path.join(tmp, "scripts/rulecheck-hook.mjs"))
  copyFileSync(path.join(here, "../02-rules/rulecheck.mjs"), path.join(tmp, "scripts/rulecheck.mjs"))
  hook = (await import(pathToFileURL(path.join(tmp, "scripts/rulecheck-hook.mjs")).href)) as Hook
})

beforeEach(() => {
  proj = path.join(tmp, "proj")
  rmSync(proj, { recursive: true, force: true })
  mkdirSync(proj)
  write("rules/test.json", JSON.stringify(RULE))
  write("src/clean.tsx", "export const a = 1\n")
  write("src/old.tsx", 'export const a = <i className="bg-gradient-to-r" />\nexport const b = 1\nexport const c = 2\n')
  git("init", "-q")
  git("add", "-A")
  git("commit", "-q", "-m", "base")
})

afterAll(() => rmSync(tmp, { recursive: true, force: true }))

describe("rulecheck hook", () => {
  it("says nothing about a clean file", () => {
    write("src/clean.tsx", "export const a = 2\n")
    expect(run("src/clean.tsx")).toBeNull()
  })

  it("reports a violation on a line the edit changed", () => {
    write("src/clean.tsx", 'export const a = <i className="bg-gradient-to-b" />\n')
    const out = run(path.join(proj, "src/clean.tsx"))
    expect(out).toContain("1 violation(s) on lines you changed in src/clean.tsx")
    expect(out).toContain("src/clean.tsx:1  T-1 [blocker]")
    expect(out).toContain("fix: Use a flat token.")
  })

  it("does not show a pre-existing hit on a line the edit did not touch", () => {
    write("src/old.tsx", 'export const a = <i className="bg-gradient-to-r" />\nexport const b = 1\nexport const c = 3\n')
    expect(run("src/old.tsx")).toBeNull()

    write("src/old.tsx", 'export const a = <i className="bg-gradient-to-r" />\nexport const b = <i className="bg-gradient-to-l" />\nexport const c = 2\n')
    const out = run("src/old.tsx")
    expect(out).toContain("src/old.tsx:2")
    expect(out).not.toContain("src/old.tsx:1 ")
    expect(out).toContain("1 pre-existing on lines you did not touch, not shown.")
  })

  it("says it could not check when the scan fails", () => {
    rmSync(path.join(proj, "rules"), { recursive: true })
    const out = run("src/clean.tsx")
    expect(out).toContain("rulecheck could not check src/clean.tsx")
    expect(out).toContain("The edit was not checked.")
  })

  it("says nothing for a path outside the project", () => {
    write("src/clean.tsx", 'export const a = <i className="bg-gradient-to-b" />\n')
    expect(run(path.join(tmp, "elsewhere.tsx"))).toBeNull()
    expect(run("../elsewhere.tsx")).toBeNull()
  })
})
