# The Storybook docs layer: a claim about this system may not be typed by hand

**Date:** 2026-09-08 · **Status:** designed, plan pending
**Adds** a system-level documentation layer to `apps/storybook`, above the 214 story files it already carries.
**Origin:** the repo's architectural material (`docs/design-system/**`) is written for agents and rendered nowhere. Asked "do we have Storybook with architecture?", the honest answer today is no.

## Why

Two surfaces document this system, and both are per-component. `apps/docs`
renders 116 components from `content/components/*.docs.tsx` — one per shipped
item — from 226 files (116 docs modules, 110 examples modules; six components
ship docs with no live example). Its homepage is a
bare link grid. `apps/storybook` carries 214 story files and exactly one MDX
page, `Overview.mdx`. Nothing renders the system-level material: the layer
model, the token contract, the decisions log, the gate chain, the measured
accessibility posture.

That material is not thin. `decisions.md` runs D1 through D22 including
reversals; `packages/ds-rules` holds 20 typed rule records with detectors and
fixtures; CI runs a 12-step chain ending in a consumer install test. The
system has more recorded judgment than most published design systems and none
of it is visible without reading `CLAUDE.md`.

**Audience decision:** this layer is a credibility artifact, read by someone
assessing how the system was built. That reader spot-checks. A single number
they can falsify discounts every other claim on the page, so the design
problem is not "write good pages" but "make a stale claim impossible".

## What the audit taught the design

- **The staleness risk is not hypothetical; it has already happened.**
  `a11y-baseline.md` is dated 2026-08-03 and headlines "47 of 119 stories have
  real, pre-existing a11y violations". The repo now has 214 story files. That
  document is one of the seven `CLAUDE.md` points at as a contract, and its
  headline figure is stale. Copying that prose into a rendered page would ship
  a provably wrong number. This single finding is why derivation is the spine
  of this design rather than a refinement of it.

- **`apps/storybook` has no `test` script, so a gate placed there never
  runs.** Root `pnpm test` is `turbo run test`; turbo's `test` task is `{}` and
  runs only in workspaces defining the script. `apps/docs` defines it,
  `apps/storybook` does not (it has `test:stories`, invoked separately as the
  a11y gate). A drift test in the storybook workspace would be silently unrun
  — the exact failure `CLAUDE.md` records as having already cost a phase. The
  generator and its gate therefore live in `apps/docs`.

- **Cross-workspace import is an established pattern, not new plumbing.**
  `vite.config.ts` and `tsconfig.json` already carry four aliases from
  storybook into `apps/docs` (`@/registry/*`, `@/content/*`,
  `@/lib/component-docs`, `@/components/component-docs`). Adding two more
  extends a pattern the stories already depend on. Note `vitest.config.ts`
  merges `vite.config.ts` explicitly, with a comment recording that vitest
  ignores it otherwise — new aliases must be added to `vite.config.ts` (which
  vitest merges) and to `tsconfig.json`, not to `vitest.config.ts`.

- **Generate-then-drift-gate is the house pattern.** `apps/docs/lib` already
  holds `docs.generated.ts` and `demos.generated.ts` from `gen-wiring.mts`,
  prettier-ignored to keep them byte-identical to generator output. The
  emitted `packages/ds-rules/rules/*.json` is drift-gated the same way. This
  design adds a third instance of a pattern the repo already trusts rather
  than inventing a mechanism.

- **MDX renders in a browser, which splits the sourcing.** Storybook MDX can
  import TypeScript through Vite, so manifest-derived counts can be computed
  live at render and cannot go stale. It cannot read `ci.yml`,
  `packages/ds-rules/rules/*.json` or `a11y-exclusions.baseline.json`. Those
  must be extracted at build time into an emitted module. The split is forced
  by the runtime, not chosen.

- **"Story" is ambiguous and the pages depend on the word.** `find -name
"*.stories.tsx" | wc -l` returns 214 **files**; each exports many stories.
  The a11y baseline's "119" is from an earlier tree and does not state its
  unit. A page whose premise is accurate counting must define the unit once
  and report it consistently. **Decision: the generator reports both, labelled
  — `storyFiles` and `stories` — and no page prints a bare "story" count
  without its unit.**

## The facts pipeline

Three new files plus two alias entries.

