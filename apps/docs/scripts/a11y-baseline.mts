// Regenerates apps/storybook/a11y-exclusions.baseline.json from the live
// vitest.config.ts exclude list. Shrink-only, by design: this script refuses
// to write a baseline that contains an entry the committed baseline doesn't
// already have. Growing the baseline is a hand edit to the JSON file in a
// reviewed commit, with the reason recorded in a11y-baseline.md — never
// something this script does for you.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { parseRawExclusions } from "./lib/a11y-ratchet";

const CONFIG = "../storybook/vitest.config.ts";
const BASELINE = "../storybook/a11y-exclusions.baseline.json";

const live = parseRawExclusions(readFileSync(CONFIG, "utf8"));

if (existsSync(BASELINE)) {
  const prev: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
  const grown = live.filter((e) => !prev.includes(e));
  if (grown.length > 0) {
    console.error(
      `a11y:baseline — refusing to grow the baseline (${grown.join(", ")}). The regenerate command may only shrink it; growth is a hand edit in a reviewed commit.`,
    );
    process.exit(1);
  }
}
writeFileSync(BASELINE, `${JSON.stringify(live, null, 2)}\n`);
console.log(`a11y:baseline — wrote ${live.length} entr${live.length === 1 ? "y" : "ies"}.`);
