/** WCAG gate for the text ramp. Parses the real stylesheets, resolves the
 *  var() chains per mode (theme × light/dark), and measures contrast — so a
 *  "restore" of a failing value (e.g. tertiary back to ink-400/ink-600, see
 *  the 2026-08-13 fix) is a red test, not a review catch. Same protection the
 *  AGENTS.md notes give --status-action / --text-destructive in prose. */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")

const globals = read("./globals.css")
const warm = read("./themes/pegbo-warm.css")

/** Pull the flat declaration block for a selector. Blocks in these files hold
 *  only declarations and comments, never nested rules. */
function block(css: string, selector: string): Record<string, string> {
  // Anchor at line start: prose comments mention selectors like `.dark`, and
  // a plain indexOf happily matches those and returns the wrong block.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const start = css.search(new RegExp(`^${escaped}[^{]*\\{`, "m"))
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start))
  const decls: Record<string, string> = {}
  for (const m of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    decls[m[1]!] = m[2]!.trim()
  }
  return decls
}

/** Later blocks win, like the cascade. */
const modes = {
  "emerald light": [block(globals, ":root")],
  "emerald dark": [block(globals, ":root"), block(globals, ".dark")],
  "warm light": [block(globals, ":root"), block(warm, '[data-theme="pegbo-warm"]')],
  "warm dark": [
    block(globals, ":root"),
    block(globals, ".dark"),
    block(warm, '[data-theme="pegbo-warm"]'),
    block(warm, '[data-theme="pegbo-warm"].dark'),
  ],
}

function resolve(layers: Record<string, string>[], name: string): string {
  let value: string | undefined
  for (const layer of layers) if (name in layer) value = layer[name]
  if (!value) throw new Error(`token not found: ${name}`)
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  return ref ? resolve(layers, ref[1]!) : value
}

function luminance(hex: string): number {
  const h = hex.replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not an opaque hex: ${hex}`)
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe.each(Object.entries(modes))("%s", (_mode, layers) => {
  const on = (fg: string, bg: string) =>
    contrast(resolve(layers, fg), resolve(layers, bg))

  it("primary and secondary text meet AA on page and card", () => {
    for (const fg of ["--text-primary", "--text-secondary"]) {
      expect(on(fg, "--surface-page")).toBeGreaterThanOrEqual(4.5)
      expect(on(fg, "--surface-card")).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("tertiary text meets AA on page and card", () => {
    expect(on("--text-tertiary", "--surface-page")).toBeGreaterThanOrEqual(4.5)
    expect(on("--text-tertiary", "--surface-card")).toBeGreaterThanOrEqual(4.5)
  })

  /** The rail is a third track. It has its own surface (--base-50 in light,
   *  a card-like ink in dark) and its own alias set — but shadcn ships no
   *  --sidebar-muted-foreground, so secondary text on the rail rides the
   *  generic ramp. Nothing measured this track before, which is how
   *  `text-sidebar-foreground/60` survived at 4.48:1 in warm light: a
   *  percentage of Text Primary tracks neither the rail's tint nor the ramp's
   *  AA-corrected steps, and an opacity composite is invisible to a gate that
   *  measures tokens. Asserted through the --sidebar-* aliases, not their
   *  Layer-2 sources, so repointing the rail at another surface fails here. */
  it("sidebar and muted foreground meet AA on the sidebar surface", () => {
    expect(on("--sidebar-foreground", "--sidebar")).toBeGreaterThanOrEqual(4.5)
    expect(on("--muted-foreground", "--sidebar")).toBeGreaterThanOrEqual(4.5)
  })

  it("tertiary stays large-text AA on muted fills (its documented floor)", () => {
    expect(on("--text-tertiary", "--surface-secondary")).toBeGreaterThanOrEqual(3)
  })

  it("the ramp keeps its order: primary > secondary > tertiary > disabled", () => {
    const card = (fg: string) => on(fg, "--surface-card")
    expect(card("--text-primary")).toBeGreaterThan(card("--text-secondary"))
    expect(card("--text-secondary")).toBeGreaterThan(card("--text-tertiary"))
    expect(card("--text-tertiary")).toBeGreaterThan(card("--text-disabled"))
  })
})
