import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import postcss from "postcss";
import { registrySchema } from "shadcn/schema";

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

type CssVars = {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
};

type Item = {
  name: string;
  title: string;
  description: string;
  type?: "registry:component" | "registry:hook" | "registry:lib";
  registryDependencies?: string[];
  dependencies?: string[];
  cssVars?: CssVars;
};

// --warning is the one token this registry adds beyond stock shadcn (the rest of
// the palette is monochrome + --destructive). Tailwind v4 emits nothing for an
// undefined utility rather than failing, so a consumer who installs one of these
// without the token gets a silently colourless near-limit state — the docs app
// hides the bug because its own globals.css defines it. Shipping the token with
// every item that references it is what closes that gap.
const WARNING_CSS_VARS: CssVars = {
  theme: {
    "color-warning": "var(--warning)",
    "color-warning-foreground": "var(--warning-foreground)",
  },
  light: { warning: "oklch(0.76 0.16 70)", "warning-foreground": "oklch(0.26 0.05 70)" },
  dark: { warning: "oklch(0.82 0.14 72)", "warning-foreground": "oklch(0.24 0.05 70)" },
};

// Per-item extras (deps/registryDeps/cssVars) keyed by name
const extras: Record<
  string,
  { dependencies?: string[]; registryDependencies?: string[]; cssVars?: CssVars }
> = {
  "credits-indicator": { cssVars: WARNING_CSS_VARS },
  "quota-meter": { cssVars: WARNING_CSS_VARS },
  "pricing-table": { cssVars: WARNING_CSS_VARS },
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "field-row": { registryDependencies: [self("reset-affordance")] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
  "safety-block": {
    registryDependencies: ["alert", "button"],
    dependencies: ["lucide-react"],
  },
  "autonomy-selector": {
    registryDependencies: ["radio-group", "button", self("entity-row"), self("section-header")],
    dependencies: ["lucide-react"],
  },
  "escalation-handoff": {
    registryDependencies: ["card", "button", self("section-header"), self("stat-readout")],
    dependencies: ["lucide-react"],
  },
  "task-tray": {
    registryDependencies: ["sheet", "button", self("entity-row")],
    dependencies: ["lucide-react"],
  },
  "citation-ref": {
    registryDependencies: ["hover-card"],
  },
  "answer-block": {
    registryDependencies: [self("citation-ref")],
    dependencies: ["lucide-react"],
  },
  "source-cards": {
    registryDependencies: ["card", "badge"],
    dependencies: ["lucide-react"],
  },
  "slot-summary": {
    registryDependencies: ["badge", "button"],
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

// npm deps per marketing item (only items that need them). `devDependencies` is
// for packages a consumer needs to *compile* but not to run: canvas-confetti
// ships no bundled types, so a TypeScript consumer's `next build` fails on the
// implicit-any import unless @types/canvas-confetti installs alongside it.
// motion, lucide-react and class-variance-authority all bundle their own types.
const marketingExtras: Record<string, { dependencies?: string[]; devDependencies?: string[] }> = {
  "number-ticker": { dependencies: ["motion"] },
  "text-animate": { dependencies: ["motion"] },
  terminal: { dependencies: ["motion"] },
  "hero-video-dialog": { dependencies: ["motion", "lucide-react"] },
  confetti: { dependencies: ["canvas-confetti"], devDependencies: ["@types/canvas-confetti"] },
  "rainbow-button": { dependencies: ["class-variance-authority"] },
  "bento-grid": { dependencies: ["lucide-react"] },
};

// Slice app/marketing.css into named blocks by `/* == name == */` markers (the
// markers sit alone on their own line at column 0). `shared` is not shipped as
// raw text — it's parsed into shadcn `cssVars` below. Items without a block
// (pure-token components) ship no css/cssVars at all.
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

// ---------------------------------------------------------------------------
// css text -> structured object, matching shadcn v4's registry-item `css`
// schema: Record<selector-or-at-rule, declarations | nested-record>. A plain
// string fails `shadcn build` ("Expected object, received string"); wrapping
// raw text under an at-rule key passes schema validation but the CLI's
// install-time writer silently drops nested rule blocks in that shape — only
// a fully nested object round-trips. Each block is walked as a real postcss
// AST (not string-sliced further), so nesting/at-rules/comments are handled
// structurally rather than by pattern-matching text.
// ---------------------------------------------------------------------------
// Selectors, at-rule params and declaration values keep whatever line breaks and
// indentation the author (or Prettier) left in marketing.css, and postcss hands
// them over verbatim — so `0%,\n  100%` becomes a JSON key and a wrapped
// linear-gradient becomes a multi-line JSON value, both of which the shadcn
// installer writes straight into the consumer's stylesheet. Collapsing
// newline+indent runs to a single space makes the emitted payload independent of
// how the stylesheet happens to be formatted. Only newline runs are touched:
// a CSS string literal can never contain a raw newline, so quoted content
// (e.g. `[data-variant="outline"]`, font stacks) is untouched.
const collapseWrapping = (text: string) => text.replace(/\s*\n\s*/g, " ");

function setUniqueKey(target: Record<string, unknown>, key: string, value: unknown, path: string) {
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    throw new Error(`css conversion: duplicate key "${key}" at ${path}`);
  }
  target[key] = value;
}

function declsToObject(nodes: postcss.ChildNode[] | undefined, path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const node of nodes ?? []) {
    if (node.type === "comment") continue;
    if (node.type !== "decl") {
      throw new Error(`css conversion: expected only declarations at ${path}, found "${node.type}"`);
    }
    setUniqueKey(out, node.prop, collapseWrapping(node.value), path);
  }
  return out;
}

function containerToObject(nodes: postcss.ChildNode[] | undefined, path: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const node of nodes ?? []) {
    if (node.type === "comment") continue;

    if (node.type === "decl") {
      throw new Error(
        `css conversion: bare declaration "${node.prop}" at ${path} (expected inside a rule or at-rule)`,
      );
    }

    if (node.type === "rule") {
      const hasNestedContainer = (node.nodes ?? []).some((n) => n.type === "rule" || n.type === "atrule");
      if (hasNestedContainer) {
        throw new Error(
          `css conversion: rule "${node.selector}" at ${path} contains a nested rule/at-rule — not supported`,
        );
      }
      const selector = collapseWrapping(node.selector);
      setUniqueKey(out, selector, declsToObject(node.nodes, `${path} > ${selector}`), path);
      continue;
    }

    if (node.type === "atrule") {
      const key = collapseWrapping(`@${node.name} ${node.params}`).trim();
      const childPath = `${path} > ${key}`;
      const children = node.nodes ?? [];
      const nonComment = children.filter((n) => n.type !== "comment");
      // An at-rule containing only decls (none expected today, e.g. a bare
      // @font-face-style block) yields a flat decls object instead of being
      // forced through the nested-container shape.
      const value =
        nonComment.length > 0 && nonComment.every((n) => n.type === "decl")
          ? declsToObject(children, childPath)
          : containerToObject(children, childPath);
      setUniqueKey(out, key, value, path);
      continue;
    }

    throw new Error(`css conversion: unsupported node type "${(node as { type: string }).type}" at ${path}`);
  }
  return out;
}

