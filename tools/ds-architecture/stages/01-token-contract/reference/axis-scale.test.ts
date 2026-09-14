import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/** All-or-nothing gate for a scale both axes want to own.
 *
 *  A radius scale has rungs that must stay in proportion. An axis replaces the
 *  WHOLE scale or leaves it entirely to the other axis — never one rung. A
 *  single-rung override is correct for at most one cell by accident: it once
 *  left one theme's card radius a rung out of step with its own popup, and the
 *  three cells where it happened to look fine hid it.
 *
 *  Point RUNGS at your own scale and SCALE_FILES at your axis stylesheets. */

const RUNGS = ["--radius-control", "--radius-card"]
const SCALE_FILES = ["src/styles/themes/example-theme.css", "src/styles/finishes/example-finish.css"]

describe("radius scale is all-or-nothing per axis", () => {
  it.each(SCALE_FILES)("%s overrides every rung or none", (file) => {
    let css: string
    try {
      css = readFileSync(path.resolve(process.cwd(), file), "utf8")
    } catch {
      return
    }
    const overridden = RUNGS.filter((rung) => new RegExp(`^\\s*${rung}\\s*:`, "m").test(css))
    expect(
      overridden.length === 0 || overridden.length === RUNGS.length,
      `overrides ${overridden.length} of ${RUNGS.length} rungs: ${overridden.join(", ")}`
    ).toBe(true)
  })
})
