import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
  files?: { path: string; type: string; target?: string }[];
};

const items: Item[] = [
  { name: "kbd", title: "Kbd", description: "Keycap chip for keyboard shortcuts." },
  {
    name: "cost-chip",
    title: "Cost Chip",
    description: "Per-action credit cost chip (e.g. 17 credits, 900 credits/min).",
    dependencies: ["lucide-react"],
  },
  {
    name: "date-section",
    title: "Date Section",
    description: "Date-grouped section header for lists and grids.",
  },
  {
    name: "choice-chips",
    title: "Choice Chips",
    description: "Ring-selected chip group for visual and numeric parameters.",
  },
  {
    name: "filter-bar",
    title: "Filter Bar",
    description: "Category chips, add-filter chip, and filters button.",
    dependencies: ["lucide-react"],
  },
  {
    name: "field-row",
    title: "Field Row",
    description: "Label + control inspector row with unit-suffixed value input.",
  },
  {
    name: "gen-settings-bar",
    title: "Gen Settings Bar",
    description: "Compact model/aspect/resolution/duration/batch strip.",
  },
  {
    name: "shortcuts-sheet",
    title: "Shortcuts Sheet",
    description: "Keyboard shortcuts cheatsheet dialog.",
    registryDependencies: ["dialog", self("kbd")],
  },
  {
    name: "thread-list",
    title: "Thread List",
    description: "Date-grouped conversation list with rename, delete, and pin.",
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
  // Flow Kit items
  {
    name: "flow-types",
    title: "Flow Types",
    description: "Flow Kit shared contracts: handle-type registry, statuses, id codec.",
    type: "registry:lib" as const,
    files: [
      { path: "registry/super-ai/flow/flow-types.ts", type: "registry:lib", target: "lib/flow-types.ts" },
      {
        path: "registry/super-ai/flow/flow-tokens.css",
        type: "registry:file",
        target: "styles/flow-tokens.css",
      },
    ],
  },
];

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
    files: i.files ?? [file(i.name)],
  })),
};

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../registry.json");
writeFileSync(OUT, JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json — ${items.length} items (base: ${REGISTRY_URL})`);

// Reference URLs for Flow AI elements (consumed by later wave items).
export const FLOW_AI_ELEMENTS: Record<string, string> = Object.fromEntries(
  ["canvas", "node", "edge", "connection", "controls", "panel", "toolbar"].map((name) => [
    name,
    `https://registry.ai-sdk.dev/${name}.json`,
  ]),
);
