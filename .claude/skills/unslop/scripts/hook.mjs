#!/usr/bin/env node
// unslop's Claude Code hook. One script, two modes picked by hook_event_name:
//
//   PostToolUse (Edit|Write)  scans the one UI file just written and hands the
//                             agent any finding it has not been told about yet.
//   Stop                      a deep pass over every UI file the session
//                             edited: all tiers, plus the render tier when a
//                             dev server answers and a file changed this turn.
//
// A Stop blocks (decision: block) only when a Floor finding (a static hit or a
// render FAIL) sits in a file edited since the previous Stop, that finding has
// not blocked before in this session, and stop_hook_active is false. Every
// finding blocks at most once, so a turn that edits nothing never blocks and
// three Stops after one edit block once. Everything else goes out as a
// systemMessage: Floor findings that already blocked, Reflex and Finish
// findings, skip notes, and render FAILs still unfixed from an earlier pass.
//
// Advisory only: any failure exits 0 with no output. Stdin is one JSON object,
// stdout is one JSON object or nothing.

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, realpathSync } from "node:fs"
import { tmpdir as osTmpdir } from "node:os"
import { dirname, join, relative, resolve, isAbsolute, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { findRepoRoot, loadConfig, expandRoutes } from "./config.mjs"
import { isUiFile, scanWithConfig, formatText } from "./rules.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const SELF = fileURLToPath(import.meta.url)
const SKIP_PATH = /(^|\/)(node_modules|dist|build|\.git)\/|(^|\/)fixtures\/(rules|grep|render)\//
const DEEP_BUDGET_MS = 60_000
const ROUTE_CUTOFF_MS = 45_000
const ANSWER_MS = 2_000

// ------------------------------------------------------------------- shared

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v)

// The repo root and config for this call, or null when the hook stays silent:
// switched off, or the repo runs its own vendored copy of this hook.
function prepare(input, env) {
  if (!isObject(input) || typeof input.cwd !== "string" || input.cwd === "") return null
  if ((env.vars ?? process.env).UNSLOP_HOOK === "0") return null
  const root = findRepoRoot(input.cwd)
  const vendored = join(root, ".claude/skills/unslop/scripts/hook.mjs")
  if (existsSync(vendored) && realpathSync(vendored) !== realpathSync(SELF)) return null
  const cfg = loadConfig(root)
  if (cfg.hook.enabled === false) return null
  return { root, cfg }
}

// The path as the scanner should see it: relative to the repo, forward slashes.
function display(root, abs) {
  const rel = relative(root, abs)
  const inside = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)
  return (inside ? rel : abs).split(sep).join("/")
}

function cacheFile(input, env) {
  const id = String(input.session_id ?? "default").replace(/[^\w.-]/g, "_") || "default"
  return join(env.tmpdir ?? osTmpdir(), "unslop", `${id}.json`)
}

function loadCache(file) {
  const empty = { reported: [], edited: [], lastDeep: 0, blocked: [], renderFails: [] }
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"))
    return {
      reported: Array.isArray(raw.reported) ? raw.reported : [],
      edited: Array.isArray(raw.edited) ? raw.edited : [],
      lastDeep: Number.isFinite(raw.lastDeep) ? raw.lastDeep : 0,
      blocked: Array.isArray(raw.blocked) ? raw.blocked : [],
      renderFails: Array.isArray(raw.renderFails) ? raw.renderFails : [],
    }
  } catch {
    return empty
  }
}

function saveCache(file, cache) {
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(cache))
  } catch { /* a cache that cannot be written only means a finding may repeat */ }
}

// Keyed on the line as written, so a finding survives a changed snippet.
const findingKey = (f) => `${f.file}|${f.id}|${f.lineText ?? f.text}`

const onlyFindings = (findings) => formatText({ findings, waived: [], notApplicable: [], unchecked: [] })

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

// ------------------------------------------------------------- PostToolUse

