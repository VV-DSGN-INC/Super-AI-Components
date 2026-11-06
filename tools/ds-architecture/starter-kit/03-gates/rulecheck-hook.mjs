#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { loadRules, scan } from "./rulecheck.mjs"

/** PostToolUse hook (Write|Edit): runs the blocker-severity rules on the one
 *  file the agent just wrote and hands the violations back as context, so the
 *  fix happens while the agent still holds the file, not after the test run
 *  fails on the tree. Registered in `.claude/settings.json` (see settings.json
 *  beside this file); the event arrives as JSON on stdin and the reply leaves
 *  as JSON on stdout. Copy it next to `rulecheck.mjs` (it imports it).
 *
 *  Four rules of its own:
 *  - it never blocks: exit 0 always, and a clean file gets no output at all;
 *  - it says so when it could not check. A scan that cannot run and a scan
 *    that found nothing must read differently;
 *  - it uses the catalogue's own scopes, so an edit outside them is silent,
 *    the same as the tree gate would be;
 *  - in a git checkout it reports only the lines the edit changed. A tree that
 *    adopted the rules late carries hits the gates already hold, and listing
 *    them on every edit is wrong advice.
 *
 *  Promotion to a blocking hook follows the criterion written beside the hook
 *  config (MANUAL.md, Part 3), not a hunch. */

const MAX_LINES = 8

function emit(context) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context } })
  )
}

function real(p) {
  try {
    return realpathSync.native(p)
  } catch {
    return p
  }
}

/** Line numbers (1-based, working tree) that differ from HEAD for `rel`, or
 *  null when git cannot say: not a checkout, no HEAD yet, or the file is
 *  untracked, in which case every line is the agent's and all are reported. */
export function changedLines(root, rel) {
  const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" })
  if (git(["ls-files", "--error-unmatch", "--", rel]).status !== 0) return null
  const diff = git(["diff", "-U0", "--no-color", "HEAD", "--", rel])
  if (diff.status !== 0) return null
  const lines = new Set()
  for (const m of diff.stdout.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1])
    const count = m[2] === undefined ? 1 : Number(m[2])
    for (let i = 0; i < count; i += 1) lines.add(start + i)
  }
  return lines
}

export function contextFor(violations, held, rel, scoped) {
  const shown = violations.slice(0, MAX_LINES)
  const lines = shown.map(
    (v) => `${v.file}:${v.line}  ${v.id} [${v.severity}]  ${v.snippet}\n    fix: ${v.fix}`
  )
  const more = violations.length - shown.length
  const where = scoped
    ? `on lines you changed in ${rel}`
    : `in ${rel} (git could not tell which lines are yours, so all are shown)`
  const heldNote = held > 0 ? `\n${held} pre-existing on lines you did not touch, not shown.` : ""
  return (
    `rulecheck: ${violations.length} violation(s) ${where}. A new violation fails the test run.\n` +
    `${lines.join("\n")}${more > 0 ? `\n...and ${more} more` : ""}${heldNote}`
  )
}

export function main(stdin, env, cwd) {
  let event
  try {
    event = JSON.parse(stdin)
  } catch {
    return null
  }
  const filePath = event?.tool_input?.file_path
  if (typeof filePath !== "string" || filePath === "") return null

  // Both through realpath: process.cwd() is already the real path, while the
  // event's file_path is whatever the tool was given, so a symlinked project
  // (macOS's /var to /private/var, a worktree reached through a link) would
  // otherwise read as "outside the project" and go silent.
  const root = real(env.CLAUDE_PROJECT_DIR || cwd)
  const rel = path.relative(root, real(path.resolve(root, filePath)))
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null

  let report
  try {
    const rules = loadRules(root).filter((r) => r.severity === "blocker")
    report = scan(rules, [rel], root)
  } catch (error) {
    return `rulecheck could not check ${rel}: ${error.message}. The edit was not checked.`
  }
  if (report.violations.length === 0) return null

  const changed = changedLines(root, rel)
  const mine = changed ? report.violations.filter((v) => changed.has(v.line)) : report.violations
  if (mine.length === 0) return null
  return contextFor(mine, report.violations.length - mine.length, rel, changed !== null)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  let stdin = ""
  try {
    stdin = readFileSync(0, "utf8")
  } catch {
    stdin = ""
  }
  const context = main(stdin, process.env, process.cwd())
  if (context) emit(context)
  // Set, never process.exit(): a hook's stdout is a pipe, and ending the
  // process at once drops what has not drained.
  process.exitCode = 0
}
