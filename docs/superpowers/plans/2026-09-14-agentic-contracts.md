# Agentic Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shipped item's guidance module a machine-readable usage contract, derive a `.meta.json`, a routing table and a published corpus from it, ship the meta beside the component through `shadcn add`, and gate all of it, with three control contracts written.

**Architecture:** `ComponentDocs` (the existing per-item guidance module under `apps/docs/content/components/`) gains `variants` and `insteadUse`. A vitest emit step imports every module under the existing `@` alias, validates it, merges manifest facts, and writes `registry/super-ai/<name>.meta.json`, `index/components.toon` and `public/llms*`; the same test without the emit flag is the drift gate. `gen-registry.mts` ships the meta as a `registry:file`. Two ratchets (contract coverage, variant story obligations) and two `CLAUDE.md` gates keep it honest.

**Tech Stack:** pnpm + turbo monorepo, Next.js docs app, vitest 4 with jsdom and `@vitejs/plugin-react`, `tsx` for `.mts` scripts, shadcn 4 registry schema, Storybook stories under `apps/storybook`.

**Spec:** `docs/superpowers/specs/2026-09-14-agentic-contracts-design.md`

## Global Constraints

- Use `pnpm`, never npm; CI installs with `--frozen-lockfile`, so no new dependencies (spec §7.1: the validator is hand-written, no zod).
- Run gates from the repo root unless a step says `apps/docs`; root `lint` and `typecheck` cover Storybook too.
- Never commit to `main`. Work on `claude/agentic-contracts` branched from `main` after merging the spec branch `claude/agentic-contracts-spec`.
- Every derived file is written only by `pnpm contract:emit` (spec D23). Never hand-edit `registry/super-ai/*.meta.json`, `index/components.toon`, or `public/llms*`.
- A contract field that can be empty carries a reason of at least 20 characters instead (spec D25). An empty array is a schema failure; an absent field is "unwritten" and lives in the coverage baseline.
- The two new fields are optional in the TypeScript type until `contract-coverage.baseline.json` is empty (spec §4).
- Baselines only shrink: `story-coverage.baseline.json` and `contract-coverage.baseline.json`. Never add to either to go green.
- `CLAUDE.md` ceiling: 14,500 bytes, headroom 2,000 (spec §8.1). Every bullet under "Rules that are easy to break by accident" names an existing gate path or appears in `docs/design-system/UNGATED.md`.
- Prose you add to docs: no em dashes, no exclamation marks. Existing text keeps its style.
- Prettier runs on every new `.ts`/`.tsx`/`.md` file before commit (`pnpm exec prettier --write <files>` from the repo root). Emitted directories are prettier-ignored (Task 3).
- A green build is not a working page. Task 12 runs the gates in `ci.yml` order and the Storybook gate in the CI image.

---

## File structure

| path (under `apps/docs` unless noted)                                                                                                       | responsibility                                                | task |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| `scripts/lib/contract-source.ts` (+ test)                                                                                                   | Load one item's guidance module by name; the import probe     | 1    |
| `lib/component-docs.ts`                                                                                                                     | The contract type: `variants`, `insteadUse`, `DocsNone`       | 2    |
| `scripts/lib/contract-schema.ts` (+ test)                                                                                                   | `validateContract`, `isNone`, `axisKey`; pure, fixture-tested | 2    |
| `scripts/lib/contract-emit.ts` (+ test)                                                                                                     | `deriveMeta` and the four renderers; the emit/drift test      | 3    |
| `registry/super-ai/*.meta.json`, `index/components.toon`, `public/llms.txt`, `public/llms-full.txt`, `public/llms/components/*.md`          | Derived, committed, drift-gated                               | 3    |
| `scripts/lib/contract-coverage.ts` (+ test), `scripts/contract-coverage-baseline.mts`, `scripts/lib/contract-coverage.baseline.json`        | The shrink-only "unwritten" ratchet                           | 4    |
| `scripts/lib/story-coverage.ts` (+ test), `scripts/story-coverage-baseline.mts`                                                             | The `variant` obligation kind                                 | 5    |
| `scripts/gen-registry.mts`, `scripts/consumer-test.sh`                                                                                      | Ship the meta as `registry:file`; prove it lands              | 6    |
| `scripts/lib/scaffold-templates.ts`, `scripts/new-component.test.ts`                                                                        | Seed the two fields red by construction                       | 7    |
| `content/components/{kbd,mode-tabs,chat-shell}.docs.tsx`, `apps/storybook/src/stories/super-ai/ModeTabs.stories.tsx`                        | The three control contracts                                   | 8    |
| `scripts/lib/claude-md.test.ts`, repo `CLAUDE.md`, `docs/design-system/UNGATED.md`                                                          | The two `CLAUDE.md` gates                                     | 9    |
| repo `tools/ds-architecture/**`                                                                                                             | Ladder refresh from the local `ds-architecture` repo          | 10   |
| `docs/design-system/story-conventions.md`, `docs/design-system/decisions.md`, `docs/CONTINUE.md`, `.claude/skills/build-component/SKILL.md` | Docs that point at the new mechanism                          | 11   |

---

### Task 1: Import probe and the module loader

Discharges the spec's first risk (§11): every one of the 116 guidance modules must evaluate under vitest before anything is built on top of them.

**Files:**

- Create: `apps/docs/scripts/lib/contract-source.ts`
- Test: `apps/docs/scripts/lib/contract-source.test.ts`

**Interfaces:**

- Consumes: `MANIFEST` from `@/lib/catalog.manifest`, `pascal` from `./scaffold-templates`.
- Produces: `loadDocs(name: string): Promise<ComponentDocs>` and `docsModulePath(name: string): string`. Task 3 and Task 8 call `loadDocs`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/scripts/lib/contract-source.test.ts
import { MANIFEST } from "@/lib/catalog.manifest";
import { loadDocs } from "./contract-source";

const shipped = MANIFEST.filter((i) => i.status === "shipped").map((i) => i.name);

