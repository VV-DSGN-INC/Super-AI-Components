import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadPattern, patternSlugs } from "./pattern-source";

const BASELINE = resolve(__dirname, "patterns-unfilled.baseline.json");

describe("unfilled patterns, ratcheted (spec 2026-09-15 §8)", () => {
  it("every unfilled module is in the baseline, and every baseline entry is still unfilled", async () => {
    const baseline: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
    const live: string[] = [];
    for (const slug of patternSlugs()) if ((await loadPattern(slug)).status === "unfilled") live.push(slug);
    const undeclared = live.filter((s) => !baseline.includes(s));
    const stale = baseline.filter((s) => !live.includes(s));
    expect(
      undeclared,
      "An unfilled pattern the baseline does not declare. Add it to the JSON in this commit.",
    ).toEqual([]);
    expect(
      stale,
      "A baseline entry that is no longer unfilled. Run `pnpm patterns:baseline` to shrink it.",
    ).toEqual([]);
  });
});