export function runPostToolUse(input, env = {}) {
  const ctx = prepare(input, env)
  if (!ctx) return null
  const filePath = input.tool_input?.file_path
  if (typeof filePath !== "string" || filePath === "") return null
  const abs = resolve(input.cwd, filePath)
  const shown = display(ctx.root, abs)
  if (SKIP_PATH.test(shown)) return null
  if (!existsSync(abs)) return null
  const source = readFileSync(abs, "utf8")
  if (!isUiFile(abs, source, ctx.cfg.uiExtensions)) return null

  const file = cacheFile(input, env)
  const cache = loadCache(file)
  if (!cache.edited.includes(abs)) cache.edited.push(abs)

  const report = scanWithConfig([{ path: shown, source }], ctx.cfg, ctx.root)
  const seen = new Set(cache.reported)
  const fresh = report.findings.filter((f) => !seen.has(findingKey(f)))
  cache.reported.push(...fresh.map(findingKey))
  saveCache(file, cache)
  if (fresh.length === 0) return null

  const text = `unslop: ${plural(fresh.length, "finding")} in ${shown}\n${onlyFindings(fresh)}`
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } })
}

// -------------------------------------------------------------------- Stop

// Runs render.mjs on one already-expanded URL and returns its parsed JSON
// report. render.mjs exits 1 when it has FAIL findings; its stdout is still the
// report. A timeout sends SIGTERM so render.mjs can close Chrome; SIGKILL
// follows only if it is still running 2 s later.
export function defaultRender(url, { widths, cwd, timeoutMs, script = join(HERE, "render.mjs") }) {
  return new Promise((resolveRun, reject) => {
    const args = [script, url, "--json", "--no-route-expansion", "--widths", widths.join(",")]
    const child = spawn(process.execPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    let out = ""
    let err = ""
    let killer = null
    child.stdout.on("data", (d) => { out += d })
    child.stderr.on("data", (d) => { err += d })
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      killer = setTimeout(() => child.kill("SIGKILL"), 2_000)
      reject(new Error("render timed out"))
    }, timeoutMs)
    child.on("error", (e) => { clearTimeout(timer); clearTimeout(killer); reject(e) })
    child.on("close", () => {
      clearTimeout(timer)
      clearTimeout(killer)
      try { resolveRun(JSON.parse(out)) } catch { reject(new Error(err.trim() || "render.mjs printed no report")) }
    })
  })
}

async function answers(url, fetchFn) {
  try {
    await fetchFn(url, { method: "GET", signal: AbortSignal.timeout(ANSWER_MS) })
    return true
  } catch {
    return false
  }
}

const renderKey = (f) => `${f.target}|${f.check}|${f.width}`

// Render tier over devUrl + routes, one render.mjs call per already-expanded
// URL. Returns { findings, notes, measured }.
async function renderTier(cfg, root, now, env) {
  const notes = []
  const findings = []
  const targets = expandRoutes(cfg.devUrl, cfg.routes)
  const render = env.render ?? defaultRender
  const started = now()
  const unmeasured = []
  const measured = []
  for (const url of targets) {
    const elapsed = now() - started
    if (elapsed >= ROUTE_CUTOFF_MS) { unmeasured.push(new URL(url).pathname); continue }
    try {
      const result = await render(url, { widths: cfg.widths, cwd: root, timeoutMs: DEEP_BUDGET_MS - 5_000 - elapsed })
      for (const f of result?.findings ?? []) if (f.grade === "FAIL" || f.grade === "WARN") findings.push(f)
      measured.push(url)
    } catch (e) {
      notes.push(`render failed for ${url}: ${String(e.message ?? e).split("\n")[0]}`)
    }
  }
  if (unmeasured.length > 0) notes.push(`not measured: ${unmeasured.join(", ")}`)
  return { findings, notes, measured }
}

