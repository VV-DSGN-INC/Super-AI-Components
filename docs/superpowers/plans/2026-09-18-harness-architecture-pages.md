# Harness and Architecture Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Harness and Architecture pages on the docs site and in Storybook, rendered from one typed source whose numbers, gate roster and prose are each held to the tree by a test.

**Architecture:** The docs app owns everything. A Node deriver emits `content/system/facts.json`, and a drift test holds it to the tree. A gate roster and a claims ledger are plain data, held to `ci.yml`, `run-gates.sh` and known prose by tests. Two page modules hold prose as strings with `{facts.key}` placeholders. One surface-neutral renderer and four figure components draw them. The Next routes and the Storybook MDX wrappers are thin shells over that renderer.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4 token classes, vitest with Testing Library (jsdom), Storybook with addon-vitest and addon-a11y (Chromium), Playwright, `js-yaml`, the `ds-rules` CLI.

**Spec:** [`../specs/2026-09-18-harness-architecture-pages-design.md`](../specs/2026-09-18-harness-architecture-pages-design.md). Read it first. This plan argues from it.

## Global Constraints

- Work on branch `claude/superai-design-system-alignment-e0e2b0` in `VV-DSGN-INC/Super-AI-Components`. Never commit to `main`. Do not push: Task 11 stops and asks Nick first.
- Use `pnpm`, never npm. Run gates from the **repo root**. Run single test files with `pnpm --filter docs exec vitest run <path relative to apps/docs>`.
- Nothing under `apps/docs/registry/**` changes. `CLAUDE.md` is not edited. No CI step is added: every new test runs inside `pnpm test`.
- `apps/docs/content/system/facts.json` is derived. Never edit it by hand. Regenerate with `cd apps/docs && pnpm facts:emit`.
- Every string in the page modules, `figures.ts`, the roster and the derived rows is public prose. It holds no digit outside backticks and `{facts.key}` placeholders, no em dash, no exclamation mark, none of: tapestry, landscape, delve, elevate, seamless, effortless, unlock, robust, journey, load-bearing, and none of: "here's the kicker", "what people miss", "that distinction matters". When a number describes the repo, use a fact. Number words are for things the page itself defines, such as its four parts.
- All prose in this plan is original. Do not open, quote or paraphrase `pegbo-inc/design-system-rebuild`.
- Component files under `apps/docs/components/system/` use token classes only: no hex, no `oklch()`, no Tailwind palette classes, no gradients, no `transition-all`, no `animate-bounce`, no emoji. Never put `text-muted-foreground` in the same class string as `bg-muted`, `bg-accent` or `bg-secondary`, and never place muted text inside a surface that paints one of those.
- Run `pnpm exec prettier --write <changed files>` before every commit. `format:check` is a CI gate.
- End every commit message with the attribution trailer your session's instructions give you.
- Executor tier: Sonnet, medium effort, one task at a time. The tasks share files, so they do not run in parallel.
- Never delete the Storybook cache while a Storybook dev server is running. Start Storybook on a free port with `-p <port> --ci`.

## Measured answers to the spec's open items

These were measured on 2026-09-18 at `bd816f3`. Do not re-measure them.

| spec §9 question                                                 | answer                                                                                                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does `scan()` check an explicit file outside a rule's scope?     | No. It filters by `detect.scope` and reports `out-of-scope`. Task 7 runs the real CLI with `DS_RULES_DIR` pointing at rescoped copies of the rule JSON                              |
| Do contract gates claim story files outside `stories/super-ai/`? | No. `check-contract.mts` maps each manifest name to `stories/super-ai/<Pascal>.stories.tsx`. Figure stories go in `stories/system/`                                                 |
| Does Storybook's tsconfig need `paths`?                          | Yes. It mirrors the Vite aliases. Task 7 adds both                                                                                                                                  |
| Does `js-yaml` install offline with types?                       | `js-yaml@4.2.0` is in the store. `@types/js-yaml` is not. Task 2 writes a local declaration                                                                                         |
| Which test owns `cssvars-liveness.baseline.json`?                | `apps/docs/scripts/lib/cssvars-liveness.test.ts`                                                                                                                                    |
| Do new routes inherit the docs shell?                            | No. `app/components/layout.tsx` mounts it for `/components/*` only. Task 10 moves the shell into `components/docs-shell.tsx` and adds an `app/(system)/` route group that reuses it |

Two more measurements the tasks rely on:

- Tailwind in Storybook scans `./components`, `./stories` and `../../docs/registry` only. Classes used only under `apps/docs/components/system` would compile to nothing there. Task 7 adds an `@source` line.
- Storybook's sidebar follows a `storySort.order` array in `apps/storybook/.storybook/preview.tsx`. Task 10 adds the two page titles to it.

## File Structure

Created, all under `apps/docs` unless the path says otherwise:

| file                                                                                             | responsibility                                                                                         |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `lib/system-page.ts`                                                                             | types, `FACT_KEYS`, `resolveFacts`, `factKeysIn`, `pageStrings`. No Node imports: Storybook bundles it |
| `scripts/lib/js-yaml.d.ts`                                                                       | local type declaration for the one `js-yaml` function used                                             |
| `scripts/lib/ci-steps.ts`                                                                        | `parseCiSteps`, `readCiSteps`: the ordered, deduped gate steps of `ci.yml`                             |
| `scripts/lib/system-facts.ts`                                                                    | `deriveFacts`, `findLedgers`, `renderFactsFile`, `FactsInputError`                                     |
| `content/system/facts.json`                                                                      | emitted numbers. Never hand-edited                                                                     |
| `content/system/gates.ts`                                                                        | `GATE_ROWS`, `PLUMBING`                                                                                |
| `content/system/derived.ts`                                                                      | `DERIVED_ROWS`                                                                                         |
| `content/system/claims.ts`                                                                       | `CLAIMS`, `claimedNumber`                                                                              |
| `content/system/figures.ts`                                                                      | the words inside the figures, and `figureStrings`                                                      |
| `content/system/harness.page.ts`, `architecture.page.ts`                                         | the two pages as data                                                                                  |
| `components/system/system-page.tsx`                                                              | `SystemPageView`, the renderer                                                                         |
| `components/system/figures.tsx`                                                                  | `FIGURES`, the figure registry                                                                         |
| `components/system/figure-frame.tsx`                                                             | `FigureFrame`: `figure` plus `figcaption`                                                              |
| `components/system/gates-table.tsx`, `derived-table.tsx`                                         | the roster and the derived rows as responsive lists                                                    |
| `components/system/harness-parts.tsx`, `consumer-surfaces.tsx`, `loops.tsx`, `ci-pipeline.tsx`   | the four figures                                                                                       |
| `components/docs-shell.tsx`                                                                      | the docs chrome, shared by two layouts                                                                 |
| `app/(system)/layout.tsx`, `app/(system)/harness/page.tsx`, `app/(system)/architecture/page.tsx` | the Next surface                                                                                       |
| `apps/storybook/src/stories/Harness.mdx`, `Architecture.mdx`                                     | the Storybook surface                                                                                  |
| `apps/storybook/src/stories/system/SystemFigures.stories.tsx`                                    | one story per figure and list, so axe covers them                                                      |

Tests sit beside what they test: `lib/system-page.test.ts`, `scripts/lib/ci-steps.test.ts`, `scripts/lib/system-facts.test.ts`, `content/system/{gates,derived,claims,pages}.test.ts`, `components/system/{system-page.test.tsx,blocks-tokens.test.ts}`.

Modified: `apps/docs/package.json`, `pnpm-lock.yaml`, `.prettierignore`, `apps/docs/components/component-docs.tsx`, `apps/docs/components/docs-nav.tsx`, `apps/docs/app/components/layout.tsx`, `apps/docs/app/page.tsx`, `apps/docs/e2e/smoke.spec.ts`, `apps/storybook/vite.config.ts`, `apps/storybook/tsconfig.json`, `apps/storybook/src/index.css`, `apps/storybook/.storybook/preview.tsx`, `apps/storybook/src/stories/Overview.mdx`, `.claude/skills/gate-run/SKILL.md` (Task 5, conditional), `docs/CONTINUE.md`.

---

### Task 1: Page types and fact placeholders

**Files:**

- Create: `apps/docs/lib/system-page.ts`
- Test: `apps/docs/lib/system-page.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `FACT_KEYS`, `FactKey`, `SystemFacts`, `FigureId`, `PageBlock`, `PageSection`, `SystemPage`, `factKeysIn(text): string[]`, `resolveFacts(text, facts): string`, `pageStrings(page): string[]`.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/lib/system-page.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  FACT_KEYS,
  factKeysIn,
  pageStrings,
  resolveFacts,
  type SystemFacts,
  type SystemPage,
} from "./system-page";

const FACTS = Object.fromEntries(FACT_KEYS.map((key, index) => [key, index + 1])) as SystemFacts;

const PAGE: SystemPage = {
  slug: "harness",
  title: "Title",
  description: "Description",
  lede: ["Lede one", "Lede two"],
  sections: [
    {
      id: "s",
      heading: "Heading",
      blocks: [
        { kind: "p", text: "Paragraph" },
        { kind: "quote", text: "Quote" },
        { kind: "list", items: ["Item"] },
        { kind: "table", columns: ["Col"], rows: [["Cell"]] },
        { kind: "figure", figure: "loops", caption: "Caption" },
        { kind: "gates" },
        { kind: "derived" },
        { kind: "links", items: [{ label: "Label", href: "/x" }] },
      ],
    },
  ],
};

describe("FACT_KEYS", () => {
  it("is sorted, so facts.json diffs stay stable", () => {
    expect([...FACT_KEYS]).toEqual([...FACT_KEYS].sort());
  });
});

describe("resolveFacts", () => {
  it("replaces every placeholder with its number", () => {
    expect(resolveFacts("{facts.ciSteps} steps, {facts.contracts} contracts", FACTS)).toBe(
      "1 steps, 2 contracts",
    );
  });

  it("leaves text without placeholders alone", () => {
    expect(resolveFacts("no numbers here", FACTS)).toBe("no numbers here");
  });

  it("throws on a key that is not a fact", () => {
    expect(() => resolveFacts("{facts.nope}", FACTS)).toThrow("unknown fact placeholder {facts.nope}");
  });
});

describe("factKeysIn", () => {
  it("lists the keys a string uses, in order, repeats included", () => {
    expect(factKeysIn("{facts.rules} and {facts.skills} and {facts.rules}")).toEqual([
      "rules",
      "skills",
      "rules",
    ]);
  });
});

describe("pageStrings", () => {
  it("returns every prose string and nothing for the data blocks", () => {
    expect(pageStrings(PAGE)).toEqual([
      "Title",
      "Description",
      "Lede one",
      "Lede two",
      "Heading",
      "Paragraph",
      "Quote",
      "Item",
      "Col",
      "Cell",
      "Caption",
      "Label",
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter docs exec vitest run lib/system-page.test.ts`
Expected: FAIL, cannot resolve `./system-page`.

- [ ] **Step 3: Write the implementation**

Create `apps/docs/lib/system-page.ts`:

```ts
/**
 * Types and pure helpers for the Harness and Architecture pages.
 *
 * No Node imports here. Storybook bundles this file for the browser through
 * the `@/lib/system-page` alias in apps/storybook/vite.config.ts.
 */

/** Every number the two pages may state. The list is closed: `deriveFacts`
 *  fills exactly these keys, and `pages.test.ts` fails on a key no page uses. */
export const FACT_KEYS = [
  "ciSteps",
  "contracts",
  "ledgers",
  "prosePages",
  "ruleBlockers",
  "rules",
  "rulesJudgment",
  "rulesRendered",
  "rulesStatic",
  "shipped",
  "shippedBlocks",
  "shippedComponents",
  "shippedPrimitives",
  "skills",
  "storyFiles",
] as const;

export type FactKey = (typeof FACT_KEYS)[number];
export type SystemFacts = Record<FactKey, number>;

export type FigureId = "harness-parts" | "consumer-surfaces" | "loops" | "ci-pipeline";

export type PageBlock =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "figure"; figure: FigureId; caption: string }
  | { kind: "gates" }
  | { kind: "derived" }
  | { kind: "links"; items: { label: string; href: string; storybook?: string }[] };

export interface PageSection {
  id: string;
  heading: string;
  blocks: PageBlock[];
}

export interface SystemPage {
  slug: "harness" | "architecture";
  title: string;
  description: string;
  /** True until Nick has done his pass. The renderer prints a draft note. */
  draft?: true;
  lede: string[];
  sections: PageSection[];
}

const PLACEHOLDER = /\{facts\.([A-Za-z]+)\}/g;

/** The fact keys a string uses, in order, repeats included. */
export function factKeysIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]);
}

/** Replaces every `{facts.key}` in `text`. Throws on a key that is not a fact. */
export function resolveFacts(text: string, facts: SystemFacts): string {
  return text.replace(PLACEHOLDER, (_whole, key: string) => {
    if (!(FACT_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unknown fact placeholder {facts.${key}}`);
    }
    return String(facts[key as FactKey]);
  });
}

