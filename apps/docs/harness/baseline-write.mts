// Regenerates harness/baseline.json for one row from that row's last run.
// Shrink-only, by design: refuses to write a key the committed baseline does
// not already carry for that row. The first run of a row is the exception —
// same discipline as story-coverage-baseline.mts.
import { writeFileSync } from "node:fs";

import { nextBaseline } from "../scripts/lib/story-coverage";
import { BASELINE_FILE, liveKeys, readBaseline, readResults } from "./baseline";

const row = process.argv[2];
if (!row) {
  console.error("usage: tsx harness/baseline-write.mts <row>");
  process.exit(2);
}
const results = readResults(row);
if (results.length === 0) {
  console.error(
    `harness:baseline — no results under harness/out/${row}/; run apps/docs/scripts/consumer-test.sh ${row} first`,
  );
  process.exit(1);
}
const prevAll = readBaseline();
const prevRow = prevAll.filter((k) => k.startsWith(`${row}/`));
const next = nextBaseline(prevRow.length > 0 ? prevRow : null, liveKeys(results));
if (next.grown.length > 0) {
  console.error(
    `harness:baseline — refusing to grow row "${row}" by ${next.grown.length} (${next.grown.slice(0, 5).join(", ")}${next.grown.length > 5 ? ", …" : ""}). The regenerate command may only shrink it; growth is a hand edit in a reviewed commit.`,
  );
  process.exit(1);
}
const merged = [...prevAll.filter((k) => !k.startsWith(`${row}/`)), ...next.baseline].sort();
writeFileSync(BASELINE_FILE, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `harness:baseline — row "${row}": ${next.baseline.length} baselined violation(s); file holds ${merged.length}.`,
);
