#!/usr/bin/env node
// unslop's rule runner: the registry's `pattern` and `co-occur` rules run over
// files with comments stripped, plus the plugin's selftest.
//
//   node rules.mjs check <file ...> [--tier floor|reflex|finish] [--json]
//   node rules.mjs list [--json]
//   node rules.mjs selftest
//
// `check` exits 1 when a Floor rule fires (whatever --tier shows), 2 when the
// runner itself fails, 0 otherwise. `render` rules need
// render.mjs and `judgment` rules need eyes; both are listed, never run here.
//
// A hit is waived by a comment on its line or the line above:
//   unslop-waive <ID or title words> · <guard evidence> · <reason>
// Floor hits cannot be waived; the report says so. Library use: isUiFile, scan, formatText,
// defaultCtx, checkFixtures.

import { readFileSync, readdirSync, existsSync, realpathSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { strip } from "./strip.mjs"
import { findRepoRoot, loadConfig, loadLocalRules, applyLocal } from "./config.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const SKILL = join(HERE, "..")
const TIER_ORDER = { floor: 0, reflex: 1, finish: 2 }
const TIER_LABEL = { floor: "FAIL", reflex: "WARN", finish: "NOTE" }
const ID_SHAPE = /^[A-Z]{2,6}(?:-[A-Z]+)*-\d+$/i

// ------------------------------------------------------------------ UI files

const UI_EXTENSIONS = new Set(["tsx", "jsx", "vue", "svelte", "astro", "html", "css", "scss", "sass", "less"])
const SCRIPT_EXTENSIONS = new Set(["ts", "js"])
const UI_IMPORT = /\bfrom\s+["'](?:react|react-dom|preact|solid-js|vue|svelte|lit|@angular\/core|next\/[\w/-]+|@mui\/[\w-]+|@radix-ui\/[\w-]+|@chakra-ui\/[\w-]+|framer-motion|styled-components|@emotion\/[\w-]+)["']/
const JSX_TAG = /<\/[A-Za-z][\w.]*>|<[A-Za-z][\w.]*\s+[\w-]+=|<[A-Z][\w.]*[^<>]*\/>/

const extOf = (path) => (/\.([A-Za-z0-9]+)$/.exec(path)?.[1] ?? "").toLowerCase()

export function isUiFile(path, source, extra = []) {
  const ext = extOf(path)
  if (UI_EXTENSIONS.has(ext) || extra.map((e) => e.replace(/^\./, "").toLowerCase()).includes(ext)) return true
  if (!SCRIPT_EXTENSIONS.has(ext)) return false
  return UI_IMPORT.test(source) || JSX_TAG.test(source)
}

// -------------------------------------------------------------------- globs

function globToRegExp(glob) {
  let re = ""
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") { re += "(?:.*/)?"; i += 2 } else { re += ".*"; i += 1 }
    } else if (c === "*") re += "[^/]*"
    else if (c === "?") re += "[^/]"
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(`^${re}$`)
}

// Matches the whole path or any tail of it, so "src/legacy/**" also covers
// "/abs/repo/src/legacy/Old.tsx".
function globMatches(glob, path) {
  const re = globToRegExp(glob)
  const norm = path.replace(/\\/g, "/")
  const parts = norm.split("/")
  for (let i = 0; i < parts.length; i++) if (re.test(parts.slice(i).join("/"))) return true
  return false
}

// --------------------------------------------------------------------- scan

export function defaultCtx(rules) {
  const waiveAliases = new Map()
  for (const r of rules) {
    waiveAliases.set(r.title.toLowerCase(), r.id)
    waiveAliases.set(r.id, r.id)
    waiveAliases.set(r.id.toLowerCase(), r.id)
  }
  return { requires: { tokens: false, scale: false, loaders: false }, exempt: [], waiveAliases }
}

function stripFor(path, source) {
  const ext = extOf(path)
  const opts = { strings: false }
  if (ext === "css") return strip(source, "css", opts)
  if (["scss", "sass", "less"].includes(ext)) return strip(source, "css", { ...opts, lineComments: true })
  if (["html", "htm", "vue", "svelte", "astro"].includes(ext)) return strip(source, "html", opts)
  return strip(source, "js", opts)
}

function lineStarts(source) {
  const starts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") starts.push(i + 1)
  return starts
}

function lineAt(starts, index) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= index) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

const snippet = (text) => text.replace(/\s+/g, " ").trim().slice(0, 80)