describe("contract-source", () => {
  it("has shipped items to probe (a zero here is a broken manifest read, not a clean tree)", () => {
    expect(shipped.length).toBeGreaterThan(0);
  });

  // Every guidance module must evaluate outside Next: the emit step imports
  // them, and a module that cannot be imported would otherwise fail one wave
  // deep instead of here.
  it.each(shipped)("%s exports its Docs object from content/components", async (name) => {
    const docs = await loadDocs(name);
    expect(typeof docs.whatItIs).toBe("string");
    expect(docs.whatItIs.length).toBeGreaterThan(0);
  });

  it("throws, naming the item, when there is no guidance module", async () => {
    await expect(loadDocs("no-such-item")).rejects.toThrow("no-such-item");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-source.test.ts`
Expected: FAIL, "Failed to resolve import ./contract-source".

- [ ] **Step 3: Write the loader**

```ts
// apps/docs/scripts/lib/contract-source.ts
/// <reference types="vite/client" />
import type { ComponentDocs } from "@/lib/component-docs";

import { pascal } from "./scaffold-templates";

// import.meta.glob is the only way to import by computed name under Vite
// without the dynamic-import-vars plugin guessing: the map is built at
// transform time from the real directory, so a typo in `name` is a missing
// key, never a silent empty module.
const modules = import.meta.glob<Record<string, unknown>>("../../content/components/*.docs.tsx");

/** Relative to this file; the glob's keys are spelled the same way. */
export function docsModulePath(name: string): string {
  return `../../content/components/${name}.docs.tsx`;
}

/** Imports a shipped item's guidance module and returns its `<Pascal>Docs`
 *  export. Throws, naming the item, when the module is missing, fails to
 *  evaluate, or exports the wrong name: an emit that cannot read its source
 *  must fail loudly, never write a blank. */
export async function loadDocs(name: string): Promise<ComponentDocs> {
  const loader = modules[docsModulePath(name)];
  if (!loader) throw new Error(`${name}: no guidance module at content/components/${name}.docs.tsx`);
  const mod = await loader();
  const key = `${pascal(name)}Docs`;
  const docs = mod[key];
  if (!docs || typeof docs !== "object") {
    throw new Error(`${name}: content/components/${name}.docs.tsx does not export ${key}`);
  }
  return docs as ComponentDocs;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-source.test.ts`
Expected: PASS, 118 tests (116 modules plus two). If any module fails to import, stop: the error names the module and the import, and that module is fixed in this task before anything else is built (spec §11, first risk).

- [ ] **Step 5: Typecheck and format, then commit**

```bash
pnpm typecheck
pnpm exec prettier --write apps/docs/scripts/lib/contract-source.ts apps/docs/scripts/lib/contract-source.test.ts
git add apps/docs/scripts/lib/contract-source.ts apps/docs/scripts/lib/contract-source.test.ts
git commit -m "test(contracts): every guidance module evaluates under vitest, through one loader"
```

---

### Task 2: The contract type and its validator

**Files:**

- Modify: `apps/docs/lib/component-docs.ts` (append after `DocsAccessibility`, extend `ComponentDocs`)
- Create: `apps/docs/scripts/lib/contract-schema.ts`
- Test: `apps/docs/scripts/lib/contract-schema.test.ts`

**Interfaces:**

- Produces types `DocsNone`, `DocsVariantValue`, `DocsVariant`, `DocsRedirect`; optional fields `variants?: DocsVariant[] | DocsNone` and `insteadUse?: DocsRedirect[] | DocsNone` on `ComponentDocs`.
- Produces `MIN_REASON = 20`, `isNone(v: unknown): v is DocsNone`, `axisKey(axis: DocsVariant): string`, `validateContract(name: string, docs: ComponentDocs, shipped: ReadonlySet<string>): string[]` (empty array means valid; every error starts with `${name}:`). Tasks 3, 4, 5 and 7 consume these.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/docs/scripts/lib/contract-schema.test.ts
import type { ComponentDocs } from "@/lib/component-docs";
import { MIN_REASON, axisKey, isNone, validateContract } from "./contract-schema";

const shipped = new Set(["kbd", "mode-tabs", "model-picker", "shortcuts-sheet"]);
const why = "a reason long enough to pass the floor";

// Only the two contract fields are under test; the nine prose fields keep
// their needle rules in contract-rules.ts and are filled with empties here.
const base: ComponentDocs = {
  whatItIs: "x",
  whyItMatters: "x",
  evidence: [],
  anatomy: [],
  usage: "x",
  dos: [],
  donts: [],
  accessibility: { keyboard: [], screenReader: [] },
  pitfalls: [],
};

describe("validateContract", () => {
  it("accepts a written contract with one axis and one redirect", () => {
    const docs: ComponentDocs = {
      ...base,
      variants: [{ prop: "variant", default: "default", values: [{ value: "default", intent: why }] }],
      insteadUse: [{ component: "model-picker", when: why }],
    };
    expect(validateContract("mode-tabs", docs, shipped)).toEqual([]);
  });

  it("accepts { none } on both fields when the reason clears the floor", () => {
    const docs: ComponentDocs = { ...base, variants: { none: why }, insteadUse: { none: why } };
    expect(validateContract("kbd", docs, shipped)).toEqual([]);
  });

  it("treats an absent field as unwritten, not invalid (the baseline owns it)", () => {
    expect(validateContract("kbd", base, shipped)).toEqual([]);
  });

  it("rejects a none whose reason is under the floor", () => {
    const docs: ComponentDocs = { ...base, variants: { none: "short" } };
    expect(validateContract("kbd", docs, shipped)).toEqual([
      `kbd: variants.none needs a reason of at least ${MIN_REASON} characters`,
    ]);
  });

  it("rejects an empty list: silence is not a decision", () => {
    const docs: ComponentDocs = { ...base, variants: [], insteadUse: [] };
    const errors = validateContract("kbd", docs, shipped);
    expect(errors).toContain("kbd: variants must be a non-empty list or { none: <why> }");
    expect(errors).toContain("kbd: insteadUse must be a non-empty list or { none: <why> }");
  });

  it("rejects a short intent, a repeated value, and a default that is not a value", () => {
    const docs: ComponentDocs = {
      ...base,
      variants: [
        {
          prop: "variant",
          default: "ghost",
          values: [
            { value: "default", intent: "too short" },
            { value: "default", intent: why },
          ],
        },
      ],
    };
    const errors = validateContract("mode-tabs", docs, shipped);
    expect(errors).toContain(
      `mode-tabs: variants[0] value "default" needs an intent of at least ${MIN_REASON} characters`,
    );
    expect(errors).toContain('mode-tabs: variants[0] repeats value "default"');
    expect(errors).toContain('mode-tabs: variants[0].default "ghost" is not one of its values');
  });

  it("requires propName when prop is not a bare identifier, and accepts it when given", () => {
    const axis = { prop: "ToolHeader · state", values: [{ value: "idle", intent: why }] };
    expect(validateContract("mode-tabs", { ...base, variants: [axis] }, shipped)).toEqual([
      'mode-tabs: variants[0] needs propName as a bare identifier when prop "ToolHeader · state" is not one',
    ]);
    expect(
      validateContract("mode-tabs", { ...base, variants: [{ ...axis, propName: "state" }] }, shipped),
    ).toEqual([]);
  });

  it("rejects a redirect to itself or to an item that is not shipped", () => {
    const docs: ComponentDocs = {
      ...base,
      insteadUse: [
        { component: "kbd", when: why },
        { component: "ghost-item", when: why },
      ],
    };
    expect(validateContract("kbd", docs, shipped)).toEqual([
      "kbd: insteadUse points at itself",
      'kbd: insteadUse "ghost-item" is not a shipped manifest item',
    ]);
  });
});

describe("helpers", () => {
  it("isNone tells the none shape from a list and from junk", () => {
    expect(isNone({ none: "x" })).toBe(true);
    expect(isNone([])).toBe(false);
    expect(isNone(null)).toBe(false);
  });

  it("axisKey prefers propName and falls back to prop", () => {
    expect(axisKey({ prop: "variant", values: [] })).toBe("variant");
    expect(axisKey({ prop: "A · b", propName: "b", values: [] })).toBe("b");
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-schema.test.ts`
Expected: FAIL, cannot resolve `./contract-schema`.

- [ ] **Step 3: Extend the type**

Append to `apps/docs/lib/component-docs.ts`, before `export interface ComponentDocs`:

```ts
/** "Nothing" as a decision, never as silence: the reason is required and
 *  gated at 20 characters (spec 2026-09-14, D25). */
export interface DocsNone {
  none: string;
}

/** One value of one variant axis, with the judgment that picks it. */
export interface DocsVariantValue {
  value: string;
  /** When to pick this value: the decision, never the appearance. */
  intent: string;
}

export interface DocsVariant {
  /** The prop as a reader sees it, e.g. "variant", "density", "ToolHeader · state". */
  prop: string;
  /** Bare identifier the story-coverage gate matches on. Required when `prop` is not one. */
  propName?: string;
  default?: string;
  values: DocsVariantValue[];
}

/** A component to reach for instead, and the situation that makes it the right one. */
export interface DocsRedirect {
  /** Registry name. Must be a shipped manifest item other than this one. */
  component: string;
  when: string;
}
```

and add to `ComponentDocs`, after `pitfalls`:

```ts
  /**
   * Machine-readable half of the contract (spec 2026-09-14 §4). Optional only
   * until scripts/lib/contract-coverage.baseline.json is empty; then required.
   */
  variants?: DocsVariant[] | DocsNone;
  insteadUse?: DocsRedirect[] | DocsNone;
```

- [ ] **Step 4: Write the validator**

```ts
// apps/docs/scripts/lib/contract-schema.ts
import type { ComponentDocs, DocsNone, DocsVariant } from "@/lib/component-docs";

/** The floor under every reason, intent and `when`. A reason shorter than a
 *  sentence is a placeholder, and the scaffolder relies on that: it seeds
 *  "unwritten" so a scaffold is red until the judgment is written. */
export const MIN_REASON = 20;

const IDENT = /^[A-Za-z_$][\w$]*$/;

export function isNone(v: unknown): v is DocsNone {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "none" in v;
}

/** The join key the story-coverage gate matches on. */
export function axisKey(axis: DocsVariant): string {
  return axis.propName ?? axis.prop;
}

function clearsFloor(s: unknown): boolean {
  return typeof s === "string" && s.trim().length >= MIN_REASON;
}

function validateAxis(name: string, axis: DocsVariant, i: number): string[] {
  const errors: string[] = [];
  const label = `variants[${i}]`;
  if (!axis.prop) errors.push(`${name}: ${label}.prop is empty`);
  if (!IDENT.test(axisKey(axis))) {
    errors.push(`${name}: ${label} needs propName as a bare identifier when prop "${axis.prop}" is not one`);
  }
  if (!Array.isArray(axis.values) || axis.values.length === 0) {
    errors.push(`${name}: ${label}.values is empty`);
    return errors;
  }
  const seen = new Set<string>();
  for (const v of axis.values) {
    if (!v.value) errors.push(`${name}: ${label} has a value with no name`);
    if (seen.has(v.value)) errors.push(`${name}: ${label} repeats value "${v.value}"`);
    seen.add(v.value);
    if (!clearsFloor(v.intent)) {
      errors.push(
        `${name}: ${label} value "${v.value}" needs an intent of at least ${MIN_REASON} characters`,
      );
    }
  }
  if (axis.default !== undefined && !seen.has(axis.default)) {
    errors.push(`${name}: ${label}.default "${axis.default}" is not one of its values`);
  }
  return errors;
}

/** Every way `docs` fails the contract, each prefixed with the item name;
 *  `[]` when valid. Checks only the two contract fields: the nine prose
 *  fields keep their needle rules in contract-rules.ts. An absent field is
 *  not an error here; contract-coverage.ts owns "unwritten". */
export function validateContract(name: string, docs: ComponentDocs, shipped: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const { variants, insteadUse } = docs;

  if (variants !== undefined) {
    if (isNone(variants)) {
      if (!clearsFloor(variants.none)) {
        errors.push(`${name}: variants.none needs a reason of at least ${MIN_REASON} characters`);
      }
    } else if (!Array.isArray(variants) || variants.length === 0) {
      errors.push(`${name}: variants must be a non-empty list or { none: <why> }`);
    } else {
      variants.forEach((axis, i) => errors.push(...validateAxis(name, axis, i)));
    }
  }

  if (insteadUse !== undefined) {
    if (isNone(insteadUse)) {
      if (!clearsFloor(insteadUse.none)) {
        errors.push(`${name}: insteadUse.none needs a reason of at least ${MIN_REASON} characters`);
      }
    } else if (!Array.isArray(insteadUse) || insteadUse.length === 0) {
      errors.push(`${name}: insteadUse must be a non-empty list or { none: <why> }`);
    } else {
      for (const r of insteadUse) {
        if (r.component === name) errors.push(`${name}: insteadUse points at itself`);
        else if (!shipped.has(r.component)) {
          errors.push(`${name}: insteadUse "${r.component}" is not a shipped manifest item`);
        }
        if (!clearsFloor(r.when)) {
          errors.push(
            `${name}: insteadUse[${r.component}].when needs a reason of at least ${MIN_REASON} characters`,
          );
        }
      }
    }
  }

  return errors;
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-schema.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 6: Typecheck (116 modules must still compile with the fields absent), format, commit**

```bash
pnpm typecheck
pnpm exec prettier --write apps/docs/lib/component-docs.ts apps/docs/scripts/lib/contract-schema.ts apps/docs/scripts/lib/contract-schema.test.ts
git add apps/docs/lib/component-docs.ts apps/docs/scripts/lib/contract-schema.ts apps/docs/scripts/lib/contract-schema.test.ts
git commit -m "feat(contracts): variants and insteadUse join ComponentDocs, with the validator that gates them"
```

---

### Task 3: Derivation and the drift gate

**Files:**

- Create: `apps/docs/scripts/lib/contract-emit.ts`
- Test: `apps/docs/scripts/lib/contract-emit.test.ts`
- Modify: `apps/docs/package.json` (scripts), repo `.prettierignore`
- Creates on first emit: `apps/docs/registry/super-ai/*.meta.json` (116), `apps/docs/index/components.toon`, `apps/docs/public/llms.txt`, `apps/docs/public/llms-full.txt`, `apps/docs/public/llms/components/*.md` (116)

**Interfaces:**

- Consumes: `loadDocs` (Task 1), `validateContract`, `isNone`, `axisKey` (Task 2), `MANIFEST`, `ManifestItem`.
- Produces: `ContractMeta` type; `deriveMeta(item: ManifestItem, docs: ComponentDocs): ContractMeta`; `renderToon(metas: ContractMeta[]): string`; `renderLlmsTxt(metas): string`; `renderComponentPage(meta): string`; `renderLlmsFull(metas): string`; `derivedFiles(metas): Map<string, string>` keyed by path relative to `apps/docs`. Tasks 4 and 5 read the emitted `.meta.json`; Task 6 ships it.

- [ ] **Step 1: Write the failing unit tests for the pure functions**

```ts
// apps/docs/scripts/lib/contract-emit.test.ts (part 1: pure renderers)
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { MANIFEST } from "@/lib/catalog.manifest";
import type { ManifestItem } from "@/lib/manifest-types";
import type { ComponentDocs } from "@/lib/component-docs";

import { deriveMeta, derivedFiles, renderComponentPage, renderLlmsTxt, renderToon } from "./contract-emit";
import { validateContract } from "./contract-schema";
import { loadDocs } from "./contract-source";

const why = "a reason long enough to pass the floor";
const item: ManifestItem = {
  id: "D4",
  name: "mode-tabs",
  title: "Mode Tabs",
  description: "Ask/Design/Build",
  family: "D",
  layer: "component",
  status: "shipped",
  wave: 1,
  base: [],
  shadcn: ["tabs"],
  consumes: [],
  npm: ["lucide-react"],
  states: ["text-only", "with-icon"],
  specAnchor: "component-specs.md#d4-mode-tabs",
};
const docs: ComponentDocs = {
  whatItIs: "Two to five interpretations of one input, as tabs.",
  whyItMatters: "Because a mode is not a model.",
  evidence: ["Claude"],
  anatomy: [{ slot: "mode-tabs", note: "The row." }],
  usage: "Reach for it when the input has modes.",
  dos: [{ text: "Keep it under five.", example: null }],
  donts: [{ text: "Do not use it as a model picker." }],
  accessibility: { keyboard: ["Arrows move."], screenReader: ["A tablist."] },
  pitfalls: ["Six modes."],
  variants: [
    {
      prop: "variant",
      default: "default",
      values: [
        { value: "default", intent: why },
        { value: "with-icon", intent: why },
      ],
    },
  ],
  insteadUse: [{ component: "model-picker", when: why }],
};

describe("deriveMeta", () => {
  const meta = deriveMeta(item, docs);

  it("merges manifest facts so the installed file is self-contained", () => {
    expect(meta.name).toBe("mode-tabs");
    expect(meta.layer).toBe("component");
    expect(meta.family).toBe("D");
    expect(meta.states).toEqual(["text-only", "with-icon"]);
    expect(meta.shadcn).toEqual(["tabs"]);
    expect(meta.regions).toEqual([]);
    expect(meta.source).toBe("content/components/mode-tabs.docs.tsx");
    expect(meta.docs).toBe("https://super-ai-components.vercel.app/components/mode-tabs");
  });

  it("keeps the text of a do and a don't and drops the example element", () => {
    expect(meta.dos).toEqual(["Keep it under five."]);
    expect(meta.donts).toEqual(["Do not use it as a model picker."]);
    expect(JSON.stringify(meta)).not.toContain("example");
  });

  it("omits an unwritten field instead of inventing an empty one", () => {
    const { variants: _v, insteadUse: _i, ...unwritten } = docs;
    const m = deriveMeta(item, unwritten);
    expect("variants" in m).toBe(false);
    expect("insteadUse" in m).toBe(false);
  });

  it("opens with the do-not-edit banner", () => {
    expect(meta.generated).toContain("pnpm contract:emit");
    expect(meta.generated).toContain("content/components/mode-tabs.docs.tsx");
  });
});

describe("renderToon", () => {
  it("writes one line per item with axes, redirects and a purpose cut at 100 characters", () => {
    const meta = deriveMeta(item, docs);
    const toon = renderToon([meta]);
    expect(toon.split("\n")[0]).toBe("components[1]{name,layer,family,meta,variants,insteadUse,purpose}:");
    expect(toon).toContain(
      "  mode-tabs,component,D,registry/super-ai/mode-tabs.meta.json,variant=default/with-icon,model-picker,",
    );
  });

  it("spells an unwritten field as `unwritten` and a decided none as `none`", () => {
    const { variants: _v, insteadUse: _i, ...unwritten } = docs;
    expect(renderToon([deriveMeta(item, unwritten)])).toContain(",unwritten,unwritten,");
    expect(
      renderToon([deriveMeta(item, { ...unwritten, variants: { none: why }, insteadUse: { none: why } })]),
    ).toContain(",none,none,");
  });

  it("quotes a purpose that contains a comma", () => {
    const m = deriveMeta(item, { ...docs, whatItIs: "Tabs, not a select." });
    expect(renderToon([m])).toContain(',"Tabs, not a select."');
  });
});

describe("renderComponentPage", () => {
  const page = renderComponentPage(deriveMeta(item, docs));

  it("leads with the title, the purpose, and the retrieval order", () => {
    expect(page.startsWith("# Mode Tabs\n\n> Two to five interpretations")).toBe(true);
    expect(page).toContain("npx shadcn@latest add https://super-ai-components.vercel.app/r/mode-tabs.json");
    expect(page).toContain("`components/super-ai/mode-tabs.meta.json`");
    expect(page).toContain("outranks this page");
  });

  it("renders every variant value with its intent, and every redirect", () => {
    expect(page).toContain("### variant (default: `default`)");
    expect(page).toContain(`- \`with-icon\`: ${why}`);
    expect(page).toContain(`- **model-picker**: ${why}`);
  });

  it("says when a field is not yet recorded rather than omitting the heading", () => {
    const { variants: _v, ...unwritten } = docs;
    expect(renderComponentPage(deriveMeta(item, unwritten))).toContain("## Variants\n\nNot yet recorded.");
  });
});

describe("renderLlmsTxt", () => {
  it("lists every component once, linking its page", () => {
    const txt = renderLlmsTxt([deriveMeta(item, docs)]);
    expect(txt).toContain("# Super AI Components");
    expect(txt).toContain("outrank these pages");
    expect(txt).toContain(
      "- [Mode Tabs](https://super-ai-components.vercel.app/llms/components/mode-tabs.md): Two to five",
    );
  });
});

describe("derivedFiles", () => {
  it("names one meta and one page per item plus the three shared files", () => {
    const files = derivedFiles([deriveMeta(item, docs)]);
    expect([...files.keys()].sort()).toEqual([
      "index/components.toon",
      "public/llms-full.txt",
      "public/llms.txt",
      "public/llms/components/mode-tabs.md",
      "registry/super-ai/mode-tabs.meta.json",
    ]);
    expect(files.get("registry/super-ai/mode-tabs.meta.json")!.endsWith("\n")).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts`
Expected: FAIL, cannot resolve `./contract-emit`.

- [ ] **Step 3: Write the derivation module**

```ts
// apps/docs/scripts/lib/contract-emit.ts
import type { ComponentDocs, DocsNone, DocsRedirect, DocsVariant } from "@/lib/component-docs";
import type { ManifestItem } from "@/lib/manifest-types";

import { axisKey, isNone } from "./contract-schema";

export const DOCS_URL = "https://super-ai-components.vercel.app";

/** The shipped contract: the guidance module's judgments plus the manifest
 *  facts an agent in a consumer tree has no other way to read. Derived only;
 *  spec 2026-09-14 §4.1. */
export interface ContractMeta {
  generated: string;
  name: string;
  title: string;
  layer: ManifestItem["layer"];
  family: ManifestItem["family"];
  description: string;
  purpose: string;
  whyItMatters: string;
  usage: string;
  evidence: string[];
  anatomy: { slot: string; note: string }[];
  variants?: DocsVariant[] | DocsNone;
  insteadUse?: DocsRedirect[] | DocsNone;
  dos: string[];
  donts: string[];
  accessibility: { keyboard: string[]; screenReader: string[]; focus?: string[] };
  pitfalls: string[];
  states: string[];
  regions: string[];
  consumes: string[];
  shadcn: string[];
  npm: string[];
  source: string;
  docs: string;
}

/** JSON.stringify writes keys in insertion order, so the two contract fields
 *  are spread in where the spec's sample puts them: after anatomy. An
 *  unwritten field is omitted, never invented as empty. */
export function deriveMeta(item: ManifestItem, docs: ComponentDocs): ContractMeta {
  return {
    generated: `by \`pnpm contract:emit\` from content/components/${item.name}.docs.tsx. Do not edit.`,
    name: item.name,
    title: item.title,
    layer: item.layer,
    family: item.family,
    description: item.description,
    purpose: docs.whatItIs,
    whyItMatters: docs.whyItMatters,
    usage: docs.usage,
    evidence: docs.evidence,
    anatomy: docs.anatomy.map(({ slot, note }) => ({ slot, note })),
    ...(docs.variants !== undefined ? { variants: docs.variants } : {}),
    ...(docs.insteadUse !== undefined ? { insteadUse: docs.insteadUse } : {}),
    dos: docs.dos.map((d) => d.text),
    donts: docs.donts.map((d) => d.text),
    accessibility: {
      keyboard: docs.accessibility.keyboard,
      screenReader: docs.accessibility.screenReader,
      ...(docs.accessibility.focus ? { focus: docs.accessibility.focus } : {}),
    },
    pitfalls: docs.pitfalls,
    states: item.states,
    regions: item.regions ?? [],
    consumes: item.consumes,
    shadcn: item.shadcn,
    npm: item.npm,
    source: `content/components/${item.name}.docs.tsx`,
    docs: `${DOCS_URL}/components/${item.name}`,
  };
}

function variantsCell(v: ContractMeta["variants"]): string {
  if (v === undefined) return "unwritten";
  if (isNone(v)) return "none";
  return v.map((axis) => `${axisKey(axis)}=${axis.values.map((x) => x.value).join("/")}`).join("|");
}

function redirectsCell(r: ContractMeta["insteadUse"]): string {
  if (r === undefined) return "unwritten";
  if (isNone(r)) return "none";
  return r.map((x) => x.component).join("|");
}

function cut(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n).trimEnd();
}

function csv(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The builder agent's routing table. One line per item, manifest order. */
export function renderToon(metas: ContractMeta[]): string {
  const rows = metas.map((m) =>
    [
      m.name,
      m.layer,
      m.family,
      `registry/super-ai/${m.name}.meta.json`,
      variantsCell(m.variants),
      redirectsCell(m.insteadUse),
      csv(cut(m.purpose, 100)),
    ].join(","),
  );
  return (
    [
      `components[${metas.length}]{name,layer,family,meta,variants,insteadUse,purpose}:`,
      ...rows.map((r) => `  ${r}`),
    ].join("\n") + "\n"
  );
}

const INSTALL = (name: string) => `npx shadcn@latest add ${DOCS_URL}/r/${name}.json`;

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}\n`;
}

function list(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "None recorded.";
}

/** One published page per component, every meta field in prose order. */
export function renderComponentPage(m: ContractMeta): string {
  const variants =
    m.variants === undefined
      ? "Not yet recorded."
      : isNone(m.variants)
        ? `None: ${m.variants.none}`
        : m.variants
            .map(
              (axis) =>
                `### ${axis.prop}${axis.default !== undefined ? ` (default: \`${axis.default}\`)` : ""}\n\n` +
                axis.values.map((v) => `- \`${v.value}\`: ${v.intent}`).join("\n"),
            )
            .join("\n\n");
  const redirects =
    m.insteadUse === undefined
      ? "Not yet recorded."
      : isNone(m.insteadUse)
        ? `None: ${m.insteadUse.none}`
        : m.insteadUse.map((r) => `- **${r.component}**: ${r.when}`).join("\n");
  const a11y = [
    `**Keyboard**\n\n${list(m.accessibility.keyboard)}`,
    `**Screen reader**\n\n${list(m.accessibility.screenReader)}`,
    ...(m.accessibility.focus ? [`**Focus**\n\n${list(m.accessibility.focus)}`] : []),
  ].join("\n\n");
  const composition = [
    `- States: ${m.states.length ? m.states.map((s) => `\`${s}\``).join(", ") : "none (a block is a layout, not a state machine)"}`,
    ...(m.regions.length ? [`- Regions: ${m.regions.map((s) => `\`${s}\``).join(", ")}`] : []),
    `- Composes from this registry: ${m.consumes.length ? m.consumes.join(", ") : "nothing"}`,
    `- shadcn primitives: ${m.shadcn.length ? m.shadcn.join(", ") : "none"}`,
    `- npm: ${m.npm.length ? m.npm.join(", ") : "none"}`,
  ].join("\n");

  return [
    `# ${m.title}\n\n> ${m.purpose}\n`,
    `Layer: ${m.layer} · Family: ${m.family} · Install: \`${INSTALL(m.name)}\` · Contract: \`components/super-ai/${m.name}.meta.json\` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: ${m.docs}\n`,
    section("Why it matters", m.whyItMatters),
    section("When to reach for it", m.usage),
    section("Variants", variants),
    section("Instead use", redirects),
    section("Do", list(m.dos)),
    section("Don't", list(m.donts)),
    section("Anatomy", list(m.anatomy.map((a) => `\`${a.slot}\`: ${a.note}`))),
    section("Accessibility", a11y),
    section("Pitfalls", list(m.pitfalls)),
    section("Composition", composition),
    section("Evidence", m.evidence.length ? m.evidence.join(", ") : "None recorded."),
  ].join("\n");
}

