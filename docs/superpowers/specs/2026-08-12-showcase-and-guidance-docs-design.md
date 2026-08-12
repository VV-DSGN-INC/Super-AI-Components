# Showcase and guidance docs

**Date:** 2026-08-12
**Status:** approved, not yet implemented
**Reference:** `ds.vyhouski.com`, the `@weeeha/ui` showcase site

The catalog is closed at 114 (plus family P's 2, counted separately) and has 639
stories, yet the project's public front door is a bare `<ul>` of links and its
only system-level prose is a single Storybook `Overview.mdx`. This spec covers
closing that gap in two phases: a showcase page, then a guidance set.

---

## 1. What we are copying, and what we are not

`ds.vyhouski.com` is two products in one repo:

1. A standalone Vite-built static site under `site/`, deployed via a
   `vercel.json` rewrite, carrying a hero, a tabbed live-demo showcase, a brand
   toggle, and a Showcase / Foundations / Tokens / Guidance / Components nav.
2. Sixteen guidance MDX pages under `src/docs/`, rendered inside Storybook,
   split Foundations / Content / Patterns, each built from live components via
   shared `<Example>` and `<DoDont>` blocks.

We copy the **idea** of both. We do not copy the **delivery**: Minimal needed a
separate static site because that repo is a library with no app in it. This repo
already runs a Next.js app that builds and serves the registry, so both phases
ship as routes inside it.

We also do not copy Minimal's section spine. Its eight tabs (Tokens, Typography,
Buttons, Inputs, Data, Feedback, Navigation, Overlays) are primitive categories.
This system's value sits above primitives, so those tabs would leave most of the
catalog homeless.

---

## 2. Architecture

Everything lands in `apps/docs`. No second site, no second deploy target, no
rewrite rules.

```
apps/docs/app/
  page.tsx                    showcase            phase 1  (replaces the bare <ul>)
  foundations/page.tsx        tokens, type, spacing, measured contrast
                                                  phase 1
  components/page.tsx         the full index      phase 1  (today's page.tsx, moved)
  components/[name]/page.tsx  unchanged
  layout.tsx                  header nav + theme toggle
                                                  phase 1
  guidance/[slug]/page.tsx    the ten pages       phase 2
```

Nothing is deleted. Today's index survives at `/components`.

**Foundations strip vs foundations page.** These are two different things and
both ship in phase 1. The *strip* is a row on the showcase page presenting the
12 `layer: "primitive"` items as tiles, the same as any other section. The
*page* at `/foundations` is the token reference: swatches, type scale, spacing,
radius, and measured contrast ratios. The strip links to the page.

### Data flow

Every count, tile, label and dependency list reads from
`apps/docs/lib/catalog.manifest.ts`. Nothing on the showcase is hand-listed, so
the page cannot drift from the catalog. Demos come from the existing
`lib/demos.generated.ts` (131 entries); no new demo components are authored for
the showcase.

**Constraint on the manifest.** Its header records that it is generator
bootstrap output that was then hand-edited, and that re-running
`scripts/gen-manifest.mts` discards those edits, including the restored
consumer-facing `description` values the tiles depend on. The `section` field
this spec adds must therefore be added **by hand, in the manifest**, and the
generator stays retired. Do not add sections to `catalog.md` and regenerate.

---

## 3. Phase 1, the showcase

### 3.1 The hero

A single assembled AI app above the fold, composed from family O blocks, which
is what those blocks exist for. Hovering a region outlines it and names the
components inside it; clicking navigates to that component's page.

This is the argument the page makes: *AI Elements gives you the conversation,
this gives you the application.* It is shown rather than asserted.

### 3.2 The section spine

Seven sections, mapped from the fifteen families:

