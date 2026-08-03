# Wave 1.5 — the component pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the machinery that makes the remaining 93 catalog items producible — a machine-readable manifest, a scaffold, a de-duplicated Storybook with a real story contract, a per-component documentation layer, a mechanical contract gate and a public roadmap — then prove it by shipping `workspace-switcher`, `promo-card` and `sidebar-nav` through it.

**Architecture:** One manifest (`apps/docs/lib/catalog.manifest.ts`) becomes the single source from which the site catalog, the registry build's dependency records, the demo/docs wiring, the roadmap and the contract gate all derive. A scaffold emits every wired file for a new component with its test suite already failing. Storybook stops copying components and imports them through Vite/tsconfig aliases. Every component gains a typed `.docs.tsx` guidance module rendered by one shared React component on both the docs page and the Storybook docs page.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, pnpm workspaces + Turborepo, vitest 4 + Testing Library, Playwright, Storybook 9 (react-vite), shadcn registry v4, tsx for build scripts.

**Spec:** [`2026-08-03-component-pipeline-design.md`](../specs/2026-08-03-component-pipeline-design.md) — read it before starting. This plan does not restate its rationale.

---

## Two corrections this plan makes to the spec

Both were found while mapping the spec onto the actual files. Neither changes the design's intent.

1. **`registryDependencies` is not `consumes` alone.** The existing `extras` record in `gen-registry.mts` mixes two kinds of dependency: shadcn base components (`"dialog"`, `"button"`) and registry-internal items (`self("kbd")`). The manifest therefore needs **two** fields — `shadcn` (the base components the code actually imports) and `consumes` (registry-internal items) — and `registryDependencies` is their concatenation. The spec's `base` field stays, but it is the catalog's _design-level_ base for documentation and is not build input; `catalog.md` lists `thread-list`'s base as "Sidebar, Dropdown-menu" while its code actually pulls `button`, `input`, `dropdown-menu` and `alert-dialog`.

2. **The 14 shipped components need an explicit exemption.** Spec §2 makes retrofitting them a non-goal, but spec §7 requires every `shipped` item to satisfy the story and documentation contracts. Those contradict. Resolution: a `contractExempt: true` field on exactly those 14 entries, checked by the gate and printed in its summary (`"12 items checked, 14 legacy items exempt"`), so the debt is visible and shrinks to zero when the retrofit task runs.

---

## File structure

**Created**

| File                                             | Responsibility                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `apps/docs/lib/catalog.manifest.ts`              | The 107 items. Data only, no logic                                                     |
| `apps/docs/lib/manifest-types.ts`                | `ManifestItem`, `FamilyId`, and the derived selectors (`shippedItems()`, `byFamily()`) |
| `apps/docs/scripts/lib/parse-catalog.ts`         | Pure parser: `catalog.md` markdown → raw rows. Testable in isolation                   |
| `apps/docs/scripts/gen-manifest.mts`             | One-shot bootstrap: parser + wave/status maps → `catalog.manifest.ts`                  |
| `apps/docs/scripts/gen-wiring.mts`               | Emits `demos.generated.ts` and `docs.generated.ts`; supports `--check`                 |
| `apps/docs/lib/demos.generated.ts`               | Generated `Record<CatalogName, ComponentType>` demo map                                |
| `apps/docs/lib/docs.generated.ts`                | Generated `Record<string, ComponentDocs>` guidance map                                 |
| `apps/docs/lib/component-docs.ts`                | `ComponentDocs` type only — importable from Storybook without pulling React trees      |
| `apps/docs/components/component-docs.tsx`        | The shared renderer used by both surfaces                                              |
| `apps/docs/content/components/<name>.docs.tsx`   | One guidance module per component                                                      |
| `apps/docs/scripts/new-component.mts`            | The scaffold                                                                           |
| `apps/docs/scripts/check-contract.mjs`           | The gate                                                                               |
| `apps/docs/app/roadmap/page.tsx`                 | The roadmap surface                                                                    |
| `apps/storybook/src/lib/component-docs-page.tsx` | Storybook docs-page wrapper around the shared renderer                                 |

**Modified**

| File                                                          | Change                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/docs/lib/catalog.ts`                                    | `CATALOG_ITEMS` derives from the manifest               |
| `apps/docs/scripts/gen-registry.mts`                          | `extras` derives from the manifest                      |
| `apps/docs/app/components/[name]/page.tsx`                    | Imports generated maps; renders `<ComponentDocs>`       |
| `apps/docs/app/page.tsx`                                      | Progress line                                           |
| `apps/docs/vitest.config.ts`                                  | `include` widened beyond `registry/**`                  |
| `apps/docs/package.json`                                      | `check:contract`, `new:component`, `gen:wiring` scripts |
| `apps/storybook/vite.config.ts`, `tsconfig.json`              | Aliases                                                 |
| `apps/storybook/package.json`, `.storybook/main.ts`           | a11y + vitest addons                                    |
| `apps/storybook/src/stories/super-ai/*.stories.tsx`           | Import through aliases                                  |
| `turbo.json`, root `package.json`, `.github/workflows/ci.yml` | Task + CI wiring                                        |

**Deleted**

- `apps/storybook/src/components/super-ai/*.tsx` (14 files)
- `apps/storybook/src/components/super-ai/demos/*.tsx` (14 files)

---

### Task 1: Widen the vitest include so non-registry code is testable

**Files:**

- Modify: `apps/docs/vitest.config.ts`
- Test: `apps/docs/lib/sanity.test.ts` (temporary, deleted in the same task)

Everything after this task tests code outside `registry/`, which the current `include` glob silently ignores. Prove the widening works before relying on it.

- [ ] **Step 1: Write a test outside `registry/` that must run**

Create `apps/docs/lib/sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest include", () => {
  it("collects tests outside registry/", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run it and watch it NOT be collected**

Run: `cd apps/docs && pnpm vitest run lib/sanity.test.ts`
Expected: `No test files found` — the file exists but the `include` glob excludes it.

- [ ] **Step 3: Widen the include**

In `apps/docs/vitest.config.ts`, replace the `include` line:

```ts
    include: [
      "registry/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "content/**/*.test.{ts,tsx}",
      "scripts/**/*.test.{ts,tsx}",
    ],
```

- [ ] **Step 4: Run it again**

Run: `cd apps/docs && pnpm vitest run lib/sanity.test.ts`
Expected: `1 passed`

- [ ] **Step 5: Delete the sanity test and commit**

```bash
rm apps/docs/lib/sanity.test.ts
git add apps/docs/vitest.config.ts
git commit -m "test(docs): widen vitest include beyond registry/"
```

---

### Task 2: The catalog.md parser

**Files:**

- Create: `apps/docs/scripts/lib/parse-catalog.ts`
- Test: `apps/docs/scripts/lib/parse-catalog.test.ts`

A pure function so the messy rows in `catalog.md` (tag suffixes, em-dash IDs, two-name rows) are pinned by tests rather than discovered during a 107-row generation run.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/lib/parse-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseCatalogTables } from "./parse-catalog";

const SAMPLE = `
## B · App shell & navigation — 8

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| B1 | \`app-sidebar\` | Assembled product sidebar | expanded · icon-rail · mobile-drawer | Sidebar |
| B6 | \`thread-list\` \`KEEP\` | Date-grouped conversations | pin · rename · active | Sidebar, Dropdown-menu |
| B7 | \`app-topbar\` \`NEW\` | Breadcrumb + title | document context · editor context | Breadcrumb, Button-group |

**Dropped from the spec:** \`chat-header\` (absorbed by B7).

## G · Canvas & nodes — CUT 2026-07-31

| # | Name | Purpose | Key states / variants | shadcn base |
|---|------|---------|-----------------------|-------------|
| G3 | \`typed-handle\` + \`typed-edge\` | Ports and lines | valid · invalid | — |
| — | \`useFlowRunner\` | **Headless.** Execution | executor-swappable | — |
`;

