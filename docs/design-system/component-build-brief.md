# Component build brief

Every component in this registry is built to the same contract. This file is the
brief handed to whoever builds one — read it once, then read your component's
own entry in [`component-specs.md`](component-specs.md).

It exists because the same instructions were being re-pasted into every build
task, which is how instructions drift.

## Your scope

You fill five already-scaffolded files. The scaffold (`pnpm new:component
<name>`) has already created them, with **deliberately failing tests**:

| File | What it is |
| --- | --- |
| `apps/docs/registry/super-ai/<name>.tsx` | the component |
| `apps/docs/registry/super-ai/<name>.test.tsx` | co-located vitest suite, starts red |
| `apps/docs/components/demos/<name>-demo.tsx` | the docs-site demo |
| `apps/docs/content/components/<name>.docs.tsx` | the guidance module |
| `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx` | one story per declared state |

You may also create `apps/docs/content/components/<name>.examples.tsx` — see
§Guidance below.

**Write nothing else.** Other components are built concurrently. In particular
never touch `lib/catalog.manifest.ts` — the integrator owns it, and reconciles
your declared dependencies against your real imports afterwards.

**Never run** `pnpm build`, the full `pnpm test`, anything in `apps/storybook`,
or any `git` write command (`commit`, `add`, `checkout`, `stash`). `refs/stash`
is shared across worktrees and an agent has already lost work that way. The
integrator runs the full gates and commits centrally.

**Do run**, from `apps/docs`: `pnpm vitest run registry/super-ai/<name>.test.tsx`,
`pnpm typecheck`, `pnpm check:tokens`.

## Compose before you build

Read the registry before writing anything. A component that reimplements a
shipped primitive is a defect, not a shortcut — this system exists to stop that.

- `apps/docs/registry/super-ai/` — 30+ shipped components. `entity-row` is the
  icon/title/description/trailing row; `preview-tile` is "the atom of every
  picker and grid"; `section-header`, `kbd`, `cost-chip`, `choice-chips`,
  `field-row`, `stat-readout`, `reset-affordance` are all primitives you should
  reach for rather than restyle.
- `apps/docs/components/ui/` — 34 vendored shadcn primitives, all **Base UI**
  (`@base-ui/react`), not Radix. Read the actual file before assuming an API.

If your spec names a composition (D13 corrected several of these), honour it. If
after reading both files you believe it genuinely doesn't fit, say so in your
report with the reason — do not silently reimplement.

## Tokens

**Semantic shadcn CSS variables only.** No Tailwind palette classes
(`bg-blue-500`), no raw hex, no `oklch()`. `pnpm check:tokens` fails the build.