// IDs a waiver comment names. Accepts IDs, a title, or a fragment of one when
// that fragment points at exactly one rule.
function waiverIds(fragment, aliases) {
  const frag = fragment.trim()
  const lower = frag.toLowerCase()
  const ids = new Set()
  if (!frag) return ids
  const direct = aliases.get(frag) ?? aliases.get(frag.toUpperCase()) ?? aliases.get(lower)
  if (direct) return ids.add(direct)
  for (const token of frag.split(/[\s,]+/)) {
    const id = ID_SHAPE.test(token) ? (aliases.get(token) ?? aliases.get(token.toUpperCase())) : undefined
    if (id) ids.add(id)
  }
  if (ids.size > 0 || lower.length < 4) return ids
  const hits = new Set()
  for (const [alias, id] of aliases) {
    if (ID_SHAPE.test(alias)) continue
    const a = alias.toLowerCase()
    if (a.includes(lower) || lower.includes(a)) hits.add(id)
  }
  return hits.size === 1 ? hits : ids
}

function waiversOn(line, aliases) {
  const found = []
  if (line === undefined) return found
  for (const m of line.matchAll(/unslop-waive\s+([^\n]*)/g)) {
    const fragment = m[1].split(/\s*·\s*|\*\/|-->|\}\s*$/)[0]
    for (const id of waiverIds(fragment, aliases)) found.push({ id, text: m[0].trim() })
  }
  return found
}

function hitsFor(rule, stripped, matchesFile) {
  const d = rule.detect
  if (!matchesFile) return []
  if (d.kind === "pattern") {
    const hits = []
    for (const m of stripped.matchAll(new RegExp(d.pattern, "gmu"))) {
      hits.push({ index: m.index, text: snippet(m[0]) })
      if (m[0] === "") break
    }
    return hits
  }
  const when = new RegExp(d.when, "mu").exec(stripped)
  if (!when || new RegExp(d.must, "mu").test(stripped)) return []
  return [{ index: when.index, text: snippet(when[0]) }]
}

export function scan(rules, files, ctx) {
  const report = { findings: [], waived: [], notApplicable: [], unchecked: [] }
  const live = []
  for (const rule of rules) {
    const d = rule.detect
    if (d.kind === "render" || d.kind === "judgment") report.unchecked.push({ id: rule.id, kind: d.kind })
    else if (d.requires && !ctx.requires?.[d.requires]) report.notApplicable.push(rule.id)
    else live.push({ rule, globs: d.files.map(globToRegExp) })
  }

  for (const file of files) {
    const path = file.path.replace(/\\/g, "/")
    const stripped = stripFor(path, file.source)
    const starts = lineStarts(file.source)
    const original = file.source.split("\n")
    for (const { rule, globs } of live) {
      if (ctx.exempt?.some((e) => e.id === rule.id && globMatches(e.glob, path))) continue
      const seen = new Set()
      for (const hit of hitsFor(rule, stripped, globs.some((g) => g.test(path) || g.test(path.split("/").pop())))) {
        const line = lineAt(starts, hit.index)
        if (seen.has(line)) continue
        seen.add(line)
        const finding = { id: rule.id, tier: rule.tier, file: path, line, text: hit.text, lineText: (original[line - 1] ?? "").trim() }
        const waiver = [...waiversOn(original[line - 1], ctx.waiveAliases), ...waiversOn(original[line - 2], ctx.waiveAliases)].find((w) => w.id === rule.id)
        if (waiver && rule.tier === "floor") report.findings.push({ ...finding, waiverIgnored: true })
        else if (waiver) report.waived.push({ ...finding, waiver: waiver.text })
        else report.findings.push(finding)
      }
    }
  }
  return report
}

// ------------------------------------------------------------------- output

