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
// Flow Kit sources install as siblings under components/super-ai/flow/ so their
// relative `./flow-types` imports resolve identically pre- and post-install.
const flowFile = (name: string, type: "registry:component" | "registry:hook" = "registry:component") => {
  const ext = type === "registry:hook" ? "ts" : "tsx";
  return {
    path: `registry/super-ai/flow/${name}.${ext}`,
    type,
    target: `components/super-ai/flow/${name}.${ext}`,
  };
};

type Item = {
  name: string;
  title: string;
  description: string;
  type?: "registry:component" | "registry:hook" | "registry:lib";
  registryDependencies?: string[];
  dependencies?: string[];
  files?: {
    path: string;
    type: "registry:lib" | "registry:component" | "registry:hook" | "registry:file";
    target?: string;
  }[];
};

// Reference URLs for Flow AI elements (consumed by later wave items).
const FLOW_AI_ELEMENTS: Record<string, string> = Object.fromEntries(
  ["canvas", "node", "edge", "connection", "controls", "panel", "toolbar"].map((name) => [
    name,
    `https://registry.ai-sdk.dev/${name}.json`,
  ]),
);

// Per-item extras (type/deps/registryDeps/files) keyed by name; name/title/description
// come from CATALOG_ITEMS. Items without a `files` entry default to file(name).
const extras: Record<string, Pick<Item, "type" | "dependencies" | "registryDependencies" | "files">> = {
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
  // Flow Kit items
  "flow-types": {
    type: "registry:lib",
    files: [
      {
        path: "registry/super-ai/flow/flow-types.ts",
        type: "registry:lib",
        target: "components/super-ai/flow/flow-types.ts",
      },
      {
        path: "registry/super-ai/flow/flow-tokens.css",
        type: "registry:file",
        target: "components/super-ai/flow/flow-tokens.css",
      },
    ],
  },
  "typed-handle": {
    registryDependencies: [self("flow-types")],
    dependencies: ["@xyflow/react"],
    files: [flowFile("typed-handle")],
  },
  "typed-edge": {
    registryDependencies: [self("flow-types")],
    dependencies: ["@xyflow/react"],
    files: [flowFile("typed-edge")],
  },
  "port-chip": {
    registryDependencies: [self("flow-types")],
    files: [flowFile("port-chip")],
  },
  "connection-hint": {
    registryDependencies: [self("flow-types")],
    files: [flowFile("connection-hint")],
  },
  "node-status": {
    registryDependencies: [self("flow-types")],
    dependencies: ["lucide-react"],
    files: [flowFile("node-status")],
  },
  "ai-node": {
    registryDependencies: [self("flow-types"), self("node-status")],
    dependencies: ["lucide-react"],
    files: [flowFile("ai-node")],
  },
  "media-slot": {
    registryDependencies: [self("flow-types")],
    dependencies: ["lucide-react"],
    files: [flowFile("media-slot")],
  },
  "run-button": {
    registryDependencies: ["button", "dropdown-menu", self("flow-types")],
    dependencies: ["lucide-react"],
    files: [flowFile("run-button")],
  },
  "model-bar": {
    registryDependencies: ["dropdown-menu", self("gen-settings-bar")],
    dependencies: ["lucide-react"],
    files: [flowFile("model-bar")],
  },
  "node-prompt": {
    registryDependencies: [self("flow-types")],
    files: [flowFile("node-prompt")],
  },
  "use-flow-runner": {
    type: "registry:hook",
    registryDependencies: [self("flow-types")],
    files: [flowFile("use-flow-runner", "registry:hook")],
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
    files: i.files ?? [file(i.name)],
  })),
};

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../registry.json");
writeFileSync(OUT, JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json — ${items.length} items (base: ${REGISTRY_URL})`);

// Suppress unused-variable lint: FLOW_AI_ELEMENTS is exported for downstream wave items.
void FLOW_AI_ELEMENTS;
