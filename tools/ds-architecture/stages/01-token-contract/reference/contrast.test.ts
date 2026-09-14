import { describe, expect, it } from "vitest"

/** Contrast gate. Every text token must clear AA against the surfaces it is
 *  actually painted on, in EVERY axis cell — not just the default one. A ramp
 *  that passes in three cells and fails in the fourth is the failure mode: the
 *  three passing cells hide it.
 *
 *  Replace the fixture below with your real values, and enumerate your real
 *  cells. Keep the cell enumeration derived from the axis list rather than
 *  hardcoded, so a new axis value arrives already gated. */

const AXES = [
  { attribute: "data-theme", values: ["default", "example"] },
  { attribute: "data-finish", values: ["default", "example"] },
]

/** Each axis contributes its values PLUS the unset state, which is a real cell
 *  that ships. Two axes of two values is nine cells, not four. */
function cells() {
  return AXES.reduce<Record<string, string>[]>(
    (acc, axis) =>
      acc.flatMap((cell) =>
        [null, ...axis.values].map((v) => (v === null ? cell : { ...cell, [axis.attribute]: v }))
      ),
    [{}]
  )
}

function contrastRatio(_foreground: string, _background: string): number {
  throw new Error("Implement against your own token values — see the WCAG relative-luminance formula.")
}

describe.skip("text ramp contrast", () => {
  it("enumerates every axis cell", () => {
    expect(cells()).toHaveLength(9)
  })

  it.each(cells())("AA in cell %o", (_cell) => {
    expect(contrastRatio("--text-primary", "--surface-primary")).toBeGreaterThanOrEqual(4.5)
  })
})