| Section   | Families                                              | Items |
| --------- | ----------------------------------------------------- | ----: |
| Shell     | B app shell & nav, C home & launcher                  |    13 |
| Compose   | D composer & context                                  |     7 |
| Generate  | E generation & parameters, H timeline & transport     |    17 |
| Results   | F results & assets, I editor surfaces                 |    12 |
| Knowledge | J library & discovery, K documents, P records & views |    17 |
| Trust     | L onboarding, N feedback & observability              |    18 |
| Account   | M account, plan & monetization                        |     7 |
|           | **total**                                             |**91** |

That 91 equals the manifest's count of `layer: "component"` items exactly. The
other two layers therefore fall into place without special-casing:

- **12 primitives** (`layer: "primitive"`) become a foundation strip.
- **13 blocks** (`layer: "block"`) are the hero.

91 + 12 + 13 = 116 shipped rows.

### 3.3 The 114 / 116 question, resolved

`catalog.md` states that family P is counted separately from the frozen 114 by
deliberate decision, so the frozen catalog is 114 and the manifest's 116 is 114
plus family P's 2. Hero copy may quote **116 components**, and should not
describe the catalog as 116 items, which would contradict `CONTINUE.md`.

### 3.4 Scope of phase 1

Ships complete and reviewable in one pass: hero, all seven sections with live
demos, the foundations strip, the `/foundations` token reference page, the new
header nav, and the moved `/components` index. One preview URL to review.

---

## 4. Phase 2, the guidance set

This repo is not starting blank. `component-build-brief.md`, `a11y-baseline.md`,
`anti-slop.md`, `decisions.md` and the per-component prose in
`component-specs.md` already hold most of the doctrine, and the existing
per-component Storybook docs are already well written.

So phase 2 is **curation, not authoring**. But not a raw publish:
`component-build-brief.md` and `CONTINUE.md` are internal contracts addressed to
agents building the system. Publishing them unedited would leak build process
into consumer documentation.

Ten pages, deliberately fewer than Minimal's sixteen, covering only where this
system has an opinion stock shadcn does not:

**Foundations (4)**

- Colour and surfaces, including the `text-muted-foreground` on `bg-muted`
  contrast trap, with measured ratios rather than assertions
- Typography
- Layout and density
- States and motion

**Patterns (4)** — the part no general-purpose design system has

- Conversation and composer
- Generation, progress and cancellation
- Approval and autonomy (the four-verb contract already written for Approval Card)
- Artifacts and results

**Content (2)**

- Voice for AI interfaces
- Empty, loading and error states

Every page renders live registry components, so guidance cannot drift from code.

---

## 5. Gates

Three CI consequences, all deliberate.

1. **`pnpm build` page count moves.** The recorded baseline is 133 pages. Update
   it in the same commit so a later reader does not mistake it for drift.
2. **Playwright smoke needs coverage for the new routes.** It asserts an `h1`
   and zero console errors per page. The hero carries hover and click behaviour
   and is the most likely place to trip the `h1` assertion, which has already
   broken here once when Base UI set `aria-hidden` on the page shell.
3. **The showcase would otherwise be ungated.** `check:tokens` scans
   `registry/super-ai/**` only, and the axe gate runs in Storybook only. Without
   change, the most-visited page in the project would be the least-checked, and
   could ship raw palette classes or a contrast failure through all eleven CI
   steps.

**Both gates are extended:**

- `check:tokens` grows to cover `apps/docs/app/**` and `apps/docs/components/**`.
- Playwright smoke gains axe assertions on the new routes.

Per `CLAUDE.md`, the `check-tokens.mjs` change is called out in the PR body so it
can be carried to the `Minimal Design System` repo, which has no equivalent
checker.

---

## 6. Explicitly out of scope

- Any change to `registry/super-ai/**`. The showcase consumes components; it
  does not modify them.
- The `contractExempt` retrofit (25 legacy items). Unrelated, and still the
  largest outstanding work in the repo.
- Reviving family G or O5 (decision D9).
- A brand-switch toggle. That is Minimal's argument, built on its three-layer
  token inversion, which this repo does not have.
