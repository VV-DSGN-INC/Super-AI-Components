/** Ladder gate for the radius scale across the theme × finish cross-product.
 *
 *  Radius is the one dimension token both axes touch: themes own the scale
 *  (Foundations → Layout & Spacing reads the three rungs as "sizes of claim" —
 *  control < entity container < overlay), and finishes load AFTER themes at
 *  equal specificity, so anything a finish declares wins outright.
 *
 *  That cost us once: `elevated` set `--radius-card: 18px` alone, which landed
 *  1px under pegbo-emerald's 19px popup and flattened Card against
 *  DialogContent in the exact pair both prototypes ship. The rule this file
 *  enforces is the fix: a finish replaces the WHOLE radius scale or none of
 *  it, and every resulting scale still has to read as a ladder.
 *
 *  Radii carry no light/dark variance (no `.dark` block declares one), so the
 *  sweep is 3 themes × 3 finishes = 9 cells, mode-invariant.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")

const globals = read("./globals.css")
const emerald = read("./themes/pegbo-emerald.css")
const warm = read("./themes/pegbo-warm.css")
const elevated = read("./finishes/elevated.css")
const flatDense = read("./finishes/flat-dense.css")

/** Pull the flat declaration block for a selector. Same parser as
 *  token-contrast.test.ts: these files hold declarations and comments only. */
function block(css: string, selector: string): Record<string, string> {
  // Anchor at line start — the prose comments name selectors too.
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

/** The four role radii a scale is made of. */
const ROLES = ["--radius-button", "--radius-control", "--radius-card", "--radius-popup"] as const

const root = block(globals, ":root")
const themes = {
  base: {},
  "pegbo-emerald": block(emerald, '[data-theme="pegbo-emerald"]'),
  "pegbo-warm": block(warm, '[data-theme="pegbo-warm"]'),
}
const finishes = {
  default: {},
  elevated: block(elevated, '[data-finish="elevated"]'),
  "flat-dense": block(flatDense, '[data-finish="flat-dense"]'),
}

/** Later layers win, like the cascade — and every entry point (.storybook,
 *  docs, both prototypes) imports finishes after themes, which is what makes
 *  this order the real one rather than a convenient one. */
function px(layers: Record<string, string>[], name: string): number {
  let value: string | undefined
  for (const layer of layers) if (name in layer) value = layer[name]
  if (!value) throw new Error(`token not found: ${name}`)
  const m = value.match(/^(-?[\d.]+)px$/)
  if (!m) throw new Error(`${name} is not a px literal: ${value}`)
  return Number(m[1])
}

const cells = Object.entries(themes).flatMap(([theme, t]) =>
  Object.entries(finishes).map(([finish, f]) => ({
    name: `${theme} + ${finish}`,
    scale: Object.fromEntries(ROLES.map((r) => [r, px([root, t, f], r)])) as Record<
      (typeof ROLES)[number],
      number
    >,
  })),
)

describe("radius scale · theme × finish", () => {
  it("declares radius all-or-nothing per finish", () => {
    // A finish that moves one rung can only be right for one theme by
    // accident: it overrides an absolute px into a scale whose other rungs
    // the theme chose at its own ratios. Replace the whole ladder or leave it.
    for (const [finish, decls] of Object.entries(finishes)) {
      const declared = ROLES.filter((r) => r in decls)
      expect(
        declared.length === 0 || declared.length === ROLES.length,
        `finish "${finish}" declares a partial radius scale (${declared.join(", ")}) — ` +
          `declare all of ${ROLES.join(", ")} or none`,
      ).toBe(true)
    }
  })

  it.each(cells)("$name reads as a ladder", ({ name, scale }) => {
    const [button, card, popup] = [
      scale["--radius-button"],
      scale["--radius-card"],
      scale["--radius-popup"],
    ]
    // Each rung at least 1.2× the one below, so "control < entity container <
    // overlay" survives as a *visible* difference and not just an ordering.
    // Integer cross-multiply — 12/10 sits exactly on the floor (flat-dense's
    // top step, the tightest in the system) and float division mis-rounds it.
    expect(card * 5, `${name}: card ${card}px is not ≥1.2× button ${button}px`).toBeGreaterThanOrEqual(
      button * 6,
    )
    expect(popup * 5, `${name}: popup ${popup}px is not ≥1.2× card ${card}px`).toBeGreaterThanOrEqual(
      card * 6,
    )
  })

  it.each(cells)("$name holds whole-px radii", ({ name, scale }) => {
    // Whole px in both code and Figma since 2026-08-11 — the reason a
    // relative/multiplier finish (13 × 1.125 = 14.625px) is not on the table.
    for (const role of ROLES) {
      expect(Number.isInteger(scale[role]), `${name}: ${role} = ${scale[role]}px`).toBe(true)
    }
  })

  it("does not grow the distinct-radius count", () => {
    // The value ratchet from AGENTS.md. Today: 6/8 controls, 10/12/16 cards,
    // 12/18/24 popups. This may shrink, never grow — a new number here means a
    // new decision that the three designed scales did not need.
    const distinct = new Set(cells.flatMap((c) => ROLES.map((r) => c.scale[r])))
    expect([...distinct].sort((a, b) => a - b)).toHaveLength(7)
  })
})
