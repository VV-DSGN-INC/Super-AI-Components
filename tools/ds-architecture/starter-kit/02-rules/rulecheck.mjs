#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

/** Reads the emitted catalogue and reports violations plus what it could not
 *  check. Stdlib only: it runs from a PreToolUse hook, from vitest, and from a
 *  shell, none of which should need a build step.
 *
 *  It never assigns severity and never invents a rule — there is exactly one
 *  place it could read them from. */

const SEVERITY_RANK = { blocker: 0, review: 1, warning: 2 }

export function loadRules(root) {
  const dir = path.join(root, "rules")
  if (!existsSync(dir)) throw new Error("rules/ not found — run: npm run rules:emit")
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")).rules)
}

export function walk(root, scopes, extensions) {
  const out = []
  const visit = (rel) => {
    const abs = path.join(root, rel)
    if (!existsSync(abs)) return
    for (const entry of readdirSync(abs)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue
      const childRel = path.join(rel, entry)
      if (statSync(path.join(root, childRel)).isDirectory()) visit(childRel)
      else if (extensions.includes(path.extname(entry))) out.push(childRel)
    }
  }
  scopes.forEach(visit)
  return out.sort()
}

export function scan(rules, files, root) {
  const violations = []
  const unchecked = []

  for (const rule of rules) {
    const d = rule.detect

    if (d.method === "rendered" || d.method === "judgment") {
      unchecked.push({ id: rule.id, reason: d.method })
      continue
    }

    const targets = files.filter(
      (f) =>
        d.scope.some((s) => f === s || f.startsWith(`${s}/`)) &&
        d.include.includes(path.extname(f)) &&
        !d.exempt.some((e) => f.includes(e))
    )

    if (targets.length === 0) {
      unchecked.push({ id: rule.id, reason: "out-of-scope" })
      continue
    }

    // Strip `g`: scan calls re.test(line) once per line, and a global regex
    // advances lastIndex across calls, so re.test() would return false on
    // every other matching line instead of true on every one. The schema
    // permits `g` in flags, so this has to be handled here, not assumed away.
    const re = new RegExp(d.pattern, d.flags.replace(/g/g, ""))
    for (const file of targets) {
      const lines = readFileSync(path.join(root, file), "utf8").split("\n")
      lines.forEach((line, i) => {
        if (!re.test(line)) return
        violations.push({
          id: rule.id,
          severity: rule.severity,
          method: d.method,
          confidence: d.method === "heuristic" ? "medium" : "high",
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
          fix: rule.fix,
        })
      })
    }
  }

  violations.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.id.localeCompare(b.id)
  )

  const summary = { blocker: 0, review: 0, warning: 0, filesScanned: files.length }
  for (const v of violations) summary[v.severity] += 1

  return { violations, unchecked, summary }
}

function main(argv) {
  const root = process.cwd()
  const arg = (name) => {
    const i = argv.indexOf(name)
    return i === -1 ? null : argv[i + 1]
  }
  const list = (name) => {
    const i = argv.indexOf(name)
    if (i === -1) return null
    const out = []
    for (let j = i + 1; j < argv.length && !argv[j].startsWith("--"); j += 1) out.push(argv[j])
    return out
  }

  let rules = loadRules(root)
  const severity = arg("--severity")
  if (severity) rules = rules.filter((r) => r.severity === severity)

  const explicit = list("--files")
  const scopes = [...new Set(rules.flatMap((r) => r.detect.scope ?? []))]
  const extensions = [...new Set(rules.flatMap((r) => r.detect.include ?? []))]
  const files = explicit ?? walk(root, scopes, extensions)

  const report = scan(rules, files, root)

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } else {
    for (const v of report.violations) {
      process.stdout.write(`${v.file}:${v.line}  ${v.id} [${v.severity}]  ${v.snippet}\n    fix: ${v.fix}\n`)
    }
    const ids = report.unchecked.map((u) => `${u.id}(${u.reason})`).join(" ")
    process.stdout.write(`\n${report.violations.length} violation(s). unchecked: ${ids || "none"}\n`)
  }

  return report.violations.length > 0 ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)))
  } catch (error) {
    // Exit 2 is the fail-open signal: "I could not tell", distinct from
    // "nothing is wrong". Callers that block must treat it as non-blocking.
    process.stderr.write(`rulecheck: ${error.message}\n`)
    process.exit(2)
  }
}
