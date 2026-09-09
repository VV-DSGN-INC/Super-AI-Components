// Shell seam for consumer-test.sh: `eval "$(pnpm exec tsx harness/preset-code.mts <row>)"`
// exports HARNESS_BASE / HARNESS_CODE / HARNESS_ROW; `--list` prints the ids
// of rows CI runs, `--known-failures` prints deferred rows with their reason.
import { ACTIVE_ROWS, HARNESS_ROWS, codeFor, rowById } from "./presets";

const arg = process.argv[2];
if (arg === "--list") {
  for (const r of ACTIVE_ROWS) console.log(r.id);
} else if (arg === "--known-failures") {
  for (const r of HARNESS_ROWS)
    if (r.knownFailure) console.log(`${r.id} (since ${r.knownFailure.since}): ${r.knownFailure.reason}`);
} else {
  const row = rowById(arg ?? "default");
  console.log(`HARNESS_BASE=${row.base}`);
  console.log(`HARNESS_CODE=${codeFor(row)}`);
  console.log(`HARNESS_ROW=${row.id}`);
}
