#!/usr/bin/env node
import { spawnSync } from "node:child_process"

import { pathToFileURL } from "node:url"

/** `npm run hygiene [-- --base=origin/main --since=YYYY-MM-DD]`: the branch and
 *  worktree report for a checkout that many agent sessions work at once.
 *
 *  The dominant loss with parallel sessions is stranding, not conflict: a
 *  session finishes, the branch never gets a PR, and the fix sits local-only.
 *  GitHub cannot see a branch that was never pushed, so this runs where the
 *  branches are.
 *
 *  For every local branch not merged into the base it asks git cherry which
 *  commits have no patch-equivalent on the base, keeps the ones with at
 *  least one, and then flags two shapes that double-count or hide work:
 *  several names on one tip commit, and a worktree parked on a branch with
 *  nothing left to land. A report, never a mutation: exit 0 when git could
 *  answer, 2 when it could not (a missing base ref, no repository), never 1. */

export function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" })
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.trim()}`)
  return r.stdout.trim()
}

export function worktrees(cwd) {
  const out = []
  let current = null
  for (const line of git(cwd, ["worktree", "list", "--porcelain"]).split("\n")) {
    if (line.startsWith("worktree ")) current = { path: line.slice(9), branch: null, prunable: false }
    else if (line.startsWith("branch ")) current.branch = line.slice(7).replace(/^refs\/heads\//, "")
    else if (line.startsWith("prunable")) current.prunable = true
    else if (line === "" && current) {
      out.push(current)
      current = null
    }
  }
  if (current) out.push(current)
  return out
}

export function report(cwd, { base = "origin/main", since = "" } = {}) {
  const branches = git(cwd, ["branch", "--format=%(refname:short)", "--no-merged", base])
    .split("\n")
    .filter(Boolean)
  // Every branch with at least one commit git cherry cannot find on the base.
  // The date filter below decides what is PRINTED; it never decides what is work.
  const novel = []
  for (const branch of branches) {
    const novelCount = git(cwd, ["cherry", base, branch])
      .split("\n")
      .filter((l) => l.startsWith("+")).length
    if (novelCount === 0) continue
    const [date, sha, ...subject] = git(cwd, ["log", "-1", "--format=%cs %H %s", branch]).split(" ")
    const ahead = Number(git(cwd, ["rev-list", "--count", `${base}..${branch}`]))
    novel.push({ branch, ahead, novel: novelCount, date, sha, subject: subject.join(" ") })
  }
  const rows = (since ? novel.filter((r) => r.date >= since) : novel).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.branch.localeCompare(b.branch)
  )
  const bySha = new Map()
  for (const row of novel) bySha.set(row.sha, [...(bySha.get(row.sha) ?? []), row.branch])
  const duplicates = [...bySha.values()].filter((names) => names.length > 1).map((names) => names.sort())
  const live = new Set(novel.map((r) => r.branch))
  const baseShort = base.replace(/^origin\//, "")
  const staleWorktrees = worktrees(cwd).filter((w) => w.branch && w.branch !== baseShort && !live.has(w.branch))
  return { base, since, rows, duplicates, staleWorktrees }
}

export function render({ base, since, rows, duplicates, staleWorktrees }) {
  const lines = []
  const scope = since ? ` since ${since}` : ""
  if (rows.length === 0) lines.push(`no branches with unlanded commits against ${base}${scope}`)
  else {
    lines.push(`${rows.length} branches with commits that have no equivalent on ${base}${scope}:`)
    for (const r of rows) lines.push(`  ${r.date}  ${r.branch}  +${r.ahead} (${r.novel} novel)  ${r.subject}`)
  }
  for (const names of duplicates) lines.push(`same commit: ${names.join(", ")}`)
  for (const w of staleWorktrees)
    lines.push(`stale worktree (nothing to land on ${w.branch}${w.prunable ? ", prunable" : ""}): ${w.path}`)
  return lines.join("\n")
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const opt = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]
  try {
    // Set, never process.exit(): the report is already queued on stdout and a
    // pipe drops what has not drained.
    console.log(render(report(process.cwd(), { base: opt("base") ?? "origin/main", since: opt("since") ?? "" })))
    process.exitCode = 0
  } catch (error) {
    // The runner's fail-open code: "I could not tell" is never "clean".
    console.log(`could not report: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 2
  }
}
