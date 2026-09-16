// Regenerates scripts/lib/patterns-unfilled.baseline.json: the slugs whose
// module says `status: "unfilled"`. Shrink-only, like story-coverage:baseline:
// a new unfilled pattern is a hand edit to the JSON in a reviewed commit, so
// the review sees the hole being declared.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

import { pascal } from "./lib/scaffold-templates";
import { nextBaseline } from "./lib/story-coverage";

const BASELINE = "scripts/lib/patterns-unfilled.baseline.json";
const DIR = "content/patterns";

const slugs = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => f.endsWith(".pattern.tsx"))
      .map((f) => f.replace(/\.pattern\.tsx$/, ""))
      .sort()
  : [];
// A text needle rather than an import: this script runs under tsx, where a
// .tsx module would still need the React transform. patterns-unfilled.test.ts
// evaluates the modules for real under vitest, so it is the authority; if this
// needle ever disagreed with it, that test is what would go red.
const live = slugs.filter((slug) => {
  const source = readFileSync(`${DIR}/${slug}.pattern.tsx`, "utf8");
  return new RegExp(`export const ${pascal(slug)}Pattern[\\s\\S]*?status:\\s*"unfilled"`).test(source);
});

const prev: string[] | null = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const next = nextBaseline(prev, live);
if (next.grown.length > 0) {
  console.error(
    `patterns:baseline — refusing to grow the baseline by ${next.grown.length} (${next.grown.join(", ")}). Declare a new unfilled pattern by editing the JSON in a reviewed commit.`,
  );
  process.exit(1);
}
writeFileSync(BASELINE, `${JSON.stringify(next.baseline, null, 2)}\n`);
console.log(`patterns:baseline — ${next.baseline.length} unfilled pattern(s).`);
