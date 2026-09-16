# Patterns Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the behaviour index as the docs site's front door: a typed pattern module per behaviour, a derived index and corpus, the shipped `docs-shell` block as the site chrome, three routes, the gates, and a launch set of 14 shipped and 2 unfilled patterns.

**Architecture:** `PatternDocs` modules under `apps/docs/content/patterns/` are the only hand-written source (spec D26 to D29). `gen-wiring.mts` wires them and their compositions into `lib/patterns.generated.ts`; the existing `contract-emit.test.ts` derives `index/patterns.toon`, `public/llms/patterns/<slug>.md` and a Patterns section in `public/llms*.txt`, and is the drift gate. Pure functions in `lib/patterns.ts` derive stage counts and related patterns for the site and the corpus from one code path. The site composes the registry's own `DocsShell` (O11) rather than writing chrome; `/components/[name]` is untouched.

**Tech Stack:** pnpm + turbo monorepo, Next.js 16 app router, vitest 4 (jsdom, `@` alias to `apps/docs`), `tsx` for `.mts` scripts, Playwright smoke against `next start`, Storybook 9 under `apps/storybook` with `@/components/demos/*` and `@/content/*` aliased into `apps/docs`.

**Spec:** `docs/superpowers/specs/2026-09-15-patterns-layer-design.md`. Task 1 amends four lines of it that the code reads contradicted; every later task argues from the amended spec.

## Global Constraints

- `pnpm`, never npm. No new dependencies: CI installs with `--frozen-lockfile`.
- Run gates from the repo root unless a step says `apps/docs`. Fresh worktree: `pnpm install --offline --frozen-lockfile` from the root first.
- Branch: `claude/project-landing-page-00809c` (already holds the spec commit `78d06eb`). Never commit to `main`.
- Every derived file is written only by its script: `lib/patterns.generated.ts` by `pnpm gen:wiring`, `index/patterns.toon`, `public/llms/patterns/*.md` and the two `llms*.txt` by `pnpm contract:emit`, `scripts/lib/patterns-unfilled.baseline.json` by `pnpm patterns:baseline`. Never hand-edit any of them.
- D26: `status: "unfilled"` requires `components: []`, no demo, `evidence` of at least one product, and `unfilledBecause` of at least 20 characters. `status: "shipped"` requires at least one component and a demo.
- D27: no family is renamed; no name or grouping from shapeof.ai is used. Stage ids are exactly `start ask tune watch review keep trust`.
- `/components/[name]/page.tsx` has no diff against `main` at the end (spec §11). Its layout file moves (Task 7) and nothing else about that route changes.
- The a11y exclusion list, `story-coverage.baseline.json` and `patterns-unfilled.baseline.json` may only shrink. Never add to any of them to go green.
- Never pass `data-slot` to a registry component (`check-contract` G2). Locate smoke hooks through the shell's own slots.
- Never pair `text-muted-foreground` with `bg-muted` / `bg-accent` / `bg-secondary` in a class string (`check:tokens`).
- Prose you add: no em dashes, no exclamation marks. Prettier on every new `.ts`/`.tsx`/`.md` before commit: `pnpm exec prettier --write <files>` from the repo root.
- `CLAUDE.md` is 14,244 bytes against a 14,500 ceiling. Task 10's edit is under 80 bytes; measure with `wc -c` before committing.
- Model policy for execution: Tasks 1 to 7 and 10 to 11 are mechanism and run inline; the 16 module tasks in Task 8 and the 14 composition tasks in Task 9 are wave work, one Sonnet agent per pattern in its own worktree, after Task 7 has merged into the branch.

---

## File structure

| path (under `apps/docs` unless noted)                                                                                                                                             | responsibility                                                             | task |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| `docs/superpowers/specs/2026-09-15-patterns-layer-design.md` (repo)                                                                                                               | Four measured corrections                                                  | 1    |
| `lib/pattern-docs.ts`                                                                                                                                                             | `PatternDocs`, `PatternStage`, `STAGES`: the record and the spine          | 2    |
| `lib/patterns.ts` (+ test)                                                                                                                                                        | Pure: `relatedPatterns`, `stageCounts`, `bySlug`, `installCommands`        | 2    |
| `scripts/lib/pattern-source.ts` (+ test)                                                                                                                                          | `loadPattern`, `patternSlugs`: the import probe                            | 3    |
| `scripts/lib/pattern-schema.ts` (+ test)                                                                                                                                          | `validatePattern`: D26 as code, pure, fixture-tested                       | 3    |
| `scripts/gen-wiring.mts`, `lib/patterns.generated.ts`                                                                                                                             | Wire modules and compositions; generated                                   | 4    |
| `scripts/lib/pattern-emit.ts` (+ test), `scripts/lib/contract-emit.ts` (+ test)                                                                                                   | `derivePatternMeta`, three renderers; llms and toon join the existing emit | 5    |
| `index/patterns.toon`, `public/llms/patterns/*.md`, `public/llms.txt`, `public/llms-full.txt`                                                                                     | Derived, committed, drift-gated                                            | 5    |
| `scripts/check-contract.mts`, `scripts/lib/pattern-stories.test.ts`, `scripts/patterns-baseline.mts`, `scripts/lib/patterns-unfilled.baseline.json`                               | Orphans, the `composition` obligation, the shrink-only unfilled set        | 6    |
| `components/site-shell.tsx`, `components/pattern-card.tsx`, `lib/families.ts`                                                                                                     | The chrome, composed from `docs-shell`; the card; family labels            | 7    |
| `app/page.tsx`, `app/patterns/[slug]/page.tsx`, `app/components/page.tsx`, `app/components/[name]/layout.tsx`                                                                     | The three routes; the moved layout                                         | 7    |
| `e2e/smoke.spec.ts`                                                                                                                                                               | `/`, every pattern page, `/components`                                     | 7    |
| `content/patterns/<slug>.pattern.tsx` × 16                                                                                                                                        | The launch set                                                             | 8    |
| `components/demos/patterns/<slug>-demo.tsx` × 14, `apps/storybook/src/stories/patterns/<Pascal>.stories.tsx` × 14                                                                 | Compositions and their stories                                             | 9    |
| `apps/storybook/.storybook/preview.tsx`, repo `.prettierignore`, repo `CLAUDE.md`, `docs/design-system/decisions.md`, `docs/CONTINUE.md`, `docs/design-system/figma-board-map.md` | Sort order, ignores, the four decisions, the gap report                    | 10   |

---

### Task 1: Amend the spec where the code contradicted it

**Files:**

- Modify: `docs/superpowers/specs/2026-09-15-patterns-layer-design.md`

Four facts measured while writing this plan contradict the spec. "Where a count contradicts a doc, the doc is what is wrong" applies to this doc too.

- [ ] **Step 1: Correct §2, the routes row.** Replace the value cell of the `page routes under apps/docs/app` row with: `3 files: page.tsx (/), components/[name]/page.tsx, and components/layout.tsx, which mounts components/docs-nav.tsx (a layer-grouped nav) on every /components/* route; / has no nav`.

- [ ] **Step 2: Correct §6.3.** Replace the first paragraph of §6.3 with:

```markdown
The component index does not exist today: the only way to reach a component
page is from `/`. `/components` renders inside the shell (§6.4) with the
Components area active, the doc-nav listing the families A to P in catalog
order, and the card grid grouped by family with the 15 marketing items in a
`Marketing` group at the end so they do not become orphans when `/` changes.
The existing `app/components/layout.tsx` (the `DocsNav` chrome) moves to
`app/components/[name]/layout.tsx` so it keeps wrapping the component pages
and stops wrapping the index. That move is the only change under
`app/components/[name]/` in phase 1; `page.tsx` there has no diff.
```

- [ ] **Step 3: Correct §6.4 and §7, the shell's slots.** Replace the first paragraph of §6.4 with:

```markdown
One shell for `/`, `/patterns/[slug]` and `/components`: the registry's own
`docs-shell` (O11), whose evidence line reads "a registry needs its own docs
site, and this is that shell". Its icon rail carries two areas, Patterns and
Components; its doc-nav carries the stages (Patterns) or the families
(Components) as sections; its content column carries the page. It has no
right-rail region and no slot above the title, so two of this spec's asks
land in documented slots instead: the section nav is the doc-nav's
`navPinned` rows, driven by the same array that renders the sections, and
the hero is the first section of the page rather than a band above the
title. Both are recorded as `docs-shell` gaps in `CONTINUE.md` §8
(`block-build-brief.md`: compose, report the gap, never fork).
```

And replace the first sentence of §7 ("The hero is a `PreviewTabs` ... goes first.") with: `The hero is a PreviewTabs with the composition on the preview tab and the demo source on the code tab, exactly as /components/[name] does it, rendered as the page's first section, "Live", directly under the title and lede.`

- [ ] **Step 4: Correct §15.** Replace `/components/[name]` has no diff against `main`. with `app/components/[name]/page.tsx` has no diff against `main`; its layout file has moved one directory down and nothing else.

- [ ] **Step 5: Format and commit.**

```bash
pnpm exec prettier --write docs/superpowers/specs/2026-09-15-patterns-layer-design.md
pnpm exec prettier --check docs/superpowers/specs/2026-09-15-patterns-layer-design.md
git add docs/superpowers/specs/2026-09-15-patterns-layer-design.md
git commit -m "docs(spec): four measured corrections before the patterns plan"
```

### Task 2: The record, the spine, and the pure derivations

**Files:**

- Create: `apps/docs/lib/pattern-docs.ts`
- Create: `apps/docs/lib/patterns.ts`
- Test: `apps/docs/lib/patterns.test.ts`

**Interfaces:**

- Produces: `STAGES` (ordered, `{ id, label, question }`), `PatternStage`, `PatternDocs`, `PatternEntry = { slug: string; docs: PatternDocs }`, `stageCounts(entries)`, `byStage(entries)`, `relatedPatterns(entries, slug, cap?)`, `installCommands(components)`. Tasks 5 and 7 import all of them.

- [ ] **Step 1: Write the failing test.**

```ts
// apps/docs/lib/patterns.test.ts
import { describe, expect, it } from "vitest";

import type { PatternDocs } from "./pattern-docs";
import { STAGES } from "./pattern-docs";
import { byStage, installCommands, relatedPatterns, stageCounts } from "./patterns";

const shipped = (title: string, stage: PatternDocs["stage"], components: string[]): PatternDocs => ({
  title,
  stage,
  definition: "What the interface does for the user, in two sentences.",
  whyItMatters: "Because the reader arrives with this job and not with a component name.",
  components,
  anatomy: [{ slot: "composer", note: "Where the prompt is typed." }],
  pitfalls: [],
  status: "shipped",
});

const ENTRIES = [
  {
    slug: "attach-context",
    docs: shipped("Attach context to a prompt", "ask", [
      "media-prompt-bar",
      "context-chips",
      "reference-strip",
    ]),
  },
  {
    slug: "quote-a-selection",
    docs: shipped("Quote a selection", "ask", ["quote-reply", "selection-toolbar"]),
  },
  {
    slug: "reuse-a-result",
    docs: shipped("Reuse a result as the next reference", "keep", [
      "asset-detail",
      "reference-strip",
      "preview-tile",
    ]),
  },
  { slug: "find-it-again", docs: shipped("Find it again", "keep", ["asset-library", "filter-bar"]) },
  { slug: "ask-first", docs: shipped("Ask before a side effect", "trust", ["permission-prompt"]) },
  {
    slug: "search-steps",
    docs: {
      ...shipped("Show the search while it thinks", "watch", []),
      status: "unfilled" as const,
      evidence: ["Perplexity"],
      unfilledBecause: "No shipped component renders retrieval steps that collapse once the answer lands.",
    },
  },
];

describe("STAGES", () => {
  it("is the seven-stage spine in journey order", () => {
    expect(STAGES.map((s) => s.id)).toEqual(["start", "ask", "tune", "watch", "review", "keep", "trust"]);
  });
});

describe("stageCounts and byStage", () => {
  it("counts every stage, including empty ones, in spine order", () => {
    expect(stageCounts(ENTRIES)).toEqual({
      start: 0,
      ask: 2,
      tune: 0,
      watch: 1,
      review: 0,
      keep: 2,
      trust: 1,
    });
    expect([...byStage(ENTRIES).keys()]).toEqual(STAGES.map((s) => s.id));
  });

  it("sorts a stage's entries shipped first, then by title", () => {
    const unfilledFirst = [
      ENTRIES[5],
      {
        ...ENTRIES[5],
        slug: "z",
        docs: { ...ENTRIES[5].docs, status: "shipped" as const, components: ["kbd"], title: "Zed" },
      },
    ];
    expect(
      byStage(unfilledFirst)
        .get("watch")!
        .map((e) => e.slug),
    ).toEqual(["z", "search-steps"]);
  });
});

describe("relatedPatterns", () => {
  it("ranks by shared components, then same stage, then title, and excludes itself", () => {
    const related = relatedPatterns(ENTRIES, "attach-context").map((e) => e.slug);
    // reuse-a-result shares reference-strip (score 1); quote-a-selection shares nothing but the stage.
    expect(related).toEqual(["reuse-a-result", "quote-a-selection"]);
  });

  it("gives an unfilled pattern its stage-mates, shipped first, capped", () => {
    const entries = [
      ...ENTRIES,
      { slug: "trace", docs: shipped("Trace what the agent did", "watch", ["trace-timeline"]) },
    ];
    expect(relatedPatterns(entries, "search-steps").map((e) => e.slug)).toEqual(["trace"]);
    expect(relatedPatterns(entries, "search-steps", 0)).toEqual([]);
  });
});

describe("installCommands", () => {
  it("is one shadcn add per component, in composition order", () => {
    expect(installCommands(["kbd", "cost-chip"])).toEqual([
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/kbd.json",
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/cost-chip.json",
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `cd apps/docs && pnpm exec vitest run lib/patterns.test.ts`
Expected: FAIL, `Cannot find module './pattern-docs'`.

- [ ] **Step 3: Write the record and the spine.**

```ts
// apps/docs/lib/pattern-docs.ts
import type { DocsSlot } from "./component-docs";

/**
 * The spine of the patterns index (spec 2026-09-15 §5, D27): the lifecycle
 * loop from concept-model.md §3 in the order a user meets it. Ids are the
 * enum the gate checks; labels are provisional display text.
 */
export const STAGES = [
  { id: "start", label: "Start", question: "How do I get in, and where am I?" },
  { id: "ask", label: "Ask", question: "How do I say what I want?" },
  { id: "tune", label: "Tune", question: "How do I control what comes back, and what it costs?" },
  { id: "watch", label: "Watch", question: "What is it doing right now?" },
  { id: "review", label: "Review", question: "Is this right, and how do I fix it?" },
  { id: "keep", label: "Keep", question: "Where does it go, and how do I find it again?" },
  { id: "trust", label: "Trust", question: "What is it allowed to do, and what am I paying?" },
] as const;

