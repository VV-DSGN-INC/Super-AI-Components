// Regenerates scripts/lib/contract-coverage.baseline.json from the emitted
// metas. Shrink-only, by design, on the same rule as story-coverage-baseline:
// growth is a hand edit in a reviewed commit, never something this writes.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { readMetas, unwrittenContracts } from "./lib/contract-coverage";
import { nextBaseline } from "./lib/story-coverage";

const BASELINE = "scripts/lib/contract-coverage.baseline.json";
const live = unwrittenContracts(readMetas("registry/super-ai"));
const prev: string[] | null = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const next = nextBaseline(prev, live);

if (next.grown.length > 0) {
  console.error(
    `contract-coverage:baseline — refusing to grow the baseline by ${next.grown.length} (${next.grown.slice(0, 5).join(", ")}${next.grown.length > 5 ? ", …" : ""}). Write the two fields instead.`,
  );
  process.exit(1);
}

writeFileSync(BASELINE, `${JSON.stringify(next.baseline, null, 2)}\n`);
console.log(`contract-coverage:baseline — ${next.baseline.length} item(s) still unwritten.`);