const HEADER = `# Super AI Components

> A shadcn-style registry of AI-interface components: primitives, components and blocks installed one item at a time with \`npx shadcn add\`, on stock shadcn tokens plus \`--warning\`. Code is the source of truth; every page here derives from the component's guidance module.

Install one item: \`npx shadcn@latest add ${DOCS_URL}/r/<name>.json\`. Each item installs its component and a \`<name>.meta.json\` beside it.
Retrieval order: with an item installed, read \`components/super-ai/<name>.meta.json\` first; it is version-locked to the installed code and its contents outrank these pages. Before installing, read the component's page below, then the full corpus if you are choosing between several.
`;

export function renderLlmsTxt(metas: ContractMeta[]): string {
  const lines = metas.map(
    (m) => `- [${m.title}](${DOCS_URL}/llms/components/${m.name}.md): ${cut(m.purpose, 100)}`,
  );
  return `${HEADER}\n## Guides\n\n- [Full corpus](${DOCS_URL}/llms-full.txt): every component page in one file\n\n## Components\n\n${lines.join("\n")}\n`;
}

export function renderLlmsFull(metas: ContractMeta[]): string {
  return `${HEADER}\n---\n\n${metas.map(renderComponentPage).join("\n---\n\n")}`;
}

/** Every derived file, keyed by path relative to apps/docs. Manifest order in,
 *  manifest order out, so parallel regeneration touches disjoint lines. */
