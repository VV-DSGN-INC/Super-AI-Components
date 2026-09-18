# Harness and Architecture pages: design

**Date:** 2026-09-18. **Baseline:** `main` at `9ded33d` (PR #58 merged). **Plan:**
[`../plans/2026-09-18-harness-architecture-pages.md`](../plans/2026-09-18-harness-architecture-pages.md),
written after this spec is approved.

Two pages, Harness and Architecture, that describe this repo as a design system
an agent can be held to. They render on the public docs site and in Storybook
from one source. Every number on them is counted from the tree, the gate roster
they print is held to `ci.yml` by a test, and their prose passes the same kind
of checks it describes.

The idea comes from `pegbo-inc/design-system-rebuild` (`src/docs/harness.mdx`
and `src/docs/architecture.mdx`, read at `27729431`). Pegbo owns that source, so
this spec carries the pattern and rewrites everything. No text, diagram or
module is copied.

This is sub-project A of four agreed on 2026-09-18. Each gets its own spec, plan
and PR.

| sub-project   | repo                  | what                                                                                                                                                        |
| ------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A (this spec) | Super-AI              | the two pages and the machinery under them                                                                                                                  |
| B             | Super-AI              | the gaps the pages have to admit: an audit loop, carry items 4 to 7 of the 2026-09-18 pegbo transfer audit, verdicts on pegbo PRs #391, #404, #376 and #415 |
| C             | Minimal Design System | a Harness page, and its hand-written Architecture page rebuilt on this pattern                                                                              |
| D             | Minimal Design System | its six carry items                                                                                                                                         |

## 1. Decisions made with Nick

| #   | decision                | choice                                                                                                                                                                                                                                                                |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | order                   | A, B, C, D. Writing the pages first forces every claim onto a count or a gate name, so the pages double as the gap audit for B                                                                                                                                        |
| 2   | surfaces                | both: Next routes and Storybook docs pages, from shared modules                                                                                                                                                                                                       |
| 3   | first reader of Harness | someone sizing up the system in two minutes. The developer deciding whether to install, and their agent, come second. Architecture carries the contributor                                                                                                            |
| 4   | numbers                 | an emitted facts file with a drift test. Build-time derivation was rejected: nobody could confirm from the dev machine that the Vercel build sees files outside `apps/docs`, and the counts need `ci.yml`, `packages/ds-rules/rules` and `apps/storybook/src/stories` |
| 5   | prose                   | typed string data, the convention `content/components/*.docs.tsx` already uses. Nick writes the one-liner and the Harness lede, and does the final pass before any prod deploy                                                                                        |
| 6   | Storybook               | stays local. Serving it at `/storybook/` is a separate later task                                                                                                                                                                                                     |

## 2. Measured state at baseline

| what                      | measurement                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                        | one `verify` job, 12 gate steps, triggers `push: main` and `pull_request`, no `schedule:`                                                                     |
| `run-gates.sh`            | 12 `run` lines, same order as `ci.yml`                                                                                                                        |
| `gate-run/SKILL.md`       | prose says "Eleven steps". A typed count that went stale when `format:check` joined on 2026-09-07. Remediation Task 5 already plans the fix (section 8)       |
| manifest                  | 116 `shipped`, 11 `cut`                                                                                                                                       |
| contracts                 | 116 `*.meta.json` under `apps/docs/registry`                                                                                                                  |
| stories                   | 116 story files under `apps/storybook/src/stories/super-ai`                                                                                                   |
| rules                     | 20 records. `detect.method`: grep 10, heuristic 8, rendered 1, judgment 1. Severity: 17 blocker, 2 warning, 1 review                                          |
| shrink-only ledgers       | 4 `*.baseline.json`: a11y exclusions, story coverage, contract coverage, cssVars liveness                                                                     |
| Storybook prose pages     | 32 MDX files, none named Harness or Architecture                                                                                                              |
| Next routes               | `/` and `/components/[name]`. No MDX support in the Next app                                                                                                  |
| `CLAUDE.md`               | 14,244 bytes against a 14,500 ceiling pinned by `apps/docs/scripts/lib/claude-md.test.ts`. The free bytes are claimed by PR #59 and remediation Task 5        |
| Storybook to docs aliases | `apps/storybook/vite.config.ts` already maps `@/content/*`, `@/components/component-docs`, `@/components/demos/*` and `@/lib/component-docs` into `apps/docs` |
| inline code in prose      | `InlineProse` in `apps/docs/components/component-docs.tsx` splits on backticks. It is not exported                                                            |
| token gate                | `rulecheck.mjs` takes `--files` with explicit repo-relative paths. Rules carry their scan scope in `detect.scope`                                             |
| JSX prose trap            | `react/no-unescaped-entities` is an error here and has broken lint twice (CONTINUE, traps). Prose held in strings avoids it                                   |
| YAML parser               | `js-yaml@4.2.0` is in the lockfile transitively. `apps/docs` has no direct YAML dependency                                                                    |

## 3. Scope

In scope:

- The two pages on both surfaces: Next `/harness` and `/architecture`, Storybook
  `Harness` and `Architecture`.
- A facts deriver, an emitted `facts.json`, and its drift test.
- A gate roster as data, held to `ci.yml` and `run-gates.sh`. This closes carry
  item 3 of the 2026-09-18 audit (skill drift test).
- A claims ledger that checks known count claims in prose against the deriver.
- Four figures, a gates table and a derived-files table, each figure with a
  story.
- A "System" group in the docs nav and two links in Storybook's Overview page.

Out of scope, and why:

- Anything under `registry/super-ai/**`. The registry is the product and these
  pages are not part of it, so `build:registry` output and the consumer test do
  not change.
- Any edit to `CLAUDE.md`. There are no free bytes. The do-not-edit rule for
  `facts.json` is carried by the file's banner, the drift test's message and a
  CONTINUE entry.
- A new CI step. Every new test runs inside `pnpm test`, so `ci.yml`,
  `run-gates.sh` and the twelve-step claim stay as they are.
- Public Storybook, pointers from `llms.txt`, a token-layer figure, a
  commit stamp on the page.
- The gaps themselves. The pages state them, Spec B closes them.

## 4. Units

Each unit has one job and can be tested without the others.

### 4.1 Facts deriver

`apps/docs/scripts/lib/system-facts.ts` exports
`deriveFacts(repoRoot: string, manifest = MANIFEST): SystemFacts`. It is pure and
synchronous and uses Node `fs` only. The root and the manifest are parameters so
the control test can point it at a planted fixture tree.

The list of facts is closed. A page may only state a number that is on it.

| key                 | definition                                                    | source                              |
| ------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `shipped`           | manifest items with `status: "shipped"`                       | `apps/docs/lib/catalog.manifest.ts` |
| `shippedPrimitives` | shipped items with `layer: "primitive"`                       | same                                |
| `shippedComponents` | shipped items with `layer: "component"`                       | same                                |
| `shippedBlocks`     | shipped items with `layer: "block"`                           | same                                |
| `contracts`         | `*.meta.json` files under `apps/docs/registry/super-ai`       | fs                                  |
| `storyFiles`        | `*.stories.tsx` under `apps/storybook/src/stories/super-ai`   | fs                                  |
| `prosePages`        | `*.mdx` under `apps/storybook/src`                            | fs                                  |
| `rules`             | records across `packages/ds-rules/rules/*.json`               | JSON                                |
| `ruleBlockers`      | records with `severity: "blocker"`                            | same                                |
| `rulesStatic`       | records whose `detect.method` is `grep` or `heuristic`        | same                                |
| `rulesRendered`     | records whose `detect.method` is `rendered`                   | same                                |
| `rulesJudgment`     | records whose `detect.method` is `judgment`                   | same                                |
| `ciSteps`           | distinct gate steps in `ci.yml`, as `readCiSteps` counts them | `.github/workflows/ci.yml`          |
| `ledgers`           | `*.baseline.json` files under `apps/`, outside `node_modules` | fs                                  |
| `skills`            | directories under `.claude/skills`                            | fs                                  |

Errors: a missing input path, an unparseable file, or any count of zero throws
`FactsInputError` naming the path and the key. "Could not check" must never look
like a clean result. If a count legitimately reaches zero later, the sentence
that uses it needs rewriting anyway, so the failure is useful.

A key that no page ends up using is removed from the deriver. It is not kept for
later. `pages.test.ts` enforces this.

Emit: `apps/docs/content/system/facts.json` holds a `generated` banner string
and the keys in alphabetical order, written as
`JSON.stringify(facts, null, 2)` plus a trailing newline, which prettier leaves
alone. The script mirrors `contract:emit`:

```json
"facts:emit": "FACTS_EMIT=1 vitest run scripts/lib/system-facts.test.ts"
```

Who emits: the contract-wave protocol applies. Parallel build agents never emit.
The integrator emits once per batch.

### 4.2 Gate roster

`apps/docs/scripts/lib/ci-steps.ts` exports `readCiSteps(repoRoot)`. It parses
the workflow with `js-yaml` (added as a devDependency of `apps/docs`), walks
every job in document order, keeps the steps that have a `run:` key, keys each
one by its `name:` when it has one and by its trimmed `run:` string otherwise,
and drops a key it has already seen. `uses:` steps are setup and are skipped.

The dedupe rule is the counting rule remediation Task 5 already writes into
`CLAUDE.md`: after `verify` splits into `gates` and `product`, both jobs install,
and the count stays twelve. The parser gives twelve before and after that split.

`apps/docs/content/system/gates.ts`:

```ts
export type GateKind = "install" | "static" | "test" | "build" | "browser";

export interface GateCheck {
  /** Repo-relative path of the script or test file that does the checking. */
  file: string;
  protects: string;
}

export interface GateRow {
  /** The step's `name:` in ci.yml when it has one, otherwise its `run:` string. */
  ciStep: string;
  /** The label `run-gates.sh` gives the same step. */
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
}

export const GATE_ROWS: GateRow[];

/** ci.yml `run:` steps that are not gates, each with its reason. Empty at baseline. */
export const PLUMBING: { ciStep: string; reason: string }[];
```

Twelve rows at baseline, with these `ciStep` values in this order:
`pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`,
`pnpm typecheck`, `pnpm check:tokens`, `pnpm check:contract`, `pnpm test`,
`pnpm build:registry`, `pnpm build`, `Playwright smoke`,
`Storybook a11y + interaction`, `Consumer install test`.

`PLUMBING` exists for the 2026-09-18 CI concurrency and scope plan, which adds a
`run:` step that computes a docs-only flag. A step that is on neither list fails
the roster test with the message "add a GateRow, or a PLUMBING entry with a
reason". That is the point: a new CI step has to be explained before it lands.

Two blind spots the rows must carry, because `CLAUDE.md` already states them:
`pnpm check:tokens` cannot see muted text in a child whose ancestor paints the
muted surface, and a green Playwright run proves nothing unless the app was
rebuilt first.

### 4.3 Derived-files table

`apps/docs/content/system/derived.ts` exports `DERIVED_ROWS`: for each generated
artifact, its source, the command that writes it, the test that holds it to the
source, and whether it is committed. Rows at baseline: the registry output
(`public/r`, not committed), the contracts layer (`*.meta.json`,
`index/components.toon`, `public/llms*`), the ds-rules JSON, the two
`gen-wiring.mts` outputs, and `facts.json`.

### 4.4 Claims ledger

`apps/docs/content/system/claims.ts` exports `CLAIMS`: known count claims in
prose, each as `{ file, pattern, fact }`. The pattern captures a number or a
number word (one to twenty, case-insensitive), and the test compares it with the
deriver's value for `fact`.

Entries at baseline:

| file                               | claim                | fact      |
| ---------------------------------- | -------------------- | --------- |
| `CLAUDE.md`                        | "Twelve steps."      | `ciSteps` |
| `CLAUDE.md`                        | "116 of 116 shipped" | `shipped` |
| `.claude/skills/gate-run/SKILL.md` | "Eleven steps,"      | `ciSteps` |

The ledger does not discover new claims. It stops the known ones from drifting,
and a pattern that matches nothing fails, so an entry cannot go dead quietly.

### 4.5 Page data

`apps/docs/lib/system-page.ts` holds the types and one pure function:

```ts
export type FigureId = "harness-parts" | "consumer-surfaces" | "loops" | "ci-pipeline";

export type PageBlock =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "figure"; figure: FigureId; caption: string }
  | { kind: "gates" }
  | { kind: "derived" }
  | { kind: "links"; items: { label: string; href: string }[] };

export interface PageSection {
  id: string;
  heading: string;
  blocks: PageBlock[];
}

export interface SystemPage {
  slug: "harness" | "architecture";
  title: string;
  description: string;
  lede: string[];
  sections: PageSection[];
}

/** Replaces every `{facts.key}` in `text`. Throws on a key that is not a fact. */
export function resolveFacts(text: string, facts: SystemFacts): string;
```

`apps/docs/content/system/harness.page.ts` and `architecture.page.ts` each
export one `SystemPage`. Prose is plain strings. Backticks mark inline code, as
in the component docs. A number appears only as a `{facts.key}` placeholder.

Inline links inside a paragraph are not supported in this version. The two pages
point at each other through the closing `links` block.

### 4.6 Renderer and blocks

`apps/docs/components/system/`:

| file                    | job                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `system-page.tsx`       | server component: renders a `SystemPage` with `facts`, the roster and the derived rows    |
| `gates-table.tsx`       | the roster as a table: step, what it protects, checks, ledgers, blind spot                |
| `derived-table.tsx`     | `DERIVED_ROWS` as a table                                                                 |
| `harness-parts.tsx`     | figure: instructions, tools, memory, loops, each with this repo's content                 |
| `consumer-surfaces.tsx` | figure: what an installing developer and their agent meet, in retrieval order             |
| `loops.tsx`             | figure: the build loop, the rejection-becomes-a-rule edge, the audit loop drawn as absent |
| `ci-pipeline.tsx`       | figure: the roster in order, by `kind`, with the three product steps marked               |

`InlineProse` gets exported from `component-docs.tsx` and reused. It is not
duplicated.

Figures are HTML boxes styled with token classes, not hand-placed SVG. Text is
real text in DOM reading order inside a `<figure>` with a `<figcaption>`. Any
connector is a border utility or an inline SVG that draws with `currentColor`,
so no raw colour enters the file. Every figure takes its labels and counts as
props from the roster and the facts. It types none of them.

### 4.7 Surfaces

- Next: `apps/docs/app/harness/page.tsx` and
  `apps/docs/app/architecture/page.tsx`, each a server component with
  `export const metadata`, rendering `SystemPage`.
- Storybook: `apps/storybook/src/stories/Harness.mdx` and `Architecture.mdx`
  beside `Overview.mdx`, each a `<Meta title="…" />` plus the same component.
- `apps/storybook/vite.config.ts` gains aliases for `@/components/system/*` and
  `@/lib/system-page`, placed before the `@/(.*)` catch-all, which would
  otherwise send them to Storybook's own `src`.
- `apps/docs/components/docs-nav.tsx` gains a "System" group above the catalog
  groups. `Overview.mdx` gains two links.

## 5. Page outlines

Both pages follow one rule of structure: the first paragraph is the whole
statement, and each section after it is the same statement at more depth, so a
reader can stop anywhere.

**Harness**

1. Lede and one-liner. These two strings are Nick's.
2. What you get beyond shadcn: the usage contract installed beside each
   component, the routing table, the `llms.txt` corpus, and the order an agent
   should read them in. Figure: consumer surfaces.
3. The four parts with this repo's content: `CLAUDE.md` as a map under a byte
   ceiling, the rule records and the four skills, the derived contracts layer,
   the build loop. Figure: harness parts.
4. The part that has to be built locally: the gates. States the limits in
   section 5.1.
5. How to explain it: the longer version, and the answer to "is that a design
   system with tests?".

**Architecture**

1. Lede: rules here are executable, and every number on the page is counted.
2. The build loop, and the audit loop stated as missing. Figure: loops.
3. Element types, as a table with paths: instructions, rules, skills, manifest,
   contracts, stories, specs and plans, gates, docs.
4. What derives from what. Block: derived.
5. The gates. Block: gates. Ratchets and control tests called out. Figure: CI
   pipeline.
6. Usage contracts: the fields, from the guidance module.
7. Stories and coverage: declared-state stories, case stories, the ratchet.
8. A change, end to end.
9. Principles.

### 5.1 Limits the prose must state

A page that argues for executable rules loses its reader at the first claim it
cannot back. These go on the page in plain words:

- There is no audit loop. CI runs on pushes and pull requests. Nothing re-checks
  `main` on a schedule, and nothing compares production with `main`.
- Deploys are manual, so production can lag `main`.
- The contrast rule sees one element at a time. The cross-component shape is
  caught only by the Storybook a11y gate.
- Of `{facts.rules}` rules, `{facts.rulesJudgment}` is judgment only and
  `{facts.rulesRendered}` needs a rendered pass.
- `facts.json` is as of its last emit. A drift test holds it to the tree. It is
  not counted at render time.

## 6. Tests

All of these run inside `pnpm test`. Paths are under `apps/docs` unless stated.

| file                                      | asserts                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/lib/system-facts.test.ts`        | control: a planted fixture tree gives exact counts, and a missing path or a zero throws `FactsInputError`. Real tree: `shipped` equals `contracts`. Drift: the committed `facts.json` equals the derived value, and the failure message names `cd apps/docs && pnpm facts:emit`                                                                              |
| `scripts/lib/ci-steps.test.ts`            | control: a two-job fixture workflow with a repeated install and a `uses:` step parses to the expected keys                                                                                                                                                                                                                                                   |
| `content/system/gates.test.ts`            | roster `ciStep` order equals `readCiSteps` minus `PLUMBING`. `localLabel` order equals the `run "…"` labels in `run-gates.sh`. Every `checks[].file` and `ledgers[]` path exists. The `pnpm check:contract` row lists every script in the docs app's `check:contract` chain. The set of all `ledgers[]` equals the `*.baseline.json` files the deriver finds |
| `content/system/claims.test.ts`           | every `CLAIMS` pattern matches its file, and the captured number equals the fact                                                                                                                                                                                                                                                                             |
| `content/system/pages.test.ts`            | every `{facts.key}` resolves. Every fact key is used by at least one page. No digit appears in prose outside backticks and placeholders, except entries in a reasoned allowlist. Every backticked token that looks like a repo path exists. Writing rules: no em dash, no exclamation mark, none of the banned words in Nick's list                          |
| `components/system/blocks-tokens.test.ts` | ds-rules finds zero blocker violations in `components/system/*.tsx`, with no rule's `detect.scope` widened                                                                                                                                                                                                                                                   |
| `components/system/system-page.test.tsx`  | renders both pages without throwing, one `h1` each, every section heading present, every figure inside a `figure` with a `figcaption`                                                                                                                                                                                                                        |

### 6.1 Page test rules

`pages.test.ts` walks every string in both page modules. Three of its rules need
a definition, so the executor does not have to guess.

- **Digits.** Section numbers come from the renderer, so no heading holds one. A
  digit inside backticks or inside a `{facts.key}` placeholder is allowed. Any
  other digit fails unless the exact string is in `DIGIT_ALLOWLIST`, where each
  entry carries a reason. A contrast ratio is the expected first entry.
- **Repo paths.** A backticked token is treated as a repo path when it contains
  a `/`, holds no whitespace and none of `*`, `{`, `<` or `[`, and does not
  start with `/`, `@` or a URL scheme. Such a token must exist on disk, relative
  to the repo root or to `apps/docs`. Generated paths that a fresh checkout does
  not have, `apps/docs/public/r` first among them, go in `GENERATED_PATHS` with
  a reason.
- **Writing rules.** No em dash and no exclamation mark. None of these words, in
  any case: tapestry, landscape, delve, elevate, seamless, effortless, unlock,
  robust, journey, load-bearing. None of these phrases: "here's the kicker",
  "what people miss", "that distinction matters". The list is Nick's rule for
  outward-facing prose, copied here because the executor cannot read his global
  instructions. It applies to the two page modules only. Repo docs keep their
  own house style.

Outside `pnpm test`:

- `apps/storybook/src/stories/system/SystemFigures.stories.tsx`: one story per
  figure and table, plus a 375px story asserting no horizontal overflow by hand,
  as the existing stories do. The shared helper is Spec B's carry item 6. This
  puts the figures under the axe gate.
- `apps/docs/e2e/smoke.spec.ts`: both routes load, show their `h1`, log no
  console error, and do not overflow at 375px.

## 7. Build order and checkpoints

The plan is written for a non-Fable executor: Sonnet medium on every task, one
task at a time because the tasks share files, with review between tasks.

0. Verify the open items in section 9 before writing code.
1. `ci-steps.ts` and its control test.
2. Facts deriver, control test, emit script, first `facts.json`, drift test.
3. Gate roster, derived rows, and their tests.
4. Claims ledger.
5. Page types, `resolveFacts`, both page modules with drafted prose and Nick's
   two strings marked, and `pages.test.ts`.
6. Renderer, tables and the first figure (harness parts), with its story.
7. **Checkpoint:** screenshots of the first figure in light and dark, at desktop
   width and at 375px. Nick approves the look before the other three are built.
8. The other three figures and their stories.
9. Surfaces: routes, MDX wrappers, aliases, nav group, Overview links, smoke
   tests.
10. `gate-run` from the repo root, then the PR.

`unslop` runs before task 6 (constraints) and again before task 10 (audit).

Done means: `gate-run` is green, both routes and both Storybook pages render in
light and dark at desktop width and at 375px, checked in Chromium and in Safari.
If Safari cannot be checked, the PR says so. The PR ends with the local docs URL
and the Storybook URL.

Prose ownership: the executor drafts everything except Nick's two strings. Nick
does the final pass before any prod deploy. Merging earlier is safe because prod
deploys are manual.

## 8. Interplay with open work

- **PR #59** (review-round budget, and the CI concurrency and scope spec and
  plan): no shared files.
- **Remediation Task 5** (`ci.yml` into `gates` and `product`): it changes the
  "Eleven steps" sentence in `gate-run/SKILL.md` to "Twelve steps", and its Step
  4 quotes the old sentence verbatim. If Task 5 has landed when this plan
  reaches the claims ledger, the ledger only pins the new sentence. If it has
  not, this plan fixes the one word and updates the quoted old text in Task 5
  Step 4 in the same commit, so that executor still finds what it expects.
- **CI concurrency and scope plan:** its docs-only flag step becomes the first
  `PLUMBING` entry, added by whichever of the two lands second.

## 9. Open items for plan task 0

Each is a fact to measure, with a fallback already chosen.

| question                                                                                                    | fallback                                                                                   |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Does ds-rules `scan()` apply a rule to an explicit file outside that rule's `detect.scope`?                 | run each `grep` and `heuristic` record's pattern over the block files directly in the test |
| Do `check:contract` or the story-coverage ratchet treat a story file outside `stories/super-ai/` as theirs? | move the figure stories to a path both ignore, and record why in the file header           |
| Does `apps/storybook/tsconfig.json` need `paths` entries to match the new aliases?                          | add them, mirroring the existing four                                                      |
| Does `js-yaml@4.2.0` install offline as a direct devDependency, with types?                                 | declare the three functions used in a local `.d.ts`                                        |
| Which test owns `cssvars-liveness.baseline.json`?                                                           | place the ledger on the `pnpm test` row and name the owning test once found                |
| Do new routes under `app/` inherit the docs shell from the root layout?                                     | wrap both pages in the shell component the component pages use                             |

## 10. What carries

- To Minimal Design System (Spec C): the deriver, the roster, the claims ledger
  and the page-data shape. Its Storybook is Vite only, so it has one surface and
  could count with `import.meta.glob`. Spec C decides whether an emitted file
  still earns its place there.
- To `ds-architecture`, as stage criteria: a counter gets a planted-fixture
  control test, "could not check" gets its own error, and a count typed into
  prose gets a ledger entry or gets removed.
- Open decision from `CLAUDE.md` (overlap with `@weeeha/ui`): these pages
  describe one repo each, so ownership does not collide. The PR body says which
  parts are portable and which schema they assume.
