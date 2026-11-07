// Reads unslop.config.json and rules/local.json. rules.mjs and render.mjs
// consume it; nothing here knows how a rule is matched.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { AREAS, TIERS, validateRegistry } from "../rules/schema.mjs"

export const CONFIG_NAME = "unslop.config.json"
const DEFAULT_RULES = "rules/local.json"
const UI_EXTENSIONS = ["tsx", "jsx", "vue", "svelte", "astro", "html", "css", "scss", "sass", "less"]
const STYLESHEET = /\.(css|scss|sass|less)$/i
const TOKEN_FILE = /^(tokens|theme)\..+|^tailwind\.config\..+/i
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git"])
const MAX_FILES = 2000
const CUSTOM_PROPERTY_FLOOR = 20

// The directory holding .git (file or folder), found by walking up; else start.
export function findRepoRoot(start = process.cwd()) {
  let dir = resolve(start)
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir
    const up = dirname(dir)
    if (up === dir) return resolve(start)
    dir = up
  }
}

const list = (v, fallback) => (Array.isArray(v) && v.every((s) => typeof s === "string") ? v : fallback)

export function loadConfig(repoRoot) {
  const file = join(repoRoot, CONFIG_NAME)
  let raw = {}
  if (existsSync(file)) {
    try {
      raw = JSON.parse(readFileSync(file, "utf8"))
    } catch (e) {
      throw new Error(`${CONFIG_NAME}: ${e.message}`)
    }
  }
  const rules = typeof raw.rules === "string" ? raw.rules : existsSync(join(repoRoot, DEFAULT_RULES)) ? DEFAULT_RULES : undefined
  const widthsOk = Array.isArray(raw.widths) && raw.widths.length > 0 && raw.widths.every((w) => Number.isInteger(w) && w > 0)
  const cfg = {
    routes: list(raw.routes, ["/"]),
    widths: widthsOk ? raw.widths : [375, 1280],
    allowMove: list(raw.allowMove, []),
    allowMotion: list(raw.allowMotion, []),
    hook: { enabled: raw.hook?.enabled ?? true, deepOnStop: raw.hook?.deepOnStop ?? true },
    reviewer: raw.reviewer ?? true,
    tokens: typeof raw.tokens === "boolean" ? raw.tokens : detectTokens(repoRoot),
    loaders: list(raw.loaders, []),
    uiExtensions: [...new Set([...UI_EXTENSIONS, ...list(raw.uiExtensions, []).map((e) => e.replace(/^\./, "").toLowerCase())])],
  }
  if (typeof raw.devUrl === "string") cfg.devUrl = raw.devUrl
  if (typeof raw.reducedMotionGlobal === "string" && raw.reducedMotionGlobal !== "") cfg.reducedMotionGlobal = raw.reducedMotionGlobal
  if (rules) cfg.rules = rules
  cfg.rulesExplicit = typeof raw.rules === "string"
  if (raw.scale && typeof raw.scale === "object") cfg.scale = raw.scale
  return cfg
}

// True when the repo has a token file, or any stylesheet defining 20+ custom
// properties. Reads at most 2000 files.
export function detectTokens(repoRoot) {
  let seen = 0
  const queue = [repoRoot]
  while (queue.length) {
    const dir = queue.shift()
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) queue.push(join(dir, e.name))
        continue
      }
      if (!e.isFile()) continue
      if (++seen > MAX_FILES) return false
      if (TOKEN_FILE.test(e.name)) return true
      if (STYLESHEET.test(e.name)) {
        const full = join(dir, e.name)
        try {
          if (statSync(full).size > 2_000_000) continue
          const props = readFileSync(full, "utf8").match(/(?:^|[\s;{])--[\w-]+\s*:/g)
          if (props && props.length >= CUSTOM_PROPERTY_FLOOR) return true
        } catch { /* unreadable file: skip */ }
      }
    }
  }
  return false
}

function needReason(kind, e) {
  if (typeof e?.reason !== "string" || e.reason.trim() === "") throw new Error(`local.json: ${kind} for ${e?.id} needs a reason`)
}

export function loadLocalRules(path) {
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (e) {
    throw new Error(`local.json: ${e.message}`)
  }
  const retier = raw.retier ?? []
  const exempt = raw.exempt ?? []
  const rules = raw.rules ?? []
  for (const e of retier) {
    needReason("retier", e)
    if (!TIERS.includes(e.tier)) throw new Error(`local.json: retier for ${e.id}: tier must be floor, reflex or finish`)
  }
  for (const e of exempt) {
    needReason("exempt", e)
    if (typeof e.glob !== "string" || !e.glob) throw new Error(`local.json: exempt for ${e.id} needs a glob`)
  }
  for (const r of rules) {
    // The registry check wants core IDs, so each rule is checked with its repo prefix dropped.
    const bare = typeof r?.id === "string" ? r.id.replace(new RegExp(`^[A-Z]{2,6}-(?=(?:${AREAS.join("|")})-)`), "") : r?.id
    const problem = validateRegistry({ version: 1, rules: [{ ...r, id: bare }] })[0]
    if (problem) throw new Error(`local.json: ${typeof bare === "string" && typeof r.id === "string" ? problem.replace(bare, r.id) : problem}`)
  }
  return { retier, exempt, rules }
}

const LOCAL_ID = new RegExp(`^[A-Z]{2,6}-(${AREAS.join("|")})-[1-9]\\d*$`)

export function applyLocal(core, local) {
  const ids = new Set(core.map((r) => r.id))
  const tiers = new Map()
  for (const e of local.retier) {
    if (!ids.has(e.id)) throw new Error(`local.json: retier names unknown rule ${e.id}`)
    tiers.set(e.id, e.tier)
  }
  for (const e of local.exempt) {
    if (!ids.has(e.id)) throw new Error(`local.json: exempt names unknown rule ${e.id}`)
  }
  for (const r of local.rules) {
    if (!LOCAL_ID.test(r?.id ?? "")) throw new Error(`local.json: rule ${r?.id} needs a repo prefix, e.g. SC-EFF-1`)
    if (ids.has(r.id)) throw new Error(`local.json: rule ${r.id} duplicates a core rule`)
    ids.add(r.id)
  }
  return [...core.map((r) => (tiers.has(r.id) ? { ...r, tier: tiers.get(r.id) } : r)), ...local.rules]
}

// Config values fill only what the flags left unset. `given` holds the flag
// names that were passed on the command line.
export function applyRenderConfig(opts, cfg, given) {
  if (!given.has("--widths")) opts.widths = cfg.widths
  if (!given.has("--allow-move")) opts.allowMove = [...cfg.allowMove]
  if (!given.has("--allow-motion")) opts.allowMotion = [...opts.allowMotion, ...cfg.allowMotion]
  opts.routes = cfg.routes
  return opts
}

// An origin-only http(s) target (no path, query or fragment) expands to the
// configured routes; a route without a leading slash gets one.
export function expandRoutes(target, routes) {
  if (!routes || !/^https?:\/\/[^/?#]+\/?$/.test(target)) return [target]
  const origin = target.replace(/\/$/, "")
  return routes.map((r) => origin + (r.startsWith("/") ? r : `/${r}`))
}