export function derivedFiles(metas: ContractMeta[]): Map<string, string> {
  const files = new Map<string, string>();
  for (const m of metas) {
    files.set(`registry/super-ai/${m.name}.meta.json`, `${JSON.stringify(m, null, 2)}\n`);
    files.set(`public/llms/components/${m.name}.md`, renderComponentPage(m));
  }
  files.set("index/components.toon", renderToon(metas));
  files.set("public/llms.txt", renderLlmsTxt(metas));
  files.set("public/llms-full.txt", renderLlmsFull(metas));
  return files;
}
```

`ManifestItem.states` is required (blocks carry `states: []`) and `regions` is optional, blocks only; `item.regions ?? []` above is the only fallback needed.

- [ ] **Step 4: Run the unit tests and watch them pass**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Add the emit-or-drift test (part 2 of the same file)**

Append to `contract-emit.test.ts`:

```ts
// Part 2: the gate. With CONTRACT_EMIT=1 it writes every derived file; without
// the flag it regenerates in memory and fails on any byte of difference.
// Same code path both ways, so writer and gate cannot disagree about "stale".
const EMIT = process.env.CONTRACT_EMIT === "1";
const ROOT = resolve(__dirname, "../.."); // apps/docs

describe("contract emit and drift", () => {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const shippedNames = new Set(shipped.map((i) => i.name));

  it("validates every shipped item and derives exactly one contract per item", async () => {
    const errors: string[] = [];
    const metas = [];
    for (const item of shipped) {
      const docs = await loadDocs(item.name);
      errors.push(...validateContract(item.name, docs, shippedNames));
      metas.push(deriveMeta(item, docs));
    }
    expect(
      errors,
      "Contract schema failures. Fix the guidance module; a reason or intent under 20 characters is a placeholder.",
    ).toEqual([]);

    const files = derivedFiles(metas);
    if (EMIT) {
      for (const [rel, content] of files) {
        mkdirSync(dirname(join(ROOT, rel)), { recursive: true });
        writeFileSync(join(ROOT, rel), content);
      }
    }
    const stale = [...files]
      .filter(
        ([rel, content]) => !existsSync(join(ROOT, rel)) || readFileSync(join(ROOT, rel), "utf8") !== content,
      )
      .map(([rel]) => rel);
    expect(
      stale,
      "Derived files are stale. Run `pnpm contract:emit` in apps/docs and commit the result; never edit a derived file by hand.",
    ).toEqual([]);

    // The derived set is exactly the shipped set: a meta or a page with no
    // shipped item behind it is deleted on emit and fails the gate otherwise.
    const orphans = [
      ...readdirSync(join(ROOT, "registry/super-ai"))
        .filter((f) => f.endsWith(".meta.json"))
        .map((f) => `registry/super-ai/${f}`)
        .filter((rel) => !files.has(rel)),
      ...(existsSync(join(ROOT, "public/llms/components"))
        ? readdirSync(join(ROOT, "public/llms/components"))
            .map((f) => `public/llms/components/${f}`)
            .filter((rel) => !files.has(rel))
        : []),
    ];
    if (EMIT) for (const rel of orphans) unlinkSync(join(ROOT, rel));
    expect(
      orphans,
      "A derived file with no shipped manifest item behind it. Run `pnpm contract:emit` to remove it.",
    ).toEqual([]);
  });
});
```

- [ ] **Step 6: Run without the flag and watch the drift gate fail (nothing emitted yet)**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts`
Expected: FAIL on "Derived files are stale" listing 235 paths (116 metas, 116 pages, 3 shared).

- [ ] **Step 7: Add the scripts and the prettier ignores**

In `apps/docs/package.json` `scripts`, after `"story-coverage:report"`:

```json
    "contract:emit": "CONTRACT_EMIT=1 vitest run scripts/lib/contract-emit.test.ts",
```

Append to the repo `.prettierignore`:

```
# Derived by apps/docs/scripts/lib/contract-emit.test.ts (`pnpm contract:emit`)
# and byte-compared by the same test. The emitter owns their shape.
apps/docs/registry/super-ai/*.meta.json
apps/docs/index/components.toon
apps/docs/public/llms.txt
apps/docs/public/llms-full.txt
apps/docs/public/llms/
```

- [ ] **Step 8: Emit, then run the gate clean**

```bash
cd apps/docs && pnpm contract:emit && pnpm exec vitest run scripts/lib/contract-emit.test.ts && ls registry/super-ai/*.meta.json | wc -l && head -3 index/components.toon
```

Expected: emit passes; the second run passes; `116`; the toon header names 116 and the first two rows end in `,unwritten,unwritten,` since no module has the fields yet.

- [ ] **Step 9: Prove the gate bites, by hand**

```bash
cd apps/docs && echo "x" >> registry/super-ai/kbd.meta.json && pnpm exec vitest run scripts/lib/contract-emit.test.ts; git checkout registry/super-ai/kbd.meta.json
cd apps/docs && cp registry/super-ai/kbd.meta.json registry/super-ai/ghost.meta.json && pnpm exec vitest run scripts/lib/contract-emit.test.ts; rm registry/super-ai/ghost.meta.json
```

Expected: the first run fails naming `registry/super-ai/kbd.meta.json` as stale; the second fails naming `registry/super-ai/ghost.meta.json` as an orphan.

- [ ] **Step 10: Full docs test run, format check, commit everything including the 235 derived files**

```bash
cd apps/docs && pnpm test
cd "$(git rev-parse --show-toplevel)" && pnpm format:check
pnpm exec prettier --write apps/docs/scripts/lib/contract-emit.ts apps/docs/scripts/lib/contract-emit.test.ts
git add apps/docs/scripts/lib/contract-emit.ts apps/docs/scripts/lib/contract-emit.test.ts apps/docs/package.json .prettierignore apps/docs/registry/super-ai/*.meta.json apps/docs/index apps/docs/public
git commit -m "feat(contracts): derive meta, routing table and llms corpus from the guidance modules, drift-gated"
```

If `pnpm format:check` lists an emitted path, the ignore pattern is wrong; fix `.prettierignore`, never reformat the file. Also run `pnpm check:contract` from the root: if `check-citations.mts` starts reading `apps/docs/public/llms/**` as authored prose, add that directory to its exclusions with the comment "derived by contract-emit; not authored", since a derived page cannot carry a citation debt of its own.

---

### Task 4: Contract-coverage ratchet

**Files:**

- Create: `apps/docs/scripts/lib/contract-coverage.ts`, `apps/docs/scripts/contract-coverage-baseline.mts`
- Test: `apps/docs/scripts/lib/contract-coverage.test.ts`
- Modify: `apps/docs/package.json` (scripts)
- Creates: `apps/docs/scripts/lib/contract-coverage.baseline.json`

**Interfaces:**

