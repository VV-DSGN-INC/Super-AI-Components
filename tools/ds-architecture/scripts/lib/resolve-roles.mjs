import { lstatSync, readdirSync } from "node:fs"
import path from "node:path"

/** A glob subset: `**` (zero or more path segments), `*` (within one segment),
 *  literals. Enough for scope roles, and small enough to have no dependency.
 *  Built by tokenising on "/" rather than by chained replaces through a
 *  sentinel character — a sentinel has to be a character no path contains, and
 *  every candidate for that is a control character that turns the source file
 *  into binary. Anchored at the target root, so a pattern that would escape it
 *  matches nothing rather than reaching outside the repo under test. A leading
 *  "./" is stripped before tokenising, so "./src/**" and "src/**" behave
 *  identically — a config author writing either should get the same answer. */
function globToRegExp(glob) {
  const normalized = glob.startsWith("./") ? glob.slice(2) : glob
  const segments = normalized.split("/")
  let body = ""
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1
    if (segment === "**") {
      body += last ? "(?:[^/]+(?:/[^/]+)*)?" : "(?:[^/]+/)*"
      return
    }
    const literal = segment.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")
    body += literal + (last ? "" : "/")
  })
  return new RegExp(`^${body}$`)
}

/** Walks the tree under root, recording every path found. A symlink is
 *  recorded as a path but never followed — lstatSync (not statSync) reports
 *  on the link itself, so a directory symlink is treated as a leaf. That is
 *  what keeps this loop-proof (a symlink cycle can never be recursed into)
 *  and root-anchored (a symlink pointing outside targetRoot cannot pull its
 *  target's contents into the walk). The lstat call is itself guarded: a
 *  broken symlink or a file removed in a race should be skipped, not fatal. */
function walk(root) {
  const out = []
  const visit = (dir) => {
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git") continue
      const full = path.join(dir, entry)
      let info
      try {
        info = lstatSync(full)
      } catch {
        continue
      }
      if (info.isDirectory()) visit(full)
      else out.push(full)
    }
  }
  visit(root)
  return out
}

export function resolveRole(targetRoot, globs) {
  const root = path.resolve(targetRoot)
  const patterns = globs.map(globToRegExp)
  const seen = new Set()
  for (const file of walk(root)) {
    const rel = path.relative(root, file)
    if (rel.startsWith("..")) continue
    if (patterns.some((re) => re.test(rel))) seen.add(file)
  }
  return [...seen].sort()
}

export function unresolvedRoles(targetRoot, scopeRoles) {
  return Object.entries(scopeRoles)
    .filter(([, globs]) => resolveRole(targetRoot, globs).length === 0)
    .map(([role]) => role)
    .sort()
}