/** Every prose string on a page, for the tests that police prose. */
export function pageStrings(page: SystemPage): string[] {
  const out = [page.title, page.description, ...page.lede];
  for (const section of page.sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      switch (block.kind) {
        case "p":
        case "quote":
          out.push(block.text);
          break;
        case "list":
          out.push(...block.items);
          break;
        case "table":
          out.push(...block.columns, ...block.rows.flat());
          break;
        case "figure":
          out.push(block.caption);
          break;
        case "links":
          out.push(...block.items.map((item) => item.label));
          break;
        case "gates":
        case "derived":
          break;
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter docs exec vitest run lib/system-page.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write apps/docs/lib/system-page.ts apps/docs/lib/system-page.test.ts
git add apps/docs/lib/system-page.ts apps/docs/lib/system-page.test.ts
git commit -m "feat(system-pages): page types and fact placeholders"
```

---

### Task 2: CI step parser

**Files:**

- Modify: `apps/docs/package.json` (devDependency), `pnpm-lock.yaml`
- Create: `apps/docs/scripts/lib/js-yaml.d.ts`, `apps/docs/scripts/lib/ci-steps.ts`
- Test: `apps/docs/scripts/lib/ci-steps.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `CI_WORKFLOW: string`, `parseCiSteps(yamlText: string): string[]`, `readCiSteps(repoRoot: string): string[]`.

The counting rule, from the spec §4.2: walk every job in document order, keep steps that have a `run:` key, key each by its `name:` when it has one and by its trimmed `run:` string otherwise, drop a key already seen, skip `uses:` steps. This gives twelve today, and still twelve after remediation Task 5 splits `verify` into two jobs that both install.

- [ ] **Step 1: Add the dependency**

```bash
pnpm --filter docs add -D js-yaml@4.2.0 --offline
git diff --stat pnpm-lock.yaml apps/docs/package.json
```

Expected: both files change, and the lockfile diff is a few lines under the `apps/docs` importer. If `--offline` fails, run the same command without it.

- [ ] **Step 2: Write the type declaration**

Create `apps/docs/scripts/lib/js-yaml.d.ts`:

```ts
/** js-yaml ships no types and @types/js-yaml is not installed. This declares
 *  the one function ci-steps.ts uses. The result is `unknown` on purpose: the
 *  caller narrows it. */
declare module "js-yaml" {
  export function load(input: string): unknown;
}
```

- [ ] **Step 3: Write the failing test**

Create `apps/docs/scripts/lib/ci-steps.test.ts`:

```ts
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCiSteps, readCiSteps } from "./ci-steps";

const REPO = resolve(__dirname, "../../../..");

const TWO_JOBS = `
name: CI
on:
  pull_request:
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
  product:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - name: Playwright smoke
        run: |
          pnpm exec playwright install chromium
          pnpm exec playwright test
`;

describe("parseCiSteps", () => {
  it("keeps run steps in document order and keys a named step by its name", () => {
    expect(parseCiSteps(TWO_JOBS)).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm lint",
      "Playwright smoke",
    ]);
  });

  it("skips uses steps", () => {
    expect(parseCiSteps(TWO_JOBS).join(" ")).not.toContain("actions/checkout");
  });

  it("counts a step repeated in a later job once", () => {
    const installs = parseCiSteps(TWO_JOBS).filter((step) => step === "pnpm install --frozen-lockfile");
    expect(installs).toHaveLength(1);
  });

  it("throws when the workflow has no jobs map", () => {
    expect(() => parseCiSteps("name: CI\n")).toThrow("workflow has no jobs map");
  });
});

describe("readCiSteps on this repo", () => {
  it("finds the gate steps the workflow runs", () => {
    const steps = readCiSteps(REPO);
    expect(steps).toContain("pnpm check:tokens");
    expect(steps).toContain("Consumer install test");
    expect(steps[0]).toBe("pnpm install --frozen-lockfile");
  });
});
```

This test does not assert a count. The roster test in Task 4 owns exact equality, so a new CI step needs one edit and not two.

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter docs exec vitest run scripts/lib/ci-steps.test.ts`
Expected: FAIL, cannot resolve `./ci-steps`.

- [ ] **Step 5: Write the implementation**

Create `apps/docs/scripts/lib/ci-steps.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { load } from "js-yaml";

export const CI_WORKFLOW = ".github/workflows/ci.yml";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The gate steps of a workflow, in document order across every job.
 *
 * A step counts when it has a `run:` key. It is keyed by its `name:` when it
 * has one and by its trimmed `run:` string otherwise. A key already seen is
 * dropped, so two jobs that both install count the install once. That is the
 * counting rule CLAUDE.md uses for its step count.
 */
export function parseCiSteps(yamlText: string): string[] {
  const doc = load(yamlText);
  if (!isRecord(doc) || !isRecord(doc.jobs)) throw new Error("workflow has no jobs map");

  const seen = new Set<string>();
  const keys: string[] = [];
  for (const job of Object.values(doc.jobs)) {
    if (!isRecord(job) || !Array.isArray(job.steps)) continue;
    for (const step of job.steps) {
      if (!isRecord(step) || typeof step.run !== "string") continue;
      const key = typeof step.name === "string" ? step.name : step.run.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export function readCiSteps(repoRoot: string): string[] {
  return parseCiSteps(readFileSync(join(repoRoot, CI_WORKFLOW), "utf8"));
}
```

- [ ] **Step 6: Run the test, then typecheck**

Run: `pnpm --filter docs exec vitest run scripts/lib/ci-steps.test.ts`
Expected: PASS, 5 tests.

Run: `pnpm --filter docs typecheck`
Expected: no errors. If `js-yaml` is reported as having no declaration, confirm `js-yaml.d.ts` sits in `apps/docs/scripts/lib/` and that its first line is the `declare module` comment block, with no top-level `import` or `export`.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write apps/docs/scripts/lib/js-yaml.d.ts apps/docs/scripts/lib/ci-steps.ts apps/docs/scripts/lib/ci-steps.test.ts apps/docs/package.json
git add apps/docs/scripts/lib/js-yaml.d.ts apps/docs/scripts/lib/ci-steps.ts apps/docs/scripts/lib/ci-steps.test.ts apps/docs/package.json pnpm-lock.yaml
git commit -m "feat(system-pages): parse ci.yml into ordered, deduped gate steps"
```

---

### Task 3: Facts deriver, emit script and drift test

**Files:**

- Create: `apps/docs/scripts/lib/system-facts.ts`, `apps/docs/content/system/facts.json` (emitted)
- Modify: `apps/docs/package.json` (script), `.prettierignore`
- Test: `apps/docs/scripts/lib/system-facts.test.ts`

**Interfaces:**

- Consumes: `FACT_KEYS`, `FactKey`, `SystemFacts` from `lib/system-page` (Task 1). `CI_WORKFLOW`, `readCiSteps` from `scripts/lib/ci-steps` (Task 2).
- Produces: `FACTS_FILE`, `FACTS_BANNER`, `FACT_SOURCES`, `class FactsInputError`, `findLedgers(repoRoot): string[]`, `deriveFacts(repoRoot, manifest?): SystemFacts`, `renderFactsFile(facts): string`.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/scripts/lib/system-facts.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { deriveFacts, FACTS_FILE, FactsInputError, renderFactsFile } from "./system-facts";

const REPO = resolve(__dirname, "../../../..");
const EMIT = process.env.FACTS_EMIT === "1";

const FIXTURE_FILES: Record<string, string> = {
  ".github/workflows/ci.yml":
    "jobs:\n  verify:\n    steps:\n      - uses: actions/checkout@v4\n      - run: pnpm lint\n      - run: pnpm test\n",
  "packages/ds-rules/rules/core.json": JSON.stringify({
    version: 1,
    rules: [
      { id: "A-1", severity: "blocker", detect: { method: "grep" } },
      { id: "A-2", severity: "blocker", detect: { method: "rendered" } },
      { id: "A-3", severity: "review", detect: { method: "judgment" } },
    ],
  }),
  "apps/docs/registry/super-ai/a.meta.json": "{}",
  "apps/docs/registry/super-ai/b.meta.json": "{}",
  "apps/docs/registry/super-ai/a.tsx": "",
  "apps/storybook/src/stories/super-ai/A.stories.tsx": "",
  "apps/storybook/src/stories/Overview.mdx": "",
  "apps/docs/scripts/lib/x.baseline.json": "{}",
  // Must be ignored: a ledger inside node_modules is not ours.
  "apps/docs/node_modules/pkg/y.baseline.json": "{}",
  ".claude/skills/one/SKILL.md": "",
};

const FIXTURE_MANIFEST = [
  { status: "shipped", layer: "primitive" },
  { status: "shipped", layer: "component" },
  { status: "shipped", layer: "block" },
  { status: "cut", layer: "component" },
] as const;

const roots: string[] = [];

function plant(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "system-facts-"));
  roots.push(root);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("deriveFacts on a planted tree", () => {
  it("counts exactly what was planted", () => {
    expect(deriveFacts(plant(FIXTURE_FILES), FIXTURE_MANIFEST)).toEqual({
      ciSteps: 2,
      contracts: 2,
      ledgers: 1,
      prosePages: 1,
      ruleBlockers: 2,
      rules: 3,
      rulesJudgment: 1,
      rulesRendered: 1,
      rulesStatic: 1,
      shipped: 3,
      shippedBlocks: 1,
      shippedComponents: 1,
      shippedPrimitives: 1,
      skills: 1,
      storyFiles: 1,
    });
  });

  it("throws FactsInputError naming the key when an input is missing", () => {
    const withoutRules = Object.fromEntries(
      Object.entries(FIXTURE_FILES).filter(([rel]) => !rel.startsWith("packages/ds-rules/")),
    );
    expect(() => deriveFacts(plant(withoutRules), FIXTURE_MANIFEST)).toThrow(FactsInputError);
    expect(() => deriveFacts(plant(withoutRules), FIXTURE_MANIFEST)).toThrow('cannot derive "rules"');
  });

  it("throws FactsInputError when a count is zero, so a blind counter cannot pass", () => {
    const noBlocks = FIXTURE_MANIFEST.filter((item) => item.layer !== "block");
    expect(() => deriveFacts(plant(FIXTURE_FILES), noBlocks)).toThrow('cannot derive "shippedBlocks"');
  });
});

describe("deriveFacts on this repo", () => {
  it("finds one contract per shipped item", () => {
    const facts = deriveFacts(REPO);
    expect(facts.contracts).toBe(facts.shipped);
  });
});

describe("facts.json", () => {
  it(EMIT ? "writes the facts file" : "matches the tree", () => {
    const content = renderFactsFile(deriveFacts(REPO));
    const abs = join(REPO, FACTS_FILE);
    if (EMIT) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      return;
    }
    const committed = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    expect(committed, `${FACTS_FILE} is stale. Run: cd apps/docs && pnpm facts:emit`).toBe(content);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter docs exec vitest run scripts/lib/system-facts.test.ts`
Expected: FAIL, cannot resolve `./system-facts`.

- [ ] **Step 3: Write the implementation**

Create `apps/docs/scripts/lib/system-facts.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { MANIFEST } from "../../lib/catalog.manifest";
import type { ManifestItem } from "../../lib/manifest-types";
import { FACT_KEYS, type FactKey, type SystemFacts } from "../../lib/system-page";
import { CI_WORKFLOW, readCiSteps } from "./ci-steps";

export const FACTS_FILE = "apps/docs/content/system/facts.json";
export const FACTS_BANNER = "Derived by `cd apps/docs && pnpm facts:emit`. Do not edit by hand.";

const MANIFEST_FILE = "apps/docs/lib/catalog.manifest.ts";
const CONTRACTS_DIR = "apps/docs/registry/super-ai";
const STORIES_DIR = "apps/storybook/src/stories/super-ai";
const PROSE_DIR = "apps/storybook/src";
const RULES_DIR = "packages/ds-rules/rules";
const LEDGERS_DIR = "apps";
const SKILLS_DIR = ".claude/skills";

/** Where each fact comes from. Used in error messages. */
export const FACT_SOURCES: Record<FactKey, string> = {
  ciSteps: CI_WORKFLOW,
  contracts: CONTRACTS_DIR,
  ledgers: LEDGERS_DIR,
  prosePages: PROSE_DIR,
  ruleBlockers: RULES_DIR,
  rules: RULES_DIR,
  rulesJudgment: RULES_DIR,
  rulesRendered: RULES_DIR,
  rulesStatic: RULES_DIR,
  shipped: MANIFEST_FILE,
  shippedBlocks: MANIFEST_FILE,
  shippedComponents: MANIFEST_FILE,
  shippedPrimitives: MANIFEST_FILE,
  skills: SKILLS_DIR,
  storyFiles: STORIES_DIR,
};

/** "Could not check" is its own error. It must never look like a clean count. */
export class FactsInputError extends Error {
  constructor(
    readonly key: FactKey,
    readonly source: string,
    detail: string,
  ) {
    super(`facts: cannot derive "${key}" from ${source}: ${detail}`);
    this.name = "FactsInputError";
  }
}

type ManifestSlice = ReadonlyArray<Pick<ManifestItem, "status" | "layer">>;

interface RuleRecord {
  severity: string;
  detect: { method: string };
}

/** Repo-relative paths of the files under `rel` that `keep` accepts, sorted.
 *  Skips node_modules and dot directories. */
function filesUnder(repoRoot: string, rel: string, keep: (name: string) => boolean, key: FactKey): string[] {
  if (!existsSync(join(repoRoot, rel))) throw new FactsInputError(key, rel, "path does not exist");
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const child = `${dir}/${entry.name}`;
      if (entry.isDirectory()) visit(child);
      else if (keep(entry.name)) out.push(child);
    }
  };
  visit(rel);
  return out.sort();
}

/** Every shrink-only ledger, repo-relative. The roster test compares this set
 *  with the ledgers the roster claims. */
export function findLedgers(repoRoot: string): string[] {
  return filesUnder(repoRoot, LEDGERS_DIR, (name) => name.endsWith(".baseline.json"), "ledgers");
}

function readRules(repoRoot: string): RuleRecord[] {
  const files = filesUnder(repoRoot, RULES_DIR, (name) => name.endsWith(".json"), "rules");
  return files.flatMap((file) => {
    let doc: { rules?: unknown };
    try {
      doc = JSON.parse(readFileSync(join(repoRoot, file), "utf8")) as { rules?: unknown };
    } catch (error) {
      throw new FactsInputError("rules", file, `unparseable: ${(error as Error).message}`);
    }
    if (!Array.isArray(doc.rules)) throw new FactsInputError("rules", file, "no rules array");
    return doc.rules as RuleRecord[];
  });
}

function countSkills(repoRoot: string): number {
  const abs = join(repoRoot, SKILLS_DIR);
  if (!existsSync(abs)) throw new FactsInputError("skills", SKILLS_DIR, "path does not exist");
  return readdirSync(abs, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

function countCiSteps(repoRoot: string): number {
  try {
    return readCiSteps(repoRoot).length;
  } catch (error) {
    throw new FactsInputError("ciSteps", CI_WORKFLOW, (error as Error).message);
  }
}

export function deriveFacts(repoRoot: string, manifest: ManifestSlice = MANIFEST): SystemFacts {
  const shipped = manifest.filter((item) => item.status === "shipped");
  const inLayer = (layer: ManifestItem["layer"]) => shipped.filter((item) => item.layer === layer).length;
  const rules = readRules(repoRoot);
  const byMethod = (...methods: string[]) =>
    rules.filter((rule) => methods.includes(rule.detect.method)).length;

  const facts: SystemFacts = {
    ciSteps: countCiSteps(repoRoot),
    contracts: filesUnder(repoRoot, CONTRACTS_DIR, (name) => name.endsWith(".meta.json"), "contracts").length,
    ledgers: findLedgers(repoRoot).length,
    prosePages: filesUnder(repoRoot, PROSE_DIR, (name) => name.endsWith(".mdx"), "prosePages").length,
    ruleBlockers: rules.filter((rule) => rule.severity === "blocker").length,
    rules: rules.length,
    rulesJudgment: byMethod("judgment"),
    rulesRendered: byMethod("rendered"),
    rulesStatic: byMethod("grep", "heuristic"),
    shipped: shipped.length,
    shippedBlocks: inLayer("block"),
    shippedComponents: inLayer("component"),
    shippedPrimitives: inLayer("primitive"),
    skills: countSkills(repoRoot),
    storyFiles: filesUnder(repoRoot, STORIES_DIR, (name) => name.endsWith(".stories.tsx"), "storyFiles")
      .length,
  };

  for (const key of FACT_KEYS) {
    if (!(facts[key] > 0)) throw new FactsInputError(key, FACT_SOURCES[key], "count is zero");
  }
  return facts;
}

/** The emitted file: a banner, then the keys in alphabetical order. This is
 *  exactly what JSON.stringify prints, so prettier has nothing to change. */
export function renderFactsFile(facts: SystemFacts): string {
  const sorted = Object.fromEntries([...FACT_KEYS].sort().map((key) => [key, facts[key]]));
  return `${JSON.stringify({ generated: FACTS_BANNER, ...sorted }, null, 2)}\n`;
}
```

- [ ] **Step 4: Run the test to see only the drift case fail**

Run: `pnpm --filter docs exec vitest run scripts/lib/system-facts.test.ts`
Expected: 4 PASS, 1 FAIL. The failing test is "matches the tree", with the message `apps/docs/content/system/facts.json is stale. Run: cd apps/docs && pnpm facts:emit`.

- [ ] **Step 5: Add the emit script and ignore the file in prettier**

In `apps/docs/package.json`, add this line to `"scripts"`, directly after the `"contract:emit"` line:

```json
"facts:emit": "FACTS_EMIT=1 vitest run scripts/lib/system-facts.test.ts",
```

At the end of `.prettierignore`, add:

```
# Derived by apps/docs/scripts/lib/system-facts.test.ts (`pnpm facts:emit`) and
# byte-compared by the same test. The emitter owns its shape.
apps/docs/content/system/facts.json
```

- [ ] **Step 6: Emit, then run the test to verify it passes**

```bash
cd apps/docs && pnpm facts:emit && cd ../..
cat apps/docs/content/system/facts.json
pnpm --filter docs exec vitest run scripts/lib/system-facts.test.ts
```

Expected: the file holds `generated` plus fifteen numeric keys, with `ciSteps` 12, `shipped` 116, `contracts` 116, `rules` 20 and `ledgers` 4. Then PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write apps/docs/scripts/lib/system-facts.ts apps/docs/scripts/lib/system-facts.test.ts apps/docs/package.json
git add apps/docs/scripts/lib/system-facts.ts apps/docs/scripts/lib/system-facts.test.ts apps/docs/package.json apps/docs/content/system/facts.json .prettierignore
git commit -m "feat(system-pages): derive facts from the tree, emit and drift-gate them"
```

---

### Task 4: Gate roster and derived-files rows

**Files:**

- Create: `apps/docs/content/system/gates.ts`, `apps/docs/content/system/derived.ts`
- Test: `apps/docs/content/system/gates.test.ts`, `apps/docs/content/system/derived.test.ts`

**Interfaces:**

- Consumes: `readCiSteps` (Task 2), `findLedgers` (Task 3).
- Produces: `GateKind`, `GateCheck`, `GateRow`, `GATE_ROWS`, `PLUMBING`, `DerivedRow`, `DERIVED_ROWS`.

Every `title`, `protects`, `blindSpot` and `note` string below is public prose and is scanned by Task 6's test. Keep the prose rules in Global Constraints when editing them.

- [ ] **Step 1: Write the failing roster test**

Create `apps/docs/content/system/gates.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readCiSteps } from "@/scripts/lib/ci-steps";
import { findLedgers } from "@/scripts/lib/system-facts";

import { GATE_ROWS, PLUMBING } from "./gates";

const REPO = resolve(__dirname, "../../../..");

/** The labels run-gates.sh gives its steps, in order: `run "<label>" <command>`. */
function localLabels(): string[] {
  const text = readFileSync(join(REPO, ".claude/skills/gate-run/run-gates.sh"), "utf8");
  return [...text.matchAll(/^run "([^"]+)"/gm)].map((match) => match[1]);
}

/** The scripts chained by the docs app's check:contract, repo-relative. */
function contractChain(): string[] {
  const pkg = JSON.parse(readFileSync(join(REPO, "apps/docs/package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  return [...pkg.scripts["check:contract"].matchAll(/scripts\/[\w-]+\.mts/g)].map(
    (match) => `apps/docs/${match[0]}`,
  );
}

describe("GATE_ROWS", () => {
  it("lists every gate step in ci.yml, in ci.yml's order", () => {
    const plumbing = new Set(PLUMBING.map((entry) => entry.ciStep));
    const ci = readCiSteps(REPO).filter((step) => !plumbing.has(step));
    expect(
      GATE_ROWS.map((row) => row.ciStep),
      "a ci.yml step is on neither list: add a GateRow, or a PLUMBING entry with a reason",
    ).toEqual(ci);
  });

  it("has no PLUMBING entry for a step ci.yml does not run", () => {
    const ci = readCiSteps(REPO);
    for (const entry of PLUMBING) expect(ci, entry.ciStep).toContain(entry.ciStep);
  });

  it("matches run-gates.sh, label for label, in order", () => {
    expect(GATE_ROWS.map((row) => row.localLabel)).toEqual(localLabels());
  });

  it("cites only files that exist", () => {
    for (const row of GATE_ROWS) {
      for (const path of [...row.checks.map((check) => check.file), ...(row.ledgers ?? [])]) {
        expect(existsSync(join(REPO, path)), `${row.ciStep} cites ${path}`).toBe(true);
      }
    }
  });

  it("gives every row a sentence and at least one check", () => {
    for (const row of GATE_ROWS) {
      expect(row.protects.length, row.ciStep).toBeGreaterThan(20);
      expect(row.checks.length, row.ciStep).toBeGreaterThan(0);
    }
  });

  it("lists every script in the docs app's check:contract chain", () => {
    const row = GATE_ROWS.find((candidate) => candidate.ciStep === "pnpm check:contract");
    const cited = row?.checks.map((check) => check.file) ?? [];
    for (const script of contractChain()) expect(cited, script).toContain(script);
  });

  it("places every shrink-only ledger on a row, and claims none that is not there", () => {
    const claimed = GATE_ROWS.flatMap((row) => row.ledgers ?? []).sort();
    expect(claimed).toEqual(findLedgers(REPO));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter docs exec vitest run content/system/gates.test.ts`
Expected: FAIL, cannot resolve `./gates`.

- [ ] **Step 3: Write the roster**

Create `apps/docs/content/system/gates.ts`:

```ts
/**
 * The gate roster: every step CI runs, as data.
 *
 * gates.test.ts holds this list to .github/workflows/ci.yml and to
 * .claude/skills/gate-run/run-gates.sh, in order. The Architecture page and
 * the CI pipeline figure print it. Every string here is public prose.
 *
 * No Node imports: Storybook bundles this file.
 */

export type GateKind = "install" | "static" | "test" | "build" | "browser";

export interface GateCheck {
  /** Repo-relative path of the script, config or test that does the checking. */
  file: string;
  protects: string;
}

export interface GateRow {
  /** The step's `name:` in ci.yml when it has one, otherwise its `run:` string. */
  ciStep: string;
  /** The label run-gates.sh gives the same step. */
  localLabel: string;
  title: string;
  kind: GateKind;
  /** One sentence: what breaks, and for whom, when this gate is off. */
  protects: string;
  checks: GateCheck[];
  /** Shrink-only ledgers this gate enforces, repo-relative. */
  ledgers?: string[];
  /** What this gate is known not to see. Printed on the page. */
  blindSpot?: string;
  /** True for the steps that exercise what a consumer installs. */
  product?: true;
}

/** ci.yml `run:` steps that are not gates, each with its reason. */
export const PLUMBING: { ciStep: string; reason: string }[] = [];

export const GATE_ROWS: GateRow[] = [
  {
    ciStep: "pnpm install --frozen-lockfile",
    localLabel: "install",
    title: "Install from the lockfile",
    kind: "install",
    protects:
      "Every gate below runs against the dependency versions the lockfile records, so nothing passes on a newer package than the one that ships.",
    checks: [{ file: "pnpm-lock.yaml", protects: "The resolved version of every dependency." }],
  },
  {
    ciStep: "pnpm lint",
    localLabel: "lint",
    title: "Lint",
    kind: "static",
    protects: "Catches unescaped quotes in JSX prose and unused code before a reviewer has to.",
    checks: [
      { file: "apps/docs/eslint.config.mjs", protects: "Rules for the docs app and the registry sources." },
      { file: "apps/storybook/eslint.config.mjs", protects: "Rules for the stories." },
    ],
  },
  {
    ciStep: "pnpm format:check",
    localLabel: "format:check",
    title: "Formatting",
    kind: "static",
    protects:
      "Keeps a diff about the change. A generated file that must match its generator byte for byte is listed as ignored and is never reformatted.",
    checks: [
      { file: ".prettierrc.json", protects: "The one formatting configuration." },
      { file: ".prettierignore", protects: "The generated files whose emitters own their shape." },
    ],
  },
  {
    ciStep: "pnpm typecheck",
    localLabel: "typecheck",
    title: "Types",
    kind: "static",
    protects:
      "A prop a component does not declare is an error here, in the registry sources, the stories and the rule records alike.",
    checks: [
      { file: "apps/docs/tsconfig.json", protects: "The docs app, the registry and the scripts." },
      { file: "apps/storybook/tsconfig.json", protects: "The stories, against the real component types." },
      { file: "packages/ds-rules/tsconfig.json", protects: "The rule records." },
    ],
  },
  {
    ciStep: "pnpm check:tokens",
    localLabel: "check:tokens",
    title: "Token contract",
    kind: "static",
    protects:
      "No raw colour, palette class, gradient or banned motion utility reaches a registry component, so a consumer's theme restyles everything they install.",
    checks: [
      { file: "packages/ds-rules/rulecheck.mjs", protects: "The detector." },
      {
        file: "packages/ds-rules/rules/core.json",
        protects: "The bans shared with the sibling design system.",
      },
      { file: "packages/ds-rules/rules/local.json", protects: "The bans specific to this repository." },
    ],
    blindSpot:
      "It reads one class string at a time. Muted text in a child whose ancestor paints the muted surface passes here, and every contrast bug that shipped had that shape. The accessibility step below is the backstop.",
  },
  {
    ciStep: "pnpm check:contract",
    localLabel: "check:contract",
    title: "Manifest, story and docs contract",
    kind: "static",
    protects:
      "Every catalog item has the story exports its declared states promise, documentation whose citations resolve, and dependencies reconciled from real imports.",
    checks: [
      {
        file: "apps/docs/scripts/check-contract.mts",
        protects: "Manifest, story and docs agreement, and the generated wiring files byte for byte.",
      },
      {
        file: "apps/docs/scripts/check-citations.mts",
        protects: "Every backticked citation in the component docs.",
      },
      {
        file: "apps/docs/scripts/reconcile-deps.mts",
        protects: "Declared dependencies against what the source really imports.",
      },
    ],
  },
  {
    ciStep: "pnpm test",
    localLabel: "test",
    title: "Unit tests and ratchets",
    kind: "test",
    protects:
      "The ledgers below may shrink and never grow, derived files must match their sources, and the numbers on this page must match the tree.",
    checks: [
      {
        file: "apps/docs/lib/catalog.manifest.test.ts",
        protects: "The catalog is complete and the cut families stay cut.",
      },
      {
        file: "apps/docs/scripts/new-component.test.ts",
        protects: "The scaffolder never emits a state named `default`.",
      },
      {
        file: "apps/docs/scripts/lib/a11y-ratchet.test.ts",
        protects: "The accessibility exclusion list only shrinks.",
      },
      {
        file: "apps/docs/scripts/lib/story-coverage.test.ts",
        protects: "Unmet story obligations only shrink.",
      },
      {
        file: "apps/docs/scripts/lib/contract-coverage.test.ts",
        protects: "Unwritten contract fields only shrink.",
      },
      {
        file: "apps/docs/scripts/lib/cssvars-liveness.test.ts",
        protects: "Every CSS variable a component reads resolves, and none is declared unread.",
      },
      {
        file: "apps/docs/scripts/lib/contract-emit.test.ts",
        protects:
          "Installed contracts, the routing table and the `llms.txt` corpus match the guidance modules.",
      },
      {
        file: "apps/docs/scripts/lib/claude-md.test.ts",
        protects: "The instructions file stays under its byte ceiling, and each rule in it names a gate.",
      },
      {
        file: "packages/ds-rules/src/emit.test.ts",
        protects: "The emitted rule JSON matches the typed records.",
      },
      {
        file: "apps/docs/scripts/lib/system-facts.test.ts",
        protects: "The numbers on these pages match the tree.",
      },
      {
        file: "apps/docs/content/system/gates.test.ts",
        protects: "This roster matches the workflow and the local gate script.",
      },
    ],
    ledgers: [
      "apps/docs/cssvars-liveness.baseline.json",
      "apps/docs/scripts/lib/contract-coverage.baseline.json",
      "apps/docs/scripts/lib/story-coverage.baseline.json",
      "apps/storybook/a11y-exclusions.baseline.json",
    ],
  },
  {
    ciStep: "pnpm build:registry",
    localLabel: "build:registry",
    title: "Registry build",
    kind: "build",
    protects:
      "Regenerates what consumers install. A stale registry is invisible locally and broken for them.",
    checks: [
      {
        file: "apps/docs/scripts/gen-wiring.mts",
        protects: "The generated wiring between manifest, demos and docs.",
      },
      {
        file: "apps/docs/scripts/gen-registry.mts",
        protects: "The registry index that `shadcn build` reads.",
      },
    ],
  },
  {
    ciStep: "pnpm build",
    localLabel: "build",
    title: "Full build",
    kind: "build",
    protects: "The docs app and Storybook both compile from the same sources the registry ships.",
    checks: [
      { file: "apps/docs/next.config.ts", protects: "The docs app build." },
      { file: "apps/storybook/.storybook/main.ts", protects: "The Storybook build." },
    ],
  },
  {
    ciStep: "Playwright smoke",
    localLabel: "playwright smoke",
    title: "Smoke test of every page",
    kind: "browser",
    protects: "Every component page renders in a real browser without a console error.",
    checks: [
      { file: "apps/docs/e2e/smoke.spec.ts", protects: "One test per catalog item, plus the system pages." },
      { file: "apps/docs/playwright.config.ts", protects: "Serves the built app on its own port." },
    ],
    blindSpot:
      "It serves the prebuilt app. Edit a source file without rebuilding and a green run proves nothing.",
    product: true,
  },
  {
    ciStep: "Storybook a11y + interaction",
    localLabel: "storybook a11y",
    title: "Accessibility and interaction",
    kind: "browser",
    protects:
      "Every story passes axe and its own interaction assertions in Chromium. This is the step that catches the contrast shape the token gate cannot see.",
    checks: [
      {
        file: "apps/storybook/vitest.config.ts",
        protects: "Runs every story in a browser, with the exclusion list the ratchet guards.",
      },
    ],
    product: true,
  },
  {
    ciStep: "Consumer install test",
    localLabel: "consumer install",
    title: "Consumer install",
    kind: "build",
    protects:
      "Installs every item into a fresh app with `shadcn add` and builds it. A component that looks right here and breaks there has failed.",
    checks: [
      { file: "apps/docs/scripts/consumer-test.sh", protects: "The install and the build, end to end." },
    ],
    product: true,
  },
];
```

- [ ] **Step 4: Run the roster test to verify it passes**

Run: `pnpm --filter docs exec vitest run content/system/gates.test.ts`
Expected: PASS, 7 tests. If the ledger test fails, print `findLedgers` output and correct the `ledgers` array to match it exactly, sorted.

- [ ] **Step 5: Write the failing derived-rows test**

Create `apps/docs/content/system/derived.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DERIVED_ROWS } from "./derived";

const REPO = resolve(__dirname, "../../../..");
const isPattern = (path: string) => /[*<]/.test(path);

describe("DERIVED_ROWS", () => {
  it("cites a source and a holder that exist", () => {
    for (const row of DERIVED_ROWS) {
      expect(existsSync(join(REPO, row.source)), row.source).toBe(true);
      expect(existsSync(join(REPO, row.heldBy)), row.heldBy).toBe(true);
    }
  });

  it("lists committed outputs that exist, and skips patterns and uncommitted ones", () => {
    for (const row of DERIVED_ROWS) {
      if (!row.committed) continue;
      for (const path of row.derived.filter((candidate) => !isPattern(candidate))) {
        expect(existsSync(join(REPO, path)), path).toBe(true);
      }
    }
  });

  it("includes the facts file these pages read", () => {
    expect(DERIVED_ROWS.flatMap((row) => row.derived)).toContain("apps/docs/content/system/facts.json");
  });
});
```

Run: `pnpm --filter docs exec vitest run content/system/derived.test.ts`
Expected: FAIL, cannot resolve `./derived`.

- [ ] **Step 6: Write the derived rows**

Create `apps/docs/content/system/derived.ts`:

```ts
/**
 * Files in this repository that are outputs: what each derives from, the
 * command that writes it, and what holds it to its source. Every `note` is
 * public prose. No Node imports: Storybook bundles this file.
 */

export interface DerivedRow {
  /** Repo-relative source the outputs are written from. */
  source: string;
  /** Repo-relative outputs. An entry with `*` or `<` is a pattern. */
  derived: string[];
  command: string;
  /** Repo-relative test or script that compares output with source. */
  heldBy: string;
  committed: boolean;
  note: string;
}

export const DERIVED_ROWS: DerivedRow[] = [
  {
    source: "apps/docs/registry/super-ai",
    derived: ["apps/docs/public/r"],
    command: "pnpm build:registry",
    heldBy: "apps/docs/scripts/consumer-test.sh",
    committed: false,
    note: "What `shadcn add` downloads. Built fresh in CI and never committed.",
  },
  {
    source: "apps/docs/content/components",
    derived: [
      "apps/docs/registry/super-ai/<name>.meta.json",
      "apps/docs/index/components.toon",
      "apps/docs/public/llms.txt",
      "apps/docs/public/llms-full.txt",
      "apps/docs/public/llms",
    ],
    command: "cd apps/docs && pnpm contract:emit",
    heldBy: "apps/docs/scripts/lib/contract-emit.test.ts",
    committed: true,
    note: "The contracts layer. One guidance module per component is the source for all of it.",
  },
  {
    source: "packages/ds-rules/src",
    derived: ["packages/ds-rules/rules/core.json", "packages/ds-rules/rules/local.json"],
    command: "pnpm --filter ds-rules rules:emit",
    heldBy: "packages/ds-rules/src/emit.test.ts",
    committed: true,
    note: "The rule records as JSON, which is what the detector reads.",
  },
  {
    source: "apps/docs/lib/catalog.manifest.ts",
    derived: ["apps/docs/lib/demos.generated.ts", "apps/docs/lib/docs.generated.ts"],
    command: "cd apps/docs && pnpm gen:wiring",
    heldBy: "apps/docs/scripts/check-contract.mts",
    committed: true,
    note: "The wiring from each catalog item to its demo and its documentation.",
  },
  {
    source: "apps/docs/scripts/lib/system-facts.ts",
    derived: ["apps/docs/content/system/facts.json"],
    command: "cd apps/docs && pnpm facts:emit",
    heldBy: "apps/docs/scripts/lib/system-facts.test.ts",
    committed: true,
    note: "The numbers on these pages, counted from the tree.",
  },
];
```

- [ ] **Step 7: Run both tests, then commit**

Run: `pnpm --filter docs exec vitest run content/system/`
Expected: PASS, 10 tests across 2 files.

```bash
pnpm exec prettier --write apps/docs/content/system/gates.ts apps/docs/content/system/gates.test.ts apps/docs/content/system/derived.ts apps/docs/content/system/derived.test.ts
git add apps/docs/content/system/gates.ts apps/docs/content/system/gates.test.ts apps/docs/content/system/derived.ts apps/docs/content/system/derived.test.ts
git commit -m "feat(system-pages): gate roster held to ci.yml and run-gates.sh, and the derived-files rows"
```

---

### Task 5: Claims ledger

**Files:**

- Create: `apps/docs/content/system/claims.ts`
- Test: `apps/docs/content/system/claims.test.ts`
- Modify: `apps/docs/content/system/gates.ts` (one check row)
- Modify, conditionally: `.claude/skills/gate-run/SKILL.md`, `docs/superpowers/plans/2026-09-17-project-review-remediation.md`

**Interfaces:**

- Consumes: `FactKey` (Task 1), `deriveFacts` (Task 3).
- Produces: `Claim`, `CLAIMS`, `claimedNumber(raw: string): number`.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/content/system/claims.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { deriveFacts } from "@/scripts/lib/system-facts";

import { claimedNumber, CLAIMS } from "./claims";

const REPO = resolve(__dirname, "../../../..");

describe("claimedNumber", () => {
  it("reads digits and number words, any case", () => {
    expect(claimedNumber("116")).toBe(116);
    expect(claimedNumber("Twelve")).toBe(12);
    expect(claimedNumber("eleven")).toBe(11);
  });

  it("returns -1 for a word it does not know", () => {
    expect(claimedNumber("several")).toBe(-1);
  });
});

describe("CLAIMS", () => {
  const facts = deriveFacts(REPO);

  for (const claim of CLAIMS) {
    it(`${claim.file}: ${claim.note}`, () => {
      const text = readFileSync(join(REPO, claim.file), "utf8");
      const match = claim.pattern.exec(text);
      expect(
        match,
        `pattern ${claim.pattern} matches nothing in ${claim.file}. Update or remove the claim.`,
      ).not.toBeNull();
      expect(
        claimedNumber(match![1]),
        `${claim.file} says "${match![0]}" and the tree says ${facts[claim.fact]}`,
      ).toBe(facts[claim.fact]);
    });
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter docs exec vitest run content/system/claims.test.ts`
Expected: FAIL, cannot resolve `./claims`.

- [ ] **Step 3: Write the ledger**

Create `apps/docs/content/system/claims.ts`:

```ts
import type { FactKey } from "@/lib/system-page";

/**
 * Counts typed into prose elsewhere in the repo, each pinned to a fact.
 *
 * The ledger does not discover new claims. It stops the known ones from
 * drifting. A pattern that matches nothing fails, so an entry cannot go dead
 * quietly. Capture group 1 is the number, as digits or as a number word.
 */
export interface Claim {
  /** Repo-relative file that holds the claim. */
  file: string;
  pattern: RegExp;
  fact: FactKey;
  note: string;
}

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

/** Digits or a number word up to twenty. Returns -1 for anything else. */
export function claimedNumber(raw: string): number {
  return /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS.indexOf(raw.toLowerCase());
}

export const CLAIMS: Claim[] = [
  {
    file: "CLAUDE.md",
    pattern: /^(\w+) steps\. The last three/m,
    fact: "ciSteps",
    note: "the CI section's step count",
  },
  {
    file: "CLAUDE.md",
    pattern: /Catalog status: (\d+) of \d+ shipped/,
    fact: "shipped",
    note: "the catalog status line",
  },
  {
    file: ".claude/skills/gate-run/SKILL.md",
    pattern: /^(\w+) steps, in/m,
    fact: "ciSteps",
    note: "the gate-run skill's step count",
  },
];
```

- [ ] **Step 4: Run the test and read which claims fail**

Run: `pnpm --filter docs exec vitest run content/system/claims.test.ts`

Two outcomes are possible, depending on whether remediation Task 5 has landed:

- The `gate-run/SKILL.md` claim FAILS with `says "Eleven steps, in" and the tree says 12`. That is the ledger's first catch. Go to Step 5.
- Everything PASSES. Task 5 already changed the word. Skip Step 5.

- [ ] **Step 5: Fix the stale word (only if Step 4 failed on SKILL.md)**

In `.claude/skills/gate-run/SKILL.md`, line 12, change the first word `Eleven` to `Twelve`. Change nothing else on the line.

Then keep remediation Task 5 executable. In `docs/superpowers/plans/2026-09-17-project-review-remediation.md`, find Task 5, "Step 4: Update the skill text". Its first fenced block quotes the old sentence. Change that block's first word from `Eleven` to `Twelve`, so the executor of that plan still finds the text it is told to replace.

Run: `pnpm --filter docs exec vitest run content/system/claims.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Put the new test on the roster**

In `apps/docs/content/system/gates.ts`, in the `pnpm test` row's `checks` array, add after the `gates.test.ts` entry:

```ts
      {
        file: "apps/docs/content/system/claims.test.ts",
        protects: "Counts typed into prose elsewhere match the tree.",
      },
```

Run: `pnpm --filter docs exec vitest run content/system/`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write apps/docs/content/system/claims.ts apps/docs/content/system/claims.test.ts apps/docs/content/system/gates.ts .claude/skills/gate-run/SKILL.md docs/superpowers/plans/2026-09-17-project-review-remediation.md
git add apps/docs/content/system/claims.ts apps/docs/content/system/claims.test.ts apps/docs/content/system/gates.ts .claude/skills/gate-run/SKILL.md docs/superpowers/plans/2026-09-17-project-review-remediation.md
git commit -m "feat(system-pages): claims ledger pins the counts typed into prose"
```

If Step 5 was skipped, `git add` reports nothing to add for the two conditional files. That is fine.

---

### Task 6: Figure words, the two page modules, and the prose test

**Files:**

- Create: `apps/docs/content/system/figures.ts`, `apps/docs/content/system/harness.page.ts`, `apps/docs/content/system/architecture.page.ts`
- Test: `apps/docs/content/system/pages.test.ts`
- Modify: `apps/docs/content/system/gates.ts` (one check row)

**Interfaces:**

- Consumes: `SystemPage`, `FACT_KEYS`, `factKeysIn`, `pageStrings` (Task 1). `GATE_ROWS` (Task 4). `DERIVED_ROWS` (Task 4).
- Produces: `HarnessPart`, `HARNESS_PARTS`, `ConsumerSurface`, `CONSUMER_SURFACES`, `LoopStep`, `BUILD_LOOP`, `REJECTION_EDGE`, `AUDIT_LOOP`, `figureStrings(): string[]`, `harnessPage: SystemPage`, `architecturePage: SystemPage`.

The prose below is a draft. `ONE_LINER` and `LEDE` in `harness.page.ts` are Nick's to write, and both pages carry `draft: true` until he has done his pass. Do not remove the flag.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/content/system/pages.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { FACT_KEYS, factKeysIn, pageStrings } from "@/lib/system-page";

import { architecturePage } from "./architecture.page";
import { DERIVED_ROWS } from "./derived";
import { figureStrings } from "./figures";
import { GATE_ROWS } from "./gates";
import { harnessPage } from "./harness.page";

const REPO = resolve(__dirname, "../../../..");
const DOCS = join(REPO, "apps/docs");

const rosterStrings = GATE_ROWS.flatMap((row) => [
  row.title,
  row.protects,
  row.blindSpot ?? "",
  ...row.checks.map((check) => check.protects),
]);

/** Every public prose string, with where it lives. */
const PROSE: { where: string; text: string }[] = [
  ...pageStrings(harnessPage).map((text) => ({ where: "harness.page.ts", text })),
  ...pageStrings(architecturePage).map((text) => ({ where: "architecture.page.ts", text })),
  ...figureStrings().map((text) => ({ where: "figures.ts", text })),
  ...rosterStrings.map((text) => ({ where: "gates.ts", text })),
  ...DERIVED_ROWS.map((row) => ({ where: "derived.ts", text: row.note })),
].filter((entry) => entry.text !== "");

/** Exact strings allowed to hold a digit outside backticks, each with a reason. */
const DIGIT_ALLOWLIST: { text: string; reason: string }[] = [];

/** Backticked paths a fresh checkout does not have, each with a reason. */
const GENERATED_PATHS: { path: string; reason: string }[] = [];

const BANNED_WORDS = [
  "tapestry",
  "landscape",
  "delve",
  "elevate",
  "seamless",
  "effortless",
  "unlock",
  "robust",
  "journey",
  "load-bearing",
];
const BANNED_PHRASES = ["here's the kicker", "what people miss", "that distinction matters"];

/** The text with code and fact placeholders removed: what the prose rules read. */
const bare = (text: string) => text.replace(/`[^`]*`/g, "").replace(/\{facts\.[A-Za-z]+\}/g, "");
const backticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
const looksLikeRepoPath = (token: string) =>
  token.includes("/") && !/[\s*{<[]/.test(token) && !/^(\/|@|[a-z]+:\/\/)/.test(token);

describe("facts on the pages", () => {
  it("uses only placeholders that name a real fact", () => {
    for (const { where, text } of PROSE) {
      for (const key of factKeysIn(text)) expect(FACT_KEYS, `${where}: {facts.${key}}`).toContain(key);
    }
  });

  it("uses every fact. A key nothing prints is removed from the deriver", () => {
    const used = new Set(PROSE.flatMap(({ text }) => factKeysIn(text)));
    expect([...used].sort()).toEqual([...FACT_KEYS]);
  });

  it("types no digit into prose", () => {
    const allowed = new Set(DIGIT_ALLOWLIST.map((entry) => entry.text));
    for (const { where, text } of PROSE) {
      if (allowed.has(text)) continue;
      expect(bare(text), `${where}: "${text}"`).not.toMatch(/\d/);
    }
  });

  it("keeps no dead allowlist entry", () => {
    const all = new Set(PROSE.map((entry) => entry.text));
    for (const entry of DIGIT_ALLOWLIST) expect(all.has(entry.text), entry.text).toBe(true);
    const cited = new Set(PROSE.flatMap(({ text }) => backticked(text)));
    for (const entry of GENERATED_PATHS) expect(cited.has(entry.path), entry.path).toBe(true);
  });
});

describe("citations on the pages", () => {
  it("cites only repo paths that exist", () => {
    const generated = new Set(GENERATED_PATHS.map((entry) => entry.path));
    for (const { where, text } of PROSE) {
      for (const token of backticked(text).filter(looksLikeRepoPath)) {
        if (generated.has(token)) continue;
        const found = existsSync(join(REPO, token)) || existsSync(join(DOCS, token));
        expect(found, `${where} cites \`${token}\`, which does not exist`).toBe(true);
      }
    }
  });
});

describe("writing rules", () => {
  it("has no em dash and no exclamation mark", () => {
    for (const { where, text } of PROSE) {
      expect(text, `${where}: "${text}"`).not.toContain("—");
      expect(bare(text), `${where}: "${text}"`).not.toContain("!");
    }
  });

  it("uses none of the banned words or phrases", () => {
    for (const { where, text } of PROSE) {
      const lower = bare(text).toLowerCase();
      for (const word of BANNED_WORDS) {
        expect(new RegExp(`\\b${word}\\b`).test(lower), `${where}: "${word}" in "${text}"`).toBe(false);
      }
      for (const phrase of BANNED_PHRASES) expect(lower, `${where}: "${text}"`).not.toContain(phrase);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter docs exec vitest run content/system/pages.test.ts`
Expected: FAIL, cannot resolve `./architecture.page`.

- [ ] **Step 3: Write the figure words**

Create `apps/docs/content/system/figures.ts`:

```ts
/**
 * The words inside the four figures. Every string is public prose and is
 * scanned by pages.test.ts. A number appears only as a `{facts.key}`
 * placeholder. No Node imports: Storybook bundles this file.
 */

export interface HarnessPart {
  id: "instructions" | "tools" | "memory" | "loops";
  label: string;
  job: string;
  items: string[];
}

export const HARNESS_PARTS: HarnessPart[] = [
  {
    id: "instructions",
    label: "Instructions",
    job: "Standing orders every session reads before anything else.",
    items: [
      "`CLAUDE.md` is a map. It points at the contracts and restates none of them.",
      "It sits under a byte ceiling with a test behind it, because context is the scarce resource.",
      "The build briefs under `docs/design-system` are the contracts themselves.",
    ],
  },
  {
    id: "tools",
    label: "Tools",
    job: "What an agent runs to constrain, check and fix its own work.",
    items: [
      "{facts.rules} rule records behind `pnpm check:tokens`, each with a fixture that must fail and one that must pass.",
      "{facts.skills} skills: build a component, integrate a batch, run every gate, audit for a generated look.",
      "A scaffolder that writes a component's files together, so none ships without its story.",
    ],
  },
  {
    id: "memory",
    label: "Memory",
    job: "What the system knows about itself, derived so it cannot go stale quietly.",
    items: [
      "{facts.contracts} usage contracts, one installed beside each component.",
      "A routing table with one line per component, read before any full contract.",
      "The `llms.txt` corpus, for agents working in other repositories.",
    ],
  },
  {
    id: "loops",
    label: "Loops",
    job: "The cycle every change runs through, ending at a person.",
    items: [
      "Build: scaffold, write the judgment down, pass {facts.ciSteps} gate steps, open a pull request.",
      "A rejection is finished when its lesson has become a rule or a gate.",
      "Audit: not built yet. Nothing re-checks `main` on a schedule.",
    ],
  },
];

export interface ConsumerSurface {
  id: "contract" | "page" | "corpus";
  when: string;
  label: string;
  what: string;
  artifact: string;
}

export const CONSUMER_SURFACES: ConsumerSurface[] = [
  {
    id: "contract",
    when: "With a component installed",
    label: "The installed contract",
    what: "Read this first. It is locked to the version of the code beside it, so it outranks anything on the web.",
    artifact: "`components/super-ai/<name>.meta.json`",
  },
  {
    id: "page",
    when: "Before installing",
    label: "The component's page",
    what: "When to reach for it, which variant fits which case, and what to use instead.",
    artifact: "`llms.txt`, then the page it links",
  },
  {
    id: "corpus",
    when: "When choosing between components",
    label: "The full corpus",
    what: "Every component page in one file.",
    artifact: "`llms-full.txt`",
  },
];

export interface LoopStep {
  id: string;
  label: string;
  detail: string;
}

export const BUILD_LOOP: LoopStep[] = [
  { id: "read", label: "Read first", detail: "The map, the build brief, the routing table." },
  {
    id: "scaffold",
    label: "Scaffold",
    detail: "Component, story, documentation and registry entry, together.",
  },
  {
    id: "judgment",
    label: "Write the judgment down",
    detail: "When to use it and what to avoid, each with its reason.",
  },
  {
    id: "audit",
    label: "Audit the look",
    detail: "The anti-slop checklist, before building and again before done.",
  },
  {
    id: "gates",
    label: "Run the gates",
    detail: "Locally, in the workflow's order, from the repository root.",
  },
  {
    id: "review",
    label: "A person reviews",
    detail: "Gates settle what a machine can settle. Review spends its attention on fit and hierarchy.",
  },
];

export const REJECTION_EDGE =
  "When review rejects something, fixing it is half the job. The other half is a new rule or gate that fails the next time.";

export const AUDIT_LOOP = {
  label: "Audit loop",
  status: "Not built",
  detail:
    "Nothing re-checks `main` on a schedule, and nothing compares production with `main`. Deploys are manual, so the two can drift apart unseen.",
};

/** Every prose string in this file, for pages.test.ts. */
export function figureStrings(): string[] {
  return [
    ...HARNESS_PARTS.flatMap((part) => [part.label, part.job, ...part.items]),
    ...CONSUMER_SURFACES.flatMap((surface) => [surface.when, surface.label, surface.what, surface.artifact]),
    ...BUILD_LOOP.flatMap((step) => [step.label, step.detail]),
    REJECTION_EDGE,
    AUDIT_LOOP.label,
    AUDIT_LOOP.status,
    AUDIT_LOOP.detail,
  ];
}
```

- [ ] **Step 4: Write the Harness page**

Create `apps/docs/content/system/harness.page.ts`:

```ts
import type { SystemPage } from "@/lib/system-page";

/**
 * NICK: `ONE_LINER` and the rest of `LEDE` are yours to write. What is here is
 * a stand-in so the page renders. Everything else in this file is a draft for
 * your final pass. Remove `draft: true` when you have done it.
 *
 * Rules for every string here, enforced by pages.test.ts: numbers only as
 * `{facts.key}` placeholders, backticked repo paths must exist, no em dash, no
 * exclamation mark, none of the banned words.
 */
const ONE_LINER =
  "Components for AI products, with rules a machine can check. Install one and your agent gets the reasoning along with the code.";

const LEDE = [
  ONE_LINER,
  "Super AI Components is a registry of {facts.shipped} interface components for AI products, installed one at a time with `shadcn add`. Around the components sits a harness: the instructions, rules, contracts and tests that let an agent build here unattended and fail visibly when it gets something wrong.",
  "The short version: components tell an agent what it may use. The harness tells it, in a failing test, when it used them wrong. This page is about the harness.",
];

export const harnessPage: SystemPage = {
  slug: "harness",
  title: "Harness",
  description:
    "What surrounds the components: the instructions, rules, contracts and tests that hold an agent's work to the system.",
  draft: true,
  lede: LEDE,
  sections: [
    {
      id: "beyond-the-component",
      heading: "What you get beyond the component",
      blocks: [
        {
          kind: "p",
          text: "Each item installs two files: the component and a usage contract beside it. The contract records when to reach for the component, which variant fits which case, what to avoid and why, and what to use instead.",
        },
        {
          kind: "p",
          text: "An agent working in your app reads that contract before it places the component. The contract is locked to the installed version, so it cannot describe a different component from the one in your tree.",
        },
        {
          kind: "figure",
          figure: "consumer-surfaces",
          caption: "What an agent in your repository meets, in the order it should read.",
        },
        {
          kind: "p",
          text: "All of it derives from one guidance module per component. The {facts.contracts} contracts, the routing table at `apps/docs/index/components.toon` and the corpus at `apps/docs/public/llms.txt` are written by one command and compared with their source by a test, so none of them can describe an older component quietly.",
        },
      ],
    },
    {
      id: "four-parts",
      heading: "The four parts",
      blocks: [
        {
          kind: "p",
          text: "A harness is the scaffolding around a model that makes its work dependable. Here it has four parts, and each one holds content specific to this system.",
        },
        {
          kind: "figure",
          figure: "harness-parts",
          caption: "The harness, part by part, with what this repository puts in each.",
        },
        {
          kind: "p",
          text: "The instructions file is short on purpose. `CLAUDE.md` is a map under a byte ceiling, and a test fails when it grows past it, because every line there competes with the task for the agent's attention.",
        },
      ],
    },
    {
      id: "built-here",
      heading: "The part that has to be built here",
      blocks: [
        {
          kind: "p",
          text: "A coding agent arrives with its own tools and its own loop. None of them can tell it whether a component is right for this system. That answer has to live in the repository, and here it lives in {facts.ciSteps} gate steps that every change passes before it merges.",
        },
        {
          kind: "p",
          text: "An ordinary test asks whether the component still works. These ask whether it still obeys the system: a colour came through a token, a contract matches its component, a catalog entry has the stories its states promise.",
        },
        {
          kind: "p",
          text: "The limits are part of the design. Of {facts.rules} rules, {facts.ruleBlockers} block a merge, and they are checked in three ways.",
        },
        {
          kind: "table",
          columns: ["How a rule is checked", "Rules"],
          rows: [
            ["By reading source", "{facts.rulesStatic}"],
            ["In a rendered page", "{facts.rulesRendered}"],
            ["By a person", "{facts.rulesJudgment}"],
          ],
        },
        {
          kind: "p",
          text: "The contrast rule reads one element at a time, so muted text inside a muted surface painted by an ancestor passes it. The accessibility step in Storybook catches that shape.",
        },
        {
          kind: "p",
          text: "There is no audit loop yet. Gates run on every push and pull request. Nothing re-checks the main branch on a schedule, and production is deployed by hand, so it can fall behind.",
        },
      ],
    },
    {
      id: "how-to-explain-it",
      heading: "How to explain it",
      blocks: [
        { kind: "p", text: "The longer version, for someone deciding whether it matters:" },
        {
          kind: "quote",
          text: "Most component libraries stop at the code. This one ships the reasoning with it and tests the reasoning like code. Every component has a contract that says when to use it and what to avoid. Every rule the system cares about is a test that fails. An agent can build with it unattended, and when it gets something wrong the build says so before a person has to.",
        },
        {
          kind: "p",
          text: "One question comes back reliably: is that a component library with tests? Close. The difference is what the tests check. They check design decisions, and they check the documentation against the code, so the written guidance cannot drift from what ships.",
        },
        {
          kind: "links",
          items: [
            {
              label: "Architecture: the same system as machinery",
              href: "/architecture",
              storybook: "?path=/docs/architecture--docs",
            },
            { label: "The component catalog", href: "/", storybook: "?path=/docs/overview--docs" },
          ],
        },
      ],
    },
  ],
};
```

- [ ] **Step 5: Write the Architecture page**

Create `apps/docs/content/system/architecture.page.ts`:

```ts
import type { SystemPage } from "@/lib/system-page";

/**
 * A draft for Nick's final pass. Remove `draft: true` when he has done it.
 *
 * Rules for every string here, enforced by pages.test.ts: numbers only as
 * `{facts.key}` placeholders, backticked repo paths must exist, no em dash, no
 * exclamation mark, none of the banned words.
 */
export const architecturePage: SystemPage = {
  slug: "architecture",
  title: "Architecture",
  description:
    "The machinery behind the components: where each kind of file lives, what is generated from what, and which check fails when any of it goes out of step.",
  draft: true,
  lede: [
    "This page is the machinery behind the components: where each kind of file lives, what is generated from what, and which check fails when any of it goes out of step.",
    "The short version: the catalog manifest is the one list of what exists, every component ships with a story and a written contract, generated files are compared with their sources on every run, and {facts.ciSteps} gate steps hold all of that in place. Read as far as you need. Every section adds detail to that paragraph and none of them changes it.",
    "Every number on this page is counted from the repository by a script and checked by a test. None is typed by hand.",
  ],
  sections: [
    {
      id: "loops",
      heading: "The build loop, and the loop that is missing",
      blocks: [
        {
          kind: "p",
          text: "One loop runs today. A change starts from the written contracts, produces a component together with its story, its documentation and its registry entry, passes the gates locally and in CI, and ends at a person.",
        },
        {
          kind: "figure",
          figure: "loops",
          caption:
            "The build loop as it runs, the edge that turns a rejection into a rule, and the audit loop this repository does not have yet.",
        },
        {
          kind: "p",
          text: "The missing loop matters. Gates run when something changes. Nothing re-checks the main branch on a schedule and nothing compares production with it, and because deploys are manual the two have drifted apart before. Closing that gap is planned work.",
        },
      ],
    },
    {
      id: "elements",
      heading: "What the system is made of",
      blocks: [
        {
          kind: "table",
          columns: ["Kind", "What it is", "Where it lives"],
          rows: [
            [
              "Instructions",
              "A map every session reads first. It points at the contracts and restates none of them.",
              "`CLAUDE.md`",
            ],
            [
              "Build briefs",
              "The house contract each component and block is built to.",
              "`docs/design-system/component-build-brief.md`",
            ],
            [
              "Rules",
              "{facts.rules} typed records of what generated UI may not do, {facts.ruleBlockers} of them blocking.",
              "`packages/ds-rules/src`",
            ],
            [
              "Skills",
              "{facts.skills} runnable procedures: build, integrate, run the gates, audit the look.",
              "`.claude/skills`",
            ],
            [
              "Manifest",
              "The single list of what exists: {facts.shipped} shipped items across {facts.shippedPrimitives} primitives, {facts.shippedComponents} components and {facts.shippedBlocks} blocks.",
              "`apps/docs/lib/catalog.manifest.ts`",
            ],
            [
              "Contracts",
              "{facts.contracts} usage contracts, one per item, derived from its guidance module.",
              "`apps/docs/registry/super-ai`",
            ],
            [
              "Stories",
              "{facts.storyFiles} story files. Declared-state stories restate the types. Case stories record the situations a component really meets.",
              "`apps/storybook/src/stories/super-ai`",
            ],
            [
              "Prose pages",
              "{facts.prosePages} pages of foundations, patterns and content guidance.",
              "`apps/storybook/src/stories`",
            ],
            ["Specs and plans", "Dated decisions, written before building.", "`docs/superpowers/specs`"],
            ["Gates", "{facts.ciSteps} steps that every change passes.", "`.github/workflows/ci.yml`"],
          ],
        },
      ],
    },
    {
      id: "derived",
      heading: "What is generated from what",
      blocks: [
        {
          kind: "p",
          text: "Several files in this repository are outputs. Nobody edits them. A command writes each one from its source, and a test or a gate compares the two on every run, so a stale output fails and cannot go on describing an older tree.",
        },
        { kind: "derived" },
        {
          kind: "p",
          text: "The numbers on this page work the same way. They live in `apps/docs/content/system/facts.json`, and they are as of the last time that file was written. A test fails when the tree has moved past it.",
        },
      ],
    },
    {
      id: "gates",
      heading: "The gates",
      blocks: [
        {
          kind: "p",
          text: "Each step below runs in CI and, in the same order, in the local script at `.claude/skills/gate-run/run-gates.sh`. The order is a list in one place, and a test fails when the workflow, the script and this page disagree.",
        },
        {
          kind: "figure",
          figure: "ci-pipeline",
          caption:
            "The steps in the order they run. The marked steps exercise what a consumer actually installs.",
        },
        { kind: "gates" },
        {
          kind: "p",
          text: "Two properties are deliberate. {facts.ledgers} ledgers are ratchets: the accessibility exclusions, the unmet story obligations, the unwritten contract fields and the CSS variable debts may shrink and may never grow. And a scanner earns trust by failing first: every rule record ships a fixture that must trip it, because a scan that finds nothing and a scan that looked at nothing print the same result.",
        },
      ],
    },
    {
      id: "contracts",
      heading: "Usage contracts",
      blocks: [
        {
          kind: "p",
          text: "Every item has a guidance module, and its contract is derived from that module. These are the fields an agent reads before placing a component.",
        },
        {
          kind: "table",
          columns: ["Field", "What it holds"],
          rows: [
            ["`purpose`", "The job the component does."],
            ["`usage`", "When to reach for it."],
            ["`variants`", "Each variant with its intent: when to pick it."],
            ["`insteadUse`", "Near twins, and when to reach for them instead."],
            ["`dos` and `donts`", "What to do and what to avoid, as sentences."],
            ["`accessibility`", "Keyboard, screen reader and focus behaviour."],
            ["`pitfalls`", "Traps that have bitten, including classes the component does not write."],
            ["`states`", "The declared states, each with a matching story."],
            ["`anatomy`", "Named parts, anchored to shipped `data-slot` values."],
          ],
        },
        {
          kind: "p",
          text: "A field nobody has written yet is recorded as unwritten. It is never filled with an empty value, and the count of unwritten fields is one of the ratchets.",
        },
      ],
    },
    {
      id: "stories",
      heading: "Stories and coverage",
      blocks: [
        {
          kind: "p",
          text: "A story file holds two kinds of story. Declared-state stories restate the types: one export per state the manifest declares, and a gate fails when one is missing. Case stories are the only place a component's real situations are written down: long content, an empty list, a narrow screen.",
        },
        {
          kind: "p",
          text: "Every story runs in Chromium with axe. That step is the backstop for the contrast shape the token gate cannot see, and its exclusion list is a ratchet.",
        },
      ],
    },
    {
      id: "a-change",
      heading: "A change, end to end",
      blocks: [
        {
          kind: "list",
          items: [
            "Read the map in `CLAUDE.md`, then the build brief, then the routing table, so nothing gets built twice.",
            "Scaffold the component with `pnpm new:component`. The files it writes move together.",
            "Write the judgment into the guidance module: when to use it and what to avoid, each with a reason.",
            "Run the anti-slop audit before building and again before calling it done.",
            "Run every gate locally, in the workflow's order, from the repository root.",
            "Open a pull request from a branch. Nothing is committed to the main branch directly.",
            "A person reviews. Merging does not deploy. Production ships by hand.",
          ],
        },
      ],
    },
    {
      id: "principles",
      heading: "The principles underneath",
      blocks: [
        {
          kind: "quote",
          text: "The registry is the product. A component that looks right in Storybook and breaks on install has failed.",
        },
        {
          kind: "quote",
          text: "A list of gates mirrors the workflow, in the workflow's order. CI stops at the first failure, so one red gate hides every gate behind it.",
        },
        {
          kind: "quote",
          text: "A green run can prove nothing. A test that serves a prebuilt app says nothing about source edited since the build.",
        },
        {
          kind: "quote",
          text: "An exclusion list may only shrink. Adding a file to silence a failure defeats the gate.",
        },
        {
          kind: "quote",
          text: "Blocks compose. When a composed component does not fit, the gap gets reported, and the component does not get reimplemented.",
        },
        {
          kind: "quote",
          text: "A number typed into prose goes stale. Count it from the tree or leave it out.",
        },
        {
          kind: "links",
          items: [
            {
              label: "Harness: what this system is, and how to say so",
              href: "/harness",
              storybook: "?path=/docs/harness--docs",
            },
            { label: "The component catalog", href: "/", storybook: "?path=/docs/overview--docs" },
          ],
        },
      ],
    },
  ],
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter docs exec vitest run content/system/pages.test.ts`
Expected: PASS, 7 tests. If "uses every fact" fails, the message lists the difference: add the missing placeholder to the prose where the spec's outline puts it. Do not delete a fact key to make the test pass without checking the spec §4.1 first.

- [ ] **Step 7: Put the new test on the roster, run the folder, commit**

In `apps/docs/content/system/gates.ts`, in the `pnpm test` row's `checks` array, add after the `claims.test.ts` entry:

```ts
      {
        file: "apps/docs/content/system/pages.test.ts",
        protects: "These pages cite real files, type no numbers and keep the writing rules.",
      },
```

Run: `pnpm --filter docs exec vitest run content/system/`
Expected: PASS, all files.

```bash
pnpm exec prettier --write apps/docs/content/system/
git add apps/docs/content/system/
git commit -m "feat(system-pages): the two pages as data, the figure words, and the prose test"
```

`facts.json` is prettier-ignored, so the folder-wide format leaves it alone. Confirm with `git status` that it is not in the commit.

---

### Task 7: Renderer, the two lists, the first figure, and Storybook wiring

**REQUIRED before writing any component in this task:** invoke the `unslop` skill (`.claude/skills/unslop/`) in its constraints-first mode, and hold the code below to what it says. The code in this task is a starting point that passes the gates. It is not a licence to skip the skill.

**Files:**

- Modify: `apps/docs/components/component-docs.tsx` (export `InlineProse`)
- Create: `apps/docs/components/system/figure-frame.tsx`, `harness-parts.tsx`, `figures.tsx`, `gates-table.tsx`, `derived-table.tsx`, `system-page.tsx`
- Test: `apps/docs/components/system/system-page.test.tsx`, `apps/docs/components/system/blocks-tokens.test.ts`
- Modify: `apps/storybook/vite.config.ts`, `apps/storybook/tsconfig.json`, `apps/storybook/src/index.css`
- Create: `apps/storybook/src/stories/system/SystemFigures.stories.tsx`

**Interfaces:**

- Consumes: `InlineProse({ text })` from `@/components/component-docs`. `resolveFacts`, `SystemFacts`, `SystemPage`, `PageBlock`, `FigureId` (Task 1). `GATE_ROWS`, `GateRow` (Task 4). `DERIVED_ROWS`, `DerivedRow` (Task 4). `HARNESS_PARTS` (Task 6).
- Produces: `FigureFrame({ id, caption, children })`, `HarnessParts({ facts })`, `FIGURES: Partial<Record<FigureId, FigureComponent>>` (Task 9 makes it total), `FigureComponent`, `GatesTable({ rows })`, `DerivedTable({ rows })`, `SystemPageView({ page, facts, surface?, link? })`, `LinkRenderer`.

- [ ] **Step 1: Export the inline-code splitter**

In `apps/docs/components/component-docs.tsx`, change the line `function InlineProse({ text }: { text: string }) {` to:

```tsx
export function InlineProse({ text }: { text: string }) {
```

Change nothing else in that file.

- [ ] **Step 2: Write the failing renderer test**

Create `apps/docs/components/system/system-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FACT_KEYS, type SystemFacts, type SystemPage } from "@/lib/system-page";

import { SystemPageView } from "./system-page";

const FACTS = Object.fromEntries(FACT_KEYS.map((key, index) => [key, index + 1])) as SystemFacts;

const PAGE: SystemPage = {
  slug: "harness",
  title: "Fixture page",
  description: "A page for the renderer test.",
  draft: true,
  lede: ["There are {facts.ciSteps} steps and a `code` chip."],
  sections: [
    {
      id: "first",
      heading: "First section",
      blocks: [
        { kind: "p", text: "A paragraph." },
        { kind: "quote", text: "A quote." },
        { kind: "list", items: ["Step one of the list"] },
        { kind: "table", columns: ["Kind", "Count"], rows: [["Rules", "{facts.rules}"]] },
        { kind: "figure", figure: "harness-parts", caption: "The caption." },
        { kind: "gates" },
        { kind: "derived" },
        {
          kind: "links",
          items: [{ label: "Elsewhere", href: "/elsewhere", storybook: "?path=/docs/x--docs" }],
        },
      ],
    },
  ],
};

describe("SystemPageView", () => {
  it("renders one titled h1 and the numbered section heading", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('[data-slot="system-page-title"]')).toHaveTextContent("Fixture page");
    expect(screen.getByRole("heading", { level: 2, name: /First section/ })).toBeInTheDocument();
  });

  it("resolves fact placeholders and renders backticks as code", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(screen.getByText(/There are 1 steps/)).toBeInTheDocument();
    expect([...container.querySelectorAll("code")].some((el) => el.textContent === "code")).toBe(true);
    expect(screen.getByRole("cell", { name: String(FACTS.rules) })).toBeInTheDocument();
  });

  it("puts every figure in a figure with a figcaption", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    const figure = container.querySelector('[data-figure="harness-parts"]');
    expect(figure?.tagName).toBe("FIGURE");
    expect(figure?.querySelector("figcaption")).toHaveTextContent("The caption.");
  });

  it("prints the roster and the derived rows", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-gates"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="system-derived"]')).not.toBeNull();
  });

  it("shows the draft note while the page is a draft, and not after", () => {
    const { container, rerender } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-page-draft"]')).not.toBeNull();
    const reviewed: SystemPage = { ...PAGE, draft: undefined };
    rerender(<SystemPageView page={reviewed} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-page-draft"]')).toBeNull();
  });

  it("uses the Storybook link target on the Storybook surface", () => {
    render(<SystemPageView page={PAGE} facts={FACTS} surface="storybook" />);
    expect(screen.getByRole("link", { name: "Elsewhere" })).toHaveAttribute("href", "?path=/docs/x--docs");
  });
});
```

Run: `pnpm --filter docs exec vitest run components/system/system-page.test.tsx`
Expected: FAIL, cannot resolve `./system-page`.

- [ ] **Step 3: Write the figure frame and the first figure**

Create `apps/docs/components/system/figure-frame.tsx`:

```tsx
import * as React from "react";

/** Every figure on the system pages: a hairline above and below, then a
 *  caption. That is the same device the roster and the derived list use, so the
 *  page has one way of setting a block apart, and a figure never nests a box
 *  inside a box. Real text in DOM reading order, so a screen reader reads the
 *  figure as written. */
export function FigureFrame({
  id,
  caption,
  children,
}: {
  id: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure data-slot="system-figure" data-figure={id} className="space-y-3">
      <div className="border-y py-6">{children}</div>
      <figcaption className="text-muted-foreground text-sm">{caption}</figcaption>
    </figure>
  );
}
```

Create `apps/docs/components/system/harness-parts.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { HARNESS_PARTS } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** The four parts of the harness, each with what this repository puts in it.
 *  Each cell is titled the way a roster row is: a muted number, then the name
 *  at the medium weight. The definition is the muted line. The specifics, which
 *  are the point, stay in the foreground colour. */
export function HarnessParts({ facts }: { facts: SystemFacts }) {
  return (
    <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
      {HARNESS_PARTS.map((part, index) => (
        <li key={part.id} className="space-y-2">
          <p className="font-medium">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {part.label}
          </p>
          <p className="text-muted-foreground text-sm leading-6">{part.job}</p>
          <ul className="space-y-1.5 text-sm leading-6">
            {part.items.map((item) => (
              <li key={item}>
                <InlineProse text={resolveFacts(item, facts)} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
```

Create `apps/docs/components/system/figures.tsx`:

```tsx
import * as React from "react";

import type { FigureId, SystemFacts } from "@/lib/system-page";

import { HarnessParts } from "./harness-parts";

export type FigureComponent = (props: { facts: SystemFacts }) => React.ReactElement;

/** The figure registry. Partial until Task 9 builds the other three, after
 *  which the type becomes a total Record and a missing figure is a type error. */
export const FIGURES: Partial<Record<FigureId, FigureComponent>> = {
  "harness-parts": HarnessParts,
};
```

- [ ] **Step 4: Write the two lists**

Create `apps/docs/components/system/gates-table.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import type { GateRow } from "@/content/system/gates";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** The gate roster. A list and not a table: the cells hold sentences, and the
 *  two columns collapse to one on a narrow screen. */
export function GatesTable({ rows }: { rows: GateRow[] }) {
  return (
    <ol data-slot="system-gates" className="divide-y border-y wrap-anywhere">
      {rows.map((row, index) => (
        <li key={row.ciStep} className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-[13rem_1fr]">
          <div className="space-y-1.5">
            <p className="font-medium">
              <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
              {row.title}
            </p>
            <p>
              <code className={CODE}>{row.ciStep}</code>
            </p>
          </div>
          <div className="space-y-2 text-sm leading-6">
            <p>
              <InlineProse text={row.protects} />
            </p>
            <ul className="space-y-1">
              {row.checks.map((check) => (
                <li key={check.file}>
                  <code className={CODE}>{check.file}</code>{" "}
                  <span className="text-muted-foreground">
                    <InlineProse text={check.protects} />
                  </span>
                </li>
              ))}
            </ul>
            {row.ledgers?.length ? (
              <p>
                <span className="font-medium">Ratchets: </span>
                {row.ledgers.map((ledger, ledgerIndex) => (
                  <React.Fragment key={ledger}>
                    {ledgerIndex > 0 ? ", " : null}
                    <code className={CODE}>{ledger}</code>
                  </React.Fragment>
                ))}
              </p>
            ) : null}
            {row.blindSpot ? (
              <p role="note" className="border-l-2 pl-3">
                <span className="font-medium">Does not see: </span>
                <InlineProse text={row.blindSpot} />
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

Create `apps/docs/components/system/derived-table.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import type { DerivedRow } from "@/content/system/derived";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** What is generated from what. A list, for the same reason GatesTable is. */
export function DerivedTable({ rows }: { rows: DerivedRow[] }) {
  return (
    <ul data-slot="system-derived" className="divide-y border-y wrap-anywhere">
      {rows.map((row) => (
        <li key={row.source} className="space-y-2 py-4 text-sm leading-6">
          <p>
            <InlineProse text={row.note} />
          </p>
          <dl className="grid gap-x-6 gap-y-1 md:grid-cols-[7rem_1fr]">
            <dt className="text-muted-foreground">Source</dt>
            <dd>
              <code className={CODE}>{row.source}</code>
            </dd>
            <dt className="text-muted-foreground">Output</dt>
            <dd className="space-y-1">
              {row.derived.map((path) => (
                <div key={path}>
                  <code className={CODE}>{path}</code>
                </div>
              ))}
              {row.committed ? null : <div className="text-muted-foreground">Not committed.</div>}
            </dd>
            <dt className="text-muted-foreground">Written by</dt>
            <dd>
              <code className={CODE}>{row.command}</code>
            </dd>
            <dt className="text-muted-foreground">Held by</dt>
            <dd>
              <code className={CODE}>{row.heldBy}</code>
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Write the renderer**

Create `apps/docs/components/system/system-page.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { DERIVED_ROWS } from "@/content/system/derived";
import { GATE_ROWS } from "@/content/system/gates";
import { resolveFacts, type PageBlock, type SystemFacts, type SystemPage } from "@/lib/system-page";

import { DerivedTable } from "./derived-table";
import { FigureFrame } from "./figure-frame";
import { FIGURES } from "./figures";
import { GatesTable } from "./gates-table";

/** How a link is drawn. The Next routes pass next/link. Storybook passes
 *  nothing and gets a plain anchor. This file imports neither, so both
 *  surfaces can bundle it. */
export type LinkRenderer = (props: {
  href: string;
  className: string;
  children: React.ReactNode;
}) => React.ReactElement;

const plainLink: LinkRenderer = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

interface ViewProps {
  page: SystemPage;
  facts: SystemFacts;
  surface?: "next" | "storybook";
  link?: LinkRenderer;
}

function Block({ block, facts, surface, link }: { block: PageBlock } & Required<Omit<ViewProps, "page">>) {
  const text = (value: string) => <InlineProse text={resolveFacts(value, facts)} />;

  switch (block.kind) {
    case "p":
      return <p className="leading-7">{text(block.text)}</p>;
    case "quote":
      return <blockquote className="border-l-2 pl-4 leading-7">{text(block.text)}</blockquote>;
    case "list":
      return (
        <ol className="list-decimal space-y-2 pl-5 leading-7">
          {block.items.map((item) => (
            <li key={item}>{text(item)}</li>
          ))}
        </ol>
      );
    case "table":
      return (
        <table className="w-full table-fixed border-collapse text-sm leading-6">
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th key={column} scope="col" className="border-b py-2 pr-4 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b py-2 pr-4 align-top">
                    {text(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "figure": {
      const Figure = FIGURES[block.figure];
      if (!Figure) throw new Error(`figure not built: ${block.figure}`);
      return (
        <FigureFrame id={block.figure} caption={resolveFacts(block.caption, facts)}>
          <Figure facts={facts} />
        </FigureFrame>
      );
    }
    case "gates":
      return <GatesTable rows={GATE_ROWS} />;
    case "derived":
      return <DerivedTable rows={DERIVED_ROWS} />;
    case "links":
      return (
        <ul className="space-y-1.5 leading-7">
          {block.items.map((item) => (
            <li key={item.href}>
              {link({
                href: surface === "storybook" ? (item.storybook ?? item.href) : item.href,
                className: "underline underline-offset-4",
                children: item.label,
              })}
            </li>
          ))}
        </ul>
      );
  }
}

/** Renders a system page. Server-safe and surface-neutral. */
export function SystemPageView({ page, facts, surface = "next", link = plainLink }: ViewProps) {
  return (
    <article
      data-slot="system-page"
      className="text-foreground mx-auto w-full max-w-3xl space-y-10 px-6 py-10 wrap-anywhere"
    >
      <header className="space-y-4">
        <h1 data-slot="system-page-title" className="text-3xl font-bold">
          {page.title}
        </h1>
        {page.draft ? (
          <p role="note" data-slot="system-page-draft" className="rounded-md border px-3 py-2 text-sm">
            Draft. The prose on this page is under review.
          </p>
        ) : null}
        {page.lede.map((paragraph) => (
          <p key={paragraph} className="leading-7">
            <InlineProse text={resolveFacts(paragraph, facts)} />
          </p>
        ))}
      </header>
      {page.sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="space-y-4"
        >
          <h2 id={`${section.id}-heading`} className="text-lg font-semibold">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {section.heading}
          </h2>
          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} facts={facts} surface={surface} link={link} />
          ))}
        </section>
      ))}
    </article>
  );
}
```

- [ ] **Step 6: Run the renderer test to verify it passes**

Run: `pnpm --filter docs exec vitest run components/system/system-page.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 7: Write the token check for these files**

`rulecheck.mjs` filters every file by its rule's `detect.scope`, and these files are outside every scope. The test below copies the rule JSON to a temp directory with the scope replaced, and runs the real CLI against it through its `DS_RULES_DIR` seam. No rule on disk changes.

Create `apps/docs/components/system/blocks-tokens.test.ts`:

```ts
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../../..");
const SYSTEM_DIR = "apps/docs/components/system";
const RULES_DIR = "packages/ds-rules/rules";
const RULECHECK = join(REPO, "packages/ds-rules/rulecheck.mjs");

interface Rule {
  id: string;
  severity: string;
  detect: { method: string; scope?: string[]; include?: string[] };
}

const tmp = mkdtempSync(join(tmpdir(), "system-rules-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

/** Copies every rule file with each rule's scope pointed at the system blocks. */
function rescopedRules(): Rule[] {
  const all: Rule[] = [];
  for (const file of readdirSync(join(REPO, RULES_DIR)).filter((name) => name.endsWith(".json"))) {
    const doc = JSON.parse(readFileSync(join(REPO, RULES_DIR, file), "utf8")) as { rules: Rule[] };
    for (const rule of doc.rules) if (Array.isArray(rule.detect.scope)) rule.detect.scope = [SYSTEM_DIR];
    writeFileSync(join(tmp, file), JSON.stringify(doc));
    all.push(...doc.rules);
  }
  return all;
}

describe("the system blocks obey the token contract", () => {
  it("has zero blocker violations, and the scan really read the files", () => {
    const rules = rescopedRules();
    const files = readdirSync(join(REPO, SYSTEM_DIR))
      .filter((name) => name.endsWith(".tsx") && !name.endsWith(".test.tsx"))
      .map((name) => `${SYSTEM_DIR}/${name}`);
    expect(files.length).toBeGreaterThan(0);

    const run = spawnSync(
      process.execPath,
      [RULECHECK, "--severity", "blocker", "--json", "--files", ...files],
      {
        env: { ...process.env, DS_RULES_DIR: tmp },
        encoding: "utf8",
      },
    );
    expect(run.status, `rulecheck could not run: ${run.stderr}`).not.toBe(2);

    const report = JSON.parse(run.stdout) as {
      violations: { id: string; file: string; line: number; snippet: string }[];
      unchecked: { id: string; reason: string }[];
      summary: { filesScanned: number };
    };

    // A scan that read nothing and a scan that found nothing print the same
    // result. These two assertions tell them apart.
    expect(report.summary.filesScanned).toBe(files.length);
    const tsxBlockers = rules
      .filter((rule) => rule.severity === "blocker" && rule.detect.include?.includes(".tsx"))
      .map((rule) => rule.id);
    expect(tsxBlockers.length).toBeGreaterThan(0);
    const skipped = report.unchecked
      .filter((entry) => entry.reason === "out-of-scope")
      .map((entry) => entry.id);
    expect(skipped.filter((id) => tsxBlockers.includes(id))).toEqual([]);

    expect(report.violations).toEqual([]);
  });
});
```

Run: `pnpm --filter docs exec vitest run components/system/blocks-tokens.test.ts`
Expected: PASS. If it reports a violation, fix the component, never the test.

- [ ] **Step 8: Wire Storybook to the new folders**

In `apps/storybook/vite.config.ts`, inside `resolve.alias`, add these two entries directly **before** the `{ find: /^@\/(.*)/, ... }` catch-all. Order matters: the catch-all would otherwise send them to Storybook's own `src`.

```ts
      { find: /^@\/components\/system\/(.*)/, replacement: resolve(__dirname, "../docs/components/system/$1") },
      { find: /^@\/lib\/system-page$/, replacement: resolve(__dirname, "../docs/lib/system-page.ts") },
```

In `apps/storybook/tsconfig.json`, inside `compilerOptions.paths`, add these two entries directly before `"@/*"`:

```json
      "@/components/system/*": ["../docs/components/system/*"],
      "@/lib/system-page": ["../docs/lib/system-page.ts"],
```

In `apps/storybook/src/index.css`, directly after the line `@source "../../docs/registry";`, add:

```css
/* ...and the system page blocks, for the same reason: they live in the docs
   app, outside Tailwind's same-package detection, so a class used only there
   would reach the DOM and compile to no CSS rule. */
@source "../../docs/components/system";
```

- [ ] **Step 9: Write the figure story**

Create `apps/storybook/src/stories/system/SystemFigures.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { DerivedTable } from "@/components/system/derived-table";
import { FigureFrame } from "@/components/system/figure-frame";
import { GatesTable } from "@/components/system/gates-table";
import { HarnessParts } from "@/components/system/harness-parts";
import { DERIVED_ROWS } from "@/content/system/derived";
import facts from "@/content/system/facts.json";
import { GATE_ROWS } from "@/content/system/gates";

/**
 * The figures and lists from the Harness and Architecture pages, one story
 * each, so the a11y gate renders them. MDX pages are not stories and axe never
 * sees them. This file lives outside `stories/super-ai/` on purpose: the
 * contract gates map catalog names to that folder and must not claim it.
 */
const meta: Meta = {
  title: "System/Figures",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

/** Nothing scrolls sideways inside a 375px column. */
const noSidewaysScroll: Story["play"] = async ({ canvasElement }) => {
  const column = canvasElement.querySelector('[data-narrow="true"]') as HTMLElement;
  await expect(column).not.toBeNull();
  await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  for (const child of Array.from(column.querySelectorAll<HTMLElement>("[data-slot]"))) {
    await expect(child.scrollWidth).toBeLessThanOrEqual(child.clientWidth);
  }
};

const Narrow = ({ children }: { children: React.ReactNode }) => (
  <div data-narrow="true" className="w-[375px]">
    {children}
  </div>
);

export const HarnessPartsFigure: Story = {
  render: () => (
    <FigureFrame id="harness-parts" caption="The harness, part by part.">
      <HarnessParts facts={facts} />
    </FigureFrame>
  ),
};

export const HarnessPartsNarrow: Story = {
  render: () => (
    <Narrow>
      <FigureFrame id="harness-parts" caption="The harness, part by part.">
        <HarnessParts facts={facts} />
      </FigureFrame>
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const Gates: Story = { render: () => <GatesTable rows={GATE_ROWS} /> };

export const GatesNarrow: Story = {
  render: () => (
    <Narrow>
      <GatesTable rows={GATE_ROWS} />
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const Derived: Story = { render: () => <DerivedTable rows={DERIVED_ROWS} /> };

export const DerivedNarrow: Story = {
  render: () => (
    <Narrow>
      <DerivedTable rows={DERIVED_ROWS} />
    </Narrow>
  ),
  play: noSidewaysScroll,
};
```

Add `import * as React from "react";` as the second import line if the Storybook lint config requires React in scope. Check with `pnpm --filter storybook lint`.

- [ ] **Step 10: Run the story gate for this file, and the contract gates**

```bash
pnpm --filter storybook exec vitest run --project storybook src/stories/system/SystemFigures.stories.tsx
pnpm check:contract
pnpm --filter docs exec vitest run scripts/lib/story-coverage.test.ts
```

Expected: the six stories pass with no axe violation and no sideways scroll. `check:contract` and the story-coverage test stay green, because neither looks outside `stories/super-ai/`.

If a narrow story fails on sideways scroll, the long `code` chips are the usual cause. Add `wrap-anywhere` to the failing list's root class string and rerun.

If `check:contract` or story coverage objects to the new file, move it to `apps/storybook/src/system/SystemFigures.stories.tsx`, record the reason in its header comment, and rerun.

- [ ] **Step 11: Typecheck and lint both workspaces, then commit**

```bash
pnpm typecheck
pnpm lint
pnpm exec prettier --write apps/docs/components/system/ apps/docs/components/component-docs.tsx apps/storybook/vite.config.ts apps/storybook/tsconfig.json apps/storybook/src/index.css apps/storybook/src/stories/system/
git add apps/docs/components/system/ apps/docs/components/component-docs.tsx apps/storybook/vite.config.ts apps/storybook/tsconfig.json apps/storybook/src/index.css apps/storybook/src/stories/system/
git commit -m "feat(system-pages): renderer, roster and derived lists, the first figure and its stories"
```

---

### Task 8: Checkpoint. Nick approves the look before the other figures are built

This task has no code. It is run by the orchestrating session, and it stops the plan.

- [ ] **Step 1: Start Storybook on a free port**

Check whether port 6007 is free: `lsof -i :6007`. A sibling worktree usually holds it, and its server would show that worktree's build while this one reports success.

- If it is free, start the `storybook` configuration from `.claude/launch.json` through the preview tool.
- If it is taken, add a configuration to `.claude/launch.json` named `storybook-6017`, with `runtimeExecutable` `pnpm`, `runtimeArgs` `["--filter", "storybook", "exec", "storybook", "dev", "-p", "6017", "--ci", "--no-open"]` and `port` 6017, and start that one. `--ci` stops Storybook hanging on its "use another port?" prompt. Do not commit the `launch.json` change.

Do not delete the Storybook cache while any Storybook server is running.

- [ ] **Step 2: Capture four screenshots of `System/Figures`**

`HarnessPartsFigure` in light and in dark, and `HarnessPartsNarrow` in light and in dark. Use the toolbar's Theme control for dark. Also capture `Gates` once in light.

- [ ] **Step 3: Run the `unslop` audit on the rendered figure**

Invoke the `unslop` skill in audit mode against those screenshots and the component source. Fix what it finds before showing Nick.

- [ ] **Step 4: Stop and ask Nick**

Send the screenshots and ask, as numbered options: 1. approve the look and build the other three figures the same way, 2. change something, with what. Do not start Task 9 without his answer. Apply any change he asks for to `figure-frame.tsx`, `harness-parts.tsx` and `gates-table.tsx` first, rerun Task 7 Step 10, and commit.

---

### Task 9: The other three figures

**Files:**

- Create: `apps/docs/components/system/consumer-surfaces.tsx`, `loops.tsx`, `ci-pipeline.tsx`
- Modify: `apps/docs/components/system/figures.tsx`, `apps/docs/components/system/system-page.test.tsx`, `apps/storybook/src/stories/system/SystemFigures.stories.tsx`

**Interfaces:**

- Consumes: `CONSUMER_SURFACES`, `BUILD_LOOP`, `REJECTION_EDGE`, `AUDIT_LOOP` (Task 6). `GATE_ROWS` (Task 4). `FigureFrame`, `FigureComponent` (Task 7).
- Produces: `ConsumerSurfaces({ facts })`, `Loops({ facts })`, `CiPipeline({ facts })`, and `FIGURES` as a total `Record<FigureId, FigureComponent>`.

Carry any change Nick asked for in Task 8 into these three. They follow the first figure's type scale, spacing and label style exactly.

- [ ] **Step 1: Write the failing test for the real pages**

In `apps/docs/components/system/system-page.test.tsx`, add these imports below the existing ones:

```tsx
import { architecturePage } from "@/content/system/architecture.page";
import facts from "@/content/system/facts.json";
import { harnessPage } from "@/content/system/harness.page";
```

and add this block at the end of the file:

```tsx
describe("the real pages", () => {
  for (const page of [harnessPage, architecturePage]) {
    it(`${page.slug} renders every section and every figure`, () => {
      const { container } = render(<SystemPageView page={page} facts={facts} />);
      expect(container.querySelectorAll("h1")).toHaveLength(1);
      for (const section of page.sections) {
        expect(container.querySelector(`#${section.id}-heading`), section.id).not.toBeNull();
      }
      const figures = page.sections
        .flatMap((section) => section.blocks)
        .filter((block) => block.kind === "figure");
      expect(container.querySelectorAll('[data-slot="system-figure"]')).toHaveLength(figures.length);
      for (const figure of container.querySelectorAll('[data-slot="system-figure"]')) {
        expect(figure.querySelector("figcaption")?.textContent?.length).toBeGreaterThan(0);
      }
    });
  }
});
```

Run: `pnpm --filter docs exec vitest run components/system/system-page.test.tsx`
Expected: FAIL with `figure not built: consumer-surfaces`.

- [ ] **Step 2: Write the consumer surfaces figure**

Create `apps/docs/components/system/consumer-surfaces.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { CONSUMER_SURFACES } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** What an agent in a consumer's repository meets, in retrieval order. */
export function ConsumerSurfaces({ facts }: { facts: SystemFacts }) {
  return (
    <ol className="grid gap-x-8 gap-y-8 md:grid-cols-3">
      {CONSUMER_SURFACES.map((surface, index) => (
        <li key={surface.id} className="space-y-2">
          <p className="font-medium">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {surface.label}
          </p>
          <p className="text-muted-foreground text-sm leading-6">{surface.when}</p>
          <p className="text-sm leading-6">
            <InlineProse text={resolveFacts(surface.what, facts)} />
          </p>
          <p className="text-sm leading-6">
            <InlineProse text={resolveFacts(surface.artifact, facts)} />
          </p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Write the loops figure**

Create `apps/docs/components/system/loops.tsx`:

```tsx
import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { AUDIT_LOOP, BUILD_LOOP, REJECTION_EDGE } from "@/content/system/figures";
import { resolveFacts, type SystemFacts } from "@/lib/system-page";

/** The build loop as it runs, the edge that turns a rejection into a rule, and
 *  the audit loop drawn as what it is today: absent. */
export function Loops({ facts }: { facts: SystemFacts }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Build loop</p>
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_LOOP.map((step, index) => (
            <li key={step.id} className="space-y-1">
              <p className="font-medium">
                <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
                {step.label}
              </p>
              <p className="text-sm leading-6">
                <InlineProse text={resolveFacts(step.detail, facts)} />
              </p>
            </li>
          ))}
        </ol>
        <p role="note" className="border-l-2 pl-3 text-sm leading-6">
          <InlineProse text={resolveFacts(REJECTION_EDGE, facts)} />
        </p>
      </div>
      {/* A dashed hairline, not a dashed box: the figure frame is already the one
          container, and a box inside it would be a card in a card. */}
      <div className="space-y-2 border-t border-dashed pt-6">
        <p className="text-muted-foreground text-sm">{AUDIT_LOOP.label}</p>
        <p className="font-medium">{AUDIT_LOOP.status}</p>
        <p className="text-sm leading-6">
          <InlineProse text={resolveFacts(AUDIT_LOOP.detail, facts)} />
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the CI pipeline figure**

Create `apps/docs/components/system/ci-pipeline.tsx`:

```tsx
import * as React from "react";

import { GATE_ROWS } from "@/content/system/gates";
import type { SystemFacts } from "@/lib/system-page";

const CODE = "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs";

/** The roster in the order it runs. Driven by GATE_ROWS alone, so it cannot
 *  show a pipeline other than the one gates.test.ts holds to ci.yml. `facts` is
 *  accepted because every figure shares one signature. */
export function CiPipeline(_props: { facts: SystemFacts }) {
  return (
    <ol className="divide-y">
      {GATE_ROWS.map((row, index) => (
        <li
          key={row.ciStep}
          className="grid grid-cols-[2rem_1fr] gap-x-2 gap-y-1 py-2.5 sm:grid-cols-[2rem_1fr_auto]"
        >
          <span className="text-muted-foreground tabular-nums">{index + 1}</span>
          <div className="space-y-1">
            <p className="font-medium">{row.title}</p>
            <p>
              <code className={CODE}>{row.ciStep}</code>
            </p>
          </div>
          <p className="col-start-2 text-sm sm:col-start-3 sm:text-right">
            <span className="text-muted-foreground">{row.kind}</span>
            {row.product ? (
              <span className="ml-2 rounded border px-1.5 py-0.5 text-xs">exercises the product</span>
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 5: Make the registry total**

Replace the whole of `apps/docs/components/system/figures.tsx` with:

```tsx
import * as React from "react";

import type { FigureId, SystemFacts } from "@/lib/system-page";

import { CiPipeline } from "./ci-pipeline";
import { ConsumerSurfaces } from "./consumer-surfaces";
import { HarnessParts } from "./harness-parts";
import { Loops } from "./loops";

export type FigureComponent = (props: { facts: SystemFacts }) => React.ReactElement;

/** The figure registry. A total Record: a FigureId with no component is a
 *  type error, not a runtime one. */
export const FIGURES: Record<FigureId, FigureComponent> = {
  "harness-parts": HarnessParts,
  "consumer-surfaces": ConsumerSurfaces,
  loops: Loops,
  "ci-pipeline": CiPipeline,
};
```

In `apps/docs/components/system/system-page.tsx`, the `figure` case keeps its `if (!Figure) throw` line. With a total Record TypeScript may flag the check as always false under strict lint rules. If `pnpm lint` reports it, delete that one line.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
pnpm --filter docs exec vitest run components/system/
```

Expected: PASS, including both "the real pages" tests and the token check, which now scans three more files.

- [ ] **Step 7: Add the stories**

In `apps/storybook/src/stories/system/SystemFigures.stories.tsx`, add these imports beside the other `@/components/system` imports:

```tsx
import { CiPipeline } from "@/components/system/ci-pipeline";
import { ConsumerSurfaces } from "@/components/system/consumer-surfaces";
import { Loops } from "@/components/system/loops";
```

and add these stories at the end of the file:

```tsx
export const ConsumerSurfacesFigure: Story = {
  render: () => (
    <FigureFrame id="consumer-surfaces" caption="What an agent in your repository meets.">
      <ConsumerSurfaces facts={facts} />
    </FigureFrame>
  ),
};

export const ConsumerSurfacesNarrow: Story = {
  render: () => (
    <Narrow>
      <FigureFrame id="consumer-surfaces" caption="What an agent in your repository meets.">
        <ConsumerSurfaces facts={facts} />
      </FigureFrame>
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const LoopsFigure: Story = {
  render: () => (
    <FigureFrame id="loops" caption="The build loop, and the loop that is missing.">
      <Loops facts={facts} />
    </FigureFrame>
  ),
};

export const LoopsNarrow: Story = {
  render: () => (
    <Narrow>
      <FigureFrame id="loops" caption="The build loop, and the loop that is missing.">
        <Loops facts={facts} />
      </FigureFrame>
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const CiPipelineFigure: Story = {
  render: () => (
    <FigureFrame id="ci-pipeline" caption="The steps in the order they run.">
      <CiPipeline facts={facts} />
    </FigureFrame>
  ),
};

export const CiPipelineNarrow: Story = {
  render: () => (
    <Narrow>
      <FigureFrame id="ci-pipeline" caption="The steps in the order they run.">
        <CiPipeline facts={facts} />
      </FigureFrame>
    </Narrow>
  ),
  play: noSidewaysScroll,
};
```

Run: `pnpm --filter storybook exec vitest run --project storybook src/stories/system/SystemFigures.stories.tsx`
Expected: PASS, 12 stories, no axe violation, no sideways scroll.

- [ ] **Step 8: Commit**

```bash
pnpm typecheck && pnpm lint
pnpm exec prettier --write apps/docs/components/system/ apps/storybook/src/stories/system/
git add apps/docs/components/system/ apps/storybook/src/stories/system/
git commit -m "feat(system-pages): consumer surfaces, loops and CI pipeline figures"
```

---

### Task 10: The two surfaces

**Files:**

- Create: `apps/docs/components/docs-shell.tsx`, `apps/docs/app/(system)/layout.tsx`, `apps/docs/app/(system)/harness/page.tsx`, `apps/docs/app/(system)/architecture/page.tsx`
- Modify: `apps/docs/app/components/layout.tsx`, `apps/docs/components/docs-nav.tsx`, `apps/docs/app/page.tsx`, `apps/docs/e2e/smoke.spec.ts`
- Create: `apps/storybook/src/stories/Harness.mdx`, `apps/storybook/src/stories/Architecture.mdx`
- Modify: `apps/storybook/.storybook/preview.tsx`, `apps/storybook/src/stories/Overview.mdx`, `apps/docs/content/system/facts.json` (re-emitted)

**Interfaces:**

- Consumes: `SystemPageView`, `LinkRenderer` (Task 7). `harnessPage`, `architecturePage` (Task 6). `facts.json` (Task 3).
- Produces: `DocsShell({ children })`, the routes `/harness` and `/architecture`, the Storybook docs entries `Harness` and `Architecture`.

- [ ] **Step 1: Write the failing smoke tests**

In `apps/docs/e2e/smoke.spec.ts`, add these imports below the existing imports:

```ts
import { architecturePage } from "../content/system/architecture.page";
import { harnessPage } from "../content/system/harness.page";
```

and add this block at the end of the file:

```ts
for (const route of [
  { path: "/harness", title: harnessPage.title },
  { path: "/architecture", title: architecturePage.title },
]) {
  test(`${route.path} renders at 375px without console errors or sideways scroll`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path);
    // Targets the page's own title by data-slot, for the reasons the component
    // test above records: role and tag locators have both been wrong here.
    await expect(page.locator('[data-slot="system-page-title"]')).toHaveText(route.title);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
```

Do not run it yet. Playwright serves the prebuilt app, so it cannot fail honestly until Step 8 rebuilds.

- [ ] **Step 2: Move the docs chrome into a shared component**

Create `apps/docs/components/docs-shell.tsx`. The JSX is moved verbatim from `app/components/layout.tsx`:

```tsx
import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";

/** The docs chrome: the sidebar rail plus the main column. Shared by the
 *  component routes and the system pages, so the two cannot drift apart. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <Link href="/" className="mb-6 block text-sm font-semibold">
            Super-AI-Components
          </Link>
          <DocsNav />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
```

Replace the whole of `apps/docs/app/components/layout.tsx` with:

```tsx
import { DocsShell } from "@/components/docs-shell";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
```

Create `apps/docs/app/(system)/layout.tsx`. The parentheses make a route group: the folder adds a layout and no URL segment.

```tsx
import { DocsShell } from "@/components/docs-shell";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
```

- [ ] **Step 3: Add the two routes**

Create `apps/docs/app/(system)/harness/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { SystemPageView, type LinkRenderer } from "@/components/system/system-page";
import facts from "@/content/system/facts.json";
import { harnessPage } from "@/content/system/harness.page";

export const metadata: Metadata = { title: harnessPage.title, description: harnessPage.description };

const link: LinkRenderer = (props) => <Link {...props} />;

export default function HarnessRoute() {
  return <SystemPageView page={harnessPage} facts={facts} link={link} />;
}
```

Create `apps/docs/app/(system)/architecture/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { SystemPageView, type LinkRenderer } from "@/components/system/system-page";
import { architecturePage } from "@/content/system/architecture.page";
import facts from "@/content/system/facts.json";

export const metadata: Metadata = {
  title: architecturePage.title,
  description: architecturePage.description,
};

const link: LinkRenderer = (props) => <Link {...props} />;

export default function ArchitectureRoute() {
  return <SystemPageView page={architecturePage} facts={facts} link={link} />;
}
```

- [ ] **Step 4: Add the System group to the docs nav**

In `apps/docs/components/docs-nav.tsx`, make three edits.

Below the `GROUPS` constant, add:

```tsx
const SYSTEM_LINKS = [
  { href: "/harness", title: "Harness" },
  { href: "/architecture", title: "Architecture" },
];

const toNavItem = (item: { name: string; title: string }) => ({
  href: `/components/${item.name}`,
  title: item.title,
});
```

Replace the whole `NavList` function with this version, which takes an `href` per item. The class strings are unchanged:

```tsx
function NavList({ items, pathname }: { items: { href: string; title: string }[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

In `DocsNav`, add the System group as the first child of `<nav className="space-y-6">`, and map the two existing call sites through `toNavItem`:

```tsx
<div>
  <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">System</p>
  <NavList items={SYSTEM_LINKS} pathname={pathname} />
</div>
```

The catalog call becomes `<NavList items={CATALOG_ITEMS.filter((i) => i.group === group).map(toNavItem)} pathname={pathname} />`, and the marketing call becomes `<NavList items={items.map(toNavItem)} pathname={pathname} />`.

- [ ] **Step 5: Link the pages from the landing page**

The sidebar is hidden below `md`, so on a phone the landing page is the only way in. In `apps/docs/app/page.tsx`, directly after the closing `</p>` of the intro paragraph, add:

```tsx
<p className="text-sm">
  <Link className="underline underline-offset-4" href="/harness">
    Harness
  </Link>
  {" · "}
  <Link className="underline underline-offset-4" href="/architecture">
    Architecture
  </Link>
</p>
```

- [ ] **Step 6: Add the Storybook pages**

Create `apps/storybook/src/stories/Harness.mdx`:

```mdx
import { Meta, Unstyled } from "@storybook/addon-docs/blocks";

import { SystemPageView } from "@/components/system/system-page";
import facts from "@/content/system/facts.json";
import { harnessPage } from "@/content/system/harness.page";

<Meta title="Harness" />

<Unstyled>
  <SystemPageView page={harnessPage} facts={facts} surface="storybook" />
</Unstyled>
```

Create `apps/storybook/src/stories/Architecture.mdx`:

```mdx
import { Meta, Unstyled } from "@storybook/addon-docs/blocks";

import { SystemPageView } from "@/components/system/system-page";
import { architecturePage } from "@/content/system/architecture.page";
import facts from "@/content/system/facts.json";

<Meta title="Architecture" />

<Unstyled>
  <SystemPageView page={architecturePage} facts={facts} surface="storybook" />
</Unstyled>
```

`Unstyled` stops Storybook's docs typography from restyling the page's own headings, paragraphs and table. If the build reports that `Unstyled` is not exported, replace the wrapper with `<div className="sb-unstyled">`, which is the class that block applies.

In `apps/storybook/.storybook/preview.tsx`, in the `storySort.order` array, add `"Harness",` and `"Architecture",` on their own lines directly after `"Overview",`.

In `apps/storybook/src/stories/Overview.mdx`, directly after the paragraph that ends "rather than restating it.", add:

```mdx
Two pages describe the system itself: [Harness](?path=/docs/harness--docs) is what surrounds the
components and how to explain it, and [Architecture](?path=/docs/architecture--docs) is the same
system as machinery.
```

- [ ] **Step 7: Re-emit the facts**

The two new MDX files raise `prosePages` by two, so the drift test is now red. That is the gate working.

```bash
pnpm --filter docs exec vitest run scripts/lib/system-facts.test.ts
```

Expected: FAIL, `facts.json is stale`.

```bash
cd apps/docs && pnpm facts:emit && cd ../..
git diff apps/docs/content/system/facts.json
pnpm --filter docs exec vitest run scripts/lib/system-facts.test.ts
```

Expected: the diff changes `prosePages` only, by two. Then PASS.

- [ ] **Step 8: Rebuild, then run the smoke tests**

```bash
pnpm build
CI=1 pnpm --filter docs exec playwright test e2e/smoke.spec.ts -g "harness|architecture"
```

Expected: 2 passed. `CI=1` stops Playwright reusing a server a sibling worktree left on port 3100.

- [ ] **Step 9: Check both Storybook pages render**

Start Storybook as in Task 8 Step 1. Open `?path=/docs/harness--docs` and `?path=/docs/architecture--docs`. Confirm each shows its title, the draft note, every figure, and that the links at the bottom move between the two pages. Read the browser console: expected no errors.

- [ ] **Step 10: Commit**

```bash
pnpm typecheck && pnpm lint
pnpm exec prettier --write apps/docs/components/docs-shell.tsx apps/docs/components/docs-nav.tsx "apps/docs/app/(system)" apps/docs/app/components/layout.tsx apps/docs/app/page.tsx apps/docs/e2e/smoke.spec.ts apps/storybook/src/stories/Harness.mdx apps/storybook/src/stories/Architecture.mdx apps/storybook/src/stories/Overview.mdx apps/storybook/.storybook/preview.tsx
git add apps/docs/components/docs-shell.tsx apps/docs/components/docs-nav.tsx "apps/docs/app/(system)" apps/docs/app/components/layout.tsx apps/docs/app/page.tsx apps/docs/e2e/smoke.spec.ts apps/docs/content/system/facts.json apps/storybook/src/stories/Harness.mdx apps/storybook/src/stories/Architecture.mdx apps/storybook/src/stories/Overview.mdx apps/storybook/.storybook/preview.tsx
git commit -m "feat(system-pages): Next routes, Storybook pages, the System nav group and smoke tests"
```

---

### Task 11: Record it, run every gate, verify in two browsers, hand over

Run by the orchestrating session.

- [ ] **Step 1: Record the derive rule in CONTINUE**

In `docs/CONTINUE.md`, at the end of section "3.5 Integrate — you do this centrally" and before the "### 3.6" heading, add:

```markdown
**`apps/docs/content/system/facts.json` is derived too.** The Harness and
Architecture pages print its numbers, and `system-facts.test.ts` fails when the
tree has moved past it. Agents never emit it. The integrator runs
`cd apps/docs && pnpm facts:emit` once per batch, after `contract:emit`. A CI
step that is on neither `GATE_ROWS` nor `PLUMBING` in
`apps/docs/content/system/gates.ts` fails `gates.test.ts`: say what the step is
before it lands. That test is also the drift check between `ci.yml` and
`run-gates.sh`, which closes carry item 3 of the 2026-09-18 pegbo transfer audit.
```

Run `pnpm exec prettier --write docs/CONTINUE.md` and commit:

```bash
git add docs/CONTINUE.md
git commit -m "docs(continue): facts.json is derived, and the roster test is the ci.yml drift check"
```

- [ ] **Step 2: Run every gate in CI's order**

Invoke the `gate-run` skill, which runs `.claude/skills/gate-run/run-gates.sh` from the repo root. Expected: all twelve steps green. The destructive-tint contrast failure in `thread-list` is a known intermittent: if the Storybook step fails only there, rerun that step once before blaming this branch.

- [ ] **Step 3: Run the `unslop` audit on the finished pages**

Invoke the `unslop` skill in audit mode on both routes. Fix what it finds, rerun the affected tests, commit.

- [ ] **Step 4: Verify in Chromium and in Safari**

Start the `docs` configuration from `.claude/launch.json` (the dev server, port 3000). If a sibling worktree holds port 3000, add a `docs-3010` configuration the same way Task 8 Step 1 adds `storybook-6017`, with `runtimeArgs` `["--filter", "docs", "exec", "next", "dev", "-p", "3010"]`, and do not commit it. Open `/harness` and `/architecture` in the built-in browser: light and dark, desktop width and 375px. Check that the sidebar shows the System group with the active page marked, that every figure renders, and that nothing scrolls sideways.

Then open both local URLs in Safari and check the same things. If Safari cannot be driven from this session, say so in the hand-over and mark Safari as unverified. Do not claim it.

- [ ] **Step 5: Hand over to Nick. Do not push**

Report, with screenshots: what was built, the gate-run result, what was verified in which browser, and the two local URLs. Then state the target out loud, `VV-DSGN-INC/Super-AI-Components`, branch `claude/superai-design-system-alignment-e0e2b0`, and ask before pushing. Pushing needs the `weeeha` GitHub account: check with `gh api repos/VV-DSGN-INC/Super-AI-Components --jq .permissions` before trying.

The PR body must say: what is portable to Minimal Design System (the deriver, the roster test, the claims ledger, the page-data shape) and that it assumes this repo's rule schema. It must say the prose is a draft behind a visible note, that `ONE_LINER` and `LEDE` are Nick's, and that nothing deploys on merge.
