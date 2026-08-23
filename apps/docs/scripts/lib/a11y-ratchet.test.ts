import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseRawExclusions } from "./a11y-ratchet";

const CONFIG = "../storybook/vitest.config.ts";
const BASELINE = "../storybook/a11y-exclusions.baseline.json";

describe("a11y exclusion ratchet", () => {
  it("the live exclusion list is a subset of the committed baseline (it may only shrink)", () => {
    const live = parseRawExclusions(readFileSync(CONFIG, "utf8"));
    expect(
      live,
      "could not locate the exclude array in vitest.config.ts — the parser must fail loud, not pass empty",
    ).not.toBeNull();
    const baseline: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
    const grown = live!.filter((e) => !baseline.includes(e));
    expect(
      grown,
      "New a11y exclusions. The list may only shrink (CLAUDE.md, a11y-baseline.md). Fix the story instead; a genuine new exemption is a hand edit to a11y-exclusions.baseline.json in a reviewed commit, with its reason in a11y-baseline.md.",
    ).toEqual([]);
  });

  it("control: the parser sees a seeded entry", () => {
    const seeded = `exclude: [\n...configDefaults.exclude,\n"**/stories/super-ai/Seeded.stories.tsx",\n]`;
    expect(parseRawExclusions(seeded)!).toContain("**/stories/super-ai/Seeded.stories.tsx");
  });

  it("control: a commented-out entry does not count as live", () => {
    const seeded = `exclude: [\n// "**/stories/super-ai/Seeded.stories.tsx",\n"**/stories/ui/**",\n]`;
    expect(parseRawExclusions(seeded)!).toEqual(["**/stories/ui/**"]);
  });

  it("control: the parser anchors on the live file (vendored glob present)", () => {
    const live = parseRawExclusions(readFileSync(CONFIG, "utf8"));
    // This entry retires only when the vendored-story exclusions themselves
    // are retired — the celebrated case, updated deliberately then.
    expect(live).toContain("**/stories/ui/**");
  });
});
