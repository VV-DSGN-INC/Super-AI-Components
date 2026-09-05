# Agent-Facing Registry, PR 1 — the MCP channel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish this repo's 131 existing demos as `registry:example` items with consumer-correct imports, and rewrite item descriptions so a coding agent can find and use these components over shadcn's MCP server.

**Architecture:** `gen-registry.mts` gains a fourth item list, built from the demo files that already exist one-per-component. Because `shadcn build` reads file content from disk and discards any inline `content`, the consumer-alias rewrite runs as a post-build pass over `public/r/*.json` and asserts its own completeness. Two pure, unit-tested modules do the real work; the emitter and the post-build script stay thin.

**Tech Stack:** Node 22+, ESM, TypeScript run through `tsx`, vitest, `shadcn@4.11.0`, pnpm workspaces + turbo.

**Spec:** `docs/superpowers/specs/2026-09-04-agent-facing-registry-design.md` — read it before starting. This plan implements its PR 1 only; PR 2 (the `docs` field and `llms.txt`) gets its own plan.

## Global Constraints

- **Use `pnpm`, never `npm`.** The lockfile is `pnpm-lock.yaml` and CI installs with `--frozen-lockfile`.
- **Run gates from the repo root**, in `.github/workflows/ci.yml` order: `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright smoke → Storybook a11y → consumer install test. A workspace-scoped `pnpm lint` is a different command from the root one and silently skips workspaces.
- **Do not add, remove or reorder a step in `ci.yml`.** Everything here rides inside existing steps.
- **`apps/docs/lib/catalog.manifest.ts` is the one shared file.** It is prepared centrally and a subagent must never write it. Task 5 edits it; that task is done by the integrator, not fanned out.
- **Never run `pnpm format`** (`CONTINUE.md` §4). Prettier re-wraps strings that gate regexes match against, and it wraps inside backtick spans in markdown. Format individual files you created with `pnpm exec prettier --write <path>` and read the result back.
- **The registry is the product.** A red `consumer-test.sh` is a shipping bug, not a flake.
- **Run commands bare when the exit status matters.** A pipe reports the pipe's status.
- **Never assert behaviour you know to be wrong to get green**, and never believe a green run from a gate you have not seen fail.

## Hazard: tests must not read `public/r`

`pnpm test` is CI step 5 and `pnpm build:registry` is step 6. A vitest that reads `public/r/*.json` therefore reads **the previous build's output** and will pass against stale, un-rewritten content. This is the same class of trap as `next start` serving a prebuilt app, which has already cost this repo a debugging session.

So the completeness check on rewritten content lives **inside** `rewrite-example-content.mts`, which runs during `build:registry`, and not in a vitest. Pure logic is unit-tested; the artifact is checked by the script that produces it.

## File Structure

| File                                                     | Responsibility                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/docs/scripts/lib/example-imports.ts` (create)      | One pure function: rewrite repo-internal registry aliases to consumer targets.   |
| `apps/docs/scripts/lib/example-imports.test.ts` (create) | Its unit tests, both directions.                                                 |
| `apps/docs/scripts/lib/example-items.ts` (create)        | Pure derivation: a demo's tier, install target, and its reconciled dependencies. |
| `apps/docs/scripts/lib/example-items.test.ts` (create)   | Its unit tests.                                                                  |
| `apps/docs/scripts/gen-registry.mts` (modify)            | Emits a fourth item list, plus `categories` on every item.                       |
| `apps/docs/scripts/rewrite-example-content.mts` (create) | Post-build pass over `public/r`, and the assertion that it was complete.         |
| `apps/docs/package.json` (modify)                        | `build:registry` gains the post-build step.                                      |
| `apps/docs/lib/catalog.manifest.ts` (modify)             | Descriptions rewritten to carry the decision.                                    |
| `docs/CONTINUE.md`, `CLAUDE.md` (modify)                 | Map lines pointing at the new surface.                                           |

---

### Task 1: The import rewrite, as a pure function

**Files:**

- Create: `apps/docs/scripts/lib/example-imports.ts`
- Test: `apps/docs/scripts/lib/example-imports.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `rewriteExampleImports(source: string): string` and `findRegistryAliases(source: string): string[]`. Task 3 uses both.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/lib/example-imports.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { findRegistryAliases, rewriteExampleImports } from "./example-imports";

describe("rewriteExampleImports", () => {
  it("rewrites a super-ai registry import to the consumer target", () => {
    const source = `import { ApprovalCard } from "@/registry/super-ai/approval-card";`;
    expect(rewriteExampleImports(source)).toBe(
      `import { ApprovalCard } from "@/components/super-ai/approval-card";`,
    );
  });

  it("rewrites a marketing registry import to the consumer target", () => {
    const source = `import { DotPattern } from "@/registry/marketing/dot-pattern";`;
    expect(rewriteExampleImports(source)).toBe(
      `import { DotPattern } from "@/components/marketing/dot-pattern";`,
    );
  });

  it("rewrites every occurrence, including type-only imports", () => {
    const source = [
      `import { ApprovalCard } from "@/registry/super-ai/approval-card";`,
      `import type { ApprovalState } from "@/registry/super-ai/approval-card";`,
      `import { EntityRow } from "@/registry/super-ai/entity-row";`,
    ].join("\n");
    expect(rewriteExampleImports(source)).not.toContain("@/registry/");
    expect(rewriteExampleImports(source).match(/@\/components\/super-ai\//g)).toHaveLength(3);
  });

  it("leaves imports that are already correct in a consumer app alone", () => {
    const source = [
      `import * as React from "react";`,
      `import { Button } from "@/components/ui/button";`,
      `import { Check } from "lucide-react";`,
    ].join("\n");
    expect(rewriteExampleImports(source)).toBe(source);
  });

  it("returns a source with no registry alias unchanged", () => {
    const source = `export default function Demo() { return null; }`;
    expect(rewriteExampleImports(source)).toBe(source);
  });
});

describe("findRegistryAliases", () => {
  it("reports every repo-internal alias it can still see", () => {
    const source = [
      `import { A } from "@/registry/super-ai/a";`,
      `import { B } from "@/registry/marketing/b";`,
    ].join("\n");
    expect(findRegistryAliases(source)).toEqual(["@/registry/super-ai/", "@/registry/marketing/"]);
  });

  it("reports nothing for rewritten content — the completeness check's success case", () => {
    expect(findRegistryAliases(`import { A } from "@/components/super-ai/a";`)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run from `apps/docs`:

```bash
pnpm exec vitest run scripts/lib/example-imports.test.ts
```

Expected: FAIL, `Failed to resolve import "./example-imports"`. If it fails any other way, fix that before continuing.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/docs/scripts/lib/example-imports.ts`:

```ts
// Demo files are written against this repo's own aliases. A consumer that
// installs an example has no `@/registry/*` path — its components land under
// the `target` each registry item declares — so the published example content
// is rewritten to those targets.
//
// This runs as a post-build pass over `public/r` rather than at emit time,
// because `shadcn build` reads file content from disk and DISCARDS any inline
// `content` a registry item supplies. Verified 2026-09-04 against
// shadcn@4.11.0 with a sentinel: the sentinel did not survive the build.
//
// The CLI's own import transformer is deliberately not relied on: it keys on
// its own style names, so correctness would become a property of a vendored
// implementation detail rather than of this emitter.

/** Repo alias prefix -> the consumer path the matching registry items install to. */
const ALIAS_TARGETS: Record<string, string> = {
  "@/registry/super-ai/": "@/components/super-ai/",
  "@/registry/marketing/": "@/components/marketing/",
};