describe("parseCatalogTables", () => {
  const rows = parseCatalogTables(SAMPLE);

  it("reads one row per catalog line, skipping prose between tables", () => {
    expect(rows).toHaveLength(5);
  });

  it("strips KEEP/NEW tags from the name", () => {
    expect(rows.map((r) => r.name)).toContain("thread-list");
    expect(rows.find((r) => r.name === "thread-list")!.name).not.toMatch(/KEEP/);
  });

  it("splits states on the middle dot", () => {
    expect(rows.find((r) => r.id === "B1")!.states).toEqual(["expanded", "icon-rail", "mobile-drawer"]);
  });

  it("kebab-cases and splits the shadcn base column", () => {
    expect(rows.find((r) => r.id === "B7")!.base).toEqual(["breadcrumb", "button-group"]);
  });

  it("reads an em-dash base column as no base", () => {
    expect(rows.find((r) => r.id === "G3")!.base).toEqual([]);
  });

  it("takes the first name when a row declares two", () => {
    expect(rows.find((r) => r.id === "G3")!.name).toBe("typed-handle");
  });

  it("derives an id from the name when the id column is an em-dash", () => {
    expect(rows.find((r) => r.name === "useFlowRunner")!.id).toBe("G-useFlowRunner");
  });

  it("tags each row with its family letter", () => {
    expect(rows.find((r) => r.id === "B1")!.family).toBe("B");
    expect(rows.find((r) => r.id === "G3")!.family).toBe("G");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run scripts/lib/parse-catalog.test.ts`
Expected: FAIL — `Failed to resolve import "./parse-catalog"`

- [ ] **Step 3: Implement the parser**

Create `apps/docs/scripts/lib/parse-catalog.ts`:

```ts
export type RawRow = {
  id: string;
  name: string;
  family: string;
  description: string;
  states: string[];
  base: string[];
};

const FAMILY_HEADING = /^## ([A-O]) ·/;
const TAG = /`(KEEP|NEW|RESTORED|SHIPPED)`/g;

const cell = (text: string) => text.trim();

const firstBacktickName = (text: string) => {
  const withoutTags = text.replace(TAG, "");
  const match = withoutTags.match(/`([^`]+)`/);
  return match ? match[1].trim() : "";
};

const splitStates = (text: string) =>
  cell(text)
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

const splitBase = (text: string) => {
  const value = cell(text);
  if (!value || value === "—") return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
};

export function parseCatalogTables(markdown: string): RawRow[] {
  const rows: RawRow[] = [];
  let family = "";

  for (const line of markdown.split("\n")) {
    const heading = line.match(FAMILY_HEADING);
    if (heading) {
      family = heading[1];
      continue;
    }

    if (!family || !line.startsWith("|")) continue;

    const cells = line.split("|").slice(1, -1);
    if (cells.length < 5) continue;

    const [idCell, nameCell, purposeCell, statesCell, baseCell] = cells;
    if (cell(idCell) === "#" || /^-+$/.test(cell(idCell))) continue; // header + divider

    const name = firstBacktickName(nameCell);
    if (!name) continue;

    const rawId = cell(idCell);
    const id = rawId && rawId !== "—" ? rawId : `${family}-${name}`;

    rows.push({
      id,
      name,
      family,
      description: cell(purposeCell),
      states: splitStates(statesCell),
      base: splitBase(baseCell),
    });
  }

  return rows;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/docs && pnpm vitest run scripts/lib/parse-catalog.test.ts`
Expected: `8 passed`

- [ ] **Step 5: Commit**

```bash
git add apps/docs/scripts/lib/parse-catalog.ts apps/docs/scripts/lib/parse-catalog.test.ts
git commit -m "feat(manifest): catalog.md table parser"
```

---

### Task 3: Manifest types and the generated manifest

**Files:**

- Create: `apps/docs/lib/manifest-types.ts`
- Create: `apps/docs/scripts/gen-manifest.mts`
- Create: `apps/docs/lib/catalog.manifest.ts` (generated output, committed)
- Test: `apps/docs/lib/catalog.manifest.test.ts`

- [ ] **Step 1: Write the types**

Create `apps/docs/lib/manifest-types.ts`:

```ts
export type FamilyId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O";

export type ManifestStatus = "planned" | "building" | "shipped" | "cut";

export interface ManifestItem {
  /** Catalog ID, e.g. "B2". The join key to catalog.md and component-specs.md. */
  id: string;
  /** Registry name, e.g. "workspace-switcher". */
  name: string;
  title: string;
  description: string;
  family: FamilyId;
  layer: "primitive" | "component" | "block";
  status: ManifestStatus;
  wave: number;
  /** Design-level base from catalog.md. Documentation only — never build input. */
  base: string[];
  /** shadcn registry items the code imports. Build input. */
  shadcn: string[];
  /** Registry-internal items this component composes. Build input. */
  consumes: string[];
  /** npm packages the component needs at runtime. */
  npm: string[];
  /** States the story file must export. */
  states: string[];
  /** Anchor into component-specs.md. */
  specAnchor: string;
  /**
   * Shipped before Wave 1.5. Exempt from the story-state and documentation
   * assertions until the retrofit task runs. Never set on a new component.
   */
  contractExempt?: true;
}

export const shippedItems = (items: ManifestItem[]) => items.filter((i) => i.status === "shipped");

export const byFamily = (items: ManifestItem[], family: FamilyId) => items.filter((i) => i.family === family);
```

- [ ] **Step 2: Write the generator**

Create `apps/docs/scripts/gen-manifest.mts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCatalogTables } from "./lib/parse-catalog";

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_MD = join(here, "../../../docs/design-system/catalog.md");
const OUT = join(here, "../lib/catalog.manifest.ts");

/** Wave assignment per decisions.md §5. G is cut, so it has no wave. */
const WAVE_BY_FAMILY: Record<string, number> = {
  A: 1,
  B: 2,
  C: 2,
  D: 3,
  E: 4,
  F: 4,
  G: 0,
  H: 6,
  I: 6,
  J: 7,
  K: 8,
  L: 9,
  M: 10,
  N: 11,
  O: 2,
};

/** The 14 items already in the registry, and the deps their code actually imports. */
const SHIPPED: Record<string, { shadcn?: string[]; consumes?: string[]; npm?: string[] }> = {
  kbd: {},
  "cost-chip": { npm: ["lucide-react"] },
  "date-section": {},
  "choice-chips": {},
  "filter-bar": { npm: ["lucide-react"] },
  "field-row": { consumes: ["reset-affordance"] },
  "gen-settings-bar": {},
  "preview-tile": {},
  "entity-row": {},
  "section-header": {},
  "reset-affordance": {},
  "stat-readout": {},
  "shortcuts-sheet": { shadcn: ["dialog"], consumes: ["kbd"] },
  "thread-list": {
    shadcn: ["button", "input", "dropdown-menu", "alert-dialog"],
    consumes: ["date-section"],
    npm: ["lucide-react"],
  },
};

const titleCase = (name: string) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const rows = parseCatalogTables(readFileSync(CATALOG_MD, "utf8"));

const items = rows.map((row) => {
  const shipped = SHIPPED[row.name];
  const layer = row.family === "A" ? "primitive" : row.family === "O" ? "block" : "component";
  const status = row.family === "G" ? "cut" : shipped ? "shipped" : "planned";

  return {
    id: row.id,
    name: row.name,
    title: titleCase(row.name),
    description: row.description,
    family: row.family,
    layer,
    status,
    wave: WAVE_BY_FAMILY[row.family] ?? 0,
    base: row.base,
    shadcn: shipped?.shadcn ?? [],
    consumes: shipped?.consumes ?? [],
    npm: shipped?.npm ?? [],
    states: row.states,
    specAnchor: `component-specs.md#${row.id.toLowerCase()}-${row.name.toLowerCase()}`,
    ...(shipped ? { contractExempt: true as const } : {}),
  };
});

const body = `// GENERATED by scripts/gen-manifest.mts from docs/design-system/catalog.md.
// Bootstrap only — regenerating overwrites hand edits. After the first run this
// file is edited by hand and by scripts/new-component.mts.
import type { ManifestItem } from "./manifest-types";

export const MANIFEST: ManifestItem[] = ${JSON.stringify(items, null, 2)};
`;

writeFileSync(OUT, body);
console.log(`gen:manifest — wrote ${items.length} items to lib/catalog.manifest.ts`);
```

- [ ] **Step 3: Run the generator**

Run: `cd apps/docs && pnpm tsx scripts/gen-manifest.mts && npx prettier --write lib/catalog.manifest.ts`
Expected: `gen:manifest — wrote 107 items` (if the count differs, the parser is dropping rows — fix the parser, not the count)

- [ ] **Step 4: Write the test that pins the manifest's shape**

Create `apps/docs/lib/catalog.manifest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MANIFEST } from "./catalog.manifest";
import { shippedItems } from "./manifest-types";

