// Shell seam for consumer-test.sh: `eval "$(pnpm exec tsx harness/preset-code.mts <row>)"`
// exports HARNESS_BASE / HARNESS_CODE / HARNESS_ROW; `--list` prints row ids.
import { HARNESS_ROWS, codeFor, rowById } from "./presets";

const arg = process.argv[2];
if (arg === "--list") {
  for (const r of HARNESS_ROWS) console.log(r.id);
} else {
  const row = rowById(arg ?? "default");
  console.log(`HARNESS_BASE=${row.base}`);
  console.log(`HARNESS_CODE=${codeFor(row)}`);
  console.log(`HARNESS_ROW=${row.id}`);
}
