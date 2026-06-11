import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CATALOG_ITEMS } from "../lib/catalog";

const REGISTRY_URL = (process.env.REGISTRY_URL ?? "https://super-ai-components.vercel.app").replace(
  /\/$/,
  "",
);
const self = (name: string) => `${REGISTRY_URL}/r/${name}.json`;
const file = (name: string) => ({
  path: `registry/super-ai/${name}.tsx`,
  type: "registry:component",
  target: `components/super-ai/${name}.tsx`,
});

type Item = {
  name: string;
  title: string;
  description: string;
  type?: "registry:component" | "registry:hook" | "registry:lib";
  registryDependencies?: string[];
  dependencies?: string[];
};

// Per-item extras (deps/registryDeps) keyed by name
const extras: Record<string, { dependencies?: string[]; registryDependencies?: string[] }> = {
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
};

const items: Item[] = CATALOG_ITEMS.map((i) => ({
  name: i.name,
  title: i.title,
  description: i.description,
  ...extras[i.name],
}));

const names = items.map((i) => i.name);
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
if (dupes.length) throw new Error(`Duplicate item names: ${dupes.join(", ")}`);

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "super-ai",
  homepage: REGISTRY_URL,
  items: items.map((i) => ({
    name: i.name,
    type: i.type ?? "registry:component",
    title: i.title,
    description: i.description,
    dependencies: i.dependencies ?? [],
    registryDependencies: i.registryDependencies ?? [],
    files: [file(i.name)],
  })),
};

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../registry.json");
writeFileSync(OUT, JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json — ${items.length} items (base: ${REGISTRY_URL})`);