const byTier = (a, b) =>
  (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || a.file.localeCompare(b.file) || a.line - b.line || a.id.localeCompare(b.id)

export function formatText(report) {
  const lines = [...report.findings]
    .sort(byTier)
    .map((f) => `${f.id} ${TIER_LABEL[f.tier] ?? "FAIL"} ${f.tier}  ${f.file}:${f.line}  ${f.text}${f.waiverIgnored ? "  waiver ignored: floor rule" : ""}`)
  if (report.waived.length > 0) {
    lines.push(`waived: ${[...report.waived].sort(byTier).map((f) => `${f.id} ${f.file}:${f.line}`).join(", ")}`)
  }
  if (report.notApplicable.length > 0) lines.push(`not applicable here: ${report.notApplicable.join(", ")}`)
  const ids = (kind) => report.unchecked.filter((u) => u.kind === kind).map((u) => u.id)
  if (ids("render").length > 0) lines.push(`render: ${ids("render").join(", ")} (run render.mjs)`)
  if (ids("judgment").length > 0) lines.push(`judgment: ${ids("judgment").join(", ")} (unchecked, review by eye)`)
  return lines.join("\n")
}

// ---------------------------------------------------------------- fixtures

// For each pattern and co-occur rule: every <name>.bad.<ext> must yield that
// rule's ID and nothing else, and its <name>.good.<ext> twin must yield nothing.
export function checkFixtures(rules, dir) {
  const failures = []
  const testable = rules.filter((r) => r.detect.kind === "pattern" || r.detect.kind === "co-occur")
  const listing = existsSync(dir) ? readdirSync(dir) : []
  let caught = 0
  for (const rule of testable) {
    const before = failures.length
    const own = rule.detect.requires
    const ctx = defaultCtx(rules)
    if (own) ctx.requires[own] = true
    const pairs = []
    for (const name of rule.fixtures?.length ? rule.fixtures : []) {
      for (const bad of listing.filter((f) => f.startsWith(`${name}.bad.`))) {
        const good = bad.replace(".bad.", ".good.")
        pairs.push({ bad, good: listing.includes(good) ? good : null })
      }
    }
    if (pairs.length === 0 || pairs.some((p) => !p.good)) {
      failures.push(`${rule.id}: no fixture pair (needs <name>.bad.<ext> and <name>.good.<ext> in fixtures/rules, named in the rule's fixtures list)`)
      continue
    }
    for (const { bad, good } of pairs) {
      const badIds = new Set(scan(rules, [{ path: bad, source: readFileSync(join(dir, bad), "utf8") }], ctx).findings.map((f) => f.id))
      if (!badIds.has(rule.id)) failures.push(`${rule.id}: ${bad} did not produce ${rule.id}`)
      else if (badIds.size > 1) failures.push(`${rule.id}: ${bad} also produced ${[...badIds].filter((i) => i !== rule.id).join(", ")}; a bad fixture plants one rule only`)
      const goodIds = new Set(scan(rules, [{ path: good, source: readFileSync(join(dir, good), "utf8") }], ctx).findings.map((f) => f.id))
      if (goodIds.size > 0) failures.push(`${rule.id}: ${good} (good) still produced ${[...goodIds].join(", ")}`)
    }
    if (failures.length === before) caught++
  }
  return { caught, total: testable.length, failures }
}

// --------------------------------------------------------------------- CLI

export function loadRules() {
  return JSON.parse(readFileSync(join(SKILL, "rules/core.json"), "utf8")).rules
}

function child(label, args) {
  const r = spawnSync(process.execPath, args, { encoding: "utf8" })
  const tail = `${r.stdout}${r.stderr}`.trim().split("\n").slice(-12).join("\n")
  return { ok: r.status === 0, label, tail }
}

function selftest() {
  const rules = loadRules()
  let ok = true
  const fx = checkFixtures(rules, join(SKILL, "fixtures/rules"))
  console.log(`rules: ${fx.caught} of ${fx.total} rules caught their positive and stayed quiet on good`)
  for (const f of fx.failures) console.log(`  FAIL ${f}`)
  if (fx.failures.length > 0) ok = false

  const render = spawnSync(process.execPath, [join(HERE, "render.mjs"), "--selftest"], { encoding: "utf8" })
  process.stdout.write(render.stdout)
  process.stderr.write(render.stderr)
  console.log(`render: ${render.status === 0 ? "selftest passed" : "selftest FAILED"}`)
  if (render.status !== 0) ok = false

  // Repo copies vendor the runner and fixtures but not the test files.
  const regTest = join(HERE, "registry.test.mjs")
  if (!existsSync(regTest)) console.log("registry: tests not vendored, skipped")
  else {
    const reg = child("registry", ["--test", regTest])
    console.log(`registry: ${reg.ok ? "tests passed" : "tests FAILED"}`)
    if (!reg.ok) { console.log(reg.tail); ok = false }
  }
  return ok ? 0 : 1
}

function parseArgs(argv) {
  const opts = { files: [], tier: null, json: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") opts.json = true
    else if (argv[i] === "--tier") opts.tier = argv[++i]
    else opts.files.push(argv[i])
  }
  return opts
}

// One scan under a repo's config: local rules, retiers and exempts applied.
// requires.loaders is decided per file: MOT-8 applies to files outside the
// loaders globs, so the scan runs once per group and the reports merge.
// `files` hold { path, source }; paths are matched against globs as given.
export function scanWithConfig(files, cfg, root) {
  const localPath = cfg.rules ? resolve(root, cfg.rules) : null
  if (localPath && !existsSync(localPath) && cfg.rulesExplicit) throw new Error(`${cfg.rules} (named in unslop.config.json) does not exist`)
  const local = localPath && existsSync(localPath) ? loadLocalRules(localPath) : { retier: [], exempt: [], rules: [] }
  const rules = applyLocal(loadRules(), local)
  const ctx = defaultCtx(rules)
  ctx.requires.tokens = cfg.tokens
  ctx.requires.scale = Boolean(cfg.scale)
  ctx.exempt = local.exempt
  const isLoader = (p) => cfg.loaders.some((g) => globMatches(g, p.replace(/\\/g, "/")))
  // MOT-8 (requires loaders) applies once the config names loaders: it runs on
  // files outside the loader globs and is not applicable inside them.
  const groups = [
    { files: files.filter((f) => !isLoader(f.path)), loaders: cfg.loaders.length > 0 },
    { files: files.filter((f) => isLoader(f.path)), loaders: false },
  ].filter((g) => g.files.length > 0)
  if (groups.length === 0) groups.push({ files: [], loaders: cfg.loaders.length > 0 })
  const parts = groups.map((g) => scan(rules, g.files, { ...ctx, requires: { ...ctx.requires, loaders: g.loaders } }))
  const report = parts[0]
  for (const part of parts.slice(1)) {
    for (const k of ["findings", "waived"]) report[k].push(...part[k])
    report.notApplicable = report.notApplicable.filter((id) => part.notApplicable.includes(id))
  }
  // reducedMotionGlobal: a stylesheet that holds the repo-wide guard satisfies MOT-5 everywhere.
  if (cfg.reducedMotionGlobal) {
    const global = resolve(root, cfg.reducedMotionGlobal)
    if (existsSync(global) && /prefers-reduced-motion/.test(readFileSync(global, "utf8"))) {
      report.findings = report.findings.filter((f) => f.id !== "MOT-5")
    }
  }
  return report
}

function check(argv) {
  const opts = parseArgs(argv)
  if (opts.files.length === 0 || (opts.tier && !(opts.tier in TIER_ORDER))) {
    console.error("usage: rules.mjs check <file ...> [--tier floor|reflex|finish] [--json]")
    return 2
  }
  const root = findRepoRoot()
  const cfg = loadConfig(root)
  const files = []
  for (const path of opts.files) {
    if (!existsSync(path)) { console.error(`rules.mjs: no such file ${path}`); return 2 }
    files.push({ path, source: readFileSync(path, "utf8") })
  }
  const report = scanWithConfig(files, cfg, root)
  const hasFloor = report.findings.some((f) => f.tier === "floor")
  if (opts.tier) {
    report.findings = report.findings.filter((f) => f.tier === opts.tier)
    report.waived = report.waived.filter((f) => f.tier === opts.tier)
  }
  console.log(opts.json ? JSON.stringify(report, null, 2) : formatText(report))
  return hasFloor ? 1 : 0
}

function list(argv) {
  const opts = parseArgs(argv)
  const rows = loadRules().map((r) => ({ id: r.id, tier: r.tier, kind: r.detect.kind, title: r.title }))
  console.log(opts.json ? JSON.stringify(rows, null, 2) : rows.map((r) => `${r.id}  ${r.tier}  ${r.kind}  ${r.title}`).join("\n"))
  return 0
}

function main(argv) {
  const [cmd, ...rest] = argv
  if (cmd === "check") return check(rest)
  if (cmd === "list") return list(rest)
  if (cmd === "selftest") return selftest()
  console.error("usage: rules.mjs check <file ...> [--tier t] [--json] | list [--json] | selftest")
  return 2
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = main(process.argv.slice(2))
  } catch (e) {
    // Exit 2 is "the runner broke"; exit 1 is reserved for a Floor finding.
    console.error(`rules.mjs: ${e.message}`)
    process.exitCode = 2
  }
}
