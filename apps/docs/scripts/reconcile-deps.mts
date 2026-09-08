// CLI entry point. The logic lives in scripts/lib/reconcile.ts so it can be
// imported by a test without running or exiting the process.
import { existsSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";
import { reconcileItem } from "./lib/reconcile";

function main() {
  const names = process.argv.slice(2);
  const items = names.length ? MANIFEST.filter((i) => names.includes(i.name)) : MANIFEST;
  const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : undefined);

  let drift = 0;
  for (const item of items) {
    if (!existsSync(`registry/super-ai/${item.name}.tsx`)) continue;
    const real = reconcileItem(item, read);
    if (!real.drifted) continue;
    drift++;
    console.log(`${item.name}`);
    for (const [label, realList, declaredList, drifted] of [
      ["shadcn  ", real.shadcn, [...item.shadcn].sort(), real.shadcnDrifted],
      ["consumes", real.consumes, [...item.consumes].sort(), real.consumesDrifted],
      ["npm     ", real.npm, [...item.npm].sort(), real.npmDrifted],
    ] as const) {
      if (drifted) {
        console.log(`  ${label} declared ${JSON.stringify(declaredList)} · real ${JSON.stringify(realList)}`);
      }
    }
  }

  console.log(
    drift
      ? `\n${drift} item(s) drifted. Update catalog.manifest.ts from the REAL column, then re-run.`
      : `\n${items.length} item(s) reconciled, no drift.`,
  );
  process.exit(drift ? 1 : 0);
}

main();