**Never pair `text-muted-foreground` with `bg-muted`, `bg-accent` or
`bg-secondary`.** Those three tokens resolve to the same value, and the pairing
measures **4.34:1** against a 4.5 minimum. It has failed the gate five separate
rounds running. Use `text-foreground` (~18:1) or that surface's own foreground
token. This includes muted text layered *inside* another component whose frame
is `bg-muted` — `preview-tile`'s frame is, for example — and muted text in a
component you compose that doesn't forward `className` down to the specific
span you need (see `model-picker.tsx`'s `ENTITY_ROW_SELECTED_DESCRIPTION_FIX`
for the arbitrary-variant call-site override this takes when a plain
`className` override can't reach the element). See
[`a11y-baseline.md`](a11y-baseline.md).

**Separately, don't pair `text-destructive` with a translucent
`bg-destructive/NN` tint on the same element** — also under 4.5:1 (4.0:1
alone; worse once tints compound). Go solid instead: `bg-destructive
text-background`. See `promo-card.tsx`'s `quota-warning` CTA and
`generation-queue.tsx`'s failed-state badge.

**`pnpm check:tokens` now catches the single-element shape of the
`text-muted-foreground`/`bg-muted` family failure mechanically, not just by
you remembering this section.** It flags a bare `text-muted-foreground` and a
bare `bg-muted`/`bg-accent`/`bg-secondary` (opacity variants included)
appearing in the same class-list string — your build fails at `check:tokens`,
before anyone opens a browser, if you write that. It does **not** catch the
*cross-component* shape — muted text in a child whose ancestor (a different
element, or a component you're composing) sets the muted background — which
is how most real instances of this bug have actually shipped. That shape only
shows up once you run `pnpm test:stories` and axe measures the real computed
colors, so run it, don't assume `check:tokens` passing means you're clear.

## Accessibility is a blocking gate

`pnpm test:stories` runs axe over every `super-ai` story and **fails CI**. The
traps that have actually bitten this system:

- **Nothing may be conveyed by colour alone.** A selected, unresolved, running
  or warning state needs text, an icon shape, or a programmatic state as well.
- **A tooltip must never be the only source of an accessible name.** Give
  icon-only controls a visible label or an sr-only one; see `modality-rail`.
- **No nested interactives.** A removable chip is a `span` with a sibling
  `button`, never a button inside a button; see `filter-bar`, and `skill-menu`
  for the same fix inside a `CommandItem`.
- **Hover-revealed affordances must be keyboard reachable** — `opacity-0` plus
  `group-focus-within`, never `display:none`; see `recent-grid`, `thread-list`.
- **A scrollable region must be focusable** (axe `scrollable-region-focusable`),
  or use a carousel whose transform-scrolling sidesteps it; see
  `feature-card-row`.
- **State changes should be announced** — `role="status"`/`aria-live` for
  submitted/generating transitions; see `feedback`.
- **An `sr-only` suffix fuses with the visible text in the accessible name.**
  `<span>In</span><span class="sr-only"> point at 3s</span>` computes as
  **"Inpoint at 3s"** — accname concatenates name-from-content chunks with
  whitespace trimmed and no separator. Two components shipped this on the same
  afternoon. Either set an outright `aria-label`, or mark the visual half
  `aria-hidden` and put the *complete* phrase in the sr-only span. Assert it
  with `expectAccessibleName` from `@/lib/test-utils`, not with
  `toHaveTextContent` — text content will not show you the bug.

## Tests

Replace every scaffolded `expect.fail` stub with a real assertion: one test per
declared state, plus a `className` passthrough test. Then pin whatever the spec
calls load-bearing — the sentences that read like decisions rather than
descriptions. Those are the ones a future refactor will quietly break.

Test behaviour, not implementation. Assert roles, accessible names and
`data-slot` structure rather than class strings.

## Guidance — the part that makes this a design system

`<name>.docs.tsx` is consumed by a **Server Component**, which reads
`docs.whatItIs`, `docs.evidence` and so on directly.

- **No `"use client"` in the docs module.** Marking it client turns its exports
  into opaque client references and the server read breaks.
- **No JSX carrying event handlers in the docs module.** Those cannot serialise
  across the boundary and break the static export.
- Interactive examples go in `<name>.examples.tsx`, marked `"use client"`,
  exporting **zero-prop** named components, referenced as `example: <GoodThing />`.

Both halves of that have broken the build before. The reference pattern is
`workspace-switcher.docs.tsx` + `workspace-switcher.examples.tsx`.

Fill every field: `whatItIs`, `whyItMatters` (cite the spec's Evidence
products — never invent them), `evidence`, `anatomy` (your real `data-slot`
names), `usage`, at least two `dos` and two `donts` each with a live example,
and at least two `pitfalls`. Translate the spec's internal voice into
consumer-facing prose; do not paste it verbatim.

### Escape quotes and apostrophes in JSX text

`react/no-unescaped-entities` is an **error** in this repo, not a warning, and
it has broken the lint gate in consecutive batches. Any literal `'` or `"` in a
JSX text node must be written as `&apos;` / `&quot;` (or the curly forms). This
bites hardest in `.examples.tsx` and demo files, where guidance prose quotes
things — `"Recommended for you"`, `don't`, `you're`. Prose inside a *string
prop* or in the `.docs.tsx` data module is fine; only JSX text nodes are
affected.

## Story

Keep the scaffolded shape: `componentDocsPage(<Pascal>Docs)` as
`parameters.docs.page`, one export per declared state with real `args`, and
**no bare `Default` export** — the contract gate rejects it.

Then add the **case stories**: the situations the component meets in a
product, as opposed to the prop combinations above. Read
[`story-conventions.md`](story-conventions.md) before writing them — it
carries the seven names, the rule for deciding which are true for your
component, and three mechanical facts about this repo's Storybook that are
expensive to rediscover.

The short version: your declared-state stories restate what the types and the
manifest already say. The case stories are the only place facts like "this
row scrolls with a hidden scrollbar at 375px" or "this spinner ignores
`prefers-reduced-motion`" exist anywhere in the repo. Write only the ones
that are true, record the ones you skipped and why, and put the judgment in
each story's description — a story with no description is a screenshot.

If a case story surfaces a defect, **say so in your report**. Do not delete
the story to get green, and do not pin the bug with an assertion that
expects the wrong behaviour.

## Report

Terse. Status; props signature; test counts (fail → pass); typecheck and
check:tokens results; what you composed; and anything in the spec you could not
honour, with the reason. Flag judgment calls rather than burying them — several
of this system's best decisions came from a builder saying "the spec is
ambiguous here and I chose X".