- Consumes: `nextBaseline(prev: string[] | null, live: string[])` from `./story-coverage`; the emitted `registry/super-ai/*.meta.json` (Task 3).
- Produces: `unwrittenContracts(items: { name: string; variants?: unknown; insteadUse?: unknown }[]): string[]` (sorted names), `readMetas(dir: string): ContractMeta[]`. Task 5 reuses `readMetas`.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/docs/scripts/lib/contract-coverage.test.ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { MANIFEST } from "@/lib/catalog.manifest";
import { readMetas, unwrittenContracts } from "./contract-coverage";

const ROOT = resolve(__dirname, "../..");
const BASELINE = join(__dirname, "contract-coverage.baseline.json");

describe("unwrittenContracts", () => {
  it("names an item missing either field, sorted, and skips one with both", () => {
    expect(
      unwrittenContracts([
        { name: "z", variants: [], insteadUse: [] },
        { name: "b", variants: { none: "x" } },
        { name: "a", insteadUse: [] },
      ]),
    ).toEqual(["a", "b"]);
  });
});

describe("readMetas", () => {
  it("reads every emitted meta, one per shipped item", () => {
    const metas = readMetas(join(ROOT, "registry/super-ai"));
    expect(metas.map((m) => m.name).sort()).toEqual(
      MANIFEST.filter((i) => i.status === "shipped")
        .map((i) => i.name)
        .sort(),
    );
  });
});

