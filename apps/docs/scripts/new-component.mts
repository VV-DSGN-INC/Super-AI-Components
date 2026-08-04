import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MANIFEST } from "../lib/catalog.manifest";
import { renderScaffold } from "./lib/scaffold-templates";

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, "..");
const name = process.argv[2];

if (!name) {
  console.error("usage: pnpm new:component <name>");
  process.exit(1);
}

const item = MANIFEST.find((i) => i.name === name);
if (!item) {
  console.error(`new:component — "${name}" is not in the manifest.`);
  process.exit(1);
}
if (item.status === "cut") {
  console.error(`new:component — "${name}" was cut from scope.`);
  process.exit(1);
}
if (item.status === "shipped") {
  console.error(`new:component — "${name}" already shipped.`);
  process.exit(1);
}

for (const [relative, source] of Object.entries(renderScaffold(item))) {
  const path = join(docsRoot, relative);
  if (existsSync(path)) {
    console.error(`new:component — refusing to overwrite ${relative}`);
    process.exit(1);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
  console.log(`  created ${relative}`);
}

console.log(`\nnew:component — ${name} scaffolded. Set its status to "building" in lib/catalog.manifest.ts.`);
