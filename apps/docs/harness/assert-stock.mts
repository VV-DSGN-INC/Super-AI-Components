// Fails when a scaffolded consumer's stylesheet lacks a name CONSUMER_STOCK_VARS
// promises. This is what keeps the list honest: TOK-9 trusts it, and a shadcn
// release that drops a role would otherwise turn a passing gate into a lie.
import { readFileSync } from "node:fs";

import { CONSUMER_STOCK_VARS } from "../scripts/lib/consumer-stock";
import { customPropNames } from "../scripts/lib/consumer-vocabulary";

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx harness/assert-stock.mts <consumer>/app/globals.css");
  process.exit(2);
}
const declared = customPropNames(readFileSync(file, "utf8"));
const missing = CONSUMER_STOCK_VARS.filter((v) => !declared.has(v));
if (missing.length > 0) {
  console.error(
    `CONSUMER STOCK: FAIL — ${file} does not declare ${missing.join(", ")}. Either shadcn changed its stock roles (shrink CONSUMER_STOCK_VARS and re-audit TOK-9) or the init step did not run.`,
  );
  process.exit(1);
}
console.log(`CONSUMER STOCK: ${CONSUMER_STOCK_VARS.length} promised names all declared in ${file}`);