export async function runStop(input, env = {}) {
  const ctx = prepare(input, env)
  if (!ctx || ctx.cfg.hook.deepOnStop === false) return null
  const { root, cfg } = ctx
  const now = env.now ?? Date.now
  const file = cacheFile(input, env)
  const cache = loadCache(file)
  const edited = cache.edited.filter((p) => existsSync(p))
  if (edited.length === 0) return null

  const files = edited.map((p) => ({ path: display(root, p), source: readFileSync(p, "utf8") }))
  const report = scanWithConfig(files, cfg, root)
  const seen = new Set(cache.reported)
  const staticAll = report.findings
  const staticNew = staticAll.filter((f) => !seen.has(findingKey(f)))

  // Files edited since the previous Stop. Only their Floor findings can block.
  const touched = new Set(edited.filter((p) => statSync(p).mtimeMs > cache.lastDeep).map((p) => display(root, p)))

  const notes = []
  let renderAll = cache.renderFails
  let renderThisTurn = []
  if (!cfg.devUrl) {
    notes.push("render tier skipped: no devUrl")
  } else if (touched.size > 0) {
    if (await answers(cfg.devUrl, env.fetch ?? globalThis.fetch)) {
      const tier = await renderTier(cfg, root, now, env)
      notes.push(...tier.notes)
      renderThisTurn = tier.findings
      // A route that was re-rendered replaces its old FAILs; routes not
      // measured this time keep theirs until a clean render.
      const measured = new Set(tier.measured)
      const kept = cache.renderFails.filter((f) => !measured.has(f.target))
      renderAll = [...kept, ...tier.findings.filter((f) => f.grade === "FAIL")]
      cache.renderFails = renderAll
    } else {
      notes.push("render tier skipped: devUrl did not answer")
    }
  }
  // Warnings from this turn's render are shown alongside the carried FAILs.
  const shownRenderAll = [...renderAll, ...renderThisTurn.filter((f) => f.grade !== "FAIL")]
  const renderNew = shownRenderAll.filter((f) => !seen.has(renderKey(f)))

  // What may block: Floor findings in files edited this turn, and this turn's
  // render FAILs, minus anything that already blocked once.
  const blockedBefore = new Set(cache.blocked)
  const candidates = [
    ...staticAll.filter((f) => f.tier === "floor" && touched.has(f.file)).map((f) => findingKey(f)),
    ...renderThisTurn.filter((f) => f.grade === "FAIL").map((f) => renderKey(f)),
  ].filter((k) => !blockedBefore.has(k))
  const blocking = candidates.length > 0 && !input.stop_hook_active

  cache.reported.push(...staticNew.map(findingKey), ...renderNew.map(renderKey))
  if (blocking) cache.blocked.push(...new Set(candidates))
  cache.edited = edited
  cache.lastDeep = now()
  saveCache(file, cache)

  // Floor findings still in the edited files are reported whether or not
  // PostToolUse already showed them; otherwise only what is new.
  const floor = staticAll.some((f) => f.tier === "floor") || shownRenderAll.some((f) => f.grade === "FAIL")
  const shownStatic = floor ? staticAll : staticNew
  const shownRender = floor ? shownRenderAll : renderNew
  if (shownStatic.length + shownRender.length === 0) return null
  const mark = (line, isSeen) => (isSeen ? `${line} (seen)` : line)
  const lines = [`unslop deep pass: ${plural(shownStatic.length + shownRender.length, "finding")}`]
  const rank = { floor: 0, reflex: 1, finish: 2 }
  const ordered = [...shownStatic].sort((a, b) => (rank[a.tier] ?? 9) - (rank[b.tier] ?? 9) || a.file.localeCompare(b.file) || a.line - b.line || a.id.localeCompare(b.id))
  for (const f of ordered) lines.push(mark(onlyFindings([f]), seen.has(findingKey(f))))
  for (const f of shownRender) lines.push(mark(`${f.check} ${f.grade} render  ${f.target}  ${f.width}px  ${f.evidence}`, seen.has(renderKey(f))))
  lines.push(...notes)
  const text = lines.join("\n")

  if (blocking) return JSON.stringify({ decision: "block", reason: text })
  return JSON.stringify({ systemMessage: text })
}

// -------------------------------------------------------------------- main

async function readStdin() {
  let data = ""
  for await (const chunk of process.stdin) data += chunk
  return data
}

async function main() {
  try {
    if (!process.argv[1] || realpathSync(resolve(process.argv[1])) !== realpathSync(SELF)) return
    const input = JSON.parse(await readStdin())
    const mode = input?.hook_event_name
    const out = mode === "PostToolUse" ? runPostToolUse(input) : mode === "Stop" ? await runStop(input) : null
    if (out) process.stdout.write(out + "\n")
  } catch { /* advisory hook: never break the session */ }
  process.exitCode = 0
}

await main()