export type PatternStage = (typeof STAGES)[number]["id"];

/** A slug is a file name, a route segment and an export-name seed at once. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** One behaviour the interface performs for the user, as a guidance module
 *  (spec 2026-09-15 §4). The only hand-written source for a pattern page. */
export interface PatternDocs {
  /** Reader-facing name of the behaviour. Never a registry name. */
  title: string;
  stage: PatternStage;
  /** What the interface does for the user, two or three sentences. */
  definition: string;
  /** Why it earns a page: the problem it solves, cited to the boards where possible. */
  whyItMatters: string;
  /** Shipped manifest names, in composition order. Empty only when unfilled. */
  components: string[];
  /** Named regions of the composition; the grey-box anatomy when unfilled. */
  anatomy: DocsSlot[];
  /** Situations the composition gets wrong in practice. */
  pitfalls: string[];
  /** Products the behaviour was observed in. Optional when shipped (inherited
   *  from the components); required when unfilled. */
  evidence?: string[];
  status: "shipped" | "unfilled";
  /** Required when unfilled, at least 20 characters (D26). */
  unfilledBecause?: string;
}
```

```ts
// apps/docs/lib/patterns.ts
// Pure derivations over the pattern modules (spec 2026-09-15 D28). The site,
// the corpus emitter and the tests all call these, so "related" cannot mean
// two different things on two surfaces.
import type { PatternDocs, PatternStage } from "./pattern-docs";
import { STAGES } from "./pattern-docs";

export interface PatternEntry {
  slug: string;
  docs: PatternDocs;
}

export const DOCS_URL = "https://super-ai-components.vercel.app";

export function stageCounts(entries: PatternEntry[]): Record<PatternStage, number> {
  const counts = Object.fromEntries(STAGES.map((s) => [s.id, 0])) as Record<PatternStage, number>;
  for (const e of entries) counts[e.docs.stage] += 1;
  return counts;
}

const byTitle = (a: PatternEntry, b: PatternEntry) => a.docs.title.localeCompare(b.docs.title, "en");
const shippedFirst = (a: PatternEntry, b: PatternEntry) =>
  Number(a.docs.status === "unfilled") - Number(b.docs.status === "unfilled") || byTitle(a, b);

/** Every stage in spine order, each with its entries shipped first, then by title. */
export function byStage(entries: PatternEntry[]): Map<PatternStage, PatternEntry[]> {
  const map = new Map<PatternStage, PatternEntry[]>(STAGES.map((s) => [s.id, []]));
  for (const e of entries) map.get(e.docs.stage)!.push(e);
  for (const list of map.values()) list.sort(shippedFirst);
  return map;
}

/** Spec §6.4: shared components, then same stage, then title; a pattern that
 *  shares nothing (every unfilled one) gets its stage-mates. Capped. */
export function relatedPatterns(entries: PatternEntry[], slug: string, cap = 4): PatternEntry[] {
  const self = entries.find((e) => e.slug === slug);
  if (!self) return [];
  const mine = new Set(self.docs.components);
  const scored = entries
    .filter((e) => e.slug !== slug)
    .map((e) => ({
      entry: e,
      shared: e.docs.components.filter((c) => mine.has(c)).length,
      sameStage: e.docs.stage === self.docs.stage,
    }))
    .filter((s) => s.shared > 0 || s.sameStage)
    .sort(
      (a, b) =>
        b.shared - a.shared || Number(b.sameStage) - Number(a.sameStage) || shippedFirst(a.entry, b.entry),
    );
  return scored.slice(0, cap).map((s) => s.entry);
}

/** A pattern does not install (spec §13); its components do, in order. */
export function installCommands(components: string[]): string[] {
  return components.map((name) => `npx shadcn@latest add ${DOCS_URL}/r/${name}.json`);
}
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `cd apps/docs && pnpm exec vitest run lib/patterns.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write apps/docs/lib/pattern-docs.ts apps/docs/lib/patterns.ts apps/docs/lib/patterns.test.ts
git add apps/docs/lib/pattern-docs.ts apps/docs/lib/patterns.ts apps/docs/lib/patterns.test.ts
git commit -m "feat(patterns): the record, the seven-stage spine, and the pure derivations"
```

### Task 3: Loading a module, and D26 as code

**Files:**

- Create: `apps/docs/scripts/lib/pattern-source.ts`
- Create: `apps/docs/scripts/lib/pattern-schema.ts`
- Test: `apps/docs/scripts/lib/pattern-schema.test.ts`, `apps/docs/scripts/lib/pattern-source.test.ts`

**Interfaces:**

- Consumes: `PatternDocs`, `STAGES` (Task 2); `MIN_REASON` from `./contract-schema`; `pascal` from `./scaffold-templates`.
- Produces: `patternSlugs(): string[]`, `loadPattern(slug): Promise<PatternDocs>`, `patternModulePath(slug)`, `validatePattern(slug, docs, shipped, hasDemo): string[]`, `SLUG_RE`. Tasks 5 and 6 import them.

- [ ] **Step 1: Write the failing schema test.**

```ts
// apps/docs/scripts/lib/pattern-schema.test.ts
import { describe, expect, it } from "vitest";

import type { PatternDocs } from "@/lib/pattern-docs";

import { SLUG_RE, validatePattern } from "./pattern-schema";

const shipped = new Set(["media-prompt-bar", "context-chips", "kbd"]);
const why = "a reason long enough to pass the twenty character floor";
const base: PatternDocs = {
  title: "Attach context to a prompt",
  stage: "ask",
  definition: why,
  whyItMatters: why,
  components: ["media-prompt-bar", "context-chips"],
  anatomy: [{ slot: "composer", note: "The prompt bar." }],
  pitfalls: [],
  status: "shipped",
};

describe("validatePattern", () => {
  it("passes a shipped pattern with resolving components and a demo", () => {
    expect(validatePattern("attach-context", base, shipped, true)).toEqual([]);
  });

  it("fails a component that is not a shipped registry name", () => {
    const errors = validatePattern("x", { ...base, components: ["draft-mode"] }, shipped, true);
    expect(errors).toEqual(['x: components[0] "draft-mode" is not a shipped manifest item']);
  });

  it("fails a shipped pattern with no components or no demo", () => {
    expect(validatePattern("x", { ...base, components: [] }, shipped, true)).toContain(
      "x: a shipped pattern composes at least one component",
    );
    expect(validatePattern("x", base, shipped, false)).toContain(
      "x: a shipped pattern has a composition at components/demos/patterns/x-demo.tsx",
    );
  });

  it("holds an unfilled pattern to D26: no components, no demo, evidence, and a reason", () => {
    const unfilled: PatternDocs = { ...base, components: [], status: "unfilled" };
    const errors = validatePattern("x", unfilled, shipped, false);
    expect(errors).toContain("x: an unfilled pattern names at least one product in evidence");
    expect(errors).toContain("x: unfilledBecause needs a reason of at least 20 characters");
    expect(
      validatePattern("x", { ...unfilled, evidence: ["Perplexity"], unfilledBecause: why }, shipped, false),
    ).toEqual([]);
    expect(
      validatePattern("x", { ...unfilled, evidence: ["Perplexity"], unfilledBecause: why }, shipped, true),
    ).toContain(
      "x: an unfilled pattern has no composition; delete components/demos/patterns/x-demo.tsx or ship it",
    );
  });

  it("refuses a title that is a registry name under another spelling, and a bad stage or slug", () => {
    expect(validatePattern("kbd", { ...base, title: "Kbd" }, shipped, true)).toContain(
      'kbd: title "Kbd" is the registry item kbd; a pattern names a behaviour, not a component (D26)',
    );
    expect(validatePattern("x", { ...base, stage: "flow" as never }, shipped, true)).toContain(
      'x: stage "flow" is not one of start, ask, tune, watch, review, keep, trust',
    );
    expect(validatePattern("Bad Slug", base, shipped, true)).toContain(
      "Bad Slug: slug must match /^[a-z0-9]+(-[a-z0-9]+)*$/",
    );
    expect(SLUG_RE.test("attach-context-to-a-prompt")).toBe(true);
  });

  it("requires a definition, a why, and at least one anatomy slot", () => {
    const errors = validatePattern(
      "x",
      { ...base, definition: "short", whyItMatters: "", anatomy: [] },
      shipped,
      true,
    );
    expect(errors).toContain("x: definition needs at least 20 characters");
    expect(errors).toContain("x: whyItMatters needs at least 20 characters");
    expect(errors).toContain("x: anatomy names at least one slot");
  });
});
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-schema.test.ts`
Expected: FAIL, `Cannot find module './pattern-schema'`.

- [ ] **Step 3: Write the validator.**

```ts
// apps/docs/scripts/lib/pattern-schema.ts
// D26 as code (spec 2026-09-15 §3). Pure: the emit gate, check-contract and
// the tests all run this one function, so "valid" means one thing.
import type { PatternDocs } from "@/lib/pattern-docs";
import { SLUG_RE, STAGES } from "@/lib/pattern-docs";

import { MIN_REASON } from "./contract-schema";

export { SLUG_RE };

const STAGE_IDS: readonly string[] = STAGES.map((s) => s.id);
const clearsFloor = (s: unknown) => typeof s === "string" && s.trim().length >= MIN_REASON;
const kebab = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function validatePattern(
  slug: string,
  docs: PatternDocs,
  shipped: ReadonlySet<string>,
  hasDemo: boolean,
): string[] {
  const errors: string[] = [];
  const demoPath = `components/demos/patterns/${slug}-demo.tsx`;

  if (!SLUG_RE.test(slug)) errors.push(`${slug}: slug must match ${SLUG_RE}`);
  if (!docs.title?.trim()) errors.push(`${slug}: title is required`);
  else if (shipped.has(kebab(docs.title))) {
    errors.push(
      `${slug}: title "${docs.title}" is the registry item ${kebab(docs.title)}; a pattern names a behaviour, not a component (D26)`,
    );
  }
  if (!STAGE_IDS.includes(docs.stage)) {
    errors.push(`${slug}: stage "${docs.stage}" is not one of ${STAGE_IDS.join(", ")}`);
  }
  if (!clearsFloor(docs.definition))
    errors.push(`${slug}: definition needs at least ${MIN_REASON} characters`);
  if (!clearsFloor(docs.whyItMatters))
    errors.push(`${slug}: whyItMatters needs at least ${MIN_REASON} characters`);
  if (!Array.isArray(docs.anatomy) || docs.anatomy.length === 0)
    errors.push(`${slug}: anatomy names at least one slot`);

  docs.components.forEach((name, i) => {
    if (!shipped.has(name)) errors.push(`${slug}: components[${i}] "${name}" is not a shipped manifest item`);
  });

  if (docs.status === "shipped") {
    if (docs.components.length === 0)
      errors.push(`${slug}: a shipped pattern composes at least one component`);
    if (!hasDemo) errors.push(`${slug}: a shipped pattern has a composition at ${demoPath}`);
  } else if (docs.status === "unfilled") {
    if (docs.components.length > 0) errors.push(`${slug}: an unfilled pattern has components: []`);
    if (hasDemo)
      errors.push(`${slug}: an unfilled pattern has no composition; delete ${demoPath} or ship it`);
    if (!docs.evidence || docs.evidence.length === 0) {
      errors.push(`${slug}: an unfilled pattern names at least one product in evidence`);
    }
    if (!clearsFloor(docs.unfilledBecause)) {
      errors.push(`${slug}: unfilledBecause needs a reason of at least ${MIN_REASON} characters`);
    }
  } else {
    errors.push(`${slug}: status must be "shipped" or "unfilled"`);
  }
  return errors;
}
```

- [ ] **Step 4: Run the schema test to verify it passes.**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-schema.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the loader and its probe test.** The loader mirrors `contract-source.ts` byte for byte in shape; the test needs one real module, so it lands with the first pattern in Task 8. Write the test now with `it.skipIf` on the module's absence, so Task 8 turns it live without editing it.

```ts
// apps/docs/scripts/lib/pattern-source.ts
/// <reference types="vite/client" />
import type { PatternDocs } from "@/lib/pattern-docs";

import { pascal } from "./scaffold-templates";

// import.meta.glob, for the same reason contract-source.ts uses it: the map is
// built from the real directory at transform time, so a typo in `slug` is a
// missing key and never a silent empty module.
const modules = import.meta.glob<Record<string, unknown>>("../../content/patterns/*.pattern.tsx");

export function patternModulePath(slug: string): string {
  return `../../content/patterns/${slug}.pattern.tsx`;
}

/** Every module on disk, by slug, sorted. The directory is the list. */
export function patternSlugs(): string[] {
  return Object.keys(modules)
    .map((key) => key.replace(/^.*\/([^/]+)\.pattern\.tsx$/, "$1"))
    .sort();
}

/** Imports one module and returns its `<Pascal>Pattern` export. Throws,
 *  naming the slug, when the file is missing or exports the wrong name. */
export async function loadPattern(slug: string): Promise<PatternDocs> {
  const loader = modules[patternModulePath(slug)];
  if (!loader) throw new Error(`${slug}: no pattern module at content/patterns/${slug}.pattern.tsx`);
  const mod = await loader();
  const key = `${pascal(slug)}Pattern`;
  const docs = mod[key];
  if (!docs || typeof docs !== "object") {
    throw new Error(`${slug}: content/patterns/${slug}.pattern.tsx does not export ${key}`);
  }
  return docs as PatternDocs;
}
```

```ts
// apps/docs/scripts/lib/pattern-source.test.ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadPattern, patternModulePath, patternSlugs } from "./pattern-source";

const first = "attach-context-to-a-prompt";
const onDisk = existsSync(resolve(__dirname, patternModulePath(first)));

describe("pattern-source", () => {
  it("spells the module path the way the glob keys it", () => {
    expect(patternModulePath("x")).toBe("../../content/patterns/x.pattern.tsx");
  });

  it("throws, naming the slug, for a module that does not exist", async () => {
    await expect(loadPattern("no-such-pattern")).rejects.toThrow("no-such-pattern: no pattern module");
  });

  it.skipIf(!onDisk)("lists the first launch module and loads its export", async () => {
    expect(patternSlugs()).toContain(first);
    const docs = await loadPattern(first);
    expect(docs.stage).toBe("ask");
    expect(docs.status).toBe("shipped");
  });
});
```