| Path                                              | Role                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/docs/scripts/gen-facts.mts`                 | Derives every claimable figure from its real source.                        |
| `apps/docs/lib/facts.generated.ts`                | Emitted, typed, prettier-ignored. Beside its two siblings.                  |
| `apps/docs/lib/facts.generated.test.ts`           | Re-derives and fails on disagreement. Runs inside the existing `test` step. |
| `apps/storybook/vite.config.ts` + `tsconfig.json` | Aliases `@/lib/catalog.manifest` and `@/lib/facts.generated`.               |

**Sources, one per fact group:**

| Fact group                                   | Derived from                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Component counts by status, family, layer    | `apps/docs/lib/catalog.manifest.ts` (live import, not emitted)                  |
| Gate chain                                   | `.github/workflows/ci.yml`, `run:` steps in file order                          |
| Rule records, by severity and file           | `packages/ds-rules/rules/*.json`                                                |
| A11y exclusions, and the baseline's own date | `apps/storybook/a11y-exclusions.baseline.json`, `vitest.config.ts` exclude list |
| Story files and stories                      | glob + export count over `apps/storybook/src/**`                                |
| Registry entry count                         | `apps/docs/registry/super-ai/**`                                                |

Manifest facts are deliberately **not** baked into the emitted module. They
arrive live through the alias, so they cannot drift even between generator
runs. Only facts unreachable from the browser are emitted.

## Drift behaviour

`facts.generated.test.ts` re-runs the derivation and compares against the
committed module. On disagreement it fails naming the stale key and the source
file it was derived from, so the fix is obvious and mechanical: re-run the
generator.

No new CI step. The test rides the `test` step already seventh in the chain,
which keeps the twelve-step list in `CLAUDE.md` accurate. This is deliberate:
`CLAUDE.md` forbids adding a step that duplicates an existing one.

## Information architecture

A single front door, then two co-equal tracks. The front door exists because
two co-equal sidebar roots with no orientation is a known way to lose a
reader.

```
Start here                  what this is, in one screen, then routes

FOUNDATIONS   — design judgment
  Principles                synthesised from decisions.md + concept-model.md
  Layer model               primitive / component / block, the promotion rule
  Token contract            what is banned, and why
  Accessibility             the measured posture, failures included
  Decisions                 D1–D22, reversals included

SYSTEM        — the machinery
  Architecture              scaffold → build → gates → registry → consumer
  The gates                 the 12 CI steps in ci.yml order, what each protects
  ds-rules                  rules as typed records, detectors, fixtures
  The registry              what `npx shadcn add` installs, and why the
                            consumer test exists
```

**Phase 1 (the spine):** Start here, Principles, Architecture, Decisions, The
gates. Reviewable before the remaining prose is written.
**Phase 2:** Layer model, Token contract, Accessibility, ds-rules, The registry.

### Source of truth, per page

Every page renders material that already exists, with one exception recorded
below.

| Page           | Backed by                                                     |
| -------------- | ------------------------------------------------------------- |
| Start here     | new prose, no factual claims beyond derived counts            |
| Principles     | **synthesis** — see risk below                                |
| Layer model    | `concept-model.md` §1 + live layer counts                     |
| Token contract | `ds-rules/rules/*.json` + `a11y-baseline.md` contrast section |
| Accessibility  | `a11y-baseline.md` + live exclusion list + current counts     |
| Decisions      | `decisions.md` D1–D22                                         |
| Architecture   | `CLAUDE.md`, `CONTINUE.md` §3, the scripts themselves         |
| The gates      | `ci.yml`                                                      |
| ds-rules       | `packages/ds-rules/src` + emitted JSON                        |
| The registry   | `gen-registry.mts`, `consumer-test.sh`                        |

**Recorded risk — Principles is the one synthesised page.** It has no single
source document; it is drawn from the decisions log and concept model. It is
therefore the page most at risk of asserting a principle the system does not
actually hold. It gets drafted from D1–D22 and reviewed on its own, against
the decisions it claims to summarise, before it ships.

## Accessibility page: publish the numbers

**Decision taken:** the page publishes real counts, including violations and
the exclusion list, and states plainly that the 2026-08-03 measurement is
historical rather than current.

Rationale: for this reader, measured honesty about a known failure is more
credible than a clean claim, and the exclusion-list rule (it may only shrink,
never grow) only reads as rigour if the list is visible. The page must frame
the counts correctly — vendored upstream ports carry 44 of the 47 historical
violation _files_ and are excluded by directory for a recorded reason, which is a
different fact from "this system has 47 accessibility bugs".

## Out of scope

- **No Pegbo code, structure, page list, theming or framing.** The screenshots
  that prompted this were a reference for shape only; this repo's architecture
  differs and the pages describe this system.
- No toolbar axes (theme, brand, finish, direction, motion, icons).
- No Changelog page. `wave-history.md` is internal, and an unmaintained
  changelog reads worse than none.
- No per-component documentation. `apps/docs` owns that; these pages link out.
- No deployment change. Publishing is a separate, manual decision.

## Success criteria

1. Every numeric claim in the layer is derived, and `pnpm test` fails when any
   emitted fact disagrees with its source.
2. The twelve-step CI chain is unchanged in length and order.
3. `pnpm lint`, `format:check`, `typecheck`, `check:tokens`, `check:contract`,
   `test`, `build:registry`, `build` all pass from the repo root.
4. A reader can spot-check any number on any page against the repository and
   find it correct.
