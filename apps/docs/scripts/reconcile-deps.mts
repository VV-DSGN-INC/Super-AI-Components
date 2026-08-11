// Reconciles each shipped component's DECLARED dependencies against its REAL
// imports. Never trust the catalog's assumed bases: it names primitives this
// repo does not vendor, and never trust a builder's own declared list either.
import { existsSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";

const RELEVANT = /^(@\/components\/ui\/|@\/registry\/super-ai\/|\.\/|lucide-react|@base-ui)/;

const names = process.argv.slice(2);
const items = names.length ? MANIFEST.filter((i) => names.includes(i.name)) : MANIFEST;

let drift = 0;
for (const item of items) {
  const path = `registry/super-ai/${item.name}.tsx`;
  if (!existsSync(path)) continue;

  const imports = [...readFileSync(path, "utf8").matchAll(/from\s+"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => RELEVANT.test(s));

  const realShadcn = [...new Set(imports.filter((s) => s.startsWith("@/components/ui/")))]
    .map((s) => s.replace("@/components/ui/", ""))
    .sort();
  // Intra-registry composition in this codebase is written relatively
  // (`./kbd`, `./entity-row`), not via the `@/registry/super-ai/` alias — that
  // alias is what a *consumer* sees post-install, not what these source files
  // use to reference a sibling. Both forms normalise to a bare component name.
  const realConsumes = [
    ...new Set(
      imports
        .filter((s) => s.startsWith("@/registry/super-ai/") || s.startsWith("./"))
        .map((s) => s.replace(/^@\/registry\/super-ai\//, "").replace(/^\.\//, "")),
    ),
  ].sort();

  const declaredShadcn = [...item.shadcn].sort();
  const declaredConsumes = [...item.consumes].sort();

  const diff = (a: string[], b: string[]) => JSON.stringify(a) !== JSON.stringify(b);
  if (diff(realShadcn, declaredShadcn) || diff(realConsumes, declaredConsumes)) {
    drift++;
    console.log(`${item.name}`);
    if (diff(realShadcn, declaredShadcn)) {
      console.log(`  shadcn   declared ${JSON.stringify(declaredShadcn)} · real ${JSON.stringify(realShadcn)}`);
    }
    if (diff(realConsumes, declaredConsumes)) {
      console.log(`  consumes declared ${JSON.stringify(declaredConsumes)} · real ${JSON.stringify(realConsumes)}`);
    }
  }
}

// @base-ui/react is normally omitted from `npm`: it arrives as a peer of any
// vendored ui/ primitive the component also imports. The exception is a
// component importing NO ui/ primitive at all — time-ruler uses only
// @base-ui/react/slider, so nothing else would drag the package in.
console.log(
  drift
    ? `\n${drift} item(s) drifted. Update catalog.manifest.ts from the REAL column, then re-run.`
    : `\n${items.length} item(s) reconciled, no drift.`,
);
process.exit(drift ? 1 : 0);
