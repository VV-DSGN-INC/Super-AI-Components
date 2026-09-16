# Patterns layer: design

**Written 2026-09-15, at commit `bbde9b9`** (the merge of PR #55). Every count
below was measured in a worktree at that commit. Where a count contradicts a
doc, the doc is what is wrong.

**Status: approved direction, not implemented.** Brainstormed 2026-09-15 on
branch `claude/project-landing-page-00809c`. Phase 1 lands from one plan,
`docs/superpowers/plans/2026-09-15-patterns-layer.md`, to be written next.
Phase 2 (§11) is a second plan against this same spec and needs no spec of its
own.

---

## 1. Why this exists

The docs site indexes the catalog by component identity and by nothing else.
`/` is a two-column grid of 116 bordered cards; `/components/[name]` is the
leaf. A reader who arrives knowing what they want the interface to _do_ ("let
the user branch the conversation", "show a draft before committing it") has to
already know which of 116 names does that. So does an agent: the emitted
`llms.txt` says what each component is, and nothing in the corpus answers "what
do I install for draft mode".

Two things prompted the layer and both are recorded so the reasoning does not
get re-derived.

**The reference.** [shapeof.ai](https://www.shapeof.ai) (Emily Campbell, 2025)
is a library of 57 named AI-interface behaviours in six groups, each
illustrated with screenshots of other people's products, under CC-BY-NC-SA.
It has no code: its UI Library route returns 404 and its examples page is a
waitlist. A 2026-09-01 mapping of its 57 entries against this catalog found 33
covered by a shipped component, 11 partially, 9 absent, and 4 that are token or
brand concerns rather than components. The site proves there is an audience
for the behaviour axis. The asymmetry runs the other way on evidence: this repo
has 116 installable items, each with stories, a guidance module, an
accessibility baseline and a token gate.

**The coverage argument.** `gaps.md` §1 records the catalog's structural
weakness: the inclusion test is only as good as the population it samples,
and a rule that discards single-occurrence patterns cannot tell "rare" from
"unsampled". Today a missing component is found when a builder hits the wall
(`CONTINUE.md` §8). A behaviour index is a second, independent coverage test.
Every behaviour that cannot be composed from shipped items is a visible,
gate-counted hole, and the count may only go down.

What the layer is not: a second copy of the component docs under new names.
`CLAUDE.md` forbids the second copy, and D23 already fixes the rule this design
follows: one source module per page, every other surface derived.

## 2. What was measured

| fact                                                   | value                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page routes under `apps/docs/app`                      | 3 files: `page.tsx` (`/`), `components/[name]/page.tsx`, and `components/layout.tsx`, which mounts `components/docs-nav.tsx` (a layer-grouped nav) on every `/components/*` route; `/` has no nav |
| shipped items in `catalog.manifest.ts`                 | 116, families A to P, G cut (D9)                                                                                                                                                                  |
| guidance modules under `content/components/*.docs.tsx` | 116, one per shipped item, typed `ComponentDocs`                                                                                                                                                  |
| demos under `components/demos/*-demo.tsx`              | 131: 116 catalog plus 15 marketing items, wired by `gen-wiring.mts` into `lib/demos.generated.ts`                                                                                                 |
| what `gen-wiring.mts` emits                            | `lib/demos.generated.ts`, `lib/docs.generated.ts`                                                                                                                                                 |
| what `contract:emit` emits                             | one `.meta.json` per item, `index/components.toon`, `public/llms.txt`, `public/llms-full.txt`                                                                                                     |
| what `check:contract` runs                             | `check-contract.mts`, `check-citations.mts`, `reconcile-deps.mts`                                                                                                                                 |
| what the smoke gate asserts about `/`                  | one thing: a heading named `Super-AI-Components` is visible (`e2e/smoke.spec.ts` line 8)                                                                                                          |
| what the smoke gate asserts per component              | `[data-slot="component-page-title"]` carries the title; zero console errors; do and don't slots render                                                                                            |
| shrink-only baselines in the repo                      | `scripts/lib/story-coverage.baseline.json`, `apps/docs/cssvars-liveness.baseline.json`, `a11y-exclusions.baseline.json`                                                                           |
| story-coverage obligations                             | three kinds (`case`, `described`, `variant`), all derived from the manifest; a pattern is not a manifest item                                                                                     |
| Storybook story location                               | `apps/storybook/src/**/*.stories.@(ts\|tsx)`, imports through the storybook workspace's own `@/` alias                                                                                            |
| last recorded decision                                 | D25 (2026-09-14)                                                                                                                                                                                  |
| the recorded behaviour spine                           | `concept-model.md` §3: COMPOSE (D) → GENERATE (E) → RESULT (F) → LIBRARY (J), EDIT (H, I), references loop back to D                                                                              |
| the 5 "known gaps" cited on 2026-09-01                 | not in `gaps.md`; they exist only in the shapeof.ai mapping, under shapeof.ai's names                                                                                                             |

## 3. Decisions

### D26 · A pattern names a behaviour and resolves to shipped components, or declares itself unfilled with a reason

A pattern earns a module under `content/patterns/` when all of the following
hold:

- Its title names something the interface does for the user, in the user's
  terms. "Draft before commit", not "diff-view". A pattern that is one
  component under another name fails this test and is not written.
- It either composes at least one shipped manifest item, or it is `unfilled`:
  `components: []`, no composition, and an `unfilledBecause` string of at least
  20 characters saying what is missing and where it was observed.
- Its evidence is the union of its components' `evidence` fields. A shipped
  pattern needs no fresh research. An unfilled pattern carries its own
  `evidence`, held to the same standard as a component candidate in `gaps.md`.

The 20-character floor is D25 applied to a missing component instead of a
missing decision: silence is not a gap report.

**Rules out:** inventing forty names in an afternoon, and relabelling the
component index as "patterns".

### D27 · The spine is the lifecycle loop; families are untouched, and the join is a gated field

The left nav of the patterns index is seven stages derived from
`concept-model.md` §3 and the families around it, in the order a user meets
them (§5). It is not the families renamed, and it is not a taxonomy borrowed
from the reference. Families A to P stay exactly as they are, as the
component axis: they are load-bearing in `component-specs.md`, `catalog.md`,
the gates, the wave commit convention and every decision record, and a
behaviour axis that tried to _be_ them would fork the vocabulary.

The two axes meet in one place, `PatternDocs.components`, and that field is
gated: every entry must be a shipped manifest name. Two vocabularies for two
different things, joined by a check, is not the drift `CLAUDE.md` warns about.
Two vocabularies for one thing would be.

**Rules out:** renaming families; a pattern group that is a family; any
grouping or naming taken from shapeof.ai, whose CC-BY-NC-SA share-alike terms
would attach to a derived taxonomy. The site is cited, in this section, as the
reference that prompted the layer, and nothing else is taken from it.

### D28 · Everything a pattern page shows beyond its own module is derived

Related patterns, the section nav, the index, the agent corpus and the
Storybook obligation all derive from the pattern modules and the manifest.
None of them is hand-maintained. The mechanism is §8; the reason is D23's: a
hand-listed "related" field is a second copy of the composition graph and rots
the first time a component is added.

### D29 · The hero is the composition; there is no illustration asset class

The detail page's hero renders the pattern's composition live, through the same
`PreviewTabs` mechanism component pages use, so the code is one tab away and
the picture cannot drift from the code. An unfilled pattern renders a grey-box
anatomy generated from its `anatomy` slots and an `unfilled` badge, so a hole
in the catalog is visible on the site rather than hidden behind a nicer image.
Cards carry no image in phase 1.

**Rules out:** a folder of SVGs, product screenshots (the reference's
approach, and other people's interfaces), and a screenshot pipeline in phase 1.
Derived thumbnails are §13.

## 4. The record

One module per pattern, `apps/docs/content/patterns/<slug>.pattern.tsx`,
default-exporting a `PatternDocs`. Field names reuse `ComponentDocs` where the
meaning is the same, so a reader of one module can read the other.

```ts
export type PatternStage = "start" | "ask" | "tune" | "watch" | "review" | "keep" | "trust";

export interface PatternDocs {
  /** Reader-facing name of the behaviour. Never a registry name. */
  title: string;
  stage: PatternStage;
  /** What the interface does for the user, two or three sentences. */
  definition: string;
  /** Why it earns a page: the problem it solves, cited to the reference boards where possible. */
  whyItMatters: string;
  /** Shipped manifest names, in composition order. Empty only when `status` is "unfilled". */
  components: string[];
  /** Named slots of the composition, rendered as callouts over the live hero,
   *  or as the grey-box anatomy when the pattern is unfilled. */
  anatomy: DocsSlot[];
  /** Situations the composition gets wrong in practice. Same discipline as ComponentDocs.pitfalls. */
  pitfalls: string[];
  /** Products the behaviour was observed in. Optional when shipped: inherited from the components. Required when unfilled. */
  evidence?: string[];
  status: "shipped" | "unfilled";
  /** Required when unfilled, gated at 20 characters (D26). What is missing, and where it was seen. */
  unfilledBecause?: string;
}
```

What is deliberately not on the record: `related` (derived, D28),
`illustration` (D29), `family` (the join is `components`), `group` (the join
is `stage`), and `usage`, `dos`, `donts`, `accessibility`. Those four belong
to the components a pattern composes, and a pattern page links down to them
rather than restating them. A pattern that needs its own accessibility notes
is a block, and belongs in family O under `block-build-brief.md`.

The composition, when shipped, is two authored files, following the component
convention exactly:

- `apps/docs/components/pattern-demos/<slug>-demo.tsx`, the composition the
  docs hero renders.
- one story under `apps/storybook/src/stories/patterns/`, title
  `Patterns/<Stage>/<Title>`, so the Storybook a11y and interaction gate
  exercises it.

## 5. The spine

Seven stages. Names are provisional until the spec review; the ordering
principle is the decision. Each row names the families whose components it
draws from and the question a reader arrives with.

| stage    | draws from                                | the reader's question                          |
| -------- | ----------------------------------------- | ---------------------------------------------- |
| `start`  | B shell, C home, L first-run              | how do I get in, and where am I                |
| `ask`    | D composer and context                    | how do I say what I want                       |
| `tune`   | E generation and parameters               | how do I control what comes back, and its cost |
| `watch`  | N, the streaming, run and tool-call half  | what is it doing right now                     |
| `review` | F results, H timeline, I editor surfaces  | is this right, and how do I fix it             |
| `keep`   | J library, K documents and knowledge      | where does it go, and how do I find it again   |
| `trust`  | N, the permission and attribution half; M | what is it allowed to do, and what am I paying |

A pattern declares its stage; the stage is not derived from its components'
families. Family N splitting across `watch` and `trust` is the reason: a
component is placed once, a behaviour is placed by the question it answers.
The `draws from` column is guidance for the author, not a constraint the gate
checks.

## 6. Routes and the shell

Three routes in phase 1, one of them new, one of them changed, one untouched.

### 6.1 `/` becomes the patterns index

Stage nav on the left, in spine order, each entry showing its pattern count.
Cards on the right, grouped under stage headings in the same order. A card
carries: title, definition, stage, up to three component chips (then `+n`),
and the `unfilled` badge where it applies. Unfilled cards sort last within
their stage.

The current `/` (the component grid) moves to `/components` (§6.3). The smoke
gate's one assertion about `/` (§2) changes with it: the plan owns the edit.

### 6.2 `/patterns/[slug]`

Top to bottom: hero (§7), title and definition, `whyItMatters`, anatomy
callouts, the components it composes (each linking to its `/components/[name]`
page, with that component's `whatItIs` as the row's one-line description),
pitfalls, evidence, related patterns. The section nav on the right lists these
sections; §6.4 says how.

`generateStaticParams` returns every pattern, shipped and unfilled. An unfilled
page renders the same skeleton with the grey-box hero, `unfilledBecause` in
place of the composition, and an empty components section that says so.

### 6.3 `/components` is created

The component index does not exist today: the only way to reach a component
page is from `/`. `/components` renders inside the shell (§6.4) with the
Components area active, the doc-nav listing the families A to P in catalog
order, and the card grid grouped by family with the 15 marketing items in a
`Marketing` group at the end so they do not become orphans when `/` changes.
The existing `app/components/layout.tsx` (the `DocsNav` chrome) moves to
`app/components/[name]/layout.tsx` so it keeps wrapping the component pages
and stops wrapping the index. That move is the only change under
`app/components/[name]/` in phase 1; `page.tsx` there has no diff. Phase 2
(§11) moves the component page itself onto the shell.

### 6.4 The shell and its derived parts

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

**Section nav.** The detail page declares its sections once, as an array of
`{ id, heading, render }`; the body and the nav both map over that array. They
cannot disagree because there is one list.

**Related.** For a shipped pattern: every other pattern scored by the number
of components the two share, ties broken by same stage, then by title; the
top four, excluding itself. For an unfilled pattern, which shares nothing: the
other patterns in its stage, shipped first, then by title, capped at four. The
same index, inverted, gives phase 2 the component page's "used in these
patterns" section.

## 7. Illustration

The hero is a `PreviewTabs` with the composition on the preview tab and the
demo source on the code tab, exactly as `/components/[name]` does it,
rendered as the page's first section, "Live", directly under the title and
lede.

Unfilled: a grey-box anatomy, one labelled box per `anatomy` slot, laid out in
declaration order, in the same frame. It is generated, not drawn, and it
matches the tone of the 110 wireframe tiles on the working board
(`figma-board-map.md`), so the site and the board speak the same visual
language for the same thing: something not yet built.

No image on cards in phase 1. The card's job is to be scanned by stage and
title; a thumbnail that is a working composer at 320 pixels reads as grey
noise, and a thumbnail that is an anatomy sketch says nothing a title does not.
Derived thumbnails are revisited in §13 once a screenshot pipeline exists.

## 8. Derivation and drift

Every surface below is emitted by a script and checked by a test, or it does
not exist. Nothing here is hand-edited, and `CLAUDE.md`'s rule about
hand-editing derived files extends to every file in this list.

| source                                                 | emitted by          | emits                                                                                                                                                                |
| ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/patterns/*.pattern.tsx` and `pattern-demos/*` | `gen-wiring.mts`    | `lib/patterns.generated.ts`: slug → module, slug → demo, the derived related index, and the stage counts                                                             |
| the same, plus `catalog.manifest.ts`                   | `contract:emit`     | `index/patterns.toon`; a `Patterns` section appended to `public/llms.txt` and `public/llms-full.txt`, one entry per pattern with its components and install commands |
| the same                                               | `patterns:baseline` | `scripts/lib/patterns-unfilled.baseline.json`: the set of unfilled slugs. The script refuses to write a larger set than the one on disk.                             |

The `.toon` file and the `llms` sections use the same field names as the
component entries they sit beside, so an agent that has learned to read one
can read the other. The install command for a pattern is the list of its
components' install commands, in composition order, because a pattern is not
a registry item and does not install (§13).

The unfilled baseline is a ratchet in the shape of `story-coverage.baseline.json`:
regenerated only through its script, and the script only shrinks it. The set of
unfilled patterns may lose members when a component ships and may never gain
one silently. Adding a new unfilled pattern is a deliberate act: the author
regenerates the baseline, and the diff shows the addition in review.

## 9. Gates

Listed in `ci.yml` order, because a gate list that is not in that order is the
trap `CLAUDE.md` names. Steps not mentioned are untouched.

- **`typecheck`.** `PatternDocs` is a type; a module that does not satisfy it
  does not compile. `patterns.generated.ts` is typed against the manifest's
  `CatalogName`, so a `components` entry that is not a registry name fails
  here before any test runs.
- **`check:contract`.** `check-contract.mts` gains pattern orphan detection,
  mirroring what it does for components: every file under `content/patterns/`
  has a slug that `patterns.generated.ts` knows, and every demo under
  `pattern-demos/` belongs to a shipped pattern.
- **`test`.** In vitest, beside `contract-emit.test.ts`:
  - schema: every module evaluates, and every field carries the value its
    comment prescribes (`definition` non-empty, `stage` in the enum,
    `anatomy` non-empty);
  - resolution: every `components` entry is a shipped manifest item, not
    `planned`, `building` or `cut`;
  - D26: `status: "unfilled"` requires `components: []` and an
    `unfilledBecause` of at least 20 characters; `status: "shipped"` requires
    at least one component and a demo;
  - obligation: every shipped pattern has a story titled
    `Patterns/<Stage>/<Title>`, checked the way `story-coverage.ts` checks
    component obligations, as a fourth obligation kind, `composition`;
  - drift: `patterns.generated.ts`, `index/patterns.toon` and the two `llms`
    sections match a fresh emission byte for byte;
  - ratchet: the set of unfilled slugs in the modules is a subset of the
    baseline, and the baseline script refuses to grow.
- **Playwright smoke.** `/` asserts the patterns index heading and at least one
  stage heading. Every pattern page, shipped and unfilled, gets the component
  loop's treatment: a `[data-slot="pattern-page-title"]` carrying the title
  and zero console errors. `/components` asserts the component index heading
  and one family heading. The existing per-component loop is unchanged.
- **Storybook a11y and interaction.** Nothing to add: the `Patterns/*` stories
  are stories, and `test:stories` runs every story. Expect this gate to find
  cross-component contrast failures in compositions that no single component
  showed, because that is the shape `a11y-baseline.md` records as the one that
  actually ships broken. The exclusion list may not grow to absorb them; the
  component gets fixed.
- **Consumer install test.** Unchanged. A pattern installs nothing (§13).

## 10. The launch set

Phase 1 ships with at least two shipped patterns per stage, fourteen minimum,
plus every unfilled pattern that passes D26. The plan produces the list; this
section fixes how it is produced, so the list is derived rather than invented.

1. Walk the 116 guidance modules. Each `whatItIs` and `whyItMatters` names
   the job the component does. Cluster components by job, not by family. A
   cluster with one member is a component, not a pattern, unless its job is
   plainly a user-facing behaviour (a `permission-prompt` is a pattern on its
   own; a `kbd` is not).
2. Walk `concept-model.md` §3 and §4. Every arrow on the lifecycle loop is a
   candidate: reference loops back to compose, edit returns to result.
3. Walk `gaps.md` and `agent-board-analysis.md` for named behaviours with
   evidence that no shipped component covers. These are the unfilled
   candidates.
4. Take the 2026-09-01 shapeof.ai mapping as a lead list only: the 9 absent
   entries say where to look. Each lead is re-derived from the boards under
   its own name and its own evidence, or it is dropped.
5. Apply D26 to every candidate. What passes is the launch set.

A floor and a method, not a list, because a list written here would be the
invented taxonomy D26 exists to prevent.

## 11. Phase 2: component pages onto the shell

A second plan against this spec, after phase 1 has merged. It moves
`/components/[name]` onto `DocShell`, adds the section nav (the component page
already renders nine sections from `ComponentDocs`, so the array in §6.4 is a
refactor, not new content), and adds the derived "used in these patterns"
section from the inverted related index. The hero stays where it is on the
component page, below the title: a component's picture is its demo, not its
argument.

Phase 1 must not touch `/components/[name]`. The `data-slot` the smoke gate
targets there is load-bearing, and the two changes are separable.

## 12. Figma

Optional first step of the phase 1 plan, not a prerequisite for the spec. If
drawn, it is a new design file, `Super-AI Patterns`, linked from
`figma-board-map.md` as a third board: the shell, the index at one stage, and
one detail page, drawn from §6 with the registry's own tokens. It is a check
on the proportions of the shell, not a source of truth; the source of truth is
this document and the code that implements it.

## 13. Out of scope, deliberately

- **Card thumbnails.** Need a screenshot pipeline (Storybook render at build
  time, drift-gated like every other derived file). Revisit after phase 2.
- **App-type recipes.** The reference board's other axis (Video Editor, Chats,
  Flow Builders, and the rest, `reference-board-analysis.md` §1). A different
  product: a recipe is a shell plus a set of patterns. It would sit on top of
  this layer, and nothing here prevents it.
- **Installing a pattern.** A pattern is not a registry item. Making one
  installable means a `registry:block`-shaped item with a composition file,
  and that is family O work under `block-build-brief.md`. If a pattern's
  composition turns out to be something people want to install as one unit,
  it becomes a block and the pattern links to it.
- **Search.** The stage nav is the finding mechanism in phase 1.
- **Replacing families.** D27.
- **A `PatternDocs` `registry:file` beside installed components** (the D24
  mechanism). Patterns are a site and corpus concern until a pattern installs.

## 14. Risks

- **Names read as slop.** The launch set is derived by §10 and gated by D26,
  and every shipped pattern's evidence is inherited from measured components.
  The remaining risk is titles, and the review of the plan's list is where a
  title gets rejected.
- **Phase 2 creeps into phase 1.** §11 forbids touching `/components/[name]`
  in phase 1, and the smoke gate's per-component loop is the tripwire.
- **The a11y gate goes red on compositions.** Expected, and the point. The
  budget for fixing components that fail only in composition belongs in the
  phase 1 plan, not in a later one.
- **The stage names are wrong.** They are provisional (§5) and they are an
  enum in one type, so renaming one is a mechanical change gated by
  `typecheck`. What is not cheap to change is the ordering principle, which is
  why that is the decision and the names are not.
- **Licence.** Nothing from the reference is used beyond the observation that
  a behaviour index has an audience (D27). If a title in the launch set
  matches one of the reference's 57 by coincidence, it is renamed, because the
  cost of a rename is nothing and the cost of an argument is not.
- **`/` changing breaks something unmeasured.** The only recorded consumer of
  `/` is the smoke gate's heading assertion (§2). Vercel and the README link to
  the site root, and both are served the new index.

## 15. Acceptance

Phase 1 is done when all of the following are measured true in one worktree
at one commit:

- `content/patterns/` holds at least 14 shipped modules with at least two per
  stage, plus every unfilled module that passed D26, and `patterns:baseline`
  has been run once to record the unfilled set.
- `/`, `/patterns/[slug]` for every module, and `/components` render under
  `next start` with zero console errors, and `e2e/smoke.spec.ts` asserts all
  three as §9 describes.
- `index/patterns.toon`, `public/llms.txt` and `public/llms-full.txt` contain
  one entry per pattern, and a fresh `contract:emit` changes no bytes.
- Every shipped pattern has a `Patterns/*` story and `test:stories` is green
  with no addition to `a11y-exclusions.baseline.json`.
- The twelve `ci.yml` steps are green in order, and `consumer-test.sh` is
  unchanged.
- `app/components/[name]/page.tsx` has no diff against `main`; its layout file
  has moved one directory down and nothing else.
- `decisions.md` carries D26 to D29 with the dates and the one-paragraph
  reasoning above, `figma-board-map.md` carries the third board if it was
  drawn, and `CONTINUE.md` §8 records the unfilled set as the backlog it now
  is.
