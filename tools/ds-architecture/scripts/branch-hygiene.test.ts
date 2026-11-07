import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

// @ts-ignore: .mjs, deliberately untyped so the script stays stdlib-only
import { render, report, worktrees } from "./branch-hygiene.mjs"

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", ["-c", "user.email=t@example.test", "-c", "user.name=t", ...args], {
    cwd,
    encoding: "utf8",
  }).trim()

function commit(cwd: string, file: string, text: string, message: string) {
  writeFileSync(path.join(cwd, file), text)
  git(cwd, "add", "-A")
  git(cwd, "commit", "-q", "-m", message)
}

/** A repo whose `main` stands in for origin/main, so no remote is needed. */
function repo() {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "dsa-hygiene-")))
  git(dir, "init", "-q", "-b", "main")
  commit(dir, "a.txt", "a\n", "base")
  return dir
}

describe("branch-hygiene report", () => {
  it("reports a branch with a commit the base lacks, and nothing for a merged one", () => {
    const dir = repo()
    git(dir, "checkout", "-q", "-b", "stranded")
    commit(dir, "b.txt", "b\n", "fix that never got a PR")
    git(dir, "checkout", "-q", "main")
    git(dir, "branch", "merged")
    const r = report(dir, { base: "main" })
    expect(r.rows.map((x: any) => x.branch)).toEqual(["stranded"])
    expect(render(r)).toMatch(/1 branches with commits that have no equivalent on main/)
  })

  it("does not report a branch whose patch landed on the base by another commit", () => {
    const dir = repo()
    git(dir, "checkout", "-q", "-b", "landed")
    commit(dir, "b.txt", "b\n", "the change")
    git(dir, "checkout", "-q", "main")
    commit(dir, "b.txt", "b\n", "same patch, squashed")
    expect(report(dir, { base: "main" }).rows).toEqual([])
  })

  it("names branches that share one tip commit", () => {
    const dir = repo()
    git(dir, "checkout", "-q", "-b", "one")
    commit(dir, "b.txt", "b\n", "work")
    git(dir, "branch", "two")
    git(dir, "checkout", "-q", "main")
    expect(report(dir, { base: "main" }).duplicates).toEqual([["one", "two"]])
  })

  it("names a worktree parked on a branch with nothing left to land", () => {
    const dir = repo()
    const wt = path.join(dir, "wt")
    mkdirSync(wt)
    git(dir, "worktree", "add", "-q", "-b", "parked", path.join(wt, "p"), "main")
    const r = report(dir, { base: "main" })
    expect(r.staleWorktrees.map((w: any) => w.branch)).toEqual(["parked"])
    expect(worktrees(dir).map((w: any) => w.branch)).toContain("parked")
  })

  it("filters what is printed by --since without changing what counts as work", () => {
    const dir = repo()
    git(dir, "checkout", "-q", "-b", "old")
    commit(dir, "b.txt", "b\n", "work")
    git(dir, "checkout", "-q", "main")
    const r = report(dir, { base: "main", since: "2999-01-01" })
    expect(r.rows).toEqual([])
    expect(render(r)).toMatch(/no branches with unlanded commits against main since 2999-01-01/)
  })

  it("throws when the base ref is missing, so the CLI can answer exit 2 and not 'clean'", () => {
    const dir = repo()
    expect(() => report(dir, { base: "origin/nope" })).toThrow()
  })
})

describe("branch-hygiene CLI", () => {
  const script = path.resolve(process.cwd(), "scripts/branch-hygiene.mjs")

  it("exits 2 and says it could not report on a missing base", () => {
    const dir = repo()
    const run = () => execFileSync("node", [script, "--base=origin/nope"], { cwd: dir, encoding: "utf8" })
    try {
      run()
      throw new Error("expected a non-zero exit")
    } catch (e: any) {
      expect(e.status).toBe(2)
      expect(String(e.stdout)).toMatch(/could not report/)
    }
  })

  it("exits 0 on a repo with nothing unlanded", () => {
    const dir = repo()
    const out = execFileSync("node", [script, "--base=main"], { cwd: dir, encoding: "utf8" })
    expect(out).toMatch(/no branches with unlanded commits against main/)
  })
})
