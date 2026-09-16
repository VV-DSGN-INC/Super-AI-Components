import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { STAGES } from "@/lib/pattern-docs";

import { loadPattern, patternSlugs } from "./pattern-source";
import { pascal } from "./scaffold-templates";
import { readStoryFacts } from "./story-coverage";

/** apps/docs/scripts/lib → apps/storybook/src/stories/patterns. */
const storyFor = (slug: string) =>
  resolve(__dirname, `../../../storybook/src/stories/patterns/${pascal(slug)}.stories.tsx`);

// The composition obligation (spec 2026-09-15 §9). No baseline: no pattern
// existed before this layer, so there is no adoption-time debt to ratchet and
// a missing story fails outright.
describe("composition stories", () => {
  it("every shipped pattern has a story titled Patterns/<Stage>/<Title> with at least one export; no unfilled one has any", async () => {
    const errors: string[] = [];
    for (const slug of patternSlugs()) {
      const docs = await loadPattern(slug);
      const path = storyFor(slug);
      if (docs.status === "unfilled") {
        if (existsSync(path)) errors.push(`${slug}: unfilled, yet a story exists at ${path}`);
        continue;
      }
      if (!existsSync(path)) {
        errors.push(`${slug}: shipped, but no story at ${path}`);
        continue;
      }
      const source = readFileSync(path, "utf8");
      const title = `Patterns/${STAGES.find((s) => s.id === docs.stage)!.label}/${docs.title}`;
      if (!source.includes(`title: "${title}"`)) errors.push(`${slug}: story title is not "${title}"`);
      if (readStoryFacts(source).exports.size === 0) errors.push(`${slug}: story exports nothing`);
    }
    expect(errors).toEqual([]);
  });
});
