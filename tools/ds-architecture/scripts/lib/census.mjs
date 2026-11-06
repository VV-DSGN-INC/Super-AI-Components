import { readFileSync } from "node:fs"

import { declaredSlots } from "./slots.mjs"
import { loadConfig } from "./validate-config.mjs"

/** The bucket for slots with no data-ds above them. Named, because a slot
 *  counted under nothing is invisible in the report. */
export const NO_SYSTEM = "(no data-ds)"

/** The text report lists this many unused slots; --json always has all. A
 *  library's full slot list on one page is hundreds of names nobody reads. */
const UNUSED_SHOWN = 30

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"])
/** Elements whose content is text, not markup: a data-slot inside a script
 *  string or a CSS selector is not a rendered element. */
const RAW_TEXT = new Set(["script", "style", "textarea", "title"])

const TAG =
  /<!--[\s\S]*?-->|<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/)?>/g

function attribute(attrs, name) {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`))
  return m ? (m[1] ?? m[2] ?? m[3]) : null
}

/** Counts every data-slot in an HTML document, grouped by the nearest data-ds
 *  ancestor (the element's own data-ds counts as nearest). A small tag scanner
 *  rather than a parser: the runner may import nothing outside node:, and a
 *  census needs only open, close, void and raw-text elements to get nesting
 *  right on real pages. */
export function censusHtml(html) {
  const counts = new Map()
  const stack = []
  const bump = (system, slot) => {
    const bucket = counts.get(system) ?? new Map()
    bucket.set(slot, (bucket.get(slot) ?? 0) + 1)
    counts.set(system, bucket)
  }

  TAG.lastIndex = 0
  let m
  while ((m = TAG.exec(html))) {
    if (m[0].startsWith("<!--")) continue
    const [, closing, rawTag, attrs = "", selfClosing] = m
    const tag = rawTag.toLowerCase()

    if (closing) {
      const i = stack.map((e) => e.tag).lastIndexOf(tag)
      if (i >= 0) stack.length = i
      continue
    }

    const own = attribute(attrs, "data-ds")
    const system = own ?? [...stack].reverse().find((e) => e.ds)?.ds ?? NO_SYSTEM
    const slot = attribute(attrs, "data-slot")
    if (slot) bump(system, slot)

    if (VOID.has(tag) || selfClosing) continue
    stack.push({ tag, ds: own })
    if (RAW_TEXT.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, TAG.lastIndex)
      TAG.lastIndex = end < 0 ? html.length : end
    }
  }

  const systems = [...counts.entries()]
    .map(([id, slots]) => ({
      id,
      slots: [...slots.entries()].map(([slot, count]) => ({ slot, count })).sort((a, b) => b.count - a.count || a.slot.localeCompare(b.slot)),
      total: [...slots.values()].reduce((n, c) => n + c, 0),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
  return { systems, total: systems.reduce((n, s) => n + s.total, 0) }
}

/** Reads a page (an HTML file, or a URL fetched as served) and counts it. With
 *  `target`, also lists which of that system's declared slots the page used
 *  and which it never rendered. A page that cannot be read throws: "could not
 *  tell" must never come back as an empty census. */
export async function runCensus(source, { target } = {}) {
  let html
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source)
    if (!res.ok) throw new Error(`could not read ${source}: HTTP ${res.status}`)
    html = await res.text()
  } else {
    try {
      html = readFileSync(source, "utf8")
    } catch (err) {
      throw new Error(`could not read ${source}: ${err.message}`)
    }
  }

  const out = { source, ...censusHtml(html) }
  if (!target) return out

  const loaded = loadConfig(target)
  if (!loaded.ok) throw new Error(`could not read the target's config: ${loaded.reason}`)
  const systemId = loaded.config.runtime?.systemId ?? NO_SYSTEM
  const declared = declaredSlots(target, loaded.config)
  const seen = new Set(out.systems.find((s) => s.id === systemId)?.slots.map((s) => s.slot) ?? [])
  return {
    ...out,
    target: {
      systemId,
      declared: declared.length,
      used: declared.filter((s) => seen.has(s)),
      unused: declared.filter((s) => !seen.has(s)),
    },
  }
}

export function formatCensus(out) {
  const lines = [`census: ${out.source}  (${out.total} slotted element(s))`]
  for (const system of out.systems) {
    lines.push(`${system.id}  ${system.total}`)
    lines.push(`  ${system.slots.map((s) => `${s.slot} ${s.count}`).join(" · ")}`)
  }
  if (out.target) {
    const t = out.target
    lines.push(`${t.systemId}: ${t.used.length} of ${t.declared} declared slot(s) rendered on this page`)
    // Zero attributed slots on a page full of slots almost always means the
    // provider that writes data-ds is not mounted, not that nothing is used.
    // Say so, or the report reads as "this system is dead here".
    const unattributed = out.systems.find((s) => s.id === NO_SYSTEM)?.total ?? 0
    if (!out.systems.some((s) => s.id === t.systemId) && unattributed > 0) {
      lines.push(
        `  no element carries data-ds="${t.systemId}", so ${unattributed} slot(s) under ${NO_SYSTEM} were not counted as this system's; check the page mounts the provider that writes it`
      )
    }
    if (t.unused.length) {
      const shown = t.unused.slice(0, UNUSED_SHOWN)
      const more = t.unused.length - shown.length
      lines.push(`  unused here (${t.unused.length}): ${shown.join(", ")}${more > 0 ? `, and ${more} more (--json lists all)` : ""}`)
    }
  }
  return lines
}
