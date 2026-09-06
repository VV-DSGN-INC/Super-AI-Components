// Regenerates scripts/lib/story-coverage.baseline.json from the live story
// tree. Shrink-only, by design: this script refuses to write a baseline that
// contains a key the committed baseline doesn't already have. Growing the
// baseline is a hand edit to the JSON file in a reviewed commit — never
// something this script does for you. Same discipline as a11y-baseline.mts.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";
import { pascal } from "./lib/scaffold-templates";
import { collectUnmet, deriveObligations, nextBaseline } from "./lib/story-coverage";

const BASELINE = "scripts/lib/story-coverage.baseline.json";
const storyFor = (name: string) => `../storybook/src/stories/super-ai/${pascal(name)}.stories.tsx`;

const shipped = MANIFEST.filter((i) => i.status === "shipped");
const live = collectUnmet(deriveObligations(shipped), (name) =>
  existsSync(storyFor(name)) ? readFileSync(storyFor(name), "utf8") : null,
).map((o) => o.key);

const prev: string[] | null = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const next = nextBaseline(prev, live);

if (next.grown.length > 0) {
  console.error(
    `story-coverage:baseline — refusing to grow the baseline by ${next.grown.length} (${next.grown.slice(0, 5).join(", ")}${next.grown.length > 5 ? ", …" : ""}). The regenerate command may only shrink it; growth is a hand edit in a reviewed commit.`,
  );
  process.exit(1);
}

writeFileSync(BASELINE, `${JSON.stringify(next.baseline, null, 2)}\n`);
const cases = next.baseline.filter((k) => k.includes(":case:")).length;
console.log(
  `story-coverage:baseline — wrote ${next.baseline.length} unmet obligation(s): ${cases} case, ${next.baseline.length - cases} described.`,
);