- [ ] **Step 6: Run both tests, then commit.**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-schema.test.ts scripts/lib/pattern-source.test.ts`
Expected: PASS, with one test skipped (the module lands in Task 8).

```bash
pnpm exec prettier --write apps/docs/scripts/lib/pattern-source.ts apps/docs/scripts/lib/pattern-source.test.ts apps/docs/scripts/lib/pattern-schema.ts apps/docs/scripts/lib/pattern-schema.test.ts
git add apps/docs/scripts/lib/pattern-source.ts apps/docs/scripts/lib/pattern-source.test.ts apps/docs/scripts/lib/pattern-schema.ts apps/docs/scripts/lib/pattern-schema.test.ts
git commit -m "feat(patterns): the module loader and D26 as a pure validator"
```

### Task 4: Wire modules and compositions

**Files:**

- Modify: `apps/docs/scripts/gen-wiring.mts`
- Create (generated): `apps/docs/lib/patterns.generated.ts`
- Modify: repo `.prettierignore`

**Interfaces:**

- Produces: `patternModules: Record<string, PatternDocs>` and `patternDemos: Record<string, ComponentType>` from `@/lib/patterns.generated`. Task 7 reads both.

The generator does not evaluate modules: it lists `content/patterns/*.pattern.tsx`, and emits a demo import only where `components/demos/patterns/<slug>-demo.tsx` exists. The schema gate (Task 5) is what says a shipped pattern must have one.

- [ ] **Step 1: Add the third target.** In `apps/docs/scripts/gen-wiring.mts`, after the `docsSource` block and before `const targets`, add:

```ts
const patternsDir = join(here, "../content/patterns");
const patternSlugs = existsSync(patternsDir)
  ? readdirSync(patternsDir)
      .filter((f) => f.endsWith(".pattern.tsx"))
      .map((f) => f.replace(/\.pattern\.tsx$/, ""))
      .sort()
  : [];
const withComposition = patternSlugs.filter((s) =>
  existsSync(join(here, `../components/demos/patterns/${s}-demo.tsx`)),
);

// Both types are used by the annotations, so the empty case keeps them: the
// pages in Task 7 typecheck against these maps before any module exists.
const patternsSource =
  patternSlugs.length === 0
    ? `// GENERATED by scripts/gen-wiring.mts. Do not edit.
import type { ComponentType } from "react";
import type { PatternDocs } from "./pattern-docs";

export const patternModules: Record<string, PatternDocs> = {};
export const patternDemos: Record<string, ComponentType> = {};
`
    : `// GENERATED by scripts/gen-wiring.mts. Do not edit.
import type { ComponentType } from "react";
import type { PatternDocs } from "./pattern-docs";

${patternSlugs.map((s) => `import { ${pascal(s)}Pattern } from "@/content/patterns/${s}.pattern";`).join("\n")}
${withComposition.map((s) => `import ${pascal(s)}PatternDemo from "@/components/demos/patterns/${s}-demo";`).join("\n")}

export const patternModules: Record<string, PatternDocs> = {
${patternSlugs.map((s) => `  "${s}": ${pascal(s)}Pattern,`).join("\n")}
};

export const patternDemos: Record<string, ComponentType> = {
${withComposition.map((s) => `  "${s}": ${pascal(s)}PatternDemo,`).join("\n")}
};
`;
```

Add `readdirSync` to the `node:fs` import on line 1, and add the target:

```ts
  { path: join(here, "../lib/patterns.generated.ts"), source: patternsSource },
```

- [ ] **Step 2: Generate and check.**

Run: `cd apps/docs && pnpm gen:wiring && pnpm exec tsx scripts/gen-wiring.mts --check`
Expected: `gen:wiring — wrote 3 files.` then `gen:wiring — wiring is current.` `lib/patterns.generated.ts` holds the two empty maps.

- [ ] **Step 3: Ignore the generated file.** In the repo `.prettierignore`, under the two `gen-wiring` lines, add `apps/docs/lib/patterns.generated.ts`. Under the `contract-emit` block add `apps/docs/index/patterns.toon` (the `public/llms/` line already covers `public/llms/patterns/`).

- [ ] **Step 4: Typecheck and commit.**

Run: `pnpm typecheck` (repo root)
Expected: green.

```bash
git add apps/docs/scripts/gen-wiring.mts apps/docs/lib/patterns.generated.ts .prettierignore
git commit -m "feat(patterns): gen-wiring emits the module and composition maps"
```

### Task 5: Derive the corpus, and gate its drift

**Files:**

- Create: `apps/docs/scripts/lib/pattern-emit.ts`
- Test: `apps/docs/scripts/lib/pattern-emit.test.ts`
- Modify: `apps/docs/scripts/lib/contract-emit.ts` (export `cut` and `csv`; `renderLlmsTxt`, `renderLlmsFull`, `derivedFiles` take patterns)
- Modify: `apps/docs/scripts/lib/contract-emit.test.ts` (the emit-and-drift test loads and validates patterns; the orphan sweep covers `public/llms/patterns/`)

**Interfaces:**

- Consumes: `PatternEntry`, `relatedPatterns`, `installCommands`, `DOCS_URL` (Task 2); `loadPattern`, `patternSlugs`, `validatePattern` (Task 3); `ContractMeta` (existing).
- Produces: `PatternMeta`, `derivePatternMeta(entry, entries, metasByName)`, `renderPatternToon(patterns)`, `renderPatternPage(p)`, `renderPatternsIndex(patterns)`. `derivedFiles(metas, patterns)` now emits `index/patterns.toon` and `public/llms/patterns/<slug>.md`.

- [ ] **Step 1: Write the failing test.**

```ts
// apps/docs/scripts/lib/pattern-emit.test.ts
import { describe, expect, it } from "vitest";

import type { PatternEntry } from "@/lib/patterns";

import type { ContractMeta } from "./contract-emit";
import { derivedFiles, renderLlmsFull, renderLlmsTxt } from "./contract-emit";
import { derivePatternMeta, renderPatternPage, renderPatternToon } from "./pattern-emit";

const meta = (name: string, evidence: string[]): Pick<ContractMeta, "name" | "evidence"> => ({
  name,
  evidence,
});
const metas = new Map([
  ["media-prompt-bar", meta("media-prompt-bar", ["Midjourney", "Freepik"])],
  ["context-chips", meta("context-chips", ["Claude", "Freepik"])],
]);
const entries: PatternEntry[] = [
  {
    slug: "attach-context",
    docs: {
      title: "Attach context to a prompt",
      stage: "ask",
      definition: "The prompt carries references as chips, not as words.",
      whyItMatters: "A chip can be removed; a sentence naming a file cannot.",
      components: ["media-prompt-bar", "context-chips"],
      anatomy: [{ slot: "composer", note: "The prompt bar." }],
      pitfalls: ["A chip with no remove control."],
      status: "shipped",
    },
  },
  {
    slug: "search-steps",
    docs: {
      title: "Show the search while it thinks",
      stage: "watch",
      definition: "Retrieval steps render while the answer is pending, then collapse.",
      whyItMatters: "A multi-second wait with nothing to read is a wait the user abandons.",
      components: [],
      anatomy: [{ slot: "steps", note: "One row per retrieval step." }],
      pitfalls: [],
      evidence: ["Perplexity", "Manus"],
      status: "unfilled",
      unfilledBecause: "No shipped component renders retrieval steps that collapse once the answer lands.",
    },
  },
];

describe("derivePatternMeta", () => {
  const p = derivePatternMeta(entries[0], entries, metas);

  it("inherits evidence from the components, deduplicated, in component order", () => {
    expect(p.evidence).toEqual(["Midjourney", "Freepik", "Claude"]);
  });

  it("carries one install command per component, the derived related slugs, and its source", () => {
    expect(p.install).toEqual([
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/media-prompt-bar.json",
      "npx shadcn@latest add https://super-ai-components.vercel.app/r/context-chips.json",
    ]);
    expect(p.related).toEqual([]);
    expect(p.source).toBe("content/patterns/attach-context.pattern.tsx");
    expect(p.docs).toBe("https://super-ai-components.vercel.app/patterns/attach-context");
    expect(p.generated).toContain("pnpm contract:emit");
  });

  it("keeps an unfilled pattern's own evidence and reason", () => {
    const u = derivePatternMeta(entries[1], entries, metas);
    expect(u.evidence).toEqual(["Perplexity", "Manus"]);
    expect(u.install).toEqual([]);
    expect(u.unfilledBecause).toContain("No shipped component");
  });
});

describe("renderPatternToon", () => {
  it("writes one line per pattern with its components joined by |", () => {
    const toon = renderPatternToon(entries.map((e) => derivePatternMeta(e, entries, metas)));
    expect(toon.split("\n")[0]).toBe("patterns[2]{slug,stage,status,components,purpose}:");
    expect(toon).toContain("  attach-context,ask,shipped,media-prompt-bar|context-chips,");
    expect(toon).toContain("  search-steps,watch,unfilled,,");
  });
});

describe("renderPatternPage", () => {
  it("leads with the title and definition, lists components with install commands, and says when unfilled", () => {
    const page = renderPatternPage(derivePatternMeta(entries[0], entries, metas));
    expect(page.startsWith("# Attach context to a prompt\n\n> The prompt carries")).toBe(true);
    expect(page).toContain("- **media-prompt-bar**: `npx shadcn@latest add");
    const unfilled = renderPatternPage(derivePatternMeta(entries[1], entries, metas));
    expect(unfilled).toContain("## Status\n\nUnfilled: No shipped component");
  });
});

describe("the shared files carry patterns", () => {
  const ps = entries.map((e) => derivePatternMeta(e, entries, metas));

  it("adds a Patterns section to llms.txt and the pages to llms-full.txt", () => {
    expect(renderLlmsTxt([], ps)).toContain(
      "## Patterns\n\n- [Attach context to a prompt](https://super-ai-components.vercel.app/llms/patterns/attach-context.md): The prompt carries",
    );
    expect(renderLlmsTxt([], ps)).toContain("(unfilled)");
    expect(renderLlmsFull([], ps)).toContain("# Show the search while it thinks");
  });

  it("names the toon and one page per pattern beside the component files", () => {
    const files = derivedFiles([], ps);
    expect([...files.keys()].sort()).toEqual([
      "index/components.toon",
      "index/patterns.toon",
      "public/llms-full.txt",
      "public/llms.txt",
      "public/llms/patterns/attach-context.md",
      "public/llms/patterns/search-steps.md",
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-emit.test.ts`
Expected: FAIL, `Cannot find module './pattern-emit'`.

- [ ] **Step 3: Write the pattern emitter.**

```ts
// apps/docs/scripts/lib/pattern-emit.ts
// The pattern half of the corpus (spec 2026-09-15 §8). Same field names as
// the component entries where the meaning is the same, so an agent that reads
// one can read the other.
import type { PatternStage } from "@/lib/pattern-docs";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { DOCS_URL, installCommands, relatedPatterns } from "@/lib/patterns";

import type { ContractMeta } from "./contract-emit";
import { csv, cut } from "./contract-emit";

export interface PatternMeta {
  generated: string;
  slug: string;
  title: string;
  stage: PatternStage;
  status: "shipped" | "unfilled";
  definition: string;
  whyItMatters: string;
  components: string[];
  install: string[];
  anatomy: { slot: string; note: string }[];
  pitfalls: string[];
  evidence: string[];
  related: string[];
  unfilledBecause?: string;
  source: string;
  docs: string;
}

export function derivePatternMeta(
  entry: PatternEntry,
  entries: PatternEntry[],
  metasByName: ReadonlyMap<string, Pick<ContractMeta, "name" | "evidence">>,
): PatternMeta {
  const { slug, docs } = entry;
  const inherited = docs.components.flatMap((name) => metasByName.get(name)?.evidence ?? []);
  const evidence = [...new Set([...inherited, ...(docs.evidence ?? [])])];
  return {
    generated: `Derived by pnpm contract:emit from content/patterns/${slug}.pattern.tsx. Do not edit.`,
    slug,
    title: docs.title,
    stage: docs.stage,
    status: docs.status,
    definition: docs.definition,
    whyItMatters: docs.whyItMatters,
    components: docs.components,
    install: installCommands(docs.components),
    anatomy: docs.anatomy,
    pitfalls: docs.pitfalls,
    evidence,
    related: relatedPatterns(entries, slug).map((e) => e.slug),
    ...(docs.unfilledBecause !== undefined ? { unfilledBecause: docs.unfilledBecause } : {}),
    source: `content/patterns/${slug}.pattern.tsx`,
    docs: `${DOCS_URL}/patterns/${slug}`,
  };
}

/** The agent's routing table for behaviours. One line per pattern. */
export function renderPatternToon(patterns: PatternMeta[]): string {
  const rows = patterns.map((p) =>
    [p.slug, p.stage, p.status, p.components.join("|"), csv(cut(p.definition, 100))].join(","),
  );
  return (
    [
      `patterns[${patterns.length}]{slug,stage,status,components,purpose}:`,
      ...rows.map((r) => `  ${r}`),
    ].join("\n") + "\n"
  );
}

const section = (title: string, body: string) => `## ${title}\n\n${body}\n`;
const list = (items: string[]) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "None recorded.");
const stageLabel = (id: PatternStage) => STAGES.find((s) => s.id === id)!.label;

export function renderPatternPage(p: PatternMeta): string {
  const components = p.components.length
    ? p.components
        .map((name, i) => `- **${name}**: \`${p.install[i]}\` · ${DOCS_URL}/components/${name}`)
        .join("\n")
    : "None yet: this pattern is unfilled.";
  return [
    `# ${p.title}\n\n> ${p.definition}\n`,
    `Stage: ${stageLabel(p.stage)} · Status: ${p.status} · Docs: ${p.docs}\n`,
    section("Why it matters", p.whyItMatters),
    section("Components, in composition order", components),
    section("Anatomy", list(p.anatomy.map((a) => `\`${a.slot}\`: ${a.note}`))),
    section("Pitfalls", list(p.pitfalls)),
    section("Related patterns", list(p.related.map((s) => `${DOCS_URL}/llms/patterns/${s}.md`))),
    section("Evidence", p.evidence.length ? p.evidence.join(", ") : "None recorded."),
    ...(p.status === "unfilled" ? [section("Status", `Unfilled: ${p.unfilledBecause}`)] : []),
  ].join("\n");
}

