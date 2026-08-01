import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

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

// ---------------------------------------------------------------------------
// Marketing tier — registry/marketing/*.tsx, css sliced from app/marketing.css
// ---------------------------------------------------------------------------
const marketingFile = (name: string) => ({
  path: `registry/marketing/${name}.tsx`,
  type: "registry:component",
  target: `components/marketing/${name}.tsx`,
});

// npm deps per marketing item (only items that need them)
const marketingExtras: Record<string, { dependencies?: string[] }> = {
  "number-ticker": { dependencies: ["motion"] },
  "text-animate": { dependencies: ["motion"] },
  terminal: { dependencies: ["motion"] },
  "hero-video-dialog": { dependencies: ["motion", "lucide-react"] },
  confetti: { dependencies: ["canvas-confetti"] },
  "rainbow-button": { dependencies: ["class-variance-authority"] },
  "bento-grid": { dependencies: ["lucide-react"] },
};

// Slice app/marketing.css into named blocks by `/* == name == */` markers (the
// markers sit alone on their own line at column 0). `shared` is prepended to
// every item that has its own block; items without a block (pure-token
// components) ship no css. Each block is treated as opaque contiguous text —
// this does not parse or restructure the CSS inside a block.
const marketingCssSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/marketing.css"),
  "utf8",
);
const cssBlocks = new Map<string, string>();
{
  const marker = /^\/\* == ([\w-]+) == \*\/$/gm;
  const indices: { name: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(marketingCssSource))) indices.push({ name: m[1], start: m.index });
  indices.forEach((entry, i) => {
    const end = i + 1 < indices.length ? indices[i + 1].start : marketingCssSource.length;
    cssBlocks.set(entry.name, marketingCssSource.slice(entry.start, end).trim());
  });
}
const sharedCss = cssBlocks.get("shared") ?? "";
const marketingCss = (name: string) => {
  const own = cssBlocks.get(name);
  return own ? [sharedCss, own].join("\n\n") : undefined;
};

const marketingItems = MARKETING_ITEMS.map((i) => ({
  name: i.name,
  type: "registry:component" as const,
  title: i.title,
  description: i.description,
  dependencies: marketingExtras[i.name]?.dependencies ?? [],
  registryDependencies: [],
  files: [marketingFile(i.name)],
  ...(marketingCss(i.name) ? { css: marketingCss(i.name) } : {}),
}));

const superAiItems = items.map((i) => ({
  name: i.name,
  type: i.type ?? "registry:component",
  title: i.title,
  description: i.description,
  dependencies: i.dependencies ?? [],
  registryDependencies: i.registryDependencies ?? [],
  files: [file(i.name)],
}));

const allItems = [...superAiItems, ...marketingItems];
const allNames = allItems.map((i) => i.name);
const allDupes = allNames.filter((n, i) => allNames.indexOf(n) !== i);
if (allDupes.length) throw new Error(`Duplicate item names: ${allDupes.join(", ")}`);

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "super-ai",
  homepage: REGISTRY_URL,
  items: allItems,
};

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../registry.json");
writeFileSync(OUT, JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json — ${allItems.length} items (base: ${REGISTRY_URL})`);
