import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { ContractMeta } from "./contract-emit";

/** Reads from the emitted metas, not the modules: the drift gate proves the
 *  metas current, and reading JSON keeps this usable from a tsx script that
 *  cannot evaluate a .docs.tsx module. */
export function readMetas(dir: string): ContractMeta[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".meta.json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as ContractMeta);
}

/** Items whose contract is unwritten: either field absent. A `{ none }` is
 *  written; an empty array never reaches here because the schema gate
 *  rejects it first. */
export function unwrittenContracts(
  items: { name: string; variants?: unknown; insteadUse?: unknown }[],
): string[] {
  return items
    .filter((i) => i.variants === undefined || i.insteadUse === undefined)
    .map((i) => i.name)
    .sort();
}