describe("MANIFEST", () => {
  it("carries every catalog item", () => {
    expect(MANIFEST).toHaveLength(107);
  });

  it("has exactly the 14 already-registered components as shipped", () => {
    expect(
      shippedItems(MANIFEST)
        .map((i) => i.name)
        .sort(),
    ).toEqual(
      [
        "choice-chips",
        "cost-chip",
        "date-section",
        "entity-row",
        "field-row",
        "filter-bar",
        "gen-settings-bar",
        "kbd",
        "preview-tile",
        "reset-affordance",
        "section-header",
        "shortcuts-sheet",
        "stat-readout",
        "thread-list",
      ].sort(),
    );
  });

  it("marks every shipped item as contract-exempt legacy", () => {
    expect(shippedItems(MANIFEST).every((i) => i.contractExempt === true)).toBe(true);
  });

  it("cuts family G", () => {
    expect(MANIFEST.filter((i) => i.family === "G").every((i) => i.status === "cut")).toBe(true);
  });

  it("has unique names", () => {
    const names = MANIFEST.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("declares only consumable dependencies that exist", () => {
    const names = new Set(MANIFEST.map((i) => i.name));
    for (const item of MANIFEST) {
      for (const dep of item.consumes) expect(names.has(dep)).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Run it**

Run: `cd apps/docs && pnpm vitest run lib/catalog.manifest.test.ts`
Expected: `6 passed`

- [ ] **Step 6: Commit**

```bash
git add apps/docs/lib/manifest-types.ts apps/docs/lib/catalog.manifest.ts \
        apps/docs/lib/catalog.manifest.test.ts apps/docs/scripts/gen-manifest.mts
git commit -m "feat(manifest): 107-item catalog manifest generated from catalog.md"
```

---

### Task 4: `catalog.ts` derives from the manifest

**Files:**

- Modify: `apps/docs/lib/catalog.ts`
- Test: `apps/docs/lib/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/lib/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CATALOG, CATALOG_ITEMS } from "./catalog";
import { MANIFEST } from "./catalog.manifest";

describe("CATALOG_ITEMS", () => {
  it("contains exactly the shipped manifest items", () => {
    expect(CATALOG.sort()).toEqual(
      MANIFEST.filter((i) => i.status === "shipped")
        .map((i) => i.name)
        .sort(),
    );
  });

  it("groups primitives and components by manifest layer", () => {
    const kbd = CATALOG_ITEMS.find((i) => i.name === "kbd")!;
    const threadList = CATALOG_ITEMS.find((i) => i.name === "thread-list")!;
    expect(kbd.group).toBe("Primitives");
    expect(threadList.group).toBe("Components");
  });

  it("keeps sidebar ordering stable — primitives before components", () => {
    const firstComponent = CATALOG_ITEMS.findIndex((i) => i.group === "Components");
    const lastPrimitive = CATALOG_ITEMS.map((i) => i.group).lastIndexOf("Primitives");
    expect(lastPrimitive).toBeLessThan(firstComponent);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run lib/catalog.test.ts`
Expected: FAIL on the first assertion — the hand-written list and manifest order differ.

- [ ] **Step 3: Replace `catalog.ts` with the derivation**

Replace the whole of `apps/docs/lib/catalog.ts`:

```ts
import { MANIFEST } from "./catalog.manifest";

export interface CatalogItem {
  name: string;
  title: string;
  description: string;
  group: "Primitives" | "Components";
}

const ORDER = { primitive: 0, component: 1, block: 2 } as const;

export const CATALOG_ITEMS: CatalogItem[] = MANIFEST.filter((i) => i.status === "shipped")
  .sort((a, b) => ORDER[a.layer] - ORDER[b.layer])
  .map((i) => ({
    name: i.name,
    title: i.title,
    description: i.description,
    group: i.layer === "primitive" ? "Primitives" : "Components",
  }));

export const CATALOG = CATALOG_ITEMS.map((i) => i.name);
export type CatalogName = string;
```

- [ ] **Step 4: Run the tests and the typecheck**

Run: `cd apps/docs && pnpm vitest run lib/catalog.test.ts && pnpm typecheck`
Expected: `3 passed`, typecheck clean.

- [ ] **Step 5: Verify the site still lists the same 14 components**

Run: `cd apps/docs && pnpm vitest run && pnpm build`
Expected: all tests pass; build succeeds; no page is lost.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/lib/catalog.ts apps/docs/lib/catalog.test.ts
git commit -m "refactor(docs): derive the site catalog from the manifest"
```

---

### Task 5: `gen-registry` extras derive from the manifest

**Files:**

- Modify: `apps/docs/scripts/gen-registry.mts:30-47`
- Test: `apps/docs/scripts/lib/registry-extras.test.ts`
- Create: `apps/docs/scripts/lib/registry-extras.ts`

The regression guard is the old hand-written record: the derived output must equal it exactly, or an already-published registry item silently changes its dependencies.

- [ ] **Step 1: Write the failing test with the old record as the expectation**

Create `apps/docs/scripts/lib/registry-extras.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MANIFEST } from "../../lib/catalog.manifest";
import { deriveExtras } from "./registry-extras";

const REGISTRY_URL = "https://super-ai-components.vercel.app";
const self = (name: string) => `${REGISTRY_URL}/r/${name}.json`;

// Verbatim copy of the hand-written record this replaces.
const LEGACY = {
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "field-row": { registryDependencies: [self("reset-affordance")] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
};

describe("deriveExtras", () => {
  const extras = deriveExtras(MANIFEST, self);

  it("reproduces the legacy record exactly", () => {
    expect(extras).toEqual(LEGACY);
  });

  it("omits items with no dependencies at all", () => {
    expect(extras.kbd).toBeUndefined();
  });

  it("orders shadcn bases before registry-internal deps", () => {
    expect(extras["shortcuts-sheet"].registryDependencies[0]).toBe("dialog");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts`
Expected: FAIL — `Failed to resolve import "./registry-extras"`

- [ ] **Step 3: Implement the derivation**

Create `apps/docs/scripts/lib/registry-extras.ts`:

```ts
import type { ManifestItem } from "../../lib/manifest-types";

export type Extras = Record<string, { dependencies?: string[]; registryDependencies?: string[] }>;

export function deriveExtras(items: ManifestItem[], self: (name: string) => string): Extras {
  const extras: Extras = {};

  for (const item of items) {
    if (item.status !== "shipped") continue;

    const registryDependencies = [...item.shadcn, ...item.consumes.map(self)];
    const entry: Extras[string] = {};
    if (registryDependencies.length) entry.registryDependencies = registryDependencies;
    if (item.npm.length) entry.dependencies = item.npm;
    if (Object.keys(entry).length) extras[item.name] = entry;
  }

  return extras;
}
```

- [ ] **Step 4: Run the test**

Run: `cd apps/docs && pnpm vitest run scripts/lib/registry-extras.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Use it in `gen-registry.mts`**

In `apps/docs/scripts/gen-registry.mts`, delete the hand-written `extras` object (the block beginning `// Per-item extras (deps/registryDeps) keyed by name`) and replace it with:

```ts
import { MANIFEST } from "../lib/catalog.manifest";
import { deriveExtras } from "./lib/registry-extras";

const extras = deriveExtras(MANIFEST, self);
```

- [ ] **Step 6: Verify the emitted registry JSON is byte-identical**

```bash
cd apps/docs
cp -r public/r /tmp/r-before
pnpm build:registry
diff -r /tmp/r-before public/r && echo "IDENTICAL"
```

Expected: `IDENTICAL`

- [ ] **Step 7: Commit**

```bash
git add apps/docs/scripts/gen-registry.mts apps/docs/scripts/lib/registry-extras.ts \
        apps/docs/scripts/lib/registry-extras.test.ts
git commit -m "refactor(registry): derive dependency records from the manifest"
```

---

### Task 6: Generated demo and docs wiring

**Files:**

- Create: `apps/docs/scripts/gen-wiring.mts`
- Create: `apps/docs/lib/demos.generated.ts` (generated, committed)
- Create: `apps/docs/lib/docs.generated.ts` (generated, committed)
- Modify: `apps/docs/app/components/[name]/page.tsx`
- Test: `apps/docs/lib/demos.generated.test.ts`

- [ ] **Step 1: Write the generator**

Create `apps/docs/scripts/gen-wiring.mts`:

```ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MANIFEST } from "../lib/catalog.manifest";

const here = dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes("--check");

const pascal = (name: string) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

const shipped = MANIFEST.filter((i) => i.status === "shipped")
  .map((i) => i.name)
  .sort();

const demosSource = `// GENERATED by scripts/gen-wiring.mts. Do not edit.
import type { ComponentType } from "react";

${shipped.map((n) => `import ${pascal(n)}Demo from "@/components/demos/${n}-demo";`).join("\n")}

export const demos: Record<string, ComponentType> = {
${shipped.map((n) => `  "${n}": ${pascal(n)}Demo,`).join("\n")}
};
`;

const withDocs = shipped.filter((n) => existsSync(join(here, `../content/components/${n}.docs.tsx`)));

const docsSource = `// GENERATED by scripts/gen-wiring.mts. Do not edit.
import type { ComponentDocs } from "./component-docs";

${withDocs.map((n) => `import { ${pascal(n)}Docs } from "@/content/components/${n}.docs";`).join("\n")}

export const componentDocs: Record<string, ComponentDocs> = {
${withDocs.map((n) => `  "${n}": ${pascal(n)}Docs,`).join("\n")}
};
`;

const targets = [
  { path: join(here, "../lib/demos.generated.ts"), source: demosSource },
  { path: join(here, "../lib/docs.generated.ts"), source: docsSource },
];

let stale = 0;
for (const { path, source } of targets) {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (current !== source) {
      stale++;
      console.error(`gen:wiring --check — ${path} is stale. Run pnpm gen:wiring.`);
    }
  } else {
    writeFileSync(path, source);
  }
}

if (check && stale) process.exit(1);
console.log(check ? "gen:wiring — wiring is current." : `gen:wiring — wrote ${targets.length} files.`);
```

- [ ] **Step 2: Run it**

Run: `cd apps/docs && pnpm tsx scripts/gen-wiring.mts`
Expected: `gen:wiring — wrote 2 files.` `lib/docs.generated.ts` has an empty map (no docs modules exist yet — correct).

- [ ] **Step 3: Write the test**

Create `apps/docs/lib/demos.generated.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { demos } from "./demos.generated";

describe("generated demo map", () => {
  it("has a demo for every catalog entry", () => {
    for (const name of CATALOG) expect(demos[name]).toBeDefined();
  });

  it("has no demo that is not in the catalog", () => {
    for (const name of Object.keys(demos)) expect(CATALOG).toContain(name);
  });
});
```

- [ ] **Step 4: Run it**

Run: `cd apps/docs && pnpm vitest run lib/demos.generated.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Use the generated map in the page**

In `apps/docs/app/components/[name]/page.tsx`, delete all 14 super-ai demo imports and the hand-written `demos` record, and add:

```ts
import { demos } from "@/lib/demos.generated";
```

Leave `marketingDemos` and its imports untouched — the marketing tier is not in the manifest.

- [ ] **Step 6: Verify the site is unchanged**

Run: `cd apps/docs && pnpm typecheck && pnpm build && pnpm exec playwright test`
Expected: typecheck clean, build succeeds, all smoke tests pass.

- [ ] **Step 7: Add the scripts and commit**

In `apps/docs/package.json` add to `scripts`:

```json
    "gen:wiring": "tsx scripts/gen-wiring.mts",
```

and change `build:registry` to regenerate wiring first:

```json
    "build:registry": "tsx scripts/gen-wiring.mts && tsx scripts/gen-registry.mts && shadcn build --output public/r",
```

```bash
git add apps/docs/scripts/gen-wiring.mts apps/docs/lib/demos.generated.ts \
        apps/docs/lib/docs.generated.ts apps/docs/lib/demos.generated.test.ts \
        "apps/docs/app/components/[name]/page.tsx" apps/docs/package.json
git commit -m "feat(docs): generate demo and docs wiring from the manifest"
```

---

### Task 7: The `ComponentDocs` type and renderer

**Files:**

- Create: `apps/docs/lib/component-docs.ts`
- Create: `apps/docs/components/component-docs.tsx`
- Test: `apps/docs/components/component-docs.test.tsx`

- [ ] **Step 1: Write the type**

Create `apps/docs/lib/component-docs.ts`:

```ts
import type { ReactNode } from "react";

export interface DocsExample {
  /** One sentence, imperative. "Put creation last, below a separator." */
  text: string;
  /** Optional live render of the right (or wrong) thing. */
  example?: ReactNode;
}

export interface DocsSlot {
  /** Matches a data-slot attribute on the component. */
  slot: string;
  note: string;
}

export interface ComponentDocs {
  /** What the pattern is, in two or three sentences. */
  whatItIs: string;
  /** Why it earns registry status. Cites the reference board where possible. */
  whyItMatters: string;
  /** Products the pattern was observed in, from component-specs.md. */
  evidence: string[];
  /** Named slots, rendered as numbered callouts over the live component. */
  anatomy: DocsSlot[];
  /** How to reach for it — the decision, not the API. */
  usage: string;
  dos: DocsExample[];
  donts: DocsExample[];
  /** Things that go wrong in practice. */
  pitfalls: string[];
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/docs/components/component-docs.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentDocsView } from "./component-docs";
import type { ComponentDocs } from "@/lib/component-docs";

const DOCS: ComponentDocs = {
  whatItIs: "The avatar-plus-name control that opens the workspace list.",
  whyItMatters: "First element in every sidebar on the reference board.",
  evidence: ["Descript", "CapCut"],
  anatomy: [{ slot: "trigger", note: "Current workspace + plan badge" }],
  usage: "Reach for it whenever a product has more than one workspace.",
  dos: [{ text: "Put creation last, below a separator." }],
  donts: [{ text: "Don't add a plus icon to the trigger." }],
  pitfalls: ["Two flavours, one component."],
};

describe("ComponentDocsView", () => {
  it("renders every guidance section", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText(DOCS.whatItIs)).toBeInTheDocument();
    expect(screen.getByText(DOCS.whyItMatters)).toBeInTheDocument();
    expect(screen.getByText(DOCS.usage)).toBeInTheDocument();
    expect(screen.getByText(DOCS.pitfalls[0])).toBeInTheDocument();
  });

  it("distinguishes dos from donts so they cannot be misread", () => {
    render(<ComponentDocsView docs={DOCS} />);
    const dos = document.querySelector('[data-slot="docs-do"]')!;
    const donts = document.querySelector('[data-slot="docs-dont"]')!;
    expect(dos.textContent).toContain("Put creation last");
    expect(donts.textContent).toContain("Don't add a plus icon");
    expect(dos.className).not.toBe(donts.className);
  });

  it("numbers anatomy slots so callouts can reference them", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Current workspace + plan badge")).toBeInTheDocument();
  });

  it("lists evidence products", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText(/Descript/)).toBeInTheDocument();
  });

  it("omits sections that carry no content", () => {
    render(<ComponentDocsView docs={{ ...DOCS, anatomy: [] }} />);
    expect(document.querySelector('[data-slot="docs-anatomy"]')).toBeNull();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run components/component-docs.test.tsx`
Expected: FAIL — `Failed to resolve import "./component-docs"`

- [ ] **Step 4: Implement the renderer**

Create `apps/docs/components/component-docs.tsx`:

```tsx
import type { ComponentDocs } from "@/lib/component-docs";
import { cn } from "@/lib/utils";

function Section({ title, slot, children }: { title: string; slot: string; children: React.ReactNode }) {
  return (
    <section data-slot={slot} className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Guidance({ items, tone }: { items: ComponentDocs["dos"]; tone: "do" | "dont" }) {
  return (
    <div
      data-slot={tone === "do" ? "docs-do" : "docs-dont"}
      className={cn(
        "space-y-3 rounded-lg border p-4",
        tone === "do" ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5",
      )}
    >
      <p className="text-sm font-medium">{tone === "do" ? "Do" : "Don't"}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.text} className="space-y-2">
            <p className="text-muted-foreground text-sm">{item.text}</p>
            {item.example ? <div className="rounded-md border p-3">{item.example}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComponentDocsView({ docs }: { docs: ComponentDocs }) {
  return (
    <div data-slot="component-docs" className="space-y-8">
      <Section title="What it is" slot="docs-what">
        <p className="text-muted-foreground text-sm">{docs.whatItIs}</p>
      </Section>

      <Section title="Why it matters" slot="docs-why">
        <p className="text-muted-foreground text-sm">{docs.whyItMatters}</p>
        {docs.evidence.length ? (
          <p className="text-muted-foreground text-xs">Observed in: {docs.evidence.join(" · ")}</p>
        ) : null}
      </Section>

      {docs.anatomy.length ? (
        <Section title="Anatomy" slot="docs-anatomy">
          <ol className="space-y-2">
            {docs.anatomy.map((slot, i) => (
              <li key={slot.slot} className="flex items-start gap-3 text-sm">
                <span className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {i + 1}
                </span>
                <span>
                  <code className="text-xs">{slot.slot}</code>
                  <span className="text-muted-foreground ml-2">{slot.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <Section title="How to use it" slot="docs-usage">
        <p className="text-muted-foreground text-sm">{docs.usage}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Guidance items={docs.dos} tone="do" />
          <Guidance items={docs.donts} tone="dont" />
        </div>
      </Section>

      {docs.pitfalls.length ? (
        <Section title="Watch out for" slot="docs-pitfalls">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {docs.pitfalls.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `cd apps/docs && pnpm vitest run components/component-docs.test.tsx && pnpm check:tokens`
Expected: `5 passed`, and `check:tokens` clean (the renderer lives outside `registry/`, but run it to confirm no palette classes crept into anything).

- [ ] **Step 6: Commit**

```bash
git add apps/docs/lib/component-docs.ts apps/docs/components/component-docs.tsx \
        apps/docs/components/component-docs.test.tsx
git commit -m "feat(docs): ComponentDocs type and shared guidance renderer"
```

---

### Task 8: The component page renders guidance

**Files:**

- Modify: `apps/docs/app/components/[name]/page.tsx`
- Test: `apps/docs/e2e/smoke.spec.ts` (extend)

- [ ] **Step 1: Render the docs section when one exists**

In `apps/docs/app/components/[name]/page.tsx`, add the imports:

```ts
import { ComponentDocsView } from "@/components/component-docs";
import { componentDocs } from "@/lib/docs.generated";
```

and insert between the `<PreviewTabs …/>` element and the Installation block:

```tsx
{
  !isMarketing && componentDocs[name] ? <ComponentDocsView docs={componentDocs[name]} /> : null;
}
```

- [ ] **Step 2: Extend the smoke test to assert guidance renders when present**

Append to `apps/docs/e2e/smoke.spec.ts`:

```ts
test("a component with guidance renders its Do and Don't blocks", async ({ page }) => {
  // Skips until the first documented component ships (Task 15).
  const documented = CATALOG_ITEMS.find((i) => i.name === "workspace-switcher");
  test.skip(!documented, "no documented component shipped yet");
  await page.goto(`/components/${documented!.name}`);
  await expect(page.locator('[data-slot="docs-do"]')).toBeVisible();
  await expect(page.locator('[data-slot="docs-dont"]')).toBeVisible();
});
```

- [ ] **Step 3: Verify nothing regressed**

Run: `cd apps/docs && pnpm typecheck && pnpm build && pnpm exec playwright test`
Expected: all pass; the new test reports as skipped.

- [ ] **Step 4: Commit**

```bash
git add "apps/docs/app/components/[name]/page.tsx" apps/docs/e2e/smoke.spec.ts
git commit -m "feat(docs): render component guidance on the component page"
```

---

### Task 9: Storybook imports through aliases instead of copies

**Files:**

- Modify: `apps/storybook/vite.config.ts`
- Modify: `apps/storybook/tsconfig.json`
- Modify: `apps/storybook/src/stories/super-ai/*.stories.tsx` (14 files)
- Delete: `apps/storybook/src/components/super-ai/*.tsx` (14), `apps/storybook/src/components/super-ai/demos/*.tsx` (14)

- [ ] **Step 1: Add the aliases, most specific first**

Replace the `resolve` block in `apps/storybook/vite.config.ts`:

```ts
  resolve: {
    alias: [
      { find: /^@\/registry\/(.*)/, replacement: resolve(__dirname, "../docs/registry/$1") },
      { find: /^@\/components\/demos\/(.*)/, replacement: resolve(__dirname, "../docs/components/demos/$1") },
      { find: /^@\/content\/(.*)/, replacement: resolve(__dirname, "../docs/content/$1") },
      { find: /^@\/lib\/component-docs$/, replacement: resolve(__dirname, "../docs/lib/component-docs.ts") },
      { find: /^@\/(.*)/, replacement: resolve(__dirname, "./src/$1") },
      // Lightweight shims so Next.js-flavored imports resolve in a Vite/Storybook context.
      { find: "next/image", replacement: resolve(__dirname, "./src/shims/next-image.tsx") },
      { find: "next/link", replacement: resolve(__dirname, "./src/shims/next-link.tsx") },
    ],
  },
```

- [ ] **Step 2: Mirror them in tsconfig**

In `apps/storybook/tsconfig.json`, replace `paths`:

```json
    "paths": {
      "@/registry/*": ["../docs/registry/*"],
      "@/components/demos/*": ["../docs/components/demos/*"],
      "@/content/*": ["../docs/content/*"],
      "@/lib/component-docs": ["../docs/lib/component-docs.ts"],
      "@/*": ["./src/*"]
    }
```

and widen `include` so the aliased files typecheck:

```json
  "include": ["src", ".storybook", "../docs/registry/super-ai", "../docs/components/demos"]
```

- [ ] **Step 3: Delete the copies**

```bash
cd apps/storybook
rm src/components/super-ai/*.tsx
rm -r src/components/super-ai/demos
```

- [ ] **Step 4: Point the 14 stories at the docs demos**

Each story currently imports `@/components/super-ai/demos/<name>-demo`. Change every one to `@/components/demos/<name>-demo`. For example, in `src/stories/super-ai/EntityRow.stories.tsx`:

```tsx
import EntityRowDemo from "@/components/demos/entity-row-demo";
```

Run this to confirm none are missed:

```bash
grep -rn "components/super-ai" apps/storybook/src/stories/super-ai/
```

Expected: no output.

- [ ] **Step 5: Verify Storybook still builds**

Run: `cd apps/storybook && pnpm typecheck && pnpm build`
Expected: typecheck clean; `storybook build` completes and writes `storybook-static/`.

- [ ] **Step 6: Commit**

```bash
git add apps/storybook/vite.config.ts apps/storybook/tsconfig.json apps/storybook/src
git commit -m "refactor(storybook): import registry sources through aliases, delete 28 copies"
```

---

### Task 10: Storybook a11y and interaction testing

**Files:**

- Modify: `apps/storybook/package.json`, `apps/storybook/.storybook/main.ts`
- Create: `apps/storybook/vitest.config.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Install the addons**

```bash
cd apps/storybook
pnpm add -D @storybook/addon-a11y@^9.1.10 @storybook/addon-vitest@^9.1.10 \
            vitest@^4.1.8 @vitest/browser@^4.1.8 playwright@^1.60.0
```

- [ ] **Step 2: Register them**

In `apps/storybook/.storybook/main.ts`:

```ts
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
```

- [ ] **Step 3: Add the Storybook vitest project**

Create `apps/storybook/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [storybookTest({ configDir: resolve(__dirname, ".storybook") })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    setupFiles: [".storybook/vitest.setup.ts"],
  },
});
```

Create `apps/storybook/.storybook/vitest.setup.ts`:

```ts
import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";
import preview from "./preview";

const project = setProjectAnnotations([preview]);
beforeAll(project.beforeAll);
```

- [ ] **Step 4: Add the test script**

In `apps/storybook/package.json` scripts:

```json
    "test:stories": "vitest run --project storybook",
```

- [ ] **Step 5: Run it**

Run: `cd apps/storybook && pnpm exec playwright install --with-deps chromium && pnpm test:stories`
Expected: every existing story runs and passes its a11y check. If a legacy story fails a11y, do **not** fix the component here — record it and move on; the retrofit is a separate task.

- [ ] **Step 6: Add the isolated CI step**

In `.github/workflows/ci.yml`, after the `Playwright smoke` step:

```yaml
- name: Storybook a11y + interaction
  run: |
    pnpm --filter storybook exec playwright install --with-deps chromium
    pnpm --filter storybook test:stories
```

- [ ] **Step 7: Commit**

```bash
git add apps/storybook/package.json apps/storybook/.storybook apps/storybook/vitest.config.ts \
        .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "test(storybook): a11y and interaction testing as an isolated CI step"
```

---

### Task 11: The shared Storybook docs page

**Files:**

- Create: `apps/storybook/src/lib/component-docs-page.tsx`

- [ ] **Step 1: Write the wrapper**

Create `apps/storybook/src/lib/component-docs-page.tsx`:

```tsx
import * as React from "react";
import { Controls, Primary, Stories, Subtitle, Title } from "@storybook/addon-docs/blocks";

import type { ComponentDocs } from "@/lib/component-docs";
import { ComponentDocsView } from "@/components/component-docs";

/**
 * The docs page every super-ai story uses. Same guidance renderer as the docs
 * site, so the two surfaces cannot describe a component differently.
 */
export const componentDocsPage = (docs: ComponentDocs) =>
  function DocsPage() {
    return (
      <>
        <Title />
        <Subtitle />
        <ComponentDocsView docs={docs} />
        <Primary />
        <Controls />
        <Stories />
      </>
    );
  };
```

- [ ] **Step 2: Add the alias the wrapper needs**

`@/components/component-docs` must resolve to the docs app. Add to `apps/storybook/vite.config.ts` **above** the generic `@/` rule:

```ts
      { find: /^@\/components\/component-docs$/, replacement: resolve(__dirname, "../docs/components/component-docs.tsx") },
```

and to `apps/storybook/tsconfig.json` paths:

```json
      "@/components/component-docs": ["../docs/components/component-docs.tsx"],
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/storybook && pnpm typecheck && pnpm build`
Expected: both clean. Nothing uses the wrapper yet — Task 15 is its first consumer.

- [ ] **Step 4: Commit**

```bash
git add apps/storybook/src/lib/component-docs-page.tsx apps/storybook/vite.config.ts apps/storybook/tsconfig.json
git commit -m "feat(storybook): shared docs page using the docs-site guidance renderer"
```

---

### Task 12: The scaffold

**Files:**

- Create: `apps/docs/scripts/new-component.mts`
- Modify: `apps/docs/package.json`
- Test: `apps/docs/scripts/new-component.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/new-component.test.ts`:

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, afterAll } from "vitest";

import { renderScaffold } from "./lib/scaffold-templates";
import type { ManifestItem } from "../lib/manifest-types";

const ITEM: ManifestItem = {
  id: "B2",
  name: "workspace-switcher",
  title: "Workspace Switcher",
  description: "Avatar/logo + name dropdown.",
  family: "B",
  layer: "component",
  status: "planned",
  wave: 2,
  base: ["dropdown-menu", "avatar"],
  shadcn: [],
  consumes: [],
  npm: [],
  states: ["workspace-list", "multi-product"],
  specAnchor: "component-specs.md#b2-workspace-switcher",
};

const dir = mkdtempSync(join(tmpdir(), "scaffold-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("renderScaffold", () => {
  const files = renderScaffold(ITEM);

  it("emits five files", () => {
    expect(Object.keys(files)).toHaveLength(5);
  });

  it("names the component export in PascalCase", () => {
    expect(files["registry/super-ai/workspace-switcher.tsx"]).toContain("export function WorkspaceSwitcher");
  });

  it("carries a data-slot matching the registry name", () => {
    expect(files["registry/super-ai/workspace-switcher.tsx"]).toContain('data-slot="workspace-switcher"');
  });

  it("writes one failing test per declared state", () => {
    const test = files["registry/super-ai/workspace-switcher.test.tsx"];
    expect(test).toContain('it("renders the workspace-list state"');
    expect(test).toContain('it("renders the multi-product state"');
    expect(test).toContain("expect.fail");
  });

  it("writes one story per declared state", () => {
    const story = files["../storybook/src/stories/super-ai/WorkspaceSwitcher.stories.tsx"];
    expect(story).toContain("export const WorkspaceList");
    expect(story).toContain("export const MultiProduct");
    expect(story).not.toContain("export const Default");
  });

  it("seeds the docs module with the spec anchor and empty guidance fields", () => {
    const docs = files["content/components/workspace-switcher.docs.tsx"];
    expect(docs).toContain("component-specs.md#b2-workspace-switcher");
    expect(docs).toContain("export const WorkspaceSwitcherDocs: ComponentDocs");
    expect(docs).toContain("dos: [");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/docs && pnpm vitest run scripts/new-component.test.ts`
Expected: FAIL — `Failed to resolve import "./lib/scaffold-templates"`

- [ ] **Step 3: Implement the templates**

Create `apps/docs/scripts/lib/scaffold-templates.ts`:

```ts
import type { ManifestItem } from "../../lib/manifest-types";

const pascal = (name: string) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

const statePascal = (state: string) => pascal(state);

export function renderScaffold(item: ManifestItem): Record<string, string> {
  const Comp = pascal(item.name);

  const component = `import { cn } from "@/lib/utils";

/**
 * ${item.title} — ${item.description}
 *
 * Spec: docs/design-system/${item.specAnchor}
 * States: ${item.states.join(" · ")}
 */
export function ${Comp}({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="${item.name}" className={cn(className)} {...props} />;
}
`;

  const test = `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ${Comp} } from "./${item.name}";

describe("${Comp}", () => {
${item.states
  .map(
    (state) => `  it("renders the ${state} state", () => {
    expect.fail("implement the ${state} state per docs/design-system/${item.specAnchor}");
  });
`,
  )
  .join("\n")}
  it("passes className through", () => {
    render(<${Comp} className="test-class" />);
    expect(document.querySelector('[data-slot="${item.name}"]')!.className).toContain("test-class");
  });
});
`;

  const demo = `"use client";

import { ${Comp} } from "@/registry/super-ai/${item.name}";

export default function ${Comp}Demo() {
  return <${Comp} />;
}
`;

  const docs = `import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/${item.specAnchor}.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 */
export const ${Comp}Docs: ComponentDocs = {
  whatItIs: "${item.description}",
  whyItMatters: "",
  evidence: [],
  anatomy: [],
  usage: "",
  dos: [],
  donts: [],
  pitfalls: [],
};
`;

  const story = `import type { Meta, StoryObj } from "@storybook/react-vite";

import { ${Comp} } from "@/registry/super-ai/${item.name}";
import { ${Comp}Docs } from "@/content/components/${item.name}.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ${Comp}> = {
  title: "Super AI/${item.title}",
  component: ${Comp},
  parameters: { layout: "centered", docs: { page: componentDocsPage(${Comp}Docs) } },
};

export default meta;
type Story = StoryObj<typeof ${Comp}>;

${item.states.map((state) => `export const ${statePascal(state)}: Story = {};`).join("\n")}
`;

  return {
    [`registry/super-ai/${item.name}.tsx`]: component,
    [`registry/super-ai/${item.name}.test.tsx`]: test,
    [`components/demos/${item.name}-demo.tsx`]: demo,
    [`content/components/${item.name}.docs.tsx`]: docs,
    [`../storybook/src/stories/super-ai/${Comp}.stories.tsx`]: story,
  };
}
```

- [ ] **Step 4: Run the test**

Run: `cd apps/docs && pnpm vitest run scripts/new-component.test.ts`
Expected: `6 passed`

- [ ] **Step 5: Write the CLI around it**

Create `apps/docs/scripts/new-component.mts`:

```ts
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
```

- [ ] **Step 6: Add the script and verify the CLI guards work**

In `apps/docs/package.json` scripts:

```json
    "new:component": "tsx scripts/new-component.mts",
```

Run: `cd apps/docs && pnpm new:component kbd`
Expected: `new:component — "kbd" already shipped.` and exit code 1.

Run: `cd apps/docs && pnpm new:component not-a-component`
Expected: `new:component — "not-a-component" is not in the manifest.`

- [ ] **Step 7: Commit**

```bash
git add apps/docs/scripts/new-component.mts apps/docs/scripts/lib/scaffold-templates.ts \
        apps/docs/scripts/new-component.test.ts apps/docs/package.json
git commit -m "feat(scaffold): pnpm new:component emits five wired files with red tests"
```

---

### Task 13: The contract gate

**Files:**

- Create: `apps/docs/scripts/check-contract.mts`
- Modify: `apps/docs/package.json`, `turbo.json`, root `package.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: Write the gate**

`.mts` run through `tsx`, not `.mjs` — the manifest is TypeScript, and `gen-registry.mts` already establishes that pattern. Create `apps/docs/scripts/check-contract.mts`:

```ts
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";

const manifest = MANIFEST;
const errors: string[] = [];
let checked = 0;
let exempt = 0;

const fileFor: Record<string, (n: string) => string> = {
  component: (n) => `registry/super-ai/${n}.tsx`,
  test: (n) => `registry/super-ai/${n}.test.tsx`,
  demo: (n) => `components/demos/${n}-demo.tsx`,
  docs: (n) => `content/components/${n}.docs.tsx`,
};

const pascal = (n: string) =>
  n
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
const storyFor = (n: string) => `../storybook/src/stories/super-ai/${pascal(n)}.stories.tsx`;
const names = new Set(manifest.map((i) => i.name));

for (const item of manifest) {
  if (item.status === "building") {
    // Only orphan detection applies to work in progress.
    continue;
  }
  if (item.status !== "shipped") continue;

  for (const dep of item.consumes) {
    if (!names.has(dep)) errors.push(`${item.name}: consumes "${dep}", which is not in the manifest`);
    else if (manifest.find((i) => i.name === dep)!.status !== "shipped")
      errors.push(`${item.name}: consumes "${dep}", which is not shipped`);
  }

  for (const [kind, path] of Object.entries(fileFor)) {
    if (kind === "docs" && item.contractExempt) continue;
    if (!existsSync(path(item.name))) errors.push(`${item.name}: missing ${kind} file ${path(item.name)}`);
  }

  if (item.contractExempt) {
    exempt++;
    continue;
  }

  checked++;

  const storyPath = storyFor(item.name);
  if (!existsSync(storyPath)) {
    errors.push(`${item.name}: missing story file ${storyPath}`);
  } else {
    const story = readFileSync(storyPath, "utf8");
    for (const state of item.states) {
      const exportName = pascal(state);
      if (!story.includes(`export const ${exportName}`))
        errors.push(`${item.name}: story file has no export for state "${state}"`);
    }
  }

  const docsPath = fileFor.docs(item.name);
  if (existsSync(docsPath)) {
    const docs = readFileSync(docsPath, "utf8");
    const required = [
      [/whatItIs:\s*"[^"]{10,}"/, "whatItIs"],
      [/whyItMatters:\s*"[^"]{10,}"/, "whyItMatters"],
      [/dos:\s*\[\s*\{/, "at least one do"],
      [/donts:\s*\[\s*\{/, "at least one don't"],
      [/pitfalls:\s*\[\s*"/, "at least one pitfall"],
    ];
    for (const [re, label] of required)
      if (!re.test(docs)) errors.push(`${item.name}: docs module is missing ${label}`);
  }
}

// Orphan detection across every registry component file.
for (const file of globSync("registry/super-ai/*.tsx")) {
  const name = file
    .split("/")
    .pop()!
    .replace(/\.test\.tsx$|\.tsx$/, "");
  if (!names.has(name)) errors.push(`orphan: ${file} has no manifest entry`);
}

// Generated wiring must be current.
try {
  execFileSync("npx", ["tsx", "scripts/gen-wiring.mts", "--check"], { stdio: "inherit" });
} catch {
  errors.push("generated wiring is stale — run pnpm gen:wiring");
}

if (errors.length) {
  for (const e of errors) console.error(`check:contract — ${e}`);
  console.error(`\ncheck:contract — ${errors.length} violation(s).`);
  process.exit(1);
}
console.log(`check:contract — ${checked} item(s) checked, ${exempt} legacy item(s) exempt.`);
```

- [ ] **Step 2: Run it against the current tree**

Run: `cd apps/docs && pnpm tsx scripts/check-contract.mts`
Expected: `check:contract — 0 item(s) checked, 14 legacy item(s) exempt.`

- [ ] **Step 3: Prove it fails on a real violation**

```bash
cd apps/docs
mv registry/super-ai/kbd.tsx /tmp/kbd.tsx
pnpm tsx scripts/check-contract.mts; echo "exit=$?"
mv /tmp/kbd.tsx registry/super-ai/kbd.tsx
```

Expected: `check:contract — kbd: missing component file …` and `exit=1`.

- [ ] **Step 4: Wire the script into every runner**

`apps/docs/package.json` scripts:

```json
    "check:contract": "tsx scripts/check-contract.mts",
```

`turbo.json` tasks:

```json
    "check:contract": {},
```

root `package.json` scripts:

```json
    "check:contract": "turbo run check:contract",
```

`.github/workflows/ci.yml`, immediately after the `pnpm check:tokens` line:

```yaml
- run: pnpm check:contract
```

- [ ] **Step 5: Verify end to end**

Run: `pnpm check:contract` from the repo root.
Expected: the same summary line, exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/scripts/check-contract.mts apps/docs/package.json turbo.json \
        package.json .github/workflows/ci.yml
git commit -m "feat(gate): check:contract enforces the component contract in CI"
```

---

### Task 14: The roadmap surface

**Files:**

- Create: `apps/docs/app/roadmap/page.tsx`
- Modify: `apps/docs/app/page.tsx`
- Modify: `apps/docs/e2e/smoke.spec.ts`

- [ ] **Step 1: Build the page**

Create `apps/docs/app/roadmap/page.tsx`:

```tsx
import Link from "next/link";

import { MANIFEST } from "@/lib/catalog.manifest";
import type { ManifestItem } from "@/lib/manifest-types";

const FAMILY_NAMES: Record<string, string> = {
  A: "Primitives",
  B: "App shell & navigation",
  C: "Home & launcher",
  D: "Composer & context",
  E: "Generation & parameters",
  F: "Results & assets",
  G: "Canvas & nodes (cut)",
  H: "Timeline & transport",
  I: "Editor surfaces",
  J: "Library, filtering & discovery",
  K: "Documents & knowledge",
  L: "First-run & onboarding",
  M: "Account, plan & monetization",
  N: "Feedback, trust & observability",
  O: "Blocks",
};

const active = MANIFEST.filter((i) => i.status !== "cut");
const shipped = active.filter((i) => i.status === "shipped");

function Row({ item }: { item: ManifestItem }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="min-w-0">
        <span className="text-muted-foreground mr-2 text-xs">{item.id}</span>
        {item.status === "shipped" ? (
          <Link href={`/components/${item.name}`} className="font-medium underline-offset-4 hover:underline">
            {item.title}
          </Link>
        ) : (
          <span className="font-medium">{item.title}</span>
        )}
        <span className="text-muted-foreground ml-2">{item.description}</span>
      </span>
      <span className="text-muted-foreground shrink-0 text-xs capitalize">{item.status}</span>
    </li>
  );
}

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Roadmap</h1>
        <p className="text-muted-foreground mt-2">
          {shipped.length} of {active.length} components shipped. Everything listed in the sidebar is
          installable today; everything here is specified.
        </p>
      </div>

      {Object.keys(FAMILY_NAMES).map((family) => {
        const items = active.filter((i) => i.family === family);
        if (!items.length) return null;
        const done = items.filter((i) => i.status === "shipped").length;
        return (
          <section key={family} className="space-y-2">
            <h2 className="text-lg font-semibold">
              {family} · {FAMILY_NAMES[family]}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                {done}/{items.length}
              </span>
            </h2>
            <ul>
              {items.map((item) => (
                <Row key={item.name} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add the homepage progress line**

In `apps/docs/app/page.tsx`, add the import and render the line under the existing subtitle paragraph:

```tsx
import Link from "next/link";
import { MANIFEST } from "@/lib/catalog.manifest";

const active = MANIFEST.filter((i) => i.status !== "cut");
const shipped = active.filter((i) => i.status === "shipped");
```

```tsx
<Link href="/roadmap" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
  {shipped.length} of {active.length} shipped →
</Link>
```

- [ ] **Step 3: Cover it with a smoke test**

Append to `apps/docs/e2e/smoke.spec.ts`:

```ts
test("roadmap lists every active catalog family", async ({ page }) => {
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /B · App shell & navigation/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Canvas & nodes/ })).toHaveCount(0);
});
```

- [ ] **Step 4: Verify**

Run: `cd apps/docs && pnpm build && pnpm exec playwright test`
Expected: build succeeds, all smoke tests pass including the new one.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/app/roadmap apps/docs/app/page.tsx apps/docs/e2e/smoke.spec.ts
git commit -m "feat(docs): roadmap surface computed from the manifest"
```

---

### Task 15: Pilot — `workspace-switcher` (B2)

**Files:**

- Create (via scaffold): `apps/docs/registry/super-ai/workspace-switcher.tsx`, `.test.tsx`, `apps/docs/components/demos/workspace-switcher-demo.tsx`, `apps/docs/content/components/workspace-switcher.docs.tsx`, `apps/storybook/src/stories/super-ai/WorkspaceSwitcher.stories.tsx`
- Modify: `apps/docs/lib/catalog.manifest.ts` (states, shadcn, consumes, npm, status)

**Spec:** `docs/design-system/component-specs.md#b2-workspace-switcher`. Read it before writing code. The load-bearing decisions are: two flavours from one component (a checked list, or `entity-row` rows with descriptions); the trigger shows current context **plus its plan badge**; creation is always last, below a rule, never a plus icon on the trigger.

- [ ] **Step 1: Set the manifest entry's build inputs**

In `apps/docs/lib/catalog.manifest.ts`, find the `workspace-switcher` entry and set:

```ts
    "states": ["workspace-list", "multi-product", "with-plan-badge"],
    "shadcn": ["dropdown-menu", "avatar", "button"],
    "consumes": ["entity-row"],
    "npm": ["lucide-react"],
    "status": "building",
```

- [ ] **Step 2: Scaffold**

Run: `cd apps/docs && pnpm new:component workspace-switcher`
Expected: five `created …` lines.

- [ ] **Step 3: Verify the scaffolded suite is red**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/workspace-switcher.test.tsx`
Expected: 3 failures — one per declared state, each `expect.fail("implement the … state …")`.

- [ ] **Step 4: Replace the scaffolded state tests with real assertions**

In `apps/docs/registry/super-ai/workspace-switcher.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSwitcher } from "./workspace-switcher";

const WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

describe("WorkspaceSwitcher", () => {
  it("renders the workspace-list state as a checked list", async () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    const current = await screen.findByRole("menuitemradio", { name: /Acme/ });
    expect(current).toHaveAttribute("aria-checked", "true");
  });

  it("renders the multi-product state as rows with descriptions", async () => {
    render(
      <WorkspaceSwitcher
        workspaces={WORKSPACES.map((w) => ({ ...w, description: `${w.name} workspace` }))}
        currentId="acme"
        onSelect={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    expect(await screen.findByText("Personal workspace")).toBeInTheDocument();
  });

  it("renders the with-plan-badge state on the trigger", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} />);
    // The plan badge is the cheapest upgrade prompt in the shell — it must be on
    // the trigger, not only inside the open menu.
    expect(screen.getByRole("button", { name: /Acme/ })).toHaveTextContent("Pro");
  });

  it("puts creation last, below a separator", async () => {
    render(
      <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} onCreate={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    const items = await screen.findAllByRole("menuitem");
    expect(items[items.length - 1]).toHaveTextContent(/create/i);
  });

  it("does not render a create affordance on the trigger", () => {
    render(
      <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} onCreate={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /Acme/ })).not.toHaveTextContent(/create|\+/i);
  });

  it("passes className through", () => {
    render(
      <WorkspaceSwitcher
        workspaces={WORKSPACES}
        currentId="acme"
        onSelect={vi.fn()}
        className="test-class"
      />,
    );
    expect(document.querySelector('[data-slot="workspace-switcher"]')!.className).toContain("test-class");
  });
});
```

- [ ] **Step 5: Run the tests and watch them fail for the right reason**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/workspace-switcher.test.tsx`
Expected: failures about missing props and menu roles — not `expect.fail` stubs.

- [ ] **Step 6: Implement the component**

Implement `apps/docs/registry/super-ai/workspace-switcher.tsx` against the spec section and the tests. Constraints that are not negotiable: `data-slot="workspace-switcher"` on the root; semantic shadcn variables only (no palette classes — `check:tokens` enforces this); `cn()` from `@/lib/utils`; named export; rows with descriptions compose `EntityRow` from `@/registry/super-ai/entity-row` rather than reimplementing it.

- [ ] **Step 7: Run the tests until green**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/workspace-switcher.test.tsx && pnpm check:tokens`
Expected: `6 passed`, tokens clean.

- [ ] **Step 8: Write the demo and the guidance**

Fill `apps/docs/components/demos/workspace-switcher-demo.tsx` so it exercises all three states, and fill `apps/docs/content/components/workspace-switcher.docs.tsx` by translating the spec section — `whyItMatters` cites the Evidence line (Descript, CapCut, Spline, Make, Lovable); `dos` includes creation-last with a live example; `donts` includes the plus-icon-on-trigger mistake with a live example; `pitfalls` includes reaching for a second component when descriptions appear.

- [ ] **Step 9: Fill in the stories**

In `apps/storybook/src/stories/super-ai/WorkspaceSwitcher.stories.tsx`, give each of `WorkspaceList`, `MultiProduct` and `WithPlanBadge` real `args`, and add a `play` function to `WorkspaceList` that opens the menu and asserts the checked item.

- [ ] **Step 10: Ship it**

Set the manifest entry's `"status": "shipped"`, then:

Run: `cd apps/docs && pnpm gen:wiring && pnpm check:contract && pnpm test && pnpm build && pnpm exec playwright test`
Expected: contract reports `1 item(s) checked, 14 legacy item(s) exempt`; everything green; `/components/workspace-switcher` renders with Do and Don't blocks.

- [ ] **Step 11: Commit**

```bash
git add apps/docs apps/storybook
git commit -m "feat(workspace-switcher): B2 — two flavours, plan badge on the trigger"
```

---

### Task 16: Pilot — `promo-card` (B5)

**Spec:** `docs/design-system/component-specs.md#b5-promo-card`. Four flavours (upgrade · invite/refer · update-available · quota warning), one component; the art slot is optional in all of them; **always dismissible, and dismissal must persist** — "a CTA that returns every session reads as a bug".

- [ ] **Step 1: Set the manifest entry's build inputs**

```ts
    "states": ["upgrade", "invite", "update-available", "quota-warning", "dismissed"],
    "shadcn": ["card", "button"],
    "consumes": [],
    "npm": ["lucide-react"],
    "status": "building",
```

- [ ] **Step 2: Scaffold and confirm red**

Run: `cd apps/docs && pnpm new:component promo-card && pnpm vitest run registry/super-ai/promo-card.test.tsx`
Expected: 5 `expect.fail` failures.

- [ ] **Step 3: Write the real tests**

Replace the state tests in `apps/docs/registry/super-ai/promo-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromoCard } from "./promo-card";

describe("PromoCard", () => {
  it.each([
    ["upgrade", "Upgrade to Pro"],
    ["invite", "Invite your team"],
    ["update-available", "Update available"],
    ["quota-warning", "You're near your limit"],
  ] as const)("renders the %s flavour", (flavour, title) => {
    render(<PromoCard flavour={flavour} title={title} onDismiss={vi.fn()} />);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders without art — the art slot is optional in every flavour", () => {
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" onDismiss={vi.fn()} />);
    expect(document.querySelector('[data-slot="promo-card-art"]')).toBeNull();
  });

  it("is always dismissible", async () => {
    const onDismiss = vi.fn();
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders nothing in the dismissed state", () => {
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" dismissed onDismiss={vi.fn()} />);
    // Dismissal that does not persist reads as a bug — the consumer owns the
    // persistence, the component owns honouring it.
    expect(screen.queryByText("Upgrade to Pro")).toBeNull();
  });

  it("passes className through", () => {
    render(<PromoCard flavour="upgrade" title="T" onDismiss={vi.fn()} className="test-class" />);
    expect(document.querySelector('[data-slot="promo-card"]')!.className).toContain("test-class");
  });
});
```

- [ ] **Step 4: Run them, implement, run again**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/promo-card.test.tsx`
Expected first: failures about a missing component API. Implement per spec, then expect `8 passed`.

- [ ] **Step 5: Demo, guidance and stories**

Demo exercises all four flavours plus a dismiss interaction. Guidance: `whyItMatters` cites the Evidence line (Descript, Spline, Zapier, Claude, Manus) and the "only ambient paywall placement" point; `donts` covers a promo that returns after dismissal, with a live example; `pitfalls` covers four flavours being one component. Stories: one per state, with a `play` on `upgrade` that dismisses the card and asserts it disappears.

- [ ] **Step 6: Ship it**

Set `"status": "shipped"`, then run:
`cd apps/docs && pnpm gen:wiring && pnpm check:contract && pnpm test && pnpm build && pnpm exec playwright test`
Expected: all green, `2 item(s) checked`.

- [ ] **Step 7: Commit**

```bash
git add apps/docs apps/storybook
git commit -m "feat(promo-card): B5 — four flavours, dismissal that sticks"
```

---

### Task 17: Pilot — `sidebar-nav` (B3)

**Spec:** `docs/design-system/component-specs.md#b3-sidebar-nav`. Section labels are `section-header` at its smallest size, not a bespoke caption; tier badges show what exists without hiding it; **active state is a filled row, not a left border** — "borders break when the sidebar collapses".

- [ ] **Step 1: Set the manifest entry's build inputs**

```ts
    "states": ["count-badge", "tier-badge", "unread-dot", "running", "pinned-group"],
    "shadcn": ["sidebar", "badge"],
    "consumes": ["section-header"],
    "npm": ["lucide-react"],
    "status": "building",
```

- [ ] **Step 2: Scaffold and confirm red**

Run: `cd apps/docs && pnpm new:component sidebar-nav && pnpm vitest run registry/super-ai/sidebar-nav.test.tsx`
Expected: 5 `expect.fail` failures.

- [ ] **Step 3: Write the real tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarNav } from "./sidebar-nav";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" as const },
      { id: "inbox", label: "Inbox", unread: true },
      { id: "runs", label: "Runs", running: true },
    ],
  },
];

describe("SidebarNav", () => {
  it("renders the count-badge state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the tier-badge state without hiding the row", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeVisible();
  });

  it("renders the unread-dot state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="sidebar-nav-unread"]')).not.toBeNull();
  });

  it("renders the running state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="sidebar-nav-running"]')).not.toBeNull();
  });

  it("renders the pinned-group state above the sections", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" pinned={[{ id: "home", label: "Home" }]} />);
    const nav = document.querySelector('[data-slot="sidebar-nav"]')!;
    expect(nav.textContent!.indexOf("Home")).toBeLessThan(nav.textContent!.indexOf("Workspace"));
  });

  it("marks the active row with a filled background, never a left border", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    const active = document.querySelector('[data-slot="sidebar-nav-item"][data-active="true"]')!;
    expect(active.className).toMatch(/bg-/);
    expect(active.className).not.toMatch(/border-l/);
  });

  it("uses section-header for section labels", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="section-header"]')).not.toBeNull();
  });

  it("passes className through", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" className="test-class" />);
    expect(document.querySelector('[data-slot="sidebar-nav"]')!.className).toContain("test-class");
  });
});
```

- [ ] **Step 4: Run them, implement, run again**

Run: `cd apps/docs && pnpm vitest run registry/super-ai/sidebar-nav.test.tsx`
Expected first: failures about the missing API. Implement per spec — section labels must render `SectionHeader` from `@/registry/super-ai/section-header` with `size="sm"` — then expect `8 passed`.

- [ ] **Step 5: Demo, guidance and stories**

Guidance: `whyItMatters` cites the Evidence line (Lovable settings, Spline, Descript, Manus); `dos` covers the filled active row with a live example; `donts` covers the left-border active state with a live example showing what happens when the rail collapses; `pitfalls` covers tier badges as the cheapest paywall.

- [ ] **Step 6: Ship it**

Set `"status": "shipped"`, then run:
`cd apps/docs && pnpm gen:wiring && pnpm check:contract && pnpm test && pnpm build && pnpm exec playwright test`
Expected: `3 item(s) checked, 14 legacy item(s) exempt`; everything green.

- [ ] **Step 7: Commit**

```bash
git add apps/docs apps/storybook
git commit -m "feat(sidebar-nav): B3 — filled active row, tier badges, pinned group"
```

---

### Task 18: Full verification and preview

**Files:** none — this task only runs things.

- [ ] **Step 1: Run every gate exactly as CI does**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm check:tokens
pnpm check:contract
pnpm test
pnpm build:registry
pnpm build
pnpm --filter docs exec playwright test
pnpm --filter storybook test:stories
apps/docs/scripts/consumer-test.sh
```

Expected: all green. `check:contract` prints `3 item(s) checked, 14 legacy item(s) exempt.`

- [ ] **Step 2: Confirm the registry actually installs the new components**

```bash
grep -l "workspace-switcher\|promo-card\|sidebar-nav" apps/docs/public/r/*.json
```

Expected: three files. Confirm `workspace-switcher.json` lists the `entity-row` registry dependency and `sidebar-nav.json` lists `section-header`.

- [ ] **Step 3: Deploy a preview**

```bash
cd apps/docs && vercel deploy --yes
```

Expected: a `Preview` URL. Visit `/roadmap` (should read 17 of 107) and each of the three new component pages (each should show Do/Don't blocks).

- [ ] **Step 4: Commit any lockfile drift and push**

```bash
git add -A
git commit -m "chore: wave 1.5 verification" || echo "nothing to commit"
git push
```

---

## Notes for the executing agent

- **Never edit `lib/demos.generated.ts` or `lib/docs.generated.ts` by hand.** Run `pnpm gen:wiring`. The gate fails on stale output.
- **Only the integrating session flips `status` to `shipped`.** A component task ends with the flip; a fan-out agent building one component must not touch other entries in the manifest.
- **Tasks 15, 16 and 17 are independent** and can run concurrently — they write disjoint files. The manifest edits in their Step 1 are one line each and should be made by the integrating session before dispatch to keep the no-shared-writes rule intact.
- **`check:tokens` will reject palette classes** (`bg-blue-500`) and raw hex in anything under `registry/`. Use semantic shadcn variables.
- **If a legacy story fails the new a11y check**, record it and move on. Retrofitting the 14 shipped components is explicitly out of scope for this wave.

## Two deliberate deviations from the usual plan format

1. **Steps 6/8/9 of the pilot tasks show tests, not implementations.** Every other code step in this
   plan hands over exact code. The three pilot components do not, because their tests _are_ the
   specification and the implementation is the design work the fan-out agent is dispatched to do —
   handing over the component body would make the pilot a typing exercise and prove nothing about
   whether the pipeline can produce a component. The constraints that are not the agent's to choose
   (`data-slot` root, semantic tokens only, `cn()`, named export, which primitives to compose) are
   stated explicitly in each step.

2. **Anatomy renders as a numbered slot list, not an overlay on the live component.** Spec §6.4
   describes callouts positioned over a real render. The renderer in Task 7 lists numbered slots by
   their `data-slot` name directly beneath the existing preview, which delivers the same
   no-drawn-diagram guarantee without the positioning work. Promoting it to a true overlay is a
   follow-on, and it needs no new data — the `anatomy` field already carries what it would need.