describe("contract coverage ratchet", () => {
  const live = unwrittenContracts(readMetas(join(ROOT, "registry/super-ai")));
  const baseline: string[] = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : [];

  it("no item is newly unwritten (the baseline may only shrink)", () => {
    const fresh = live.filter((n) => !baseline.includes(n));
    expect(
      fresh,
      "Items whose guidance module lacks `variants` or `insteadUse`. Write both fields (a { none: <why> } is a decision; an absent field is not). The baseline is adoption-time debt and may only shrink.",
    ).toEqual([]);
  });

  it("no baseline entry is stale (a written contract must be locked in)", () => {
    const stale = baseline.filter((n) => !live.includes(n));
    expect(
      stale,
      "These items now carry both fields but are still listed in contract-coverage.baseline.json. Run `pnpm contract-coverage:baseline` in apps/docs to lock the progress in.",
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-coverage.test.ts`
Expected: FAIL, cannot resolve `./contract-coverage`.

- [ ] **Step 3: Write the module and the baseline script**

```ts
// apps/docs/scripts/lib/contract-coverage.ts
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
```

```ts
// apps/docs/scripts/contract-coverage-baseline.mts
// Regenerates scripts/lib/contract-coverage.baseline.json from the emitted
// metas. Shrink-only, by design, on the same rule as story-coverage-baseline:
// growth is a hand edit in a reviewed commit, never something this writes.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { readMetas, unwrittenContracts } from "./lib/contract-coverage";
import { nextBaseline } from "./lib/story-coverage";

const BASELINE = "scripts/lib/contract-coverage.baseline.json";
const live = unwrittenContracts(readMetas("registry/super-ai"));
const prev: string[] | null = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const next = nextBaseline(prev, live);

if (next.grown.length > 0) {
  console.error(
    `contract-coverage:baseline — refusing to grow the baseline by ${next.grown.length} (${next.grown.slice(0, 5).join(", ")}${next.grown.length > 5 ? ", …" : ""}). Write the two fields instead.`,
  );
  process.exit(1);
}

writeFileSync(BASELINE, `${JSON.stringify(next.baseline, null, 2)}\n`);
console.log(`contract-coverage:baseline — ${next.baseline.length} item(s) still unwritten.`);
```

Add to `apps/docs/package.json` scripts, after `"contract:emit"`:

```json
    "contract-coverage:baseline": "tsx scripts/contract-coverage-baseline.mts",
```

- [ ] **Step 4: Write the first baseline and run the tests**

```bash
cd apps/docs && pnpm contract-coverage:baseline && pnpm exec vitest run scripts/lib/contract-coverage.test.ts
```

Expected: "116 item(s) still unwritten" (Task 8 brings it to 113); PASS.

- [ ] **Step 5: Prove the ratchet refuses to grow**

```bash
cd apps/docs && node -e "const f='scripts/lib/contract-coverage.baseline.json';const a=JSON.parse(require('fs').readFileSync(f));a.pop();require('fs').writeFileSync(f,JSON.stringify(a,null,2)+'\n')" && pnpm contract-coverage:baseline; git checkout scripts/lib/contract-coverage.baseline.json
```

Expected: exit 1 with "refusing to grow the baseline by 1".

- [ ] **Step 6: Format and commit**

```bash
pnpm exec prettier --write apps/docs/scripts/lib/contract-coverage.ts apps/docs/scripts/lib/contract-coverage.test.ts apps/docs/scripts/contract-coverage-baseline.mts
git add apps/docs/scripts/lib/contract-coverage.ts apps/docs/scripts/lib/contract-coverage.test.ts apps/docs/scripts/contract-coverage-baseline.mts apps/docs/scripts/lib/contract-coverage.baseline.json apps/docs/package.json
git commit -m "feat(contracts): shrink-only baseline of items whose contract is unwritten"
```

---

### Task 5: The `variant` story obligation

**Files:**

- Modify: `apps/docs/scripts/lib/story-coverage.ts`, `apps/docs/scripts/lib/story-coverage.test.ts`, `apps/docs/scripts/story-coverage-baseline.mts`, `apps/docs/scripts/story-coverage-report.mts` (if it prints per-kind counts)

**Interfaces:**

- Consumes: `readMetas` (Task 4), `isNone`, `axisKey` (Task 2).
- Produces: `ObligationKind` gains `"variant"`; `CoverageItem` gains `variants?: CoverageVariant[]` with `CoverageVariant = { propName: string; values: string[] }`; `StoryFacts` gains `source: string`; new `variantNeedles(propName: string, value: string): string[]` and `coverageItemsFromMetas(shipped: { name: string; states: string[] }[], metas: ContractMeta[]): CoverageItem[]`.

- [ ] **Step 1: Write the failing tests**

Add to `story-coverage.test.ts`:

```ts
// add `coverageItemsFromMetas` and `variantNeedles` to the existing import from "./story-coverage"

describe("variant obligations", () => {
  it("derives one obligation per declared value, keyed propName=value", () => {
    const obligations = deriveObligations([
      {
        name: "mode-tabs",
        states: [],
        variants: [{ propName: "variant", values: ["default", "with-icon"] }],
      },
    ]);
    expect(obligations.filter((o) => o.kind === "variant").map((o) => o.key)).toEqual([
      "mode-tabs:variant:variant=default",
      "mode-tabs:variant:variant=with-icon",
    ]);
  });

  it("is met by a JSX attribute or an args entry, and by nothing looser", () => {
    const obligations = deriveObligations([
      {
        name: "mode-tabs",
        states: [],
        variants: [{ propName: "variant", values: ["default", "with-icon", "with-tooltip"] }],
      },
    ]);
    const facts = readStoryFacts(
      `export const A: Story = { args: { variant: "with-icon" } };\nexport const B: Story = { render: () => <ModeTabs variant="with-tooltip" /> };\n// the default variant, mentioned in prose only\n`,
    );
    const unmet = unmetObligations(obligations, facts).map((o) => o.key);
    expect(unmet).toEqual(["mode-tabs:variant:variant=default"]);
  });

  it("spells both needles", () => {
    expect(variantNeedles("variant", "with-icon")).toEqual(['variant="with-icon"', 'variant: "with-icon"']);
  });

  it("builds coverage items from metas, ignoring a none and an unwritten field", () => {
    const items = coverageItemsFromMetas(
      [
        { name: "kbd", states: ["single"] },
        { name: "mode-tabs", states: ["text-only"] },
        { name: "chat-shell", states: [] },
      ],
      [
        { name: "kbd", variants: { none: "no axis at all, on purpose" } },
        {
          name: "mode-tabs",
          variants: [
            { prop: "ToolHeader · state", propName: "variant", values: [{ value: "default", intent: "x" }] },
          ],
        },
      ],
    );
    expect(items).toEqual([
      { name: "kbd", states: ["single"], variants: [] },
      { name: "mode-tabs", states: ["text-only"], variants: [{ propName: "variant", values: ["default"] }] },
      { name: "chat-shell", states: [], variants: [] },
    ]);
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/story-coverage.test.ts`
Expected: FAIL, `variantNeedles` is not exported.

- [ ] **Step 3: Extend the module**

In `story-coverage.ts`:

```ts
export type ObligationKind = "case" | "described" | "variant";

export interface CoverageVariant {
  propName: string;
  values: string[];
}

export interface CoverageItem {
  name: string;
  states: string[];
  /** Declared variant values, from the emitted meta. Absent or empty when the
   *  contract is unwritten or records { none }. */
  variants?: CoverageVariant[];
}
```

In `deriveObligations`, after the `states` loop:

```ts
for (const axis of item.variants ?? []) {
  for (const value of axis.values) {
    out.push({
      key: `${item.name}:variant:${axis.propName}=${value}`,
      item: item.name,
      kind: "variant",
      target: `${axis.propName}=${value}`,
      why: `a story must render ${axis.propName}="${value}" (JSX) or pass ${axis.propName}: "${value}" (args) — a declared variant nobody renders is a contract nobody checked (spec 2026-09-14 §7.3)`,
    });
  }
}
```

`StoryFacts` gains `source: string` and `readStoryFacts` returns `{ exports, skips, described, source }`.

```ts
/** The two spellings a story can use; a quoted attribute or an args entry,
 *  never a word in a sentence. Derived from a bare identifier on purpose:
 *  the rebuild ran 57 obligations into an unsatisfiable needle by deriving
 *  it from display prose. */
export function variantNeedles(propName: string, value: string): string[] {
  return [`${propName}="${value}"`, `${propName}: "${value}"`];
}
```

In `unmetObligations`:

```ts
return obligations.filter((o) => {
  if (o.kind === "case") return !(facts.exports.has(o.target) || facts.skips.has(o.target));
  if (o.kind === "described") return !facts.described.has(o.target);
  const eq = o.target.indexOf("=");
  const propName = o.target.slice(0, eq);
  const value = o.target.slice(eq + 1);
  return !variantNeedles(propName, value).some((n) => facts.source.includes(n));
});
```

And the bridge from metas:

```ts
import { axisKey, isNone } from "./contract-schema";
import type { ContractMeta } from "./contract-emit";

/** One code path for the ratchet test and the baseline script: variants come
 *  from the emitted metas, which the drift gate keeps current. */
export function coverageItemsFromMetas(
  shipped: { name: string; states: string[] }[],
  metas: Pick<ContractMeta, "name" | "variants">[],
): CoverageItem[] {
  const byName = new Map(metas.map((m) => [m.name, m]));
  return shipped.map((i) => {
    const v = byName.get(i.name)?.variants;
    const variants =
      v === undefined || isNone(v)
        ? []
        : v.map((axis) => ({ propName: axisKey(axis), values: axis.values.map((x) => x.value) }));
    return { name: i.name, states: i.states, variants };
  });
}
```

Blocks arrive with `states: []` today (see the existing "gives a block ... nothing else" test); keep passing `item.states ?? []` wherever the callers build items.

- [ ] **Step 4: Point the ratchet test and the baseline script at the metas**

In `story-coverage.test.ts`'s `describe("story coverage ratchet")` replace `const obligations = deriveObligations(shipped);` with:

```ts
const metas = readMetas(join(__dirname, "../../registry/super-ai"));
const obligations = deriveObligations(coverageItemsFromMetas(shipped, metas));
```

(import `readMetas` from `./contract-coverage` and `join` from `node:path`). Keep the existing two-kinds liveness assertion; the third kind's liveness assertion is added in Task 8 once a control declares variants.

In `story-coverage-baseline.mts` replace `deriveObligations(shipped)` with `deriveObligations(coverageItemsFromMetas(shipped, readMetas("registry/super-ai")))` and extend the summary line:

```ts
const cases = next.baseline.filter((k) => k.includes(":case:")).length;
const variants = next.baseline.filter((k) => k.includes(":variant:")).length;
console.log(
  `story-coverage:baseline — wrote ${next.baseline.length} unmet obligation(s): ${cases} case, ${next.baseline.length - cases - variants} described, ${variants} variant.`,
);
```

If `story-coverage-report.mts` prints per-kind counts, add the `variant` count the same way.

- [ ] **Step 5: Run the coverage tests and the baseline script; the baseline must not change**

```bash
cd apps/docs && pnpm exec vitest run scripts/lib/story-coverage.test.ts && pnpm story-coverage:baseline && git diff --stat scripts/lib/story-coverage.baseline.json
```

Expected: PASS; the script reports 0 variant; the diff is empty (no meta declares variants yet, so nothing new is unmet).

- [ ] **Step 6: Typecheck, format, commit**

```bash
pnpm typecheck
pnpm exec prettier --write apps/docs/scripts/lib/story-coverage.ts apps/docs/scripts/lib/story-coverage.test.ts apps/docs/scripts/story-coverage-baseline.mts apps/docs/scripts/story-coverage-report.mts
git add apps/docs/scripts/lib/story-coverage.ts apps/docs/scripts/lib/story-coverage.test.ts apps/docs/scripts/story-coverage-baseline.mts apps/docs/scripts/story-coverage-report.mts
git commit -m "feat(story-coverage): a declared variant value is an obligation a story must render"
```

---

### Task 6: Ship the meta beside the component

**Files:**

- Modify: `apps/docs/scripts/gen-registry.mts` (the `file` helper area, lines 20 to 25, and `superAiItems`, lines 247 to 257)
- Modify: `apps/docs/scripts/consumer-test.sh` (after the `shadcn add` at line 76)

**Interfaces:**

- Consumes: the emitted `registry/super-ai/<name>.meta.json` (Task 3).
- Produces: every super-ai item's `files` has a second entry `{ path, type: "registry:file", target: "components/super-ai/<name>.meta.json" }` and a `docs` string.

- [ ] **Step 1: Add the meta file entry and the install note**

After the `file` helper in `gen-registry.mts`:

```ts
// The usage contract ships beside the code (spec 2026-09-14, D24). A
// registry:file needs an explicit target; it lands wherever the component
// lands, because both targets share the same base.
const metaFile = (name: string) => ({
  path: `registry/super-ai/${name}.meta.json`,
  type: "registry:file",
  target: `components/super-ai/${name}.meta.json`,
});
const contractNote = (name: string) =>
  `Read ${name}.meta.json beside this file before placing the component: it records when to use it, which variant and why, and what to reach for instead.`;
```

In `superAiItems`:

```ts
  files: [file(i.name), metaFile(i.name), ...(filesByName.get(i.name) ?? [])],
  docs: contractNote(i.name),
```

`registrySchema.parse` at the bottom validates the shape; a rejected `docs` or `type` fails here with a path.

- [ ] **Step 2: Build the registry and inspect one item**

```bash
pnpm build:registry && node -e "const i=require('./apps/docs/public/r/mode-tabs.json');console.log(i.files.map(f=>f.type+' '+f.target));console.log(i.docs)"
```

Expected: two lines, `registry:component components/super-ai/mode-tabs.tsx` and `registry:file components/super-ai/mode-tabs.meta.json`, then the note. Then `pnpm check:contract` from the root: green, proving the orphan scan ignores `.meta.json` (spec §6).

- [ ] **Step 3: Assert the contract lands, in the consumer test**

Insert after the `pnpm dlx shadcn@latest add ...` line in `consumer-test.sh`:

```bash
echo "==> Verifying the usage contract installed beside its component"
META="components/super-ai/mode-tabs.meta.json"
if [ ! -f "components/super-ai/mode-tabs.tsx" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — components/super-ai/mode-tabs.tsx did not install" >&2
  exit 1
fi
if [ ! -f "$META" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — $META did not install (registry:file entry missing or mis-targeted)" >&2
  exit 1
fi
node -e "
const m = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
if (m.name !== 'mode-tabs') { console.error('CONSUMER INSTALL TEST: FAIL — ' + process.argv[1] + ' names ' + m.name); process.exit(1); }
if (!Array.isArray(m.variants) || m.variants.length === 0) { console.error('CONSUMER INSTALL TEST: FAIL — ' + process.argv[1] + ' carries no variants; the control contract did not travel'); process.exit(1); }
" "$META"
echo "  found $META with $(node -e "console.log(JSON.parse(require('fs').readFileSync('$META','utf8')).variants.length)") variant axis"
```

The `variants` assertion goes green only after Task 8 writes the `mode-tabs` contract; run the consumer test in Task 12, not here.

- [ ] **Step 4: Commit**

```bash
pnpm exec prettier --write apps/docs/scripts/gen-registry.mts
git add apps/docs/scripts/gen-registry.mts apps/docs/scripts/consumer-test.sh
git commit -m "feat(registry): every item ships its usage contract as a registry:file beside the component"
```

---

### Task 7: The scaffolder seeds the fields red

**Files:**

- Modify: `apps/docs/scripts/lib/scaffold-templates.ts` (the `docs` template, after `pitfalls: [],`)
- Modify: `apps/docs/scripts/new-component.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `new-component.test.ts` beside "seeds both arms of the accessibility block":

```ts
// Seeded with a reason under MIN_REASON on purpose: a scaffold must fail the
// contract schema gate until the judgment is written, the way it already
// ships failing tests. "unwritten" is nine characters.
it("seeds the two contract fields red by construction", () => {
  const docs = files["content/components/workspace-switcher.docs.tsx"];
  expect(docs).toContain('variants: { none: "unwritten" }');
  expect(docs).toContain('insteadUse: { none: "unwritten" }');
  expect("unwritten".length).toBeLessThan(MIN_REASON);
});
```

Import `MIN_REASON` from `./lib/contract-schema`.

- [ ] **Step 2: Run and watch it fail**

Run: `cd apps/docs && pnpm exec vitest run scripts/new-component.test.ts`
Expected: FAIL, the template has no `variants:` line.

- [ ] **Step 3: Seed the template**

In the `docs` template string in `scaffold-templates.ts`, after `  pitfalls: [],`:

```ts
  // Both fields are the contract's machine half (spec 2026-09-14 §4). Replace
  // the seed with a list, or keep { none } and write the reason: the schema
  // gate rejects anything under 20 characters.
  variants: { none: "unwritten" },
  insteadUse: { none: "unwritten" },
```

- [ ] **Step 4: Run, then commit**

Run: `cd apps/docs && pnpm exec vitest run scripts/new-component.test.ts`
Expected: PASS.

```bash
pnpm exec prettier --write apps/docs/scripts/lib/scaffold-templates.ts apps/docs/scripts/new-component.test.ts
git add apps/docs/scripts/lib/scaffold-templates.ts apps/docs/scripts/new-component.test.ts
git commit -m "feat(scaffold): a new component's contract fields are seeded red"
```

---

### Task 8: The three control contracts

**Files:**

- Modify: `apps/docs/content/components/kbd.docs.tsx`, `apps/docs/content/components/mode-tabs.docs.tsx`, `apps/docs/content/components/chat-shell.docs.tsx` (append the two fields before the closing `};`)
- Modify: `apps/storybook/src/stories/super-ai/ModeTabs.stories.tsx` (the `TextOnly` story's args)
- Modify: `apps/docs/scripts/lib/story-coverage.test.ts` (third-kind liveness assertion)
- Regenerates: the derived files, `contract-coverage.baseline.json`

- [ ] **Step 1: Write `kbd`'s contract (no axis, so it exercises D25)**

Append inside `KbdDocs`, after `pitfalls: [...]`:

```ts
  variants: {
    none: "Kbd and KbdGroup take plain DOM props and expose no axis: a keycap is one size and one style on purpose, so every shortcut in a product reads as the same product.",
  },
  insteadUse: [
    {
      component: "shortcuts-sheet",
      when: "You are listing more than a handful of shortcuts. The sheet owns the sectioning and the dialog and composes Kbd for the keys.",
    },
  ],
```

- [ ] **Step 2: Write `mode-tabs`'s contract**

Append inside `ModeTabsDocs`:

```ts
  variants: [
    {
      prop: "variant",
      default: "default",
      values: [
        {
          value: "default",
          intent:
            "Text-only triggers, the choice whenever the row has room: a word is the most legible label a mode can have, and nothing has to be learned.",
        },
        {
          value: "with-icon",
          intent:
            "Icon plus visible label, once the modes have glyphs people already recognise. The icon speeds the scan; the label still carries the meaning.",
        },
        {
          value: "with-tooltip",
          intent:
            "Icon-only triggers for tight spaces such as an embedded composer toolbar. The label ships as sr-only button content, so the tooltip is a sighted hint, never the only name.",
        },
      ],
    },
  ],
  insteadUse: [
    {
      component: "model-picker",
      when: "The choice is which model answers, not how the same input is interpreted. Modes are interpretations of one input; a model list is a different object with its own affordances.",
    },
  ],
```

Read `content/components/model-picker.docs.tsx`'s `whatItIs` first; if it contradicts the `when` above, reword the `when` to match what the picker actually is. The intent text must describe a decision, not an appearance (spec §9's expected rejection).

- [ ] **Step 3: Write `chat-shell`'s contract (a block: no axis, two redirects)**

Read `content/components/home-shell.docs.tsx` and `content/components/studio-shell.docs.tsx` `whatItIs` lines, then append inside `ChatShellDocs`:

```ts
  variants: {
    none: "A shell owns arrangement and nothing else, so it has no axis of its own: every region is filled by a component that carries its own variants. Vary the parts, never the shell.",
  },
  insteadUse: [
    {
      component: "home-shell",
      when: "The primary object is the workspace of projects and recent work rather than one running conversation. Home is where a thread is started; this shell is where one runs.",
    },
    {
      component: "studio-shell",
      when: "The output is an artifact edited on its own canvas with the conversation beside it. When the artifact is the page, the studio shell owns the layout.",
    },
  ],
```

Adjust either `when` if the target's `whatItIs` says otherwise; never describe a block by what you assume it is.

- [ ] **Step 4: Make the `default` value's story needle explicit**

In `ModeTabs.stories.tsx`, the `TextOnly` story (line 53) demonstrates the default variant without naming it. Add `variant: "default",` to its `args` (or, if it uses `render`, add `variant="default"` on the `<ModeTabs>` it renders). The `with-icon` (`variant: "with-icon"`, line 22) and `with-tooltip` (line 38) needles already exist.

- [ ] **Step 5: Add the third-kind liveness assertion**

In `story-coverage.test.ts`'s ratchet describe, extend the existing liveness test:

```ts
expect(obligations.filter((o) => o.kind === "variant").length).toBeGreaterThan(0);
```

- [ ] **Step 6: Emit, regenerate the contract baseline, run every coverage gate**

```bash
cd apps/docs && pnpm contract:emit && pnpm contract-coverage:baseline && pnpm exec vitest run scripts/lib/contract-emit.test.ts scripts/lib/contract-coverage.test.ts scripts/lib/story-coverage.test.ts && pnpm story-coverage:baseline && git diff --stat scripts/lib/story-coverage.baseline.json
```

Expected: emit passes (three contracts validate); "113 item(s) still unwritten"; all three test files PASS; the story baseline script reports 0 variant unmet and the diff is empty. If it reports a variant unmet, the story needle in Step 4 is wrong; fix the story, never the baseline.

- [ ] **Step 7: Prove the gates bite on a control, by hand**

Two probes, each restored with `git checkout` before the next:

1. In `content/components/mode-tabs.docs.tsx`, change the `with-tooltip` intent to `"x"`. Run `cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts`. Expected: FAIL naming `mode-tabs: variants[0] value "with-tooltip" needs an intent of at least 20 characters`. Restore: `git checkout content/components/mode-tabs.docs.tsx`.
2. In `content/components/kbd.docs.tsx`, delete the whole `variants:` block. Run `pnpm contract:emit && pnpm exec vitest run scripts/lib/contract-coverage.test.ts`. Expected: FAIL, "Items whose guidance module lacks" naming `kbd`. Restore: `git checkout content/components/kbd.docs.tsx && pnpm contract:emit`.

- [ ] **Step 8: Inspect one page and the routing table, then commit**

```bash
cd apps/docs && sed -n 1,30p public/llms/components/mode-tabs.md && grep -n "^  kbd,\|^  mode-tabs,\|^  chat-shell," index/components.toon
```

Expected: the page shows the three intents and the redirect; the three toon rows read `none`/`shortcuts-sheet`, `variant=default/with-icon/with-tooltip`/`model-picker`, and `none`/`home-shell|studio-shell`.

```bash
pnpm exec prettier --write apps/docs/content/components/kbd.docs.tsx apps/docs/content/components/mode-tabs.docs.tsx apps/docs/content/components/chat-shell.docs.tsx apps/storybook/src/stories/super-ai/ModeTabs.stories.tsx apps/docs/scripts/lib/story-coverage.test.ts
git add apps/docs/content/components apps/storybook/src/stories/super-ai/ModeTabs.stories.tsx apps/docs/scripts/lib apps/docs/registry/super-ai apps/docs/index apps/docs/public
git commit -m "feat(contracts): kbd, mode-tabs and chat-shell carry the first three usage contracts"
```

---

### Task 9: Two gates on `CLAUDE.md`

**Files:**

- Create: `apps/docs/scripts/lib/claude-md.test.ts`, `docs/design-system/UNGATED.md`
- Modify: repo `CLAUDE.md` (the "Rules that are easy to break by accident" section)

- [ ] **Step 1: Write the failing test**

```ts
// apps/docs/scripts/lib/claude-md.test.ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(__dirname, "../../../..");
const CLAUDE_MD = join(REPO, "CLAUDE.md");
const UNGATED = join(REPO, "docs/design-system/UNGATED.md");

/** May only be lowered. Raising it is a diff a reviewer sees (spec §8.1). */
const CEILING = 14_500;
/** The file must sit within this many bytes of the ceiling, so the ceiling
 *  ratchets down as the file shrinks instead of sitting idle. */
const HEADROOM = 2_000;

const SECTION = "## Rules that are easy to break by accident";
// A gate is a path under one of the roots that hold tests, scripts or CI.
const GATE_PATH = /`((?:packages|apps|scripts|tools|\.github)\/[^`\s]+)`/g;

function rulesSection(text: string): string {
  const start = text.indexOf(SECTION);
  expect(start, `CLAUDE.md has no "${SECTION}" heading`).toBeGreaterThan(-1);
  const rest = text.slice(start + SECTION.length);
  const end = rest.indexOf("\n## ");
  return end === -1 ? rest : rest.slice(0, end);
}

/** Bullets in the section, each joined across its continuation lines. */
function bullets(section: string): string[] {
  const out: string[] = [];
  for (const line of section.split("\n")) {
    if (line.startsWith("- ")) out.push(line.slice(2));
    else if (line.startsWith("  ") && out.length) out[out.length - 1] += ` ${line.trim()}`;
  }
  return out;
}

describe("CLAUDE.md size", () => {
  const bytes = Buffer.byteLength(readFileSync(CLAUDE_MD));

  it(`is under the ceiling (${CEILING} bytes; the constant may only go down)`, () => {
    expect(bytes).toBeLessThanOrEqual(CEILING);
  });

  it(`is within ${HEADROOM} bytes of the ceiling (lower CEILING when the file shrinks)`, () => {
    expect(bytes).toBeGreaterThan(CEILING - HEADROOM);
  });
});

describe("CLAUDE.md stub provenance", () => {
  const section = rulesSection(readFileSync(CLAUDE_MD, "utf8"));
  const ungated = existsSync(UNGATED) ? readFileSync(UNGATED, "utf8") : "";
  const items = bullets(section);

  it("has rule bullets to check (zero means the section moved, not that it is clean)", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it.each(items.map((b) => [b.slice(0, 60), b] as const))(
    "%s names an existing gate or an UNGATED reason",
    (_, bullet) => {
      const paths = [...bullet.matchAll(GATE_PATH)].map((m) => m[1]).filter((p) => existsSync(join(REPO, p)));
      const bold = /^\*\*([^*]+)\*\*/.exec(bullet)?.[1];
      const excused = bold !== undefined && ungated.includes(bold);
      expect(
        paths.length > 0 || excused,
        `Rule has no gate path that exists and no entry in docs/design-system/UNGATED.md: ${bullet.slice(0, 120)}`,
      ).toBe(true);
    },
  );
});
```

- [ ] **Step 2: Run and watch it fail on the current bullets**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/claude-md.test.ts`
Expected: FAIL on several bullets (those pointing only at a doc).

- [ ] **Step 3: Rewrite the bullets so each names its gate, and write UNGATED.md**

In `CLAUDE.md`, section "Rules that are easy to break by accident", make these edits (keep every bullet's prose; only add the gate pointer or nothing):

| bullet (leading bold phrase)                                                      | add                                                                                                            |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/docs/lib/catalog.manifest.ts` is the one shared file.                       | `Gate: \`apps/docs/lib/catalog.manifest.test.ts\`.`                                                            |
| `consumes` / `shadcn` / `npm` are reconciled from real imports                    | `Gate: \`apps/docs/scripts/reconcile-deps.mts\`.`                                                              |
| A gate list must mirror `ci.yml`, in `ci.yml`'s order.                            | nothing; excused in UNGATED.md                                                                                 |
| A green run can prove nothing.                                                    | nothing; excused in UNGATED.md                                                                                 |
| The a11y exclusion list may only shrink, never grow.                              | `Gates: \`apps/docs/scripts/lib/a11y-ratchet.test.ts\`, \`apps/docs/scripts/lib/story-coverage.test.ts\`.`     |
| Never pair `text-muted-foreground` with `bg-muted` / `bg-accent` / `bg-secondary` | `Gate: \`packages/ds-rules/rulecheck.mjs\`.`                                                                   |
| Blocks compose; they do not implement.                                            | nothing; excused in UNGATED.md                                                                                 |
| Don't name a state `default`                                                      | `Gate: \`apps/docs/scripts/new-component.test.ts\`.`                                                           |
| Family G and O5 are cut (D9).                                                     | grep `apps/docs/lib/*.test.ts` for `"cut"`; if a test asserts cut status, name it, otherwise excuse in UNGATED |

Add one bullet at the end of the section:

```markdown
- **Contracts derive; never hand-edit a `.meta.json`, `index/components.toon` or `public/llms*`.** The guidance module is the source; `pnpm contract:emit` writes the rest and the drift gate fails on any byte of difference. → `docs/superpowers/specs/2026-09-14-agentic-contracts-design.md`. Gate: `apps/docs/scripts/lib/contract-emit.test.ts`.
```

Create `docs/design-system/UNGATED.md`:

```markdown
# Rules with no gate, and why

Every bullet under "Rules that are easy to break by accident" in `CLAUDE.md`
names a gate that exists, or appears here with the reason nothing enforces it.
`apps/docs/scripts/lib/claude-md.test.ts` checks both directions. An entry
here is a debt, not a permission: when a gate becomes possible, write it and
delete the row.

| leading phrase (verbatim from CLAUDE.md)               | why nothing enforces it                                                                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A gate list must mirror `ci.yml`, in `ci.yml`'s order. | The `gate-run` skill is the discharge. A test that parsed skill prose against `ci.yml` would be a fourth copy of the list it protects.        |
| A green run can prove nothing.                         | Procedural: it says to rebuild before `playwright test`. The Playwright config runs `pnpm start`; nothing can tell a stale build from source. |
| Blocks compose; they do not implement.                 | A judgment. `block-build-brief.md` and review discharge it; a reimplemented row passes every mechanical gate, which is the rule's own point.  |
```

Add the "Family G and O5" row only if no test asserts it. The leading phrases must match `CLAUDE.md`'s bold text byte for byte.

- [ ] **Step 4: Run the gate, check the byte count, commit**

```bash
cd apps/docs && pnpm exec vitest run scripts/lib/claude-md.test.ts && wc -c ../../CLAUDE.md
```

Expected: PASS; the count is between 12,500 and 14,500. If over, trim the new bullet's prose, never raise `CEILING`.

```bash
pnpm exec prettier --write CLAUDE.md docs/design-system/UNGATED.md apps/docs/scripts/lib/claude-md.test.ts
git add CLAUDE.md docs/design-system/UNGATED.md apps/docs/scripts/lib/claude-md.test.ts
git commit -m "test(claude-md): a size ceiling that only lowers, and every rule names its gate or its excuse"
```

---

### Task 10: Refresh the vendored ladder

**Files:**

- Modify: `tools/ds-architecture/**` (copied from `/Users/nickv/ClaudeCode Projects/ds-architecture`, commit `396bab6`, 2026-08-22), `tools/ds-architecture/VENDOR.md`, `tools/ds-architecture/package.json`
- Possibly modify: repo `ds-architecture.config.json` if the upstream schema changed

- [ ] **Step 1: Copy runtime files only**

```bash
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude package-lock.json \
  --exclude DESIGN.md --exclude MANUAL.md --exclude README.md --exclude .gitignore \
  "/Users/nickv/ClaudeCode Projects/ds-architecture/" tools/ds-architecture/
git status --short tools/ds-architecture | head -40
```

`VENDOR.md` is overwritten by upstream's copy; Step 3 rewrites it. `DESIGN.md` and `MANUAL.md` stay out on purpose (one copy of the rule book, per the existing `VENDOR.md`).

- [ ] **Step 2: Re-apply the one local change and run the vendored suite**

Add `"@types/node": "^22.0.0",` back into `tools/ds-architecture/package.json` `devDependencies` (upstream lacks it and its typecheck fails without it). Then:

```bash
cd tools/ds-architecture && npm install && npm test && npm run typecheck
```

Expected: PASS. The vendored suite must stay dependency-free per `scripts/lib/no-deps.test.ts`; do not add `tools/*` to `pnpm-workspace.yaml`.

- [ ] **Step 3: Rewrite VENDOR.md's stamp, keeping the local notes**

Replace the first two bullets of `tools/ds-architecture/VENDOR.md` with:

```markdown
- **Source:** the local `ds-architecture` repo (no remote), commit `396bab6`
  (2026-08-22, "feat: ladder integration across three stages"). Stages built
  upstream at that commit: 00, 01, 09.
- **Vendored here:** 2026-08-22 at stage 00; refreshed to the commit above
  on <write today's date>, runtime only (scripts/, src/, stages/, LADDER.md).
  MANUAL.md and DESIGN.md stay upstream.
```

Keep the "Local changes", "Inherited open questions", "Not wired into CI", "Staying outside the workspace" and "Known config compromise" bullets as they are.

- [ ] **Step 4: Run the ladder from the root**

```bash
pnpm check:ladder
```

Expected: `highestContiguous=01` with `01.4c` unchecked. Two other outcomes are possible and each has a next step:

- The config is rejected (the upstream `config.schema.json` changed): read `git diff tools/ds-architecture/src/config/config.schema.json`, adjust `ds-architecture.config.json` to the new shape, and note the change under "Known config compromise" in `VENDOR.md`.
- Stage 01 claims are unmet (this registry keeps stock shadcn tokens in `app/globals.css` and its name contract in `packages/ds-rules/src/local.ts`): do not fix them here. Record each unmet claim id in `VENDOR.md` under a new bullet "Stage 01 at refresh" and add one line to `CONTINUE.md` §8 naming them as a gap. Then amend the spec's acceptance item 6 to the number actually reached, with the claim ids, in the same commit. Honest number over the expected one.

- [ ] **Step 5: Commit**

```bash
git add tools/ds-architecture ds-architecture.config.json docs/CONTINUE.md docs/superpowers/specs/2026-09-14-agentic-contracts-design.md
git commit -m "chore(ladder): refresh the vendored ds-architecture to 396bab6, stages 00, 01 and 09"
```

---

### Task 11: The docs point at the mechanism

**Files:**

- Modify: `docs/design-system/story-conventions.md` (Scope today, the "Gated as a ratchet" bullet)
- Modify: `docs/design-system/decisions.md` (append D23, D24, D25)
- Modify: `docs/CONTINUE.md` (§3.3 "Emits five files", §3.4 "its own five files", §8 new subsection)
- Modify: `.claude/skills/build-component/SKILL.md` (§3 and §4)

- [ ] **Step 1: story-conventions.md**

In the "Gated as a ratchet since 2026-09-04" bullet, change "derives two obligations per item from the manifest" to "derives three obligations per item: from the manifest, each of the eight names present or `case-skip`-annotated and a JSDoc description above every declared-state export; from the emitted contract (`registry/super-ai/<name>.meta.json`), every declared variant value rendered as `prop="value"` or passed as `prop: "value"` in some story". Keep the rest of the bullet.

- [ ] **Step 2: decisions.md**

Append after D22, in the file's existing format (`### D23 · <title> — 2026-09-14`), the three decisions from the spec §3, each in two or three sentences with the rejected alternative named. Copy the titles verbatim from the spec:

- D23 · The guidance module is the contract; every other surface derives from it
- D24 · The contract ships beside the code, and the installed copy outranks the web
- D25 · Silence is not a decision

- [ ] **Step 3: CONTINUE.md**

- §3.3: after "Emits five files with **deliberately failing tests**.", add: "The sixth file, `registry/super-ai/<name>.meta.json`, is not scaffolded: `pnpm contract:emit` derives it from the docs module once the two contract fields are written, and the scaffold seeds those fields red (`{ none: "unwritten" }`)."
- §3.4: after "each writes only its own five files (plus an optional `.examples.tsx`)", add: "and, after writing the docs module, runs `pnpm contract:emit` and commits its own `.meta.json` and its own lines of `index/components.toon` and `public/llms*`. The integrator re-runs emit once after the merge."
- §8: add a subsection "Contract waves (spec `2026-09-14-agentic-contracts-design.md` §9)" with: the three controls landed; `contract-coverage.baseline.json` at 113; the wave rule (about twelve items per wave, Sonnet agents in worktrees, Opus review, a wave that would grow either baseline does not merge); and a line per wave to be appended as each lands.

- [ ] **Step 4: build-component SKILL.md**

- §3 "Give each agent only": add "its contract targets: which shipped items it is most often confused with (for `insteadUse`) and whether it has a variant axis (for `variants`); the agent writes the judgments, you name the neighbours".
- §4 Integrate: add "Run `pnpm contract:emit` in `apps/docs` once after merging the wave and commit any residue; then `pnpm contract-coverage:baseline`, which must shrink."

- [ ] **Step 5: Format (three passes for story-conventions.md, per CLAUDE.md), check, commit**

```bash
pnpm exec prettier --write docs/design-system/story-conventions.md docs/design-system/story-conventions.md docs/design-system/story-conventions.md docs/design-system/decisions.md docs/CONTINUE.md .claude/skills/build-component/SKILL.md
pnpm format:check
git add docs/design-system/story-conventions.md docs/design-system/decisions.md docs/CONTINUE.md .claude/skills/build-component/SKILL.md
git commit -m "docs: the contract mechanism, its three decisions, and the wave protocol"
```

---

### Task 12: The full gate run

No new files. Run every gate in `ci.yml` order from the repo root, then the two that need a browser or a fresh app. A green build is not a working page; the last two are the ones that exercise the product.

- [ ] **Step 1: The twelve steps, in order**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check:tokens
pnpm check:contract
pnpm test
pnpm build:registry
pnpm build
```

Expected: every command exits 0. Stop at the first red; a red here hides every gate behind it.

- [ ] **Step 2: Playwright smoke (rebuild first; `next start` serves the prebuilt output)**

```bash
cd apps/docs && pnpm exec playwright test
```

- [ ] **Step 3: The Storybook gate in the CI image**

```bash
./scripts/linux-gate.sh
```

- [ ] **Step 4: The consumer install test**

```bash
apps/docs/scripts/consumer-test.sh
```

Expected: the line `found components/super-ai/mode-tabs.meta.json with 1 variant axis`.

- [ ] **Step 5: The published surfaces, by eye**

```bash
cd apps/docs && (pnpm start & echo $! > /tmp/sai-start.pid)
sleep 5 && curl -s http://localhost:3000/llms.txt | head -20 && curl -s http://localhost:3000/llms/components/mode-tabs.md | head -30 && curl -s http://localhost:3000/r/mode-tabs.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).files.map(f=>f.target)))"
kill "$(cat /tmp/sai-start.pid)"
```

Expected: the corpus lists 116 components; the page shows three intents and one redirect; the registry item lists two targets.

- [ ] **Step 6: Record the numbers in the spec's acceptance section and open the PR**

Update spec §12 with the measured counts (metas emitted, baseline size, `CLAUDE.md` bytes, ladder result), commit, and open a PR against `main` from `claude/agentic-contracts` with a TL;DR, the acceptance table, and the wave protocol pointer. Do not push to `main`; deploys stay manual (`CONTINUE.md` §7) and are not part of this plan.

---

## After the plan: the waves, and the end state

Not tasks in this plan; recorded so the next session does not redesign them.

**Waves.** 113 items remain, in `contract-coverage.baseline.json`. Each wave takes about twelve: one Sonnet agent per item in its own worktree, given only the item name, its neighbours for `insteadUse`, and a pointer to the spec §4 and `build-component` §3. The agent appends the two fields to its docs module, adds a story needle for any variant value no story renders, runs `pnpm contract:emit` and `pnpm test` in `apps/docs`, and commits its module, its story, its meta and its lines of the shared files. Opus reviews for judgment: an intent that describes appearance ("solid fill, rounded") is the expected rejection. The integrator merges, re-runs emit, runs `pnpm contract-coverage:baseline` (must shrink by the wave's count) and `pnpm story-coverage:baseline` (must not grow), appends a wave line to `CONTINUE.md` §8, and opens one PR per wave.

**End state (one task, when the baseline is empty).** Make `variants` and `insteadUse` required in `ComponentDocs`; delete `contract-coverage.baseline.json`, `contract-coverage.ts`, its test and the baseline script; change the scaffold test to assert the seed still fails the schema (it does, the type is satisfied by `{ none }`); remove the `"Optional only until"` comment; update CONTINUE.md §8 and the spec's status line to "implemented".