/** The Patterns block of llms.txt. */
export function renderPatternsIndex(patterns: PatternMeta[]): string {
  const lines = patterns.map(
    (p) =>
      `- [${p.title}](${DOCS_URL}/llms/patterns/${p.slug}.md): ${cut(p.definition, 100)}${p.status === "unfilled" ? " (unfilled)" : ""}`,
  );
  return `## Patterns\n\n${lines.join("\n")}\n`;
}
```

- [ ] **Step 4: Thread patterns through the existing emitter.** In `apps/docs/scripts/lib/contract-emit.ts`:

  - Change `function cut(` and `function csv(` to `export function cut(` and `export function csv(`.
  - Add at the top: `import type { PatternMeta } from "./pattern-emit";` and `import { renderPatternPage, renderPatternsIndex, renderPatternToon } from "./pattern-emit";`. (`pattern-emit.ts` imports only types and the two helpers from this file, so the cycle is type-only plus two pure functions; vitest and tsc both accept it.)
  - Replace the three shared renderers:

```ts
export function renderLlmsTxt(metas: ContractMeta[], patterns: PatternMeta[] = []): string {
  const lines = metas.map(
    (m) => `- [${m.title}](${DOCS_URL}/llms/components/${m.name}.md): ${cut(m.purpose, 100)}`,
  );
  const patternsBlock = patterns.length ? `\n${renderPatternsIndex(patterns)}` : "";
  return `${HEADER}\n## Guides\n\n- [Full corpus](${DOCS_URL}/llms-full.txt): every component page in one file\n\n## Components\n\n${lines.join("\n")}\n${patternsBlock}`;
}

export function renderLlmsFull(metas: ContractMeta[], patterns: PatternMeta[] = []): string {
  const pages = [...metas.map(renderComponentPage), ...patterns.map(renderPatternPage)];
  return `${HEADER}\n---\n\n${pages.join("\n---\n\n")}`;
}

export function derivedFiles(metas: ContractMeta[], patterns: PatternMeta[] = []): Map<string, string> {
  const files = new Map<string, string>();
  for (const m of metas) {
    files.set(`registry/super-ai/${m.name}.meta.json`, `${JSON.stringify(m, null, 2)}\n`);
    files.set(`public/llms/components/${m.name}.md`, renderComponentPage(m));
  }
  for (const p of patterns) files.set(`public/llms/patterns/${p.slug}.md`, renderPatternPage(p));
  files.set("index/components.toon", renderToon(metas));
  files.set("index/patterns.toon", renderPatternToon(patterns));
  files.set("public/llms.txt", renderLlmsTxt(metas, patterns));
  files.set("public/llms-full.txt", renderLlmsFull(metas, patterns));
  return files;
}
```

- [ ] **Step 5: Make the gate load, validate and derive patterns.** In `apps/docs/scripts/lib/contract-emit.test.ts`:

  - Add imports: `import { loadPattern, patternSlugs } from "./pattern-source";`, `import { validatePattern } from "./pattern-schema";`, `import { derivePatternMeta } from "./pattern-emit";`, `import type { PatternEntry } from "@/lib/patterns";`.
  - In the `derivedFiles` unit test, the expected key list gains `"index/patterns.toon"` (six keys, sorted).
  - In `"validates every shipped item and derives exactly one contract per item"`, after `metas.push(...)` loop and before `const files = derivedFiles(metas);`, add:

```ts
const entries: PatternEntry[] = await Promise.all(
  patternSlugs().map(async (slug) => ({ slug, docs: await loadPattern(slug) })),
);
for (const { slug, docs } of entries) {
  const hasDemo = existsSync(join(ROOT, `components/demos/patterns/${slug}-demo.tsx`));
  errors.push(...validatePattern(slug, docs, shippedNames, hasDemo));
}
expect(errors, "Pattern schema failures (D26). Fix the pattern module.").toEqual([]);
const metasByName = new Map(metas.map((m) => [m.name, m]));
const patternMetas = entries.map((e) => derivePatternMeta(e, entries, metasByName));
```

    and change the call to `const files = derivedFiles(metas, patternMetas);`.

- In the orphan sweep, add a third spread mirroring the `public/llms/components` one for `public/llms/patterns`.

- [ ] **Step 6: Run the emitter test, then emit, then run the gate.**

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-emit.test.ts scripts/lib/contract-emit.test.ts`
Expected: the pattern tests PASS; the drift test FAILS once, naming `index/patterns.toon` as stale (it does not exist yet).

Run: `cd apps/docs && pnpm contract:emit && pnpm exec vitest run scripts/lib/contract-emit.test.ts`
Expected: PASS. `git status` shows `index/patterns.toon` (one header line, `patterns[0]{...}:`) and the two `llms*.txt` unchanged in bytes, because the Patterns block is omitted when empty.

- [ ] **Step 7: Commit.**

```bash
pnpm exec prettier --write apps/docs/scripts/lib/pattern-emit.ts apps/docs/scripts/lib/pattern-emit.test.ts apps/docs/scripts/lib/contract-emit.ts apps/docs/scripts/lib/contract-emit.test.ts
git add apps/docs/scripts/lib/pattern-emit.ts apps/docs/scripts/lib/pattern-emit.test.ts apps/docs/scripts/lib/contract-emit.ts apps/docs/scripts/lib/contract-emit.test.ts apps/docs/index/patterns.toon
git commit -m "feat(patterns): derive the toon, the pages and the llms section; drift-gated with the components"
```

### Task 6: Orphans, the composition obligation, and the unfilled ratchet

**Files:**

- Modify: `apps/docs/scripts/check-contract.mts`
- Create: `apps/docs/scripts/lib/pattern-stories.test.ts`
- Create: `apps/docs/scripts/patterns-baseline.mts`, `apps/docs/scripts/lib/patterns-unfilled.baseline.json`, `apps/docs/scripts/lib/patterns-unfilled.test.ts`
- Modify: `apps/docs/package.json` (one script)
- Modify: `docs/superpowers/specs/2026-09-15-patterns-layer-design.md` (two sentences, below)

- [ ] **Step 1: Orphan detection.** In `apps/docs/scripts/check-contract.mts`, add `import { SLUG_RE } from "../lib/pattern-docs";` beside the manifest imports, and after the registry orphan loop (the `for (const file of readdirSync("registry/super-ai")...` block) add:

```ts
// Patterns (spec 2026-09-15 §9). A module is a kebab slug that exports
// `<Pascal>Pattern: PatternDocs` (a text needle, like the docs modules above;
// this script never imports a module), and a composition belongs to a module.
const PATTERNS_DIR = "content/patterns";
const PATTERN_DEMOS_DIR = "components/demos/patterns";
const patternSlugs = existsSync(PATTERNS_DIR)
  ? readdirSync(PATTERNS_DIR)
      .filter((f) => f.endsWith(".pattern.tsx"))
      .map((f) => f.replace(/\.pattern\.tsx$/, ""))
  : [];
for (const slug of patternSlugs) {
  if (!SLUG_RE.test(slug)) errors.push(`pattern ${slug}: file name is not a kebab slug`);
  const source = readFileSync(`${PATTERNS_DIR}/${slug}.pattern.tsx`, "utf8");
  const needle = `export const ${pascal(slug)}Pattern: PatternDocs`;
  if (!source.includes(needle)) errors.push(`pattern ${slug}: module does not contain \`${needle}\``);
}
const patternSet = new Set(patternSlugs);
for (const file of existsSync(PATTERN_DEMOS_DIR) ? readdirSync(PATTERN_DEMOS_DIR) : []) {
  if (!file.endsWith("-demo.tsx")) continue;
  const slug = file.replace(/-demo\.tsx$/, "");
  if (!patternSet.has(slug)) errors.push(`orphan: ${PATTERN_DEMOS_DIR}/${file} has no pattern module`);
}
```

`SLUG_RE` lives in `lib/pattern-docs.ts` (Task 2 places it there; `pattern-schema.ts` re-exports it) because this `.mts` runs under `tsx` and takes relative imports, not the `@` alias.

Run: `cd apps/docs && pnpm check:contract`
Expected: green, count unchanged.

- [ ] **Step 2: The composition obligation.** The spec calls this a fourth `story-coverage` obligation kind. It is realised as its own test with the same parser and no baseline: there is no adoption-time debt to ratchet because no pattern existed before this plan, so a missing story fails outright.

```ts
// apps/docs/scripts/lib/pattern-stories.test.ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { STAGES } from "@/lib/pattern-docs";

import { loadPattern, patternSlugs } from "./pattern-source";
import { pascal } from "./scaffold-templates";
import { readStoryFacts } from "./story-coverage";

/** apps/docs/scripts/lib → apps/storybook/src/stories/patterns. */
const storyFor = (slug: string) =>
  resolve(__dirname, `../../../storybook/src/stories/patterns/${pascal(slug)}.stories.tsx`);

describe("composition stories (spec 2026-09-15 §9)", () => {
  it("every shipped pattern has a story titled Patterns/<Stage>/<Title> with at least one export; no unfilled one has any", async () => {
    const errors: string[] = [];
    for (const slug of patternSlugs()) {
      const docs = await loadPattern(slug);
      const path = storyFor(slug);
      if (docs.status === "unfilled") {
        if (existsSync(path)) errors.push(`${slug}: unfilled, yet a story exists at ${path}`);
        continue;
      }
      if (!existsSync(path)) {
        errors.push(`${slug}: shipped, but no story at ${path}`);
        continue;
      }
      const source = readFileSync(path, "utf8");
      const title = `Patterns/${STAGES.find((s) => s.id === docs.stage)!.label}/${docs.title}`;
      if (!source.includes(`title: "${title}"`)) errors.push(`${slug}: story title is not "${title}"`);
      if (readStoryFacts(source).exports.size === 0) errors.push(`${slug}: story exports nothing`);
    }
    expect(errors).toEqual([]);
  });
});
```

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/pattern-stories.test.ts`
Expected: PASS (zero modules, zero obligations).

- [ ] **Step 3: The unfilled ratchet.** Add `"patterns:baseline": "tsx scripts/patterns-baseline.mts"` to `apps/docs/package.json` scripts, after `story-coverage:report`.

```ts
// apps/docs/scripts/patterns-baseline.mts
// Regenerates scripts/lib/patterns-unfilled.baseline.json: the slugs whose
// module says `status: "unfilled"`. Shrink-only, like story-coverage:baseline:
// a new unfilled pattern is a hand edit to the JSON in a reviewed commit, so
// the review sees the hole being declared.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { pascal } from "./lib/scaffold-templates";
import { nextBaseline } from "./lib/story-coverage";

const BASELINE = "scripts/lib/patterns-unfilled.baseline.json";
const DIR = "content/patterns";

const slugs = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => f.endsWith(".pattern.tsx"))
      .map((f) => f.replace(/\.pattern\.tsx$/, ""))
      .sort()
  : [];
const live: string[] = [];
for (const slug of slugs) {
  const mod = (await import(resolve(DIR, `${slug}.pattern.tsx`))) as Record<string, { status?: string }>;
  if (mod[`${pascal(slug)}Pattern`]?.status === "unfilled") live.push(slug);
}

const prev: string[] | null = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const next = nextBaseline(prev, live);
if (next.grown.length > 0) {
  console.error(
    `patterns:baseline — refusing to grow the baseline by ${next.grown.length} (${next.grown.join(", ")}). Declare a new unfilled pattern by editing the JSON in a reviewed commit.`,
  );
  process.exit(1);
}
writeFileSync(BASELINE, `${JSON.stringify(next.baseline, null, 2)}\n`);
console.log(`patterns:baseline — ${next.baseline.length} unfilled pattern(s).`);
```

```ts
// apps/docs/scripts/lib/patterns-unfilled.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadPattern, patternSlugs } from "./pattern-source";

const BASELINE = resolve(__dirname, "patterns-unfilled.baseline.json");

describe("unfilled patterns, ratcheted (spec 2026-09-15 §8)", () => {
  it("every unfilled module is in the baseline, and every baseline entry is still unfilled", async () => {
    const baseline: string[] = JSON.parse(readFileSync(BASELINE, "utf8"));
    const live: string[] = [];
    for (const slug of patternSlugs()) if ((await loadPattern(slug)).status === "unfilled") live.push(slug);
    const undeclared = live.filter((s) => !baseline.includes(s));
    const stale = baseline.filter((s) => !live.includes(s));
    expect(
      undeclared,
      "An unfilled pattern the baseline does not declare. Add it to the JSON in this commit.",
    ).toEqual([]);
    expect(
      stale,
      "A baseline entry that is no longer unfilled. Run `pnpm patterns:baseline` to shrink it.",
    ).toEqual([]);
  });
});
```

Run: `cd apps/docs && pnpm patterns:baseline && pnpm exec vitest run scripts/lib/patterns-unfilled.test.ts`
Expected: writes `[]`, then PASS.

- [ ] **Step 4: Amend the spec's two sentences.** In §8, replace `Adding a new unfilled pattern is a deliberate act: the author regenerates the baseline, and the diff shows the addition in review.` with `Adding a new unfilled pattern is a deliberate act: the author adds its slug to the JSON by hand in the same commit, and the diff shows the hole being declared.` In §9's `obligation:` bullet, replace `as a fourth obligation kind, composition` with `as its own test, pattern-stories.test.ts, with no baseline because there is no adoption-time debt`.

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write apps/docs/scripts/check-contract.mts apps/docs/scripts/lib/pattern-stories.test.ts apps/docs/scripts/patterns-baseline.mts apps/docs/scripts/lib/patterns-unfilled.test.ts apps/docs/package.json docs/superpowers/specs/2026-09-15-patterns-layer-design.md
git add apps/docs/scripts/check-contract.mts apps/docs/scripts/lib/pattern-stories.test.ts apps/docs/scripts/patterns-baseline.mts apps/docs/scripts/lib/patterns-unfilled.baseline.json apps/docs/scripts/lib/patterns-unfilled.test.ts apps/docs/package.json docs/superpowers/specs/2026-09-15-patterns-layer-design.md
git commit -m "feat(patterns): orphan detection, the composition obligation, and the shrink-only unfilled set"
```

### Task 7: The shell, the three routes, and the smoke gate

**Files:**

- Create: `apps/docs/lib/families.ts` (+ test `apps/docs/lib/families.test.ts`)
- Create: `apps/docs/lib/site-nav.ts`
- Create: `apps/docs/components/site-shell.tsx`, `apps/docs/components/index-card.tsx`, `apps/docs/components/unfilled-anatomy.tsx`
- Create: `apps/docs/app/patterns/[slug]/page.tsx`, `apps/docs/app/components/page.tsx`
- Modify: `apps/docs/app/page.tsx` (rewritten), `apps/docs/e2e/smoke.spec.ts`
- Move: `apps/docs/app/components/layout.tsx` → `apps/docs/app/components/[name]/layout.tsx` (`git mv`, no content change)

**Interfaces:**

- Consumes: `patternModules`, `patternDemos` (Task 4); `STAGES`, `byStage`, `relatedPatterns`, `PatternEntry` (Task 2); `DocsShell` and `DocsShellProps` from `@/registry/super-ai/docs-shell`; `PreviewTabs`; `componentDocs` from `@/lib/docs.generated`; `MANIFEST`, `MARKETING_ITEMS`, `MARKETING_GROUPS`.
- Produces: `SiteShell`, `IndexCard`, `UnfilledAnatomy`, `patternsNav(entries)`, `componentsNav()`, `anchored(sections)`, `FAMILY_LABELS`, `FAMILY_ORDER`.

The chrome is the registry's own `docs-shell` (O11; spec §6.4 as amended in Task 1). Its rail switches area (Patterns, Components), its doc-nav lists the pages of the area, its content column is measured at 68ch. It has no hero slot and no right rail: the hero is the first section and the section nav is the doc-nav's pinned rows. Both are reported as gaps in Task 10.

- [ ] **Step 1: Family labels, with the test that every shipped family has one.**

```ts
// apps/docs/lib/families.test.ts
import { describe, expect, it } from "vitest";

import { MANIFEST } from "./catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "./families";

describe("families", () => {
  it("labels every family a shipped item belongs to, in catalog order", () => {
    const shipped = new Set(MANIFEST.filter((i) => i.status === "shipped").map((i) => i.family));
    for (const f of shipped) expect(FAMILY_LABELS[f], `family ${f}`).toBeTruthy();
    expect(FAMILY_ORDER).toEqual(["A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "N", "O", "P"]);
  });
});
```

```ts
// apps/docs/lib/families.ts
// Display names for the family letters, from catalog.md's headings. The
// letters stay the ids (spec 2026-09-15 D27); this is the only place a name
// is attached to one, and families.test.ts holds it to the manifest.
import type { FamilyId } from "./manifest-types";

export const FAMILY_LABELS: Record<FamilyId, string> = {
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
  P: "Records & views",
};

/** Catalog order, G omitted (D9). */
export const FAMILY_ORDER: FamilyId[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];
```

Run: `cd apps/docs && pnpm exec vitest run lib/families.test.ts`
Expected: PASS.

- [ ] **Step 2: The nav builders and the anchor helper.** Pure, server-safe.

```ts
// apps/docs/lib/site-nav.tsx
import type { DocsShellProps, DocsShellSection } from "@/registry/super-ai/docs-shell";

import { MANIFEST } from "./catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "./families";
import { MARKETING_GROUPS, MARKETING_ITEMS } from "./marketing-catalog";
import { STAGES } from "./pattern-docs";
import type { PatternEntry } from "./patterns";
import { byStage } from "./patterns";

type NavSections = NonNullable<DocsShellProps["navSections"]>;

/** Stages as sections, patterns as rows; a hole is visible as a badge. */
export function patternsNav(entries: PatternEntry[]): NavSections {
  const grouped = byStage(entries);
  return STAGES.map((s) => {
    const list = grouped.get(s.id) ?? [];
    return {
      label: `${s.label} · ${list.length}`,
      items: list.map((e) => ({
        id: e.slug,
        label: e.docs.title,
        href: `/patterns/${e.slug}`,
        ...(e.docs.status === "unfilled" ? { tier: "unfilled" } : {}),
      })),
    };
  });
}

/** Families as sections, components as rows, marketing at the end. */
export function componentsNav(): NavSections {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const families = FAMILY_ORDER.map((f) => ({
    label: `${f} · ${FAMILY_LABELS[f]}`,
    items: shipped
      .filter((i) => i.family === f)
      .map((i) => ({ id: i.name, label: i.title, href: `/components/${i.name}` })),
  })).filter((s) => s.items.length > 0);
  const marketing = MARKETING_GROUPS.map((g) => ({
    label: `Marketing · ${g}`,
    items: MARKETING_ITEMS.filter((i) => i.group === g).map((i) => ({
      id: i.name,
      label: i.title,
      href: `/components/${i.name}`,
    })),
  })).filter((s) => s.items.length > 0);
  return [...families, ...marketing];
}

/** One array drives the sections and the on-page nav (spec §6.4): the body
 *  gains an id the nav's `#` links land on, and the pinned rows are derived. */
export function anchored(sections: DocsShellSection[]): {
  sections: DocsShellSection[];
  pinned: NonNullable<DocsShellProps["navPinned"]>;
} {
  return {
    sections: sections.map((s) => ({
      ...s,
      body: (
        <div id={s.id} className="scroll-mt-8">
          {s.body}
        </div>
      ),
    })),
    pinned: sections.map((s) => ({ id: `on-page-${s.id}`, label: s.title, href: `#${s.id}` })),
  };
}
```

The file is `.tsx` because `anchored` returns JSX; imports spell it `@/lib/site-nav`.

- [ ] **Step 3: The shell.**

```tsx
// apps/docs/components/site-shell.tsx
"use client";

import { Layers, Waypoints } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";

import { DocsShell, type DocsShellProps } from "@/registry/super-ai/docs-shell";

type Area = "patterns" | "components";

const AREAS: NonNullable<DocsShellProps["areas"]> = [
  { id: "patterns", label: "Patterns", icon: <Waypoints /> },
  { id: "components", label: "Components", icon: <Layers /> },
];
const AREA_HREF: Record<Area, string> = { patterns: "/", components: "/components" };

export interface SiteShellProps {
  area: Area;
  navSections: NonNullable<DocsShellProps["navSections"]>;
  navPinned?: DocsShellProps["navPinned"];
  activePageId?: string;
  title: string;
  /** Inline text only: the block renders it inside a <p>. */
  lede?: string;
  sections: NonNullable<DocsShellProps["sections"]>;
  children?: React.ReactNode;
}

/** The site's chrome is the registry's own O11 block, composed rather than
 *  reimplemented (block-build-brief.md). Height comes from here because the
 *  block is embeddable and sizes to its container. */
export function SiteShell({
  area,
  navSections,
  navPinned,
  activePageId,
  title,
  lede,
  sections,
  children,
}: SiteShellProps) {
  const router = useRouter();
  return (
    <DocsShell
      className="h-dvh"
      areas={AREAS}
      activeAreaId={area}
      onSelectArea={(id) => router.push(AREA_HREF[id as Area])}
      railLabel="Super-AI-Components"
      railBrand={<span className="truncate text-sm font-semibold">Super-AI-Components</span>}
      navLabel={area === "patterns" ? "Patterns by stage" : "Components by family"}
      navSections={navSections}
      navPinned={navPinned}
      activePageId={activePageId}
      title={title}
      lede={lede}
      sections={sections}
    >
      {children}
    </DocsShell>
  );
}
```

- [ ] **Step 4: The card and the grey-box anatomy.**

```tsx
// apps/docs/components/index-card.tsx
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

export interface IndexCardProps {
  href: string;
  title: string;
  description: string;
  /** Small caps line above the title: the stage or the family. */
  kicker?: string;
  /** Registry names; three shown, the rest counted. */
  chips?: string[];
  badge?: string;
}

export function IndexCard({ href, title, description, kicker, chips = [], badge }: IndexCardProps) {
  const shown = chips.slice(0, 3);
  const rest = chips.length - shown.length;
  return (
    <Link
      href={href}
      className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors"
    >
      {kicker ? (
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{kicker}</span>
      ) : null}
      <span className="flex items-center gap-2">
        <span className="font-medium">{title}</span>
        {badge ? <Badge variant="outline">{badge}</Badge> : null}
      </span>
      <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</span>
      {shown.length ? (
        <span className="mt-auto flex flex-wrap gap-1 pt-1">
          {shown.map((c) => (
            <code key={c} className="rounded border px-1 py-0.5 text-[11px]">
              {c}
            </code>
          ))}
          {rest > 0 ? <span className="text-xs">+{rest}</span> : null}
        </span>
      ) : null}
    </Link>
  );
}

export function IndexGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
```

`hover:bg-accent` with `text-muted-foreground` children is the pairing the token gate and `a11y-baseline.md` forbid. Rebind the variable on the link instead of restyling the children: add `hover:[--muted-foreground:var(--accent-foreground)]` to the `Link` class string. Keep the two classes in that one string so the gate can see the rebind.

```tsx
// apps/docs/components/unfilled-anatomy.tsx
import { Badge } from "@/components/ui/badge";
import type { DocsSlot } from "@/lib/component-docs";

/** D29: an unfilled pattern draws its anatomy as labelled grey boxes, in
 *  declaration order, in the same frame the composition would fill. */
export function UnfilledAnatomy({ anatomy, because }: { anatomy: DocsSlot[]; because?: string }) {
  return (
    <div data-slot="unfilled-anatomy" className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">Unfilled</Badge>
        <span>{because}</span>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {anatomy.map((slot, i) => (
          <li
            key={slot.slot}
            className="flex min-h-20 flex-col gap-1 rounded-md border border-dashed p-3 text-xs"
          >
            <span className="font-medium">
              {i + 1}. <code>{slot.slot}</code>
            </span>
            <span>{slot.note}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 5: `/`, the patterns index (spec §6.1).** Replace `apps/docs/app/page.tsx` entirely:

```tsx
// apps/docs/app/page.tsx
import { IndexCard, IndexGrid } from "@/components/index-card";
import { SiteShell } from "@/components/site-shell";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { byStage } from "@/lib/patterns";
import { patternModules } from "@/lib/patterns.generated";
import { patternsNav } from "@/lib/site-nav";

export default function Home() {
  const entries: PatternEntry[] = Object.entries(patternModules).map(([slug, docs]) => ({ slug, docs }));
  const grouped = byStage(entries);
  const sections = STAGES.map((s) => {
    const list = grouped.get(s.id) ?? [];
    return {
      id: s.id,
      title: `${s.label}: ${s.question}`,
      body: list.length ? (
        <IndexGrid>
          {list.map((e) => (
            <IndexCard
              key={e.slug}
              href={`/patterns/${e.slug}`}
              title={e.docs.title}
              description={e.docs.definition}
              chips={e.docs.components}
              badge={e.docs.status === "unfilled" ? "Unfilled" : undefined}
            />
          ))}
        </IndexGrid>
      ) : (
        <p>Nothing here yet.</p>
      ),
    };
  });
  return (
    <SiteShell
      area="patterns"
      navSections={patternsNav(entries)}
      title="Patterns"
      lede="What an AI interface does for the user, stage by stage, and the components that build each behaviour."
      sections={sections}
    />
  );
}
```

- [ ] **Step 6: `/patterns/[slug]` (spec §6.2).**

```tsx
// apps/docs/app/patterns/[slug]/page.tsx
import fs from "node:fs";
import path from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

import { PreviewTabs } from "@/components/preview-tabs";
import { SiteShell } from "@/components/site-shell";
import { UnfilledAnatomy } from "@/components/unfilled-anatomy";
import { CATALOG_ITEMS } from "@/lib/catalog";
import { componentDocs } from "@/lib/docs.generated";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { installCommands, relatedPatterns } from "@/lib/patterns";
import { patternDemos, patternModules } from "@/lib/patterns.generated";
import { anchored, patternsNav } from "@/lib/site-nav";

export function generateStaticParams() {
  return Object.keys(patternModules).map((slug) => ({ slug }));
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const docs = patternModules[slug];
  if (!docs) notFound();

  const entries: PatternEntry[] = Object.entries(patternModules).map(([s, d]) => ({ slug: s, docs: d }));
  const Demo = patternDemos[slug];
  const demoSource = Demo
    ? fs.readFileSync(path.join(process.cwd(), "components/demos/patterns", `${slug}-demo.tsx`), "utf8")
    : null;
  const stage = STAGES.find((s) => s.id === docs.stage)!;
  const evidence = [
    ...new Set([
      ...docs.components.flatMap((n) => componentDocs[n]?.evidence ?? []),
      ...(docs.evidence ?? []),
    ]),
  ];
  const install = installCommands(docs.components);

  const { sections, pinned } = anchored([
    {
      id: "live",
      title: "Live",
      body:
        Demo && demoSource ? (
          <PreviewTabs preview={<Demo />} code={demoSource} fullBleed />
        ) : (
          <UnfilledAnatomy anatomy={docs.anatomy} because={docs.unfilledBecause} />
        ),
    },
    { id: "why", title: "Why it matters", body: <p>{docs.whyItMatters}</p> },
    {
      id: "anatomy",
      title: "Anatomy",
      body: (
        <ol className="space-y-2">
          {docs.anatomy.map((slot, i) => (
            <li key={slot.slot} className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-xs">
                {i + 1}
              </span>
              <span>
                <code className="text-xs">{slot.slot}</code> <span>{slot.note}</span>
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "components",
      title: "Components, in composition order",
      body: docs.components.length ? (
        <ul className="space-y-3">
          {docs.components.map((name, i) => {
            const item = CATALOG_ITEMS.find((c) => c.name === name)!;
            return (
              <li key={name} className="flex flex-col gap-1">
                <Link href={`/components/${name}`} className="font-medium underline-offset-4 hover:underline">
                  {item.title}
                </Link>
                <span>{componentDocs[name]?.whatItIs ?? item.description}</span>
                <code className="text-xs">{install[i]}</code>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>None yet. {docs.unfilledBecause}</p>
      ),
    },
    {
      id: "pitfalls",
      title: "Pitfalls",
      body: docs.pitfalls.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {docs.pitfalls.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : (
        <p>None recorded.</p>
      ),
    },
    {
      id: "evidence",
      title: "Evidence",
      body: <p>{evidence.length ? evidence.join(", ") : "None recorded."}</p>,
    },
    {
      id: "related",
      title: "Related patterns",
      body: (
        <ul className="space-y-1">
          {relatedPatterns(entries, slug).map((e) => (
            <li key={e.slug}>
              <Link href={`/patterns/${e.slug}`} className="underline-offset-4 hover:underline">
                {e.docs.title}
              </Link>
              {e.docs.status === "unfilled" ? " (unfilled)" : ""}
            </li>
          ))}
        </ul>
      ),
    },
  ]);

  return (
    <SiteShell
      area="patterns"
      navSections={patternsNav(entries)}
      navPinned={pinned}
      activePageId={slug}
      title={docs.title}
      lede={`${stage.label} · ${docs.definition}`}
      sections={sections}
    />
  );
}
```

- [ ] **Step 7: `/components`, and the layout move.**

```bash
git mv apps/docs/app/components/layout.tsx "apps/docs/app/components/[name]/layout.tsx"
```

```tsx
// apps/docs/app/components/page.tsx
import { IndexCard, IndexGrid } from "@/components/index-card";
import { SiteShell } from "@/components/site-shell";
import { MANIFEST } from "@/lib/catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "@/lib/families";
import { MARKETING_ITEMS } from "@/lib/marketing-catalog";
import { componentsNav } from "@/lib/site-nav";

export default function ComponentsIndex() {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const sections = [
    ...FAMILY_ORDER.map((f) => ({
      id: f,
      title: `${f} · ${FAMILY_LABELS[f]}`,
      items: shipped.filter((i) => i.family === f),
    })),
    { id: "marketing", title: "Marketing", items: MARKETING_ITEMS },
  ]
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      body: (
        <IndexGrid>
          {s.items.map((i) => (
            <IndexCard
              key={i.name}
              href={`/components/${i.name}`}
              title={i.title}
              description={i.description}
            />
          ))}
        </IndexGrid>
      ),
    }));
  return (
    <SiteShell
      area="components"
      navSections={componentsNav()}
      title="Components"
      lede="Every shipped item, by family. Each installs with one shadcn add."
      sections={sections}
    />
  );
}
```

- [ ] **Step 8: The smoke gate.** In `apps/docs/e2e/smoke.spec.ts`, replace the first test and add two, leaving the per-component loop and the Do/Don't test unchanged:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// (existing imports stay above this line)

test("the front door is the patterns index, one section per stage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText("Patterns");
  for (const stage of ["start", "ask", "tune", "watch", "review", "keep", "trust"]) {
    await expect(page.locator(`[data-section-id="${stage}"]`)).toBeVisible();
  }
});

// The generated map imports every composition, which the Playwright runner
// cannot evaluate; the directory is the same list.
const patternsDir = join(process.cwd(), "content/patterns"); // playwright.config.ts lives in apps/docs
const patternSlugs = readdirSync(patternsDir)
  .filter((f) => f.endsWith(".pattern.tsx"))
  .map((f) => f.replace(/\.pattern\.tsx$/, ""));
for (const slug of patternSlugs) {
  test(`/patterns/${slug} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    const title = /title:\s*"([^"]+)"/.exec(
      readFileSync(join(patternsDir, `${slug}.pattern.tsx`), "utf8"),
    )![1];
    await page.goto(`/patterns/${slug}`);
    // The shell's own title slot: a composition never renders a docs-shell,
    // so the locator is unique, and it does not depend on the a11y tree.
    await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText(title);
    expect(errors).toEqual([]);
  });
}

test("the component index lists the families", async ({ page }) => {
  await page.goto("/components");
  await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText("Components");
  await expect(page.locator('[data-section-id="B"]')).toBeVisible();
  await expect(page.locator('[data-section-id="marketing"]')).toBeVisible();
});
```

- [ ] **Step 9: Build, run the smoke gate, look at the pages.**

Run, from the repo root: `pnpm lint && pnpm typecheck && pnpm check:tokens && pnpm check:contract && pnpm test`
Expected: green. `check:tokens` is the step most likely to object to the card; fix the class string, never the rule.

Run: `cd apps/docs && pnpm build && pnpm exec playwright test`
Expected: green, with zero pattern pages (the loop is empty until Task 8) and `/`, `/components` and every `/components/<name>` passing.

Open `http://127.0.0.1:3100/` from `pnpm start --port 3100` in the Browser pane and confirm: rail with two areas, doc-nav with seven stage sections, seven empty stage sections in the column. Then `/components`: fifteen family sections plus Marketing, and a component card that opens the unchanged component page with its `DocsNav` chrome intact.

- [ ] **Step 10: Commit.**

```bash
pnpm exec prettier --write apps/docs/lib/families.ts apps/docs/lib/families.test.ts apps/docs/lib/site-nav.tsx apps/docs/components/site-shell.tsx apps/docs/components/index-card.tsx apps/docs/components/unfilled-anatomy.tsx apps/docs/app/page.tsx "apps/docs/app/patterns/[slug]/page.tsx" apps/docs/app/components/page.tsx apps/docs/e2e/smoke.spec.ts
git add -A apps/docs/lib apps/docs/components apps/docs/app apps/docs/e2e
git commit -m "feat(patterns): the docs-shell chrome, the patterns and component indexes, and the pattern page"
```

### Task 8: The launch set, sixteen modules

**Files:**

- Create: `apps/docs/content/patterns/<slug>.pattern.tsx`, one per row below
- Modify: `apps/docs/scripts/lib/patterns-unfilled.baseline.json` (the two unfilled slugs, by hand, in the same commit as their modules)

Derived by spec §10: the 116 `whatItIs` fields clustered by job, the lifecycle loop's arrows, `gaps.md` §4 for the unfilled candidates, and the seven Storybook `Patterns/*` guidance pages (`apps/storybook/src/stories/patterns/*.mdx`), which already name several of these behaviours in prose. Two unfilled candidates were considered and dropped under D26: `confidence-badge` (U5) and `correction-queue` (U6) are `DEFER` with a product count of 1 in `agent-board-analysis.md` §3, so they have no evidence to carry yet. The 2026-09-01 shapeof.ai leads (branches, draft mode, prompt enhancer, watermark, action plan) are not written: no in-tree evidence names a product for any of them. Task 10 records both lists in `CONTINUE.md` §8.

Every module has this shape; the table gives the fields, and the sixteen bodies follow. Slugs are the file names; the export is `pascal(slug) + "Pattern"`.

```tsx
// apps/docs/content/patterns/<slug>.pattern.tsx
import type { PatternDocs } from "@/lib/pattern-docs";

/** Drawn from: <the guidance page or board section named in the body>. Plain
 *  data, read by a Server Component and by the emitter; no JSX. */
export const <Pascal>Pattern: PatternDocs = { /* body */ };
```

| #   | slug                                   | stage  | components (composition order)                             | status   |
| --- | -------------------------------------- | ------ | ---------------------------------------------------------- | -------- |
| 1   | `set-up-on-first-run`                  | start  | onboarding-wizard, coach-mark, shortcuts-sheet             | shipped  |
| 2   | `start-from-a-suggestion`              | start  | suggestion-chips, recent-grid, empty-state                 | shipped  |
| 3   | `attach-context-to-a-prompt`           | ask    | media-prompt-bar, context-chips, reference-strip           | shipped  |
| 4   | `quote-a-selection-into-the-prompt`    | ask    | selection-toolbar, quote-reply, context-toolbar            | shipped  |
| 5   | `see-the-cost-before-you-run`          | tune   | cost-chip, run-button, credits-indicator                   | shipped  |
| 6   | `set-parameters-in-plain-language`     | tune   | parameter-panel, field-row, choice-chips, reset-affordance | shipped  |
| 7   | `follow-work-that-is-still-running`    | watch  | generation-queue, task-tray, result-card                   | shipped  |
| 8   | `trace-what-the-agent-did`             | watch  | trace-timeline, run-inspector                              | shipped  |
| 9   | `compare-candidates-side-by-side`      | review | compare-viewer, generation-grid                            | shipped  |
| 10  | `approve-edit-regenerate-or-skip`      | review | approval-card, diff-review, action-stack                   | shipped  |
| 11  | `find-it-again`                        | keep   | asset-library, filter-bar, filter-panel, date-section      | shipped  |
| 12  | `reuse-a-result-as-the-next-reference` | keep   | asset-detail, reference-strip, preview-tile                | shipped  |
| 13  | `ask-before-a-side-effect`             | trust  | permission-prompt, autonomy-selector, trust-dialog         | shipped  |
| 14  | `show-the-sources-behind-an-answer`    | trust  | answer-block, citation-ref, source-cards                   | shipped  |
| 15  | `show-the-search-while-it-thinks`      | watch  | none                                                       | unfilled |
| 16  | `review-code-changes-hunk-by-hunk`     | review | none                                                       | unfilled |

Anatomy slot names double as the composition's `data-region` values in Task 9, so the numbered list on the page and the boxes in the demo name the same things.

- [ ] **Step 1: Write modules 1 to 8.**

```ts
// set-up-on-first-run.pattern.tsx · export SetUpOnFirstRunPattern
{
  title: "Set up on first run",
  stage: "start",
  definition:
    "The first session asks the few questions the product cannot guess, points at the two or three controls that matter, and puts the keyboard within reach. Everything else waits until it is needed.",
  whyItMatters:
    "Family L exists because every reference product front-loads a short setup and then teaches in place rather than with a tour. A wizard that asks more than it needs, or a tour that explains every control, is skipped, and the product then meets a user who has learned nothing.",
  components: ["onboarding-wizard", "coach-mark", "shortcuts-sheet"],
  anatomy: [
    { slot: "setup", note: "The multi-step first-run survey: role, intent, the one or two settings that change the defaults." },
    { slot: "pointer", note: "A single anchored coach mark on the control the setup answers point at." },
    { slot: "shortcuts", note: "The cheatsheet, reachable from the pointer and from the keyboard, so the tour ends in the user's hands." },
  ],
  pitfalls: [
    "A setup step whose answer changes nothing downstream. Every question earns its place by picking a default.",
    "More than one coach mark on screen. A second pointer turns guidance into a tour, and tours are dismissed unread.",
    "A shortcuts sheet that lists the whole keymap. Lead with the shortcuts the setup just made relevant.",
  ],
  status: "shipped",
}
```

```ts
// start-from-a-suggestion.pattern.tsx · export StartFromASuggestionPattern
{
  title: "Start from a suggestion",
  stage: "start",
  definition:
    "An empty workspace offers something to do rather than a blank field: recent work to reopen, and starter prompts that fill the composer without sending. The first action is a pick, not a composition.",
  whyItMatters:
    "Family C and L1 cover the same moment from two sides. The reference board's home screens put recents and starters above the fold because a blank prompt is the highest-abandonment state in a creative tool; a chip that fills the composer lowers the cost of the first attempt to one click, and keeps the user in control of sending.",
  components: ["suggestion-chips", "recent-grid", "empty-state"],
  anatomy: [
    { slot: "recents", note: "Recent projects as thumbnails, newest first. Absent on a true first run." },
    { slot: "starters", note: "Suggestion chips. Each fills the composer; none submits or navigates." },
    { slot: "nothing-here", note: "The empty state that replaces recents on first run, pointing at the starters." },
  ],
  pitfalls: [
    "A suggestion that submits on click. The chip is a prompt, and the user sends it.",
    "Recents and starters competing at the same weight. Recents win when they exist; starters are the fallback.",
    "An empty state that apologises. It names the next action and stops.",
  ],
  status: "shipped",
}
```

```ts
// attach-context-to-a-prompt.pattern.tsx · export AttachContextToAPromptPattern
{
  title: "Attach context to a prompt",
  stage: "ask",
  definition:
    "The prompt carries its references as removable chips and typed attachment slots rather than as words. A file, a selection, a URL or a mention is an object the user can inspect and remove, and the composer shows exactly what the next message will send.",
  whyItMatters:
    "The design specification's section 4 states the principle family D exists for: the composer is a context-assembly surface. The Storybook page Patterns/AI conversation shows the failure it prevents, a sentence naming three references where nothing can be removed and nothing reports that one of them has gone missing.",
  components: ["media-prompt-bar", "context-chips", "reference-strip"],
  anatomy: [
    { slot: "composer", note: "The prompt bar in its docked presentation, with the chips passed into its context slot." },
    { slot: "chips", note: "One chip per reference, each with its own remove control; an unresolved one says so in a word and a border." },
    { slot: "references", note: "Typed attachment slots above the prompt for media inputs: image, video, audio, style." },
  ],
  pitfalls: [
    "A chip without a remove control. Removing a chip is the edit; a chip that cannot be removed is a label.",
    "Signalling an unresolved reference by colour alone. The chip changes its icon, its border, its text and its name together.",
    "Running two composers in one surface. Reach for the prompt bar or for AI Elements' PromptInput, never both.",
  ],
  status: "shipped",
}
```

```ts
// quote-a-selection-into-the-prompt.pattern.tsx · export QuoteASelectionIntoThePromptPattern
{
  title: "Quote a selection into the prompt",
  stage: "ask",
  definition:
    "Selecting text, a region, a cell or a time range raises a small toolbar at the selection, and one of its actions quotes the selection into the composer as a block that remembers where it came from. The excerpt is what the user sees; the anchor is what the quote resolves against later.",
  whyItMatters:
    "Quote-reply's anchor prop is the load-bearing decision, recorded on the component: an excerpt without an anchor silently re-points when the source is edited. Three toolbars in this registry raise on a selection (K4 on text, I3 on canvas objects, the quote itself) and the pattern is the one motion they share.",
  components: ["selection-toolbar", "quote-reply", "context-toolbar"],
  anatomy: [
    { slot: "selection", note: "The selection-following toolbar on text, with the quote action among its AI actions." },
    { slot: "quote", note: "The quoted block in the composer: excerpt, kind label, and the rendered anchor." },
    { slot: "object-selection", note: "The same motion on a canvas object: the floating toolbar that follows a selected shape." },
  ],
  pitfalls: [
    "Quoting the excerpt without the anchor. The quote must render where it came from, or it cannot be resolved after an edit.",
    "A toolbar that appears on hover rather than on selection. Hover is not intent.",
    "Four quote components for four capture sources. Only the excerpt branches; the block is one component.",
  ],
  status: "shipped",
}
```

```ts
// see-the-cost-before-you-run.pattern.tsx · export SeeTheCostBeforeYouRunPattern
{
  title: "See the cost before you run",
  stage: "tune",
  definition:
    "The price of an action sits on the control that triggers it, the balance it draws from is always in view, and the two agree before the user commits. A run that cannot be afforded says so on the button, not in an error afterwards.",
  whyItMatters:
    "A2 cost-chip is consumed by five components across four families (concept-model.md §2), which is the argument for this being a pattern rather than a feature of one button. The reference board's generation surfaces all price the action at the point of action; a cost discovered after the fact is the paywall pattern's failure mode, not this one's.",
  components: ["cost-chip", "run-button", "credits-indicator"],
  anatomy: [
    { slot: "price", note: "The per-action cost chip, in credits or credits per minute." },
    { slot: "trigger", note: "The run button carrying the price and, once running, the progress; its insufficient-credits state is a state, not a disabled button." },
    { slot: "balance", note: "The persistent balance the price is measured against." },
  ],
  pitfalls: [
    "A price that appears only in a confirmation dialog. It belongs on the control before the click.",
    "Disabling the run button when credits are short. The state is named on the button and leads to the top-up.",
    "A balance that updates only on reload. It moves when the run starts.",
  ],
  status: "shipped",
}
```

```ts
// set-parameters-in-plain-language.pattern.tsx · export SetParametersInPlainLanguagePattern
{
  title: "Set parameters in plain language",
  stage: "tune",
  definition:
    "Generation parameters are rows with a label, a control and a unit, their ends described in words rather than numbers, and every changed value can be put back. A visual parameter is a set of chips to pick from, not a slider to guess at.",
  whyItMatters:
    "E3's spec asks for plain-language ends on every range because the reference products that expose raw numbers are the ones whose users leave settings at default. A6, A4 and A11 are primitives precisely because inspectors across families E, I, G and M need the same row, the same chip and the same reset.",
  components: ["parameter-panel", "field-row", "choice-chips", "reset-affordance"],
  anatomy: [
    { slot: "panel", note: "The parameter panel: grouped rows with plain-language ends." },
    { slot: "row", note: "One label plus control plus unit row, the inspector's atom." },
    { slot: "choices", note: "A ring-selected chip group for a visual or discrete parameter." },
    { slot: "reset", note: "The reset control beside every editable value, at row and at group scope." },
  ],
  pitfalls: [
    "A slider from 0 to 100 with no words at either end. Name what low and high produce.",
    "A reset that lives only in a menu. It sits beside the value it resets.",
    "Chips for a continuous parameter. Chips are for choices the user can name.",
  ],
  status: "shipped",
}
```

```ts
// follow-work-that-is-still-running.pattern.tsx · export FollowWorkThatIsStillRunningPattern
{
  title: "Follow work that is still running",
  stage: "watch",
  definition:
    "A started job gets a slot the moment it starts, stays visible when the user leaves the view that started it, and turns into its result in place. The wait is drawn once, in one indicator, and the user can keep working.",
  whyItMatters:
    "Family E and N split this moment between the queue that shows pending slots, the tray that carries work across views, and the result card that is the same box from queued through done. The Storybook page Patterns/Loading states records the rule they share: one wait, one indicator, and never a spinner beside a progress bar beside a skeleton.",
  components: ["generation-queue", "task-tray", "result-card"],
  anatomy: [
    { slot: "queue", note: "Pending slots with progress, in the surface that started them." },
    { slot: "tray", note: "The task tray: work that outlives the view, with its own progress and a way back." },
    { slot: "result", note: "The result card in its queued and running states, which becomes the finished card without moving." },
  ],
  pitfalls: [
    "A job that vanishes when the user navigates away. The tray exists so that it does not.",
    "Two indicators for one wait. Pick the queue slot or the card state, never both.",
    "A finished result that appears somewhere else. It replaces its own placeholder.",
  ],
  status: "shipped",
}
```

```ts
// trace-what-the-agent-did.pattern.tsx · export TraceWhatTheAgentDidPattern
{
  title: "Trace what the agent did",
  stage: "watch",
  definition:
    "Every step an agent took is a row on a timeline, and any row opens to its inputs, outputs, tokens, cost and errors. What the agent is doing now is the last row, still open.",
  whyItMatters:
    "N4 was re-validated by four agent products in the second reference population (agent-board-analysis.md §3), which is the strongest evidence line in family N. A run the user cannot inspect is a run the user cannot trust, and the pattern is the only surface where a wrong tool call is visible before its consequence is.",
  components: ["trace-timeline", "run-inspector"],
  anatomy: [
    { slot: "timeline", note: "The waterfall of steps, tool calls and model calls, with the running step last." },
    { slot: "inspector", note: "The selected span's detail: input, output, tokens, cost, error." },
  ],
  pitfalls: [
    "Showing only the final answer with a summary of steps. The rows are the audit; the summary is not.",
    "Hiding cost per span. It is the number that explains the total.",
    "A timeline that scrolls to the top on each new step. The running step stays in view.",
  ],
  status: "shipped",
}
```

- [ ] **Step 2: Write modules 9 to 16.**

```ts
// compare-candidates-side-by-side.pattern.tsx · export CompareCandidatesSideBySidePattern
{
  title: "Compare candidates side by side",
  stage: "review",
  definition:
    "A batch of results is a grid whose select mode replaces hover actions with selection, and any two or more selected results open as labelled panes at the same size. Picking is a comparison, not a scroll.",
  whyItMatters:
    "F2's select mode and F5's labelled panes exist as a pair because the reference board's generation grids all resolve to the same motion: choose several, look at them together, keep one. A grid without a compare surface makes the user compare from memory.",
  components: ["compare-viewer", "generation-grid"],
  anatomy: [
    { slot: "grid", note: "The batch gallery in select mode, density set by the host." },
    { slot: "panes", note: "The compare viewer: labelled panes, synced where the media allows it." },
  ],
  pitfalls: [
    "Panes of different sizes. Comparison needs the same frame for every candidate.",
    "A compare view with no way back to the grid keeping the selection.",
    "Labelling panes A and B only. Label them by what differs: the prompt, the seed, the model.",
  ],
  status: "shipped",
}
```

```ts
// approve-edit-regenerate-or-skip.pattern.tsx · export ApproveEditRegenerateOrSkipPattern
{
  title: "Approve, edit, regenerate or skip",
  stage: "review",
  definition:
    "A generated artifact waits on one of four verbs, always in the same order. Confirm and skip end the interaction; edit and regenerate hand the artifact back. Changes arrive with the reason for each, and a decision can be undone for a moment after it is made.",
  whyItMatters:
    "F7 fixes the four verbs and their order in the component rather than at the call site, and the Storybook page Patterns/Actions & confirmation carries the rules its tests pin. K3 adds the per-change rationale, and F4 is where a confirmed result goes next. Together they are the Approval contract this registry inherits everywhere an artifact needs a decision.",
  components: ["approval-card", "diff-review", "action-stack"],
  anatomy: [
    { slot: "approval", note: "The card with the four verbs in house order and the eight-second undo." },
    { slot: "changes", note: "Track changes with a rationale per change, for a text artifact." },
    { slot: "next", note: "The action stack: where a confirmed result is handed on." },
  ],
  pitfalls: [
    "Reordering the verbs per product. Muscle memory across surfaces is the point of fixing them.",
    "Confirm without undo. The two terminal verbs are irreversible without it.",
    "A change with no reason. The rationale is what lets a reviewer skip rather than read.",
  ],
  status: "shipped",
}
```

```ts
// find-it-again.pattern.tsx · export FindItAgainPattern
{
  title: "Find it again",
  stage: "keep",
  definition:
    "A library is a header with search and view controls, a chip row for the common filters, a faceted rail for the rest, and results grouped by date. The same asset is reachable by when, by what, and by which project.",
  whyItMatters:
    "Family J and A3 are the LIBRARY stage of the lifecycle loop (concept-model.md §3). The Storybook page Patterns/Resource index records the shape: filters are chips until there are too many, then a rail; the list never loses its date grouping. A library that is only a search box makes every past result a new search.",
  components: ["asset-library", "filter-bar", "filter-panel", "date-section"],
  anatomy: [
    { slot: "library", note: "The library shell: header actions, search, list or grid toggle, folders." },
    { slot: "chips", note: "The filter bar: category chips, add-filter chip, and the filters button." },
    { slot: "facets", note: "The faceted rail, for the filters that do not fit on a chip row." },
    { slot: "dates", note: "Date-grouped section headers over the results." },
  ],
  pitfalls: [
    "A filter that exists in the rail and not on a chip once applied. Applied filters are always visible.",
    "Losing the date grouping in grid view. The grouping is the memory aid.",
    "Search that resets the filters. The two compose.",
  ],
  status: "shipped",
}
```

```ts
// reuse-a-result-as-the-next-reference.pattern.tsx · export ReuseAResultAsTheNextReferencePattern
{
  title: "Reuse a result as the next reference",
  stage: "keep",
  definition:
    "A finished asset opens with its provenance beside it, and one action puts it into the next prompt's reference slot. The loop closes: what came out becomes what goes in, without leaving the product or re-uploading anything.",
  whyItMatters:
    "This is the arrow at the bottom of concept-model.md §3, the one that makes the lifecycle a loop: saved assets become new prompt references. The reference board's creative tools all have it, and it is the behaviour that separates a generator from a studio.",
  components: ["asset-detail", "reference-strip", "preview-tile"],
  anatomy: [
    { slot: "detail", note: "The lightbox: the media with its provenance rail, prompt, model and settings." },
    { slot: "reference", note: "The typed reference slot the asset lands in." },
    { slot: "tile", note: "The preview tile that represents the asset in the slot and in the library alike." },
  ],
  pitfalls: [
    "Reusing the asset without its settings. Provenance travels with the reference.",
    "A reference slot that accepts only uploads. The library is the first source.",
    "A tile that looks different in the slot and in the grid. One tile, one primitive.",
  ],
  status: "shipped",
}
```

```ts
// ask-before-a-side-effect.pattern.tsx · export AskBeforeASideEffectPattern
{
  title: "Ask before a side effect",
  stage: "trust",
  definition:
    "An agent pauses before a consequential call and asks, with four fixed verbs: allow once, always allow, deny, edit first. A standing grant is visible and revocable somewhere the user can find it, and untrusted content asks its own question before it runs.",
  whyItMatters:
    "N8 interrupts rather than joining the stream because the call has already been composed and is waiting. N9 exists because always-allow only emits a choice; the surface that lists and revokes grants is what makes it safe. The Storybook page Patterns/AI conversation states the rule: never let a surface write a standing grant without a surface that lists and revokes them.",
  components: ["permission-prompt", "autonomy-selector", "trust-dialog"],
  anatomy: [
    { slot: "prompt", note: "The permission dialog with its four verbs and the call it is about." },
    { slot: "grants", note: "The autonomy selector: three levels, each with its blast radius in words, and the denials beside them." },
    { slot: "trust", note: "The dialog that asks before third-party content runs." },
  ],
  pitfalls: [
    "A permission gate that scrolls away in the stream. It interrupts, or it is not a gate.",
    "Always-allow with no review surface. A permanent permission the user cannot see is a one-way door.",
    "Rewording the verbs per product. Allow once, always allow, deny, edit first.",
  ],
  status: "shipped",
}
```

```ts
// show-the-sources-behind-an-answer.pattern.tsx · export ShowTheSourcesBehindAnAnswerPattern
{
  title: "Show the sources behind an answer",
  stage: "trust",
  definition:
    "Citations attach to the claim, not to the answer. Each marker opens the quoted passage, an unsourced claim is marked as such, and the sources that were retrieved but never used are shown beside the ones that were.",
  whyItMatters:
    "K7's one recorded decision, citations at the claim, is what makes coverage computable and a thin answer visible. K6 keeps an unresolved citation on screen rather than dropping it, and K8 shows the retrieved set so the reader notices the document the model ignored. All three passed the agent-board inclusion test on the same slice (agent-board-analysis.md §3).",
  components: ["answer-block", "citation-ref", "source-cards"],
  anatomy: [
    { slot: "answer", note: "The grounded answer: claims with markers, coverage computed, gaps stated in words." },
    { slot: "marker", note: "One inline citation, resolved, loading or unresolved, opening the quote." },
    { slot: "sources", note: "The retrieved set, used and unused, with relevance shown." },
  ],
  pitfalls: [
    "An answer-level source list. It cannot say which sentence came from where.",
    "Dropping an unresolved citation. It stays, and says it is unresolved.",
    "Markers that arrive before the claim they support. Hold them until the claim settles.",
  ],
  status: "shipped",
}
```

```ts
// show-the-search-while-it-thinks.pattern.tsx · export ShowTheSearchWhileItThinksPattern
{
  title: "Show the search while it thinks",
  stage: "watch",
  definition:
    "While a grounded answer is being assembled, the retrieval steps render as they happen: the queries issued, the sources opened, the ones discarded. When the answer lands, the steps collapse into a line the reader can reopen to audit it.",
  whyItMatters:
    "A multi-second wait with nothing to read is a wait the user abandons, and the steps are also the only place the reader can see that the model searched the wrong thing. Every research agent in the second reference population draws this surface (agent-board-analysis.md §2, research agents).",
  components: [],
  anatomy: [
    { slot: "steps", note: "One row per retrieval step, appended live, with the source it opened." },
    { slot: "discards", note: "Sources considered and dropped, distinguishable from the ones kept." },
    { slot: "collapsed", note: "The one-line summary the steps fold into once the answer arrives." },
  ],
  pitfalls: [
    "Steps that disappear when the answer lands. They collapse; they do not vanish.",
    "A step list that is a spinner with captions. Each row names a real query or source.",
  ],
  evidence: ["Perplexity", "Manus", "ChatGPT deep research", "Gemini"],
  status: "unfilled",
  unfilledBecause:
    "gaps.md U13 search-steps: no shipped component renders retrieval steps that stay legible during a multi-second wait and collapse once the answer arrives.",
}
```

```ts
// review-code-changes-hunk-by-hunk.pattern.tsx · export ReviewCodeChangesHunkByHunkPattern
{
  title: "Review code changes hunk by hunk",
  stage: "review",
  definition:
    "A code change from an agent is a line-level diff with syntax highlighting, and each hunk is applied or skipped on its own. The files that did not change are hidden, and a rename is marked as a rename rather than as a delete and an add.",
  whyItMatters:
    "K3 diff-review is word-level for prose and cannot carry a code diff. Every coding agent in the second reference population reviews by hunk (agent-board-analysis.md §2, coding agents), and the pattern is the review stage's biggest hole for a whole product category.",
  components: [],
  anatomy: [
    { slot: "diff", note: "The line-level diff, highlighted, one file at a time." },
    { slot: "hunk-actions", note: "Apply and skip on each hunk, with the count of decisions left." },
    { slot: "changed-files", note: "The tree of changed files with per-file review state." },
  ],
  pitfalls: [
    "Reusing the prose diff for code. Word-level marks make a code change unreadable.",
    "Apply-all as the only action. The hunk is the unit of review.",
  ],
  evidence: ["Claude Code", "GitHub Copilot", "Cursor"],
  status: "unfilled",
  unfilledBecause:
    "gaps.md U15 code-diff: diff-review is word-level for prose; nothing renders a line-level code diff with per-hunk apply and skip.",
}
```

- [ ] **Step 3: Declare the two holes, wire, emit, and run the gates.** Set `apps/docs/scripts/lib/patterns-unfilled.baseline.json` to:

```json
["review-code-changes-hunk-by-hunk", "show-the-search-while-it-thinks"]
```

Run: `cd apps/docs && pnpm gen:wiring && pnpm contract:emit`
Expected: `patterns.generated.ts` imports sixteen modules and no demos yet; `index/patterns.toon` has sixteen rows; `public/llms/patterns/` has sixteen pages; the two `llms*.txt` gain their Patterns block.

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts`
Expected, when run after the modules alone: FAIL with fourteen D26 errors, one per shipped pattern: `a shipped pattern has a composition at components/demos/patterns/<slug>-demo.tsx`. That list is Task 9's checklist. In the wave, each agent writes its module and its composition together (Task 9, wave protocol), so no commit carries a red gate.

Run: `cd apps/docs && pnpm exec vitest run scripts/lib/patterns-unfilled.test.ts scripts/lib/pattern-source.test.ts lib/patterns.test.ts`
Expected: PASS; the `pattern-source` probe is no longer skipped.

- [ ] **Step 4: Commit, per pattern, together with Task 9's files.** The two unfilled modules commit on their own:

```bash
pnpm exec prettier --write apps/docs/content/patterns/*.pattern.tsx
git add apps/docs/content/patterns apps/docs/scripts/lib/patterns-unfilled.baseline.json apps/docs/lib/patterns.generated.ts apps/docs/index/patterns.toon apps/docs/public/llms apps/docs/public/llms.txt apps/docs/public/llms-full.txt
git commit -m "feat(patterns): the launch set, fourteen shipped and two declared holes"
```

### Task 9: Fourteen compositions and their stories

**Files:**

- Create: `apps/docs/components/demos/patterns/<slug>-demo.tsx`, one per shipped pattern
- Create: `apps/storybook/src/stories/patterns/<Pascal>.stories.tsx`, one per shipped pattern

**Interfaces:**

- Consumes: the component demos under `apps/docs/components/demos/<name>-demo.tsx` (every one a zero-prop default export, `"use client"`).
- Produces: a default-exported composition per shipped pattern, wired by Task 4's `patternDemos`, rendered by Task 7's Live section, and exercised by the Storybook a11y gate.

A composition is a layout of the component demos, one `data-region` per anatomy slot, in the slot order the module declares. Composing the demos rather than re-propping the components keeps one source of realistic props per component and means a demo fix reaches every pattern that uses it. Where a demo's default props do not show the behaviour (a demo that shows an idle state where the pattern needs the running one), wire the component directly with props copied from that demo, and say so in the file comment. None of the fourteen demos opens a dialog on mount (measured: no `defaultOpen`, `open={true}` or `useState(true)` in the six dialog-bearing demos), so the hero and the smoke gate are safe.

**Wave protocol.** Tasks 8 and 9 are one unit of work per pattern: an agent writes the module, the composition and the story, runs the four commands in Step 3, and commits once. The gate is green at every commit. Task 8's bodies are the content; this task is the shape. The two unfilled patterns have a module only.

- [ ] **Step 1: The worked example, pattern 3.**

```tsx
// apps/docs/components/demos/patterns/attach-context-to-a-prompt-demo.tsx
"use client";

import ContextChipsDemo from "@/components/demos/context-chips-demo";
import MediaPromptBarDemo from "@/components/demos/media-prompt-bar-demo";
import ReferenceStripDemo from "@/components/demos/reference-strip-demo";

/**
 * Attach context to a prompt, live. One region per anatomy slot of
 * content/patterns/attach-context-to-a-prompt.pattern.tsx, in its order, so the
 * numbered list on the page and the boxes here name the same things. Composed
 * from the component demos, not re-propped: a demo fix reaches this page.
 */
export default function AttachContextToAPromptDemo() {
  return (
    <div data-slot="pattern-composition" className="flex w-full max-w-3xl flex-col gap-6 p-6">
      <div data-region="composer">
        <MediaPromptBarDemo />
      </div>
      <div data-region="chips">
        <ContextChipsDemo />
      </div>
      <div data-region="references">
        <ReferenceStripDemo />
      </div>
    </div>
  );
}
```

```tsx
// apps/storybook/src/stories/patterns/AttachContextToAPrompt.stories.tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import AttachContextToAPromptDemo from "@/components/demos/patterns/attach-context-to-a-prompt-demo";

const meta: Meta<typeof AttachContextToAPromptDemo> = {
  title: "Patterns/Ask/Attach context to a prompt",
  component: AttachContextToAPromptDemo,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof AttachContextToAPromptDemo>;

/** The composition exactly as the pattern page's Live section renders it. */
export const Composition: Story = {};
```

- [ ] **Step 2: The other thirteen, same two files each.** The demo file is the example above with these substitutions; the story file is the example above with the title from the table (`Patterns/<Stage label>/<Title>`, the label from `STAGES`) and the Pascal names. Regions are the module's anatomy slots, in order; each wraps the demo named beside it.

| slug                                   | Pascal                           | title                                              | regions → demos                                                                                                        |
| -------------------------------------- | -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `set-up-on-first-run`                  | `SetUpOnFirstRun`                | Patterns/Start/Set up on first run                 | setup → `onboarding-wizard-demo`, pointer → `coach-mark-demo`, shortcuts → `shortcuts-sheet-demo`                      |
| `start-from-a-suggestion`              | `StartFromASuggestion`           | Patterns/Start/Start from a suggestion             | recents → `recent-grid-demo`, starters → `suggestion-chips-demo`, nothing-here → `empty-state-demo`                    |
| `quote-a-selection-into-the-prompt`    | `QuoteASelectionIntoThePrompt`   | Patterns/Ask/Quote a selection into the prompt     | selection → `selection-toolbar-demo`, quote → `quote-reply-demo`, object-selection → `context-toolbar-demo`            |
| `see-the-cost-before-you-run`          | `SeeTheCostBeforeYouRun`         | Patterns/Tune/See the cost before you run          | price → `cost-chip-demo`, trigger → `run-button-demo`, balance → `credits-indicator-demo`                              |
| `set-parameters-in-plain-language`     | `SetParametersInPlainLanguage`   | Patterns/Tune/Set parameters in plain language     | panel → `parameter-panel-demo`, row → `field-row-demo`, choices → `choice-chips-demo`, reset → `reset-affordance-demo` |
| `follow-work-that-is-still-running`    | `FollowWorkThatIsStillRunning`   | Patterns/Watch/Follow work that is still running   | queue → `generation-queue-demo`, tray → `task-tray-demo`, result → `result-card-demo`                                  |
| `trace-what-the-agent-did`             | `TraceWhatTheAgentDid`           | Patterns/Watch/Trace what the agent did            | timeline → `trace-timeline-demo`, inspector → `run-inspector-demo`                                                     |
| `compare-candidates-side-by-side`      | `CompareCandidatesSideBySide`    | Patterns/Review/Compare candidates side by side    | grid → `generation-grid-demo`, panes → `compare-viewer-demo`                                                           |
| `approve-edit-regenerate-or-skip`      | `ApproveEditRegenerateOrSkip`    | Patterns/Review/Approve, edit, regenerate or skip  | approval → `approval-card-demo`, changes → `diff-review-demo`, next → `action-stack-demo`                              |
| `find-it-again`                        | `FindItAgain`                    | Patterns/Keep/Find it again                        | library → `asset-library-demo`, chips → `filter-bar-demo`, facets → `filter-panel-demo`, dates → `date-section-demo`   |
| `reuse-a-result-as-the-next-reference` | `ReuseAResultAsTheNextReference` | Patterns/Keep/Reuse a result as the next reference | detail → `asset-detail-demo`, reference → `reference-strip-demo`, tile → `preview-tile-demo`                           |
| `ask-before-a-side-effect`             | `AskBeforeASideEffect`           | Patterns/Trust/Ask before a side effect            | prompt → `permission-prompt-demo`, grants → `autonomy-selector-demo`, trust → `trust-dialog-demo`                      |
| `show-the-sources-behind-an-answer`    | `ShowTheSourcesBehindAnAnswer`   | Patterns/Trust/Show the sources behind an answer   | answer → `answer-block-demo`, marker → `citation-ref-demo`, sources → `source-cards-demo`                              |

A block-sized demo (`asset-library-demo`, `generation-grid-demo`, `asset-detail-demo`) may need its region given a height, `className="h-[28rem]"`, the way `Patterns/AI conversation` gives the stream one. Set it on the region div, never inside the demo.

- [ ] **Step 3: Per pattern, the four commands, then commit.**

```bash
cd apps/docs && pnpm gen:wiring && pnpm contract:emit
cd apps/docs && pnpm exec vitest run scripts/lib/contract-emit.test.ts scripts/lib/pattern-stories.test.ts
cd apps/docs && pnpm check:contract
pnpm --filter storybook exec vitest run --project storybook   # or ./scripts/linux-gate.sh from the root, which is the gate CI runs
```

Expected: all green. If `test:stories` reports a contrast failure inside a composition, it is a cross-component pairing no single component showed (`a11y-baseline.md`). Fix the component, rebind the variable on the surface that paints the background, and never add the story to the exclusion list.

```bash
pnpm exec prettier --write "apps/docs/components/demos/patterns/<slug>-demo.tsx" "apps/storybook/src/stories/patterns/<Pascal>.stories.tsx" "apps/docs/content/patterns/<slug>.pattern.tsx"
git add apps/docs/content/patterns apps/docs/components/demos/patterns apps/storybook/src/stories/patterns apps/docs/lib/patterns.generated.ts apps/docs/index/patterns.toon apps/docs/public/llms apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/scripts/lib/patterns-unfilled.baseline.json
git commit -m "feat(patterns): <title>, composed from <n> components"
```

### Task 10: The decisions, the gap report, the sort order, and the rule book

**Files:**

- Modify: `docs/design-system/decisions.md` (D26 to D29, after the D25 paragraph that ends `red until someone writes the judgment.`)
- Modify: `docs/CONTINUE.md` §8 (a new subsection at the end of the section)
- Modify: `apps/storybook/.storybook/preview.tsx` (`storySort`)
- Modify: repo `CLAUDE.md` (one bullet, under 80 bytes of change)

- [ ] **Step 1: Four decisions.** Insert after D25:

```markdown
### D26 · A pattern names a behaviour and resolves to shipped components, or declares itself unfilled with a reason — 2026-09-15

A pattern module (`content/patterns/<slug>.pattern.tsx`) earns its place when
its title names something the interface does for the user rather than a
component, and it either composes at least one shipped item or is `unfilled`
with `components: []`, no composition, its own `evidence`, and an
`unfilledBecause` of at least 20 characters. A shipped pattern inherits its
components' evidence. Gate: `pattern-schema.ts`, run by
`contract-emit.test.ts`. Spec 2026-09-15 §3.

### D27 · The pattern spine is the lifecycle loop; families are untouched, and the join is a gated field — 2026-09-15

Seven stages from `concept-model.md` §3 in journey order: start, ask, tune,
watch, review, keep, trust. Not the families renamed, and nothing taken from
the reference site that prompted the layer (shapeof.ai, CC-BY-NC-SA) beyond
the observation that a behaviour index has an audience. The two axes meet in
`PatternDocs.components`, and every entry must be a shipped manifest name.

### D28 · Everything a pattern page shows beyond its own module is derived — 2026-09-15

Related patterns (shared components, then stage, then title, capped at four),
the on-page nav, the index, `index/patterns.toon`, the `llms` pages and the
Storybook obligation all derive from the modules and the manifest. A
hand-listed `related` field would be a second copy of the composition graph
(D23). The unfilled set is a shrink-only baseline.

### D29 · The hero is the composition; there is no illustration asset class — 2026-09-15

A pattern page's first section renders its composition live through
`PreviewTabs`; an unfilled pattern renders a grey-box anatomy generated from
its slots and an unfilled badge. No SVG folder, no product screenshots, no
screenshot pipeline. Cards carry no image until derived thumbnails exist.
```

- [ ] **Step 2: The gap report.** Append to `docs/CONTINUE.md` §8, as its last subsection:

```markdown
### Patterns layer, 2026-09-15: what composing `docs-shell` for the site found

The site's chrome is O11 `docs-shell`, composed per `block-build-brief.md`.
Three gaps, none forked around:

- **No slot above the title.** The pattern page wanted its hero as a band
  above the title; the block renders the title first. The hero is the first
  section instead. A `hero` prop rendered between the announcement strip and
  the header would close it.
- **No on-page nav region.** The block has four regions and none of them is a
  right rail. The section nav rides the doc-nav's `navPinned` rows, driven by
  the same array that renders the sections. A `toc` region beside the article
  would close it.
- **Nav rows with `href` are plain anchors.** B3 renders `<a href>`; the site
  loses client-side navigation on every nav click. A `renderLink` prop, or
  accepting an element for `href`, would close it without the block knowing
  about Next.

The unfilled set, held in `scripts/lib/patterns-unfilled.baseline.json`:
`show-the-search-while-it-thinks` (gaps.md U13) and
`review-code-changes-hunk-by-hunk` (gaps.md U15). Each becomes shipped the day
its component does.

Considered and not written, with the reason:

- `confidence-badge` (U5) and `correction-queue` (U6): `DEFER`, one product,
  in `agent-board-analysis.md` §3. No evidence to carry until the extraction
  and vision slices are sampled.
- The 2026-09-01 shapeof.ai leads (branches, draft mode, prompt enhancer,
  watermark, action plan): no in-tree evidence names a product for any of
  them. They are sampling targets, and they get their own names when written.

Wave-2 candidates that passed the §10 walk and were left out of the launch
floor: announce what changed (L3, L4); move between workspaces and tools (B2,
B4, B3); choose how the request is interpreted (D4, D6, E2); pick a preset
instead of a parameter (E4, A8, A7); watch the answer arrive claim by claim
(K7, K6); edit media by editing text (H4, H6, H1); hand a result to another
tool (F4, F3, I4); browse what others made (J3, J6, J4); pick up where you
left off (B6, C4, J4, J5); say when you stopped and why (N10, N11, M6); show
what it costs and what is left (M2, M3, N6, M5).
```

- [ ] **Step 3: Sort the stages under Patterns.** In `apps/storybook/.storybook/preview.tsx`, after `"AI conversation",` inside the Patterns array, add the seven stage folders in spine order:

```ts
            "Start",
            "Ask",
            "Tune",
            "Watch",
            "Review",
            "Keep",
            "Trust",
```

- [ ] **Step 4: The rule book, under the ceiling.** In `CLAUDE.md`, the bullet that begins `**Contracts derive; never hand-edit a`: replace `index/components.toon` with `index/*.toon`, and `The guidance module is the source` with `The guidance or pattern module is the source`. Then:

Run: `wc -c CLAUDE.md && cd apps/docs && pnpm exec vitest run scripts/lib/claude-md.test.ts`
Expected: at most 14,500 bytes, and PASS.

- [ ] **Step 5: Format and commit.**

```bash
pnpm exec prettier --write docs/design-system/decisions.md docs/CONTINUE.md apps/storybook/.storybook/preview.tsx CLAUDE.md
pnpm exec prettier --check docs/design-system/decisions.md docs/CONTINUE.md apps/storybook/.storybook/preview.tsx CLAUDE.md
git add docs/design-system/decisions.md docs/CONTINUE.md apps/storybook/.storybook/preview.tsx CLAUDE.md
git commit -m "docs(patterns): D26 to D29, the docs-shell gaps, the stage order, and the rule book"
```

### Task 11: The twelve gates, in order, and the proof

**Files:** none new.

- [ ] **Step 1: The CI sequence, from the repo root, in `ci.yml` order.**

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

Expected: each green before the next runs. `format:check` may need a second `pnpm format` if `story-conventions.md`'s table re-wraps (CLAUDE.md, CI section).

- [ ] **Step 2: The three that exercise the product.**

```bash
cd apps/docs && pnpm exec playwright test
./scripts/linux-gate.sh
apps/docs/scripts/consumer-test.sh
```

Expected: the smoke run covers `/`, sixteen `/patterns/<slug>` pages, `/components` and every `/components/<name>`; the Storybook gate covers fourteen `Patterns/*` compositions with no change to `a11y-exclusions.baseline.json`; the consumer install is unchanged.

- [ ] **Step 3: Look, then hand over.** `cd apps/docs && pnpm start --port 3100`, open `http://127.0.0.1:3100/` in the Browser pane, walk `/` → a pattern → a component → back to `/components`, in Chrome and in Safari, and screenshot `/` and one pattern page. Confirm `git diff main -- "apps/docs/app/components/[name]/page.tsx"` is empty. Report the local URL and the two screenshots; a Vercel preview is a manual deploy from `apps/docs` with the `weeeha` account and happens only on request.

- [ ] **Step 4: Acceptance, against spec §15.** Tick each line of §15 with the command that proved it, in the PR description, and open the PR against `main` with the plan and the spec linked.
