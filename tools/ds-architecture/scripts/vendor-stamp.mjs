import { readFileSync } from "node:fs"
import path from "node:path"

const ROW_RE = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([0-9a-f]{7,40})\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/

/** Printed on every conformance run, so a stale copy is visible in the
 *  transcript rather than silent. Deliberately no network check — the trade is
 *  that a rule reaches a target on the next refresh rather than the instant it
 *  is written, and in exchange no rule travels without having been exercised
 *  upstream first. */
export function readVendorStamp(repoRoot) {
  let text
  try {
    text = readFileSync(path.join(repoRoot, "VENDOR.md"), "utf8")
  } catch {
    return []
  }
  return text
    .split("\n")
    .map((line) => line.match(ROW_RE))
    .filter(Boolean)
    .map((m) => ({ artifact: m[1], upstreamPath: m[2], sha: m[3], date: m[4] }))
}

export function formatStamp(rows) {
  if (rows.length === 0) return "vendored: none"
  return "vendored: " + rows.map((r) => `${r.artifact}@${r.sha} (${r.date})`).join(", ")
}