const ALIAS_RE = /@\/registry\/(super-ai|marketing)\//g;

export function rewriteExampleImports(source: string): string {
  return source.replace(ALIAS_RE, (match) => ALIAS_TARGETS[match] ?? match);
}

/** Every repo-internal alias still present, in source order, deduplicated.
 *  Empty means the rewrite was complete. */
export function findRegistryAliases(source: string): string[] {
  return [...new Set(source.match(ALIAS_RE) ?? [])];
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
pnpm exec vitest run scripts/lib/example-imports.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Format, lint and typecheck the new files**

```bash
pnpm exec prettier --write scripts/lib/example-imports.ts scripts/lib/example-imports.test.ts
```

Then from the repo root, bare:

```bash
pnpm lint
```

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/scripts/lib/example-imports.ts apps/docs/scripts/lib/example-imports.test.ts
git commit -m "feat(registry): pure rewrite of demo imports to consumer targets"
```

---

### Task 2: Tier, target and dependency derivation for examples

**Files:**

- Create: `apps/docs/scripts/lib/example-items.ts`
- Test: `apps/docs/scripts/lib/example-items.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces, all used by Task 3:
  - `type ExampleTier = "super-ai" | "marketing"`
  - `demoSourcePath(componentName: string): string`
  - `exampleTarget(componentName: string, tier: ExampleTier): string`
  - `demoDependencies(source: string, self: (name: string) => string): { registryDependencies: string[]; dependencies: string[] }`

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/lib/example-items.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { demoDependencies, demoSourcePath, exampleTarget } from "./example-items";

const self = (name: string) => `https://example.test/r/${name}.json`;

describe("demoSourcePath", () => {
  it("points at the demo file that already exists for every shipped item", () => {
    expect(demoSourcePath("approval-card")).toBe("components/demos/approval-card-demo.tsx");
  });
});

describe("exampleTarget", () => {
  it("lands a super-ai example in an examples subfolder beside its components", () => {
    expect(exampleTarget("approval-card", "super-ai")).toBe(
      "components/super-ai/examples/approval-card-demo.tsx",
    );
  });

  it("lands a marketing example in the marketing examples subfolder", () => {
    expect(exampleTarget("dot-pattern", "marketing")).toBe(
      "components/marketing/examples/dot-pattern-demo.tsx",
    );
  });
});

describe("demoDependencies", () => {
  it("resolves the demo's own component as a registry dependency, so adding the example pulls it", () => {
    const source = `import { ApprovalCard } from "@/registry/super-ai/approval-card";`;
    expect(demoDependencies(source, self).registryDependencies).toEqual([
      "https://example.test/r/approval-card.json",
    ]);
  });

  it("resolves a vendored shadcn import to its bare registry name", () => {
    const source = `import { Button } from "@/components/ui/button";`;
    expect(demoDependencies(source, self).registryDependencies).toEqual(["button"]);
  });

  it("collects npm packages as dependencies and excludes react", () => {
    const source = [`import * as React from "react";`, `import { Check } from "lucide-react";`].join("\n");
    const deps = demoDependencies(source, self);
    expect(deps.dependencies).toEqual(["lucide-react"]);
    expect(deps.registryDependencies).toEqual([]);
  });

  it("counts a type-only import of the same component once", () => {
    const source = [
      `import { ApprovalCard } from "@/registry/super-ai/approval-card";`,
      `import type { ApprovalState } from "@/registry/super-ai/approval-card";`,
    ].join("\n");
    expect(demoDependencies(source, self).registryDependencies).toHaveLength(1);
  });

  it("ignores relative imports, which never cross a package boundary", () => {
    const source = `import { helper } from "./helper";`;
    const deps = demoDependencies(source, self);
    expect(deps.registryDependencies).toEqual([]);
    expect(deps.dependencies).toEqual([]);
  });

  it("returns both lists sorted, so the emitted payload is stable across runs", () => {
    const source = [
      `import { Card } from "@/components/ui/card";`,
      `import { Button } from "@/components/ui/button";`,
      `import { Zap } from "lucide-react";`,
      `import { motion } from "motion/react";`,
    ].join("\n");
    const deps = demoDependencies(source, self);
    expect(deps.registryDependencies).toEqual(["button", "card"]);
    expect(deps.dependencies).toEqual(["lucide-react", "motion"]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
pnpm exec vitest run scripts/lib/example-items.test.ts
```

Expected: FAIL, `Failed to resolve import "./example-items"`.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/docs/scripts/lib/example-items.ts`:

```ts
// Derivation for `registry:example` items, kept pure so gen-registry.mts stays
// a thin caller and every rule here is unit-testable without a build.
//
// Dependencies are reconciled from the demo's REAL imports. CONTINUE.md §3.5
// sets this rule for components and it holds identically here: never an
// assumed list, never the catalog's design-level bases.

export type ExampleTier = "super-ai" | "marketing";

/** The demo file that already exists for every shipped item.
 *  `demos.generated.test.ts` gates that one-per-item invariant. */
export function demoSourcePath(componentName: string): string {
  return `components/demos/${componentName}-demo.tsx`;
}

/** Examples install into an `examples/` subfolder beside their tier's
 *  components, so an example can never collide with a component file. */
export function exampleTarget(componentName: string, tier: ExampleTier): string {
  return `components/${tier}/examples/${componentName}-demo.tsx`;
}

const UI_PREFIX = "@/components/ui/";
const REGISTRY_PREFIXES = ["@/registry/super-ai/", "@/registry/marketing/"];

export function demoDependencies(
  source: string,
  self: (name: string) => string,
): { registryDependencies: string[]; dependencies: string[] } {
  const registryDependencies = new Set<string>();
  const dependencies = new Set<string>();

  for (const match of source.matchAll(/from\s+"([^"]+)"/g)) {
    const specifier = match[1];

    if (specifier.startsWith(UI_PREFIX)) {
      registryDependencies.add(specifier.slice(UI_PREFIX.length));
      continue;
    }

    const registryPrefix = REGISTRY_PREFIXES.find((p) => specifier.startsWith(p));
    if (registryPrefix) {
      registryDependencies.add(self(specifier.slice(registryPrefix.length)));
      continue;
    }

    // Relative imports stay inside the file's own directory and never cross a
    // package boundary; `react` is a peer every consumer already has.
    if (specifier.startsWith(".") || specifier.startsWith("@/") || specifier === "react") continue;

    // "motion/react" and friends install as their package root.
    dependencies.add(
      specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0],
    );
  }

  return {
    registryDependencies: [...registryDependencies].sort(),
    dependencies: [...dependencies].sort(),
  };
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
pnpm exec vitest run scripts/lib/example-items.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Format, lint and typecheck**

```bash
pnpm exec prettier --write scripts/lib/example-items.ts scripts/lib/example-items.test.ts
```

From the repo root, bare: `pnpm lint`, then `pnpm typecheck`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/scripts/lib/example-items.ts apps/docs/scripts/lib/example-items.test.ts
git commit -m "feat(registry): derive example targets and deps from real demo imports"
```

---

### Task 3: Emit the example items and rewrite the published content

This is the task that changes the product. It ends with the consumer test green, which is the end-to-end proof that the rewritten imports resolve in a real app.

**Files:**

- Modify: `apps/docs/scripts/gen-registry.mts`
- Create: `apps/docs/scripts/rewrite-example-content.mts`
- Modify: `apps/docs/package.json` (the `build:registry` script)

**Interfaces:**

- Consumes: `rewriteExampleImports`, `findRegistryAliases` (Task 1); `demoSourcePath`, `exampleTarget`, `demoDependencies`, `ExampleTier` (Task 2).
- Produces: `registry.json` containing `<name>-demo` items of type `registry:example`; `public/r/<name>-demo.json` with rewritten content.

- [ ] **Step 1: Add the example item list to the emitter**

In `apps/docs/scripts/gen-registry.mts`, add to the imports at the top:

```ts
import { existsSync } from "node:fs";

import { demoDependencies, demoSourcePath, exampleTarget, type ExampleTier } from "./lib/example-items";
```

Note `readFileSync` and `writeFileSync` are already imported from `node:fs` in this file; add `existsSync` to that existing import rather than writing a second import statement.

Then, immediately **after** the `libItems` declaration and **before** the `const allItems = ...` line, insert:

```ts
// registry:example items — the demos this repo already maintains, published so
// shadcn's MCP `get_item_examples_from_registries` returns working code. That
// tool is the only one that returns file content at all; `view` returns a file
// count. Measured against shadcn@4.11.0, 2026-09-04.
//
// Content is NOT rewritten here: `shadcn build` re-reads each file from `path`
// and discards inline `content`. The consumer-alias rewrite is the post-build
// pass in scripts/rewrite-example-content.mts.
const exampleSources: { name: string; title: string; tier: ExampleTier }[] = [
  ...CATALOG_ITEMS.map((i) => ({ name: i.name, title: i.title, tier: "super-ai" as const })),
  ...MARKETING_ITEMS.map((i) => ({ name: i.name, title: i.title, tier: "marketing" as const })),
];

const exampleItems = exampleSources
  .filter((entry) => existsSync(demoSourcePath(entry.name)))
  .map((entry) => {
    const source = readFileSync(demoSourcePath(entry.name), "utf8");
    const { registryDependencies, dependencies } = demoDependencies(source, self);
    return {
      name: `${entry.name}-demo`,
      type: "registry:example" as const,
      title: `${entry.title} Demo`,
      description: `Working example showing how to use ${entry.name}.`,
      dependencies,
      registryDependencies,
      files: [
        {
          path: demoSourcePath(entry.name),
          type: "registry:example",
          target: exampleTarget(entry.name, entry.tier),
        },
      ],
    };
  });
```

Then change the `allItems` line to include them:

```ts
const allItems = [...superAiItems, ...libItems, ...marketingItems, ...exampleItems];
```

And extend the final log line so the count is visible:

```ts
console.log(
  `registry.json — ${superAiItems.length} super-ai + ${marketingItems.length} marketing + ${exampleItems.length} example items (base: ${REGISTRY_URL})`,
);
```

- [ ] **Step 2: Run the emitter and confirm the items appear un-rewritten**

```bash
pnpm exec tsx scripts/gen-registry.mts
```

Then:

```bash
node -e 'const r=require("./registry.json");const ex=r.items.filter(i=>i.type==="registry:example");console.log("examples:",ex.length,"total:",r.items.length);console.log(JSON.stringify(ex.find(i=>i.name==="approval-card-demo"),null,1))'
```

Expected: `examples: 131 total: 264`, and the `approval-card-demo` item carries `registryDependencies` including the `approval-card` self URL. The duplicate-name guard already in this file will throw if any example name collides with a component name.

- [ ] **Step 3: Write the post-build rewrite script, with its own completeness assertion**

Create `apps/docs/scripts/rewrite-example-content.mts`:

```ts
// Post-build pass over the PUBLISHED registry artifacts. `shadcn build` inlines
// each file's content by reading `path` from disk and discards any inline
// `content` an item supplied (verified with a sentinel against shadcn@4.11.0,
// 2026-09-04), so this is the only place the consumer-alias rewrite can happen.
//
// It also asserts its own completeness and exits non-zero on any survivor. That
// assertion deliberately does NOT live in a vitest: `pnpm test` runs BEFORE
// `pnpm build:registry` in ci.yml, so a test reading public/r would read the
// previous build's output and pass against stale content — the same stale-artifact
// trap that has already cost this repo a debugging session.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { findRegistryAliases, rewriteExampleImports } from "./lib/example-imports";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public/r");

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json") && f !== "registry.json");

let examplesSeen = 0;
let rewritten = 0;
const survivors: string[] = [];

for (const fileName of files) {
  const path = join(OUT_DIR, fileName);
  const item = JSON.parse(readFileSync(path, "utf8"));
  if (item.type !== "registry:example") continue;
  examplesSeen++;

  let touched = false;
  for (const file of item.files ?? []) {
    if (typeof file.content !== "string") continue;
    const next = rewriteExampleImports(file.content);
    if (next !== file.content) {
      file.content = next;
      touched = true;
    }
    const remaining = findRegistryAliases(next);
    if (remaining.length) survivors.push(`${item.name}: ${remaining.join(", ")}`);
  }

  if (touched) {
    writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
    rewritten++;
  }
}

// A pass that matched nothing must say so rather than reporting success — a
// check that cannot fail passes silently.
if (examplesSeen === 0) {
  console.error(
    "rewrite-example-content — found no registry:example items in public/r. The emitter or this filter is wrong; refusing to report success.",
  );
  process.exit(1);
}

if (survivors.length) {
  console.error(
    `rewrite-example-content — ${survivors.length} example file(s) still carry a repo-internal alias after rewriting:\n  ${survivors.join("\n  ")}`,
  );
  process.exit(1);
}

console.log(
  `rewrite-example-content — ${examplesSeen} example item(s) checked, ${rewritten} rewritten, 0 aliases remaining.`,
);
```

- [ ] **Step 4: Watch the assertion fail before wiring it in**

Build the registry without the rewrite, then run the script's check against that output by temporarily neutering the rewrite. Do it by running the script twice: the first run rewrites and reports; to see the failure path, re-build and run with the rewrite disabled.

```bash
pnpm exec tsx scripts/gen-registry.mts && pnpm exec shadcn build --output public/r
```

```bash
node -e 'const j=require("./public/r/approval-card-demo.json");console.log(j.files[0].content.split("\n").find(l=>l.includes("@/registry/")))'
```

Expected: it prints the un-rewritten import line. That is the failing state the script exists to fix. Now run the script:

```bash
pnpm exec tsx scripts/rewrite-example-content.mts
```

Expected: `131 example item(s) checked, 131 rewritten, 0 aliases remaining.`

Re-run the same `node -e` command above. Expected: it prints `undefined`, because no line contains the alias any more.

- [ ] **Step 5: Prove the failure path is real**

Temporarily break the rewrite so the assertion fires, confirming it can fail. In `apps/docs/scripts/lib/example-imports.ts`, change `rewriteExampleImports` to `return source;`, then:

```bash
pnpm exec tsx scripts/gen-registry.mts && pnpm exec shadcn build --output public/r
```

```bash
pnpm exec tsx scripts/rewrite-example-content.mts
```

Expected: exit 1, listing 131 items that still carry an alias. **Revert that edit** (`git checkout -- scripts/lib/example-imports.ts`) and re-run the two commands to confirm it returns to 0 survivors.

- [ ] **Step 6: Wire the step into `build:registry`**

In `apps/docs/package.json`, change the `build:registry` script from:

```
"build:registry": "tsx scripts/gen-wiring.mts && tsx scripts/gen-registry.mts && shadcn build --output public/r"
```

to:

```
"build:registry": "tsx scripts/gen-wiring.mts && tsx scripts/gen-registry.mts && shadcn build --output public/r && tsx scripts/rewrite-example-content.mts"
```

- [ ] **Step 7: Run the full build path from the repo root**

```bash
pnpm build:registry
```

Expected: the rewrite line appears at the end, with 0 aliases remaining.

- [ ] **Step 8: Run the consumer install test, the end-to-end control**

```bash
apps/docs/scripts/consumer-test.sh
```

Expected: `CONSUMER INSTALL TEST: PASS`. This installs all 264 items into a fresh Next app and builds it, so an example whose imports do not resolve fails here. Record the wall-clock time; the spec's §7 fallback (installing a named sample instead of all examples) is triggered only by a measured runtime, not pre-emptively.

If it fails on an example's import, do not exclude the example. Read the failing import, and either extend `demoDependencies` (if a dependency is unreconciled) or `ALIAS_TARGETS` (if a demo uses an alias shape the survey missed), then add the case to that module's unit tests.

- [ ] **Step 9: Format, lint, typecheck**

```bash
pnpm exec prettier --write scripts/rewrite-example-content.mts scripts/gen-registry.mts
```

From the repo root, bare: `pnpm lint`, then `pnpm typecheck`.

- [ ] **Step 10: Commit**

```bash
git add apps/docs/scripts/gen-registry.mts apps/docs/scripts/rewrite-example-content.mts apps/docs/package.json apps/docs/registry.json apps/docs/public/r
git commit -m "feat(registry): publish demos as registry:example items with consumer-correct imports"
```

---

### Task 4: Ship `categories` on every item

**Files:**

- Modify: `apps/docs/scripts/gen-registry.mts`

**Interfaces:**

- Consumes: `groupFor` from `apps/docs/lib/catalog.ts`, already imported into this file's neighbourhood via `CATALOG_ITEMS`.
- Produces: a `categories` array on every emitted item.

**Deviation from the spec, decided here:** spec decision 5 says categories ship "from the item's family". The family letter alone (`"b"`) is meaningless as a category, and the family's human label lives only in `catalog.md` headings, with `parse-catalog.ts`'s heading regex matching `[A-O]` and therefore missing family P. Introducing a hand-maintained letter-to-label map would create exactly the second home for a fact that this repo's architecture forbids. So categories derive from the layer group, which already exists in code as `groupFor`.

- [ ] **Step 1: Add categories to each item list**

In `apps/docs/scripts/gen-registry.mts`, import the group helper by adding to the existing `../lib/catalog` import:

```ts
import { CATALOG_ITEMS, groupFor } from "../lib/catalog";
```

In `superAiItems`, add a `categories` field:

```ts
categories: [groupFor(layerByName.get(i.name)!).toLowerCase()],
```

In `marketingItems`, add:

```ts
categories: ["marketing", i.group.toLowerCase()],
```

In `libItems`, add:

```ts
categories: ["lib"],
```

In `exampleItems`, add:

```ts
categories: ["examples"],
```

- [ ] **Step 2: Rebuild and verify every item carries a category**

```bash
pnpm build:registry
```

```bash
node -e 'const r=require("./apps/docs/registry.json");const missing=r.items.filter(i=>!i.categories?.length);console.log("items:",r.items.length,"| missing categories:",missing.length);console.log([...new Set(r.items.flatMap(i=>i.categories))].sort().join(", "))'
```

Expected: `missing categories: 0`, and a category list containing `blocks, components, examples, lib, marketing, primitives` plus the marketing groups.

- [ ] **Step 3: Confirm the schema still accepts the registry**

`gen-registry.mts` already validates against `registrySchema` before writing, so a bad shape throws during step 2. Confirm the run printed no error and `registry.json` was rewritten.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/scripts/gen-registry.mts apps/docs/registry.json apps/docs/public/r
git commit -m "feat(registry): ship categories derived from the layer group"
```

---

### Task 5: Rewrite descriptions to carry the decision

**Done by the integrator, not a fanned-out subagent** — this edits `catalog.manifest.ts`, the one shared file.

**Files:**

- Modify: `apps/docs/lib/catalog.manifest.ts` (the `description` field of shipped items)

**Interfaces:**

- Consumes: nothing.
- Produces: descriptions that `search_items_in_registries` can fuzzy-match on intent.

**The rule.** Fuzzy search runs over name and description only, so the description is the whole of an agent's discovery. Write what the component _decides or affords_, in the words someone would use when they do not know its name. Keep it to one sentence. Do not restate the title. Do not list props.

Worked examples, all from the current manifest:

| name            | today                                                           | rewritten                                                                                            |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `kbd`           | Keycap chip for keyboard shortcuts.                             | Renders a keyboard shortcut as keycaps, including chords and sequences.                              |
| `approval-card` | Single-artifact approval                                        | Asks the user to approve, edit, regenerate or skip one agent-proposed artifact before it is applied. |
| `cost-chip`     | Per-action credit cost chip (e.g. 17 credits, 900 credits/min). | Shows what an action will cost in credits before the user commits to running it.                     |
| `quota-meter`   | (current text)                                                  | Shows usage against an allowance, including the near-limit and over-limit states.                    |

- [ ] **Step 1: Read the current descriptions in one pass**

```bash
node -e 'const {MANIFEST}=require("./apps/docs/lib/catalog.manifest.ts");' 2>/dev/null || true
```

That will not run directly; use the emitted registry instead, which is the same field:

```bash
node -e 'const r=require("./apps/docs/registry.json");for(const i of r.items.filter(i=>i.type!=="registry:example"))console.log(i.name.padEnd(28)+i.description)'
```

- [ ] **Step 2: Rewrite them in `catalog.manifest.ts`**

Edit the `description` field of each shipped item to follow the rule above. Do not touch any other field. Do not touch `catalog.md`: nothing reconciles the two, and the catalog's terse row text is correct for a human browsing a catalog.

- [ ] **Step 3: Add the shape guard**

Create `apps/docs/lib/catalog.manifest.descriptions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { MANIFEST } from "./catalog.manifest";

const shipped = MANIFEST.filter((i) => i.status === "shipped");

describe("item descriptions carry the decision", () => {
  it("every shipped item has a description long enough to say something", () => {
    const tooShort = shipped.filter((i) => i.description.trim().length < 40).map((i) => i.name);
    expect(
      tooShort,
      "Fuzzy search over name and description is the whole of an agent's discovery; a description this short cannot carry the decision.",
    ).toEqual([]);
  });

  it("no description merely restates the title", () => {
    const restated = shipped
      .filter(
        (i) =>
          i.description.toLowerCase().replace(/[^a-z]/g, "") === i.title.toLowerCase().replace(/[^a-z]/g, ""),
      )
      .map((i) => i.name);
    expect(restated).toEqual([]);
  });

  it("descriptions are distinct, so search can tell two items apart", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const item of shipped) {
      const key = item.description.trim().toLowerCase();
      if (seen.has(key)) dupes.push(`${item.name} duplicates ${seen.get(key)}`);
      seen.set(key, item.name);
    }
    expect(dupes).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the guard and watch it pass**

```bash
pnpm exec vitest run lib/catalog.manifest.descriptions.test.ts
```

Expected: PASS, 3 tests. If the length assertion fails, it is naming items you have not rewritten yet; finish them rather than lowering the threshold.

- [ ] **Step 5: Read the descriptions back on the docs page**

The same field renders as the component page subtitle, so a description tuned only for matching can read badly to a person. Start the docs app and read three pages:

```bash
pnpm --filter docs dev
```

Open `/components/approval-card`, `/components/kbd` and `/components/quota-meter` and confirm the subtitle reads as a sentence a designer would accept. Stop the dev server when done.

- [ ] **Step 6: Rebuild and commit**

```bash
pnpm build:registry
```

```bash
git add apps/docs/lib/catalog.manifest.ts apps/docs/lib/catalog.manifest.descriptions.test.ts apps/docs/registry.json apps/docs/public/r
git commit -m "feat(registry): descriptions carry the decision, not the shape"
```

---

### Task 6: Verify against a real client, then the full gate list

**Files:**

- Modify: `docs/CONTINUE.md`, `CLAUDE.md`

- [ ] **Step 1: Point a real MCP client at the built registry**

Serve the built output and confirm the examples tool returns code. From `apps/docs`:

```bash
npx --yes serve public -l 4848 --no-clipboard
```

In a second shell, confirm the item the MCP would fetch carries rewritten content:

```bash
node -e 'fetch("http://127.0.0.1:4848/r/approval-card-demo.json").then(r=>r.json()).then(j=>{const c=j.files[0].content;console.log("type:",j.type);console.log("has repo alias:",c.includes("@/registry/"));console.log(c.split("\n").filter(l=>l.startsWith("import")).join("\n"))})'
```

Expected: `type: registry:example`, `has repo alias: false`, and imports pointing at `@/components/super-ai/...`.

Then confirm the search index carries the item so the MCP can discover it:

```bash
node -e 'fetch("http://127.0.0.1:4848/r/registry.json").then(r=>r.json()).then(j=>{const ex=j.items.filter(i=>i.type==="registry:example");console.log("indexed examples:",ex.length);console.log(j.items.find(i=>i.name==="approval-card").description)})'
```

Expected: `indexed examples: 131`, and the rewritten description.

Stop the server.

- [ ] **Step 2: Run the search control**

The point of Task 5 is that an agent can find a component by intent. Confirm the new description carries a phrase the old one could not. Against the index:

```bash
node -e 'const j=require("./apps/docs/registry.json");const q="approve";const hits=j.items.filter(i=>(i.name+" "+i.description).toLowerCase().includes(q));console.log(hits.map(i=>i.name).join(", "))'
```

Expected: `approval-card` appears. Repeat with an intent word for two other components you rewrote. This mirrors the CLI's fuzzy match over name and description; it does not replace it, so also note in the PR body which client you exercised in step 1.

- [ ] **Step 3: Update the two map files**

In `CLAUDE.md`, under "The registry is the product", add one line after the `pnpm build:registry` sentence:

```markdown
`build:registry` also publishes every demo as a `registry:example` item and rewrites its imports to consumer targets — that rewrite is what `shadcn`'s MCP `get_item_examples_from_registries` serves, and `scripts/rewrite-example-content.mts` fails the build if any repo-internal alias survives.
```

In `docs/CONTINUE.md` §1, add a short paragraph recording that the agent-facing channel exists, what it carries, and that the spec and this plan are its record. State the item counts as derived by `build:registry`'s own log line rather than repeating a number that will rot.

- [ ] **Step 4: Run the whole gate list from the repo root, in ci.yml order**

Each bare, stopping at the first failure:

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm check:tokens
```

```bash
pnpm check:contract
```

```bash
pnpm test
```

```bash
pnpm build:registry
```

```bash
pnpm build
```

```bash
cd apps/docs && pnpm exec playwright test
```

```bash
cd apps/storybook && pnpm test:stories
```

```bash
apps/docs/scripts/consumer-test.sh
```

- [ ] **Step 5: Commit and open the PR**

```bash
git add CLAUDE.md docs/CONTINUE.md
git commit -m "docs(map): name the agent-facing example channel"
```

The PR body states: what the MCP measurement found, that the rewrite assertion was seen to fail before it was believed, the consumer test's measured runtime with 264 items, and which MCP client was exercised. Per `CLAUDE.md`, flag anything portable to the Minimal Design System repo.

---

## Self-Review

**Spec coverage.** Spec decision 1 (examples as the payload) is Tasks 2 and 3. Decision 2 (the import rewrite) is Tasks 1 and 3. Decision 3 (the completeness check lives in the build script) is Task 3, steps 3 to 5. Decision 4 (descriptions) is Task 5. Decision 5 (categories) is Task 4, with a stated deviation. Decisions 6 and 7 (`docs`, `llms.txt`) are PR 2 and out of scope here. Decision 8 (`meta` deferred) requires no task. Decision 9 (examples install in the consumer test) is Task 3 step 8. Every gate in spec §6 that applies to PR 1 has a step.

**Spec correction made while writing this plan.** The spec originally said `gen-registry.mts` rewrites content on emit. Measuring `shadcn@4.11.0` with a sentinel showed `shadcn build` re-reads every file from `path` and discards inline `content`, so that was not possible. The spec's decision 2 now describes the post-build pass, a new decision 3 records why the completeness check cannot be a vitest, and §6 matches. The two documents agree as written.

**Placeholders.** None. Every code step carries the code; every verification step carries its command and its expected output.

**Type consistency.** `rewriteExampleImports` and `findRegistryAliases` are defined in Task 1 and used under those names in Task 3. `demoSourcePath`, `exampleTarget`, `demoDependencies` and `ExampleTier` are defined in Task 2 and used under those names in Task 3. `self` is the existing `gen-registry.mts` helper and is passed into `demoDependencies` with the signature Task 2 declares.
