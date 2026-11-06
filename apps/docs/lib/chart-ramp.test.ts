import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The chart ramp in both themes. The dark block used to be a byte copy of the
 * light one, which left chart-4 and chart-5 at 1.6:1 and 1.2:1 against the
 * dark background. Pinned here: every dark step clears 3:1 (WCAG 1.4.11's
 * non-text minimum, since bars and swatches are graphics), the dark ramp runs
 * in the inverted order of the light one, and Storybook's copy of the theme
 * matches the docs app's so the axe gate renders what ships.
 *
 * Reading apps/storybook from here is the same cross-workspace shape
 * scripts/turbo-inputs.test.ts records: turbo hashes this test from apps/docs
 * files, so a lone edit to Storybook's stylesheet may replay a cached pass
 * locally. CI runs cold, which is the run that matters.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCES = {
  docs: path.join(ROOT, "docs/app/globals.css"),
  storybook: path.join(ROOT, "storybook/src/index.css"),
};

type Block = Record<string, number>;

/** Lightness of every achromatic `--name: oklch(L 0 0)` in a `:root` / `.dark` block. */
function block(css: string, selector: ":root" | ".dark"): Block {
  const blocks = [...css.matchAll(/(^|\n)(:root|\.dark) \{([^}]*)\}/g)].filter((m) => m[2] === selector);
  const out: Block = {};
  for (const [, , , body] of blocks) {
    for (const m of body.matchAll(/(--[a-z0-9-]+):\s*oklch\(([\d.]+) 0 0\)/g)) out[m[1]] = Number(m[2]);
  }
  return out;
}

/** WCAG contrast between two achromatic OKLCH lightnesses (luminance = L³). */
function contrast(a: number, b: number): number {
  const [hi, lo] = [a ** 3, b ** 3].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const STEPS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

describe.each(Object.entries(SOURCES))("chart ramp (%s)", (_name, file) => {
  const css = readFileSync(file, "utf8");
  const light = block(css, ":root");
  const dark = block(css, ".dark");

  it("declares all five steps in both themes", () => {
    for (const step of STEPS) {
      expect(light[step], `${step} light`).toBeTypeOf("number");
      expect(dark[step], `${step} dark`).toBeTypeOf("number");
    }
  });

  it("does not copy the light ramp into dark", () => {
    expect(STEPS.map((s) => dark[s])).not.toEqual(STEPS.map((s) => light[s]));
  });

  it("clears 3:1 against the dark background at every step", () => {
    const background = dark["--background"];
    for (const step of STEPS) {
      expect(contrast(dark[step], background), `${step} against the dark background`).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it("inverts the light ramp's lightness order", () => {
    const lightOrder = STEPS.map((s) => light[s]);
    const darkOrder = STEPS.map((s) => dark[s]);
    // Light runs from lightest (nearest its white background) to darkest; dark
    // runs from darkest (nearest its near-black background) to lightest.
    expect(lightOrder).toEqual([...lightOrder].sort((a, b) => b - a));
    expect(darkOrder).toEqual([...darkOrder].sort((a, b) => a - b));
  });
});

it("Storybook's theme carries the same chart ramp as the docs app", () => {
  const docs = readFileSync(SOURCES.docs, "utf8");
  const storybook = readFileSync(SOURCES.storybook, "utf8");
  for (const selector of [":root", ".dark"] as const) {
    const a = block(docs, selector);
    const b = block(storybook, selector);
    expect(STEPS.map((s) => b[s])).toEqual(STEPS.map((s) => a[s]));
  }
});
