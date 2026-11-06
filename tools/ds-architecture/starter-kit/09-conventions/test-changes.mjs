#!/usr/bin/env node
/**
 * The lines a pull request took away from tests that already existed: an input
 * to a review step, written to a JSON file the review reads (see
 * `review-SKILL.md` beside this file).
 *
 * Adding a test is free. Removing or changing a line of a test, a snapshot or a
 * visual baseline that existed before the PR is what this lists, because that
 * is how a regression passes its own suite: a change can keep a test's name and
 * every assertion, alter one fixture line, and the test goes on passing while it
 * no longer pins the behaviour it used to.
 *
 * It is a report, not a gate. Retiring a ledger row whose site the PR fixed
 * removes a line and tightens a gate; the reviewer tells the two apart, with
 * the PR body's `## Test changes` section as the author's account.
 *
 * Pure over the PR's own diff (`gh pr diff`) and its body, so it needs no
 * history and works in a shallow checkout. A removed test line found unchanged
 * (whitespace aside) among the lines the diff adds to test files is listed as
 * moved, with the file it went to, never dropped: a common line such as
 * `expect(x).toBe(true)` re-added elsewhere must stay visible. A line re-added
 * only in a non-test file is taken, not moved. Blank lines and lines of
 * brackets and punctuation alone are neither.
 *
 * Usage: node test-changes.mjs --patch .review/diff.patch --pr .review/pr.json
 * Prints the report as JSON. Exit 0 = report written; 2 = an input was
 * unreadable, and the caller must not present that as a clean report.
 */
import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

/** Files whose lines pin behaviour: vitest suites and probes. */
export const TEST_FILE = /\.(test|spec|probe)\.[cm]?[jt]sx?$/
/** Files whose whole content is the pinned expectation. */
export const BASELINE_FILE = /(^|\/)(__screenshots__|__snapshots__)\/|\.snap$/

/** Lines listed per file before the rest is counted. */
const LIST_CAP = 40
/** Moved lines listed per file before the rest is counted. */
const MOVED_CAP = 20

const squeeze = (line) => line.replace(/\s+/g, "")
/** Blank, or brackets and punctuation only: carries no expectation on its own. */
const trivial = (line) => /^[\s{}()[\];,.]*$/.test(line)
const comment = (line) => (/^\s*(\/\/|\/?\*|\*\/|\{\/\*)/.test(line) ? 1 : 0)

/** One block per file in a unified diff. Context lines are ignored: only
 *  `-` and `+` lines change what a file says. */
export function parsePatch(patch) {
  const blocks = []
  let cur = null
  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const m = /^diff --git a\/(.*) b\/(.*)$/.exec(line)
      cur = { oldPath: m ? m[1] : "", newPath: m ? m[2] : "", status: "modified", binary: false, removed: [], added: [] }
      blocks.push(cur)
    } else if (!cur) {
      continue
    } else if (line.startsWith("new file mode")) {
      cur.status = "added"
    } else if (line.startsWith("deleted file mode")) {
      cur.status = "deleted"
    } else if (line.startsWith("rename from ")) {
      cur.status = "renamed"
    } else if (line.startsWith("Binary files ") || line === "GIT binary patch") {
      cur.binary = true
    } else if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      continue
    } else if (line.startsWith("-")) {
      cur.removed.push(line.slice(1))
    } else if (line.startsWith("+")) {
      cur.added.push(line.slice(1))
    }
  }
  return blocks
}

/** The author's account: `path: reason` lines under a `## Test changes`
 *  heading of the PR body, up to the next heading. A path with no reason is
 *  not an account. */
export function declaredTestChanges(body) {
  const declared = new Map()
  let inside = false
  for (const raw of String(body ?? "").split(/\r?\n/)) {
    if (/^#{1,6}\s/.test(raw)) {
      inside = /^#{1,6}\s+test changes\s*$/i.test(raw.trim())
      continue
    }
    if (!inside) continue
    const m = /^\s*(?:[-*]\s+)?`?([^`\s:]+)`?\s*:\s*(\S.*)$/.exec(raw)
    if (m) declared.set(m[1], m[2].trim())
  }
  return declared
}

/** The report the reviewer reads. */
export function testChanges(patch, body = "") {
  const blocks = parsePatch(patch)
  const declared = declaredTestChanges(body)
  // Where each added test line landed: only a test file can receive a moved test.
  const pool = new Map()
  for (const b of blocks) {
    if (!TEST_FILE.test(b.newPath)) continue
    for (const line of b.added) {
      if (trivial(line)) continue
      const k = squeeze(line)
      if (!pool.has(k)) pool.set(k, [])
      pool.get(k).push(b.newPath)
    }
  }
  const files = []
  let moved = 0
  for (const b of blocks) {
    const path = b.oldPath
    const kind = BASELINE_FILE.test(path) ? "baseline" : TEST_FILE.test(path) ? "test" : null
    if (!kind || b.status === "added") continue
    const lost = []
    const movedLines = []
    for (const line of b.removed) {
      if (trivial(line)) continue
      const dest = kind === "test" ? pool.get(squeeze(line)) : undefined
      if (dest && dest.length > 0) movedLines.push({ line: line.trim(), to: dest.shift() })
      else lost.push(line.trim())
    }
    const movedHere = movedLines.length
    moved += movedHere
    // Code before comments: the reader looks at the top of the list, and a
    // fixture or an assertion carries the expectation, a comment describes it.
    lost.sort((x, y) => comment(x) - comment(y))
    const changedBinary = b.binary && b.status !== "renamed"
    if (lost.length === 0 && movedHere === 0 && !changedBinary && b.status !== "deleted") continue
    files.push({
      path,
      ...(b.newPath !== path ? { newPath: b.newPath } : {}),
      kind,
      status: b.status,
      ...(changedBinary ? { binary: true } : {}),
      linesTaken: lost.length,
      lines: lost.slice(0, LIST_CAP),
      ...(lost.length > LIST_CAP ? { more: lost.length - LIST_CAP } : {}),
      movedHere,
      ...(movedHere ? { moved: movedLines.slice(0, MOVED_CAP) } : {}),
      declared: declared.get(path) ?? declared.get(b.newPath) ?? null,
    })
  }
  return {
    status: files.length ? "changes" : "none",
    files,
    movedElsewhere: moved,
    summary: {
      files: files.length,
      linesTaken: files.reduce((n, f) => n + f.linesTaken, 0),
      moved,
      // A pure move needs no account; a taken line, a changed baseline or a deleted file does.
      undeclared: files.filter((f) => f.declared === null && (f.linesTaken > 0 || f.binary || f.status === "deleted")).length,
    },
  }
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const patchFile = arg("--patch")
  const prFile = arg("--pr")
  if (!patchFile) {
    console.error("usage: node test-changes.mjs --patch <diff.patch> [--pr <pr.json>]")
    return 2
  }
  let patch
  let body = ""
  try {
    patch = readFileSync(patchFile, "utf8")
    if (prFile) body = JSON.parse(readFileSync(prFile, "utf8")).body ?? ""
  } catch (error) {
    console.error(`test-changes: ${error.message}`)
    return 2
  }
  process.stdout.write(JSON.stringify(testChanges(patch, body), null, 2) + "\n")
  return 0
}

// Exit through process.exitCode: main() has written the report to stdout, and
// ending the process at once drops whatever a pipe has not drained.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = main(process.argv.slice(2))