function cssTextToObject(cssText: string): Record<string, unknown> {
  return containerToObject(postcss.parse(cssText).nodes, "root");
}

// The `shared` block is exactly `:root { --custom-props } .dark { --custom-props }`.
// Parsed once into shadcn's cssVars shape; leading `--` is stripped from each
// prop (shadcn's installer re-adds it). Light currently carries 13 keys, dark
// 11 (pulse/ripple colors only exist in :root) — that asymmetry is correct.
function parseSharedCssVars(sharedText: string): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const topLevel = (postcss.parse(sharedText).nodes ?? []).filter((n) => n.type !== "comment");
  const isRootRule = (n: postcss.ChildNode): n is postcss.Rule => n.type === "rule" && n.selector === ":root";
  const isDarkRule = (n: postcss.ChildNode): n is postcss.Rule => n.type === "rule" && n.selector === ".dark";
  if (
    topLevel.length !== 2 ||
    !topLevel.every((n) => n.type === "rule") ||
    !topLevel.some(isRootRule) ||
    !topLevel.some(isDarkRule)
  ) {
    throw new Error(
      `shared css block: expected exactly ":root" and ".dark" rules, got: ${topLevel
        .map((n) => (n.type === "rule" ? n.selector : n.type))
        .join(", ")}`,
    );
  }
  const extractVars = (rule: postcss.Rule): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const child of rule.nodes ?? []) {
      if (child.type === "comment") continue;
      if (child.type !== "decl" || !child.prop.startsWith("--")) {
        throw new Error(
          `shared css block: "${rule.selector}" must contain only custom-property declarations, found "${child.type}"`,
        );
      }
      setUniqueKey(out, child.prop.slice(2), collapseWrapping(child.value), `shared > ${rule.selector}`);
    }
    return out;
  };
  return {
    light: extractVars(topLevel.find(isRootRule)!),
    dark: extractVars(topLevel.find(isDarkRule)!),
  };
}

const sharedCssVars = parseSharedCssVars(cssBlocks.get("shared") ?? "");

const marketingItems = MARKETING_ITEMS.map((i) => {
  const ownBlockText = cssBlocks.get(i.name);
  console.log(`  ${i.name}${ownBlockText ? " +css" : " (no css)"}`);
  return {
    name: i.name,
    type: "registry:component" as const,
    title: i.title,
    description: i.description,
    dependencies: marketingExtras[i.name]?.dependencies ?? [],
    ...(marketingExtras[i.name]?.devDependencies
      ? { devDependencies: marketingExtras[i.name]!.devDependencies }
      : {}),
    registryDependencies: [],
    files: [marketingFile(i.name)],
    ...(ownBlockText ? { cssVars: sharedCssVars, css: cssTextToObject(ownBlockText) } : {}),
  };
});

const superAiItems = items.map((i) => ({
  name: i.name,
  type: i.type ?? "registry:component",
  title: i.title,
  description: i.description,
  dependencies: i.dependencies ?? [],
  registryDependencies: i.registryDependencies ?? [],
  files: [file(i.name)],
  ...(i.cssVars ? { cssVars: i.cssVars } : {}),
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

// Validate against shadcn's own zod schema at generation time so a bad shape
// (e.g. a css field the CLI's installer can't round-trip) fails here, with a
// precise path, instead of surfacing later inside `shadcn build`.
const validatedRegistry = registrySchema.parse(registry);

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../registry.json");
writeFileSync(OUT, JSON.stringify(validatedRegistry, null, 2) + "\n");
console.log(
  `registry.json — ${superAiItems.length} super-ai + ${marketingItems.length} marketing items (base: ${REGISTRY_URL})`,
);
