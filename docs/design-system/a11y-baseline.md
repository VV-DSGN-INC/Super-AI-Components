# Storybook a11y baseline (2026-08-03)

Recorded while wiring `@storybook/addon-a11y` + `@storybook/addon-vitest` into
`apps/storybook` as a CI gate (component-pipeline plan, "Storybook a11y and
interaction testing"). This is the audit result that decided what the gate
enforces today and what it excludes.

## How it was produced

`@storybook/addon-a11y` defaults `parameters.a11y.test` to `"todo"`. In that
mode, axe still runs and results still show in the Storybook UI panel, but
violations are only ever recorded as a warning — `getMode()` in the addon's
`preview.mjs` returns `"failed"` (the branch that calls
`expect(result).toHaveNoViolations()` and actually throws) only when
`test === "error"`. With the default left in place, the addon-vitest
integration mounted every story and reported pass/fail on interactions, but
**asserted nothing about accessibility at all** — a story with an unlabeled,
un-clickable `<button/>` injected into it passed the suite outright.

That was caught by deliberately breaking a passing story
(`ResetAffordance.stories.tsx`, an unlabeled `<button/>` via a decorator) and
observing that `pnpm test:stories` still exited 0. Fixing it took two changes,
not one:

- `apps/storybook/.storybook/preview.tsx`: `parameters: { a11y: { test:
  "error" } }`.
- `apps/storybook/.storybook/vitest.setup.ts`: the manual
  `setProjectAnnotations([preview])` never included addon-a11y's own preview
  module, so its `afterEach` hook (the thing that actually runs axe and
  throws) was never part of the composed project annotations. Fixed by
  running Storybook's own migration for this exact gap:
  `pnpm exec storybook automigrate addon-a11y-addon-test --yes --skip-doctor
  --config-dir .storybook --skip-install`, which added
  `import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview"` and
  included it in `setProjectAnnotations([...])`.

With both fixes in place, the same deliberately-broken story failed with the
axe rule named in the output, confirming the gate actually asserts. Reverting
the break and re-running against the full (un-excluded) 119-story suite gave
the real baseline below.

Command: `cd apps/storybook && pnpm test:stories` (i.e. `vitest run
--project storybook`, with the addon-vitest browser project pointed at
`.storybook/main.ts` via `configDir`).

## Result: 47 of 119 stories have real, pre-existing a11y violations

This was not new breakage — these violations existed before this task; they
were simply never asserted. Violations by axe rule (a file can trip more than
one):

| Rule | Count |
| --- | --- |
| color-contrast | 35 |
| button-name | 20 |
| label | 18 |
| nested-interactive | 7 |
| scrollable-region-focusable | 4 |
| aria-required-children | 4 |
| aria-toggle-field-name | 4 |
| aria-hidden-focus | 4 |
| select-name | 3 |
| aria-allowed-attr | 3 |
| aria-valid-attr-value | 1 |

Plus 3 stories that fail to *mount* at all under a real browser (not a11y
findings — component/story runtime crashes):

- `stories/ai-elements/Context.stories.tsx` — `Cannot read properties of
  undefined (reading 'reasoningTokens')`; the story's mock `usage` prop is
  shaped flat, the component reads `usage.outputTokenDetails.reasoningTokens`.
- `stories/ui/DropdownMenu.stories.tsx` — Base UI: `MenuGroupContext is
  missing`.
- `stories/ui/MessageScroller.stories.tsx` — `useMessageScroller must be used
  within a MessageScroller`.

## Where the violations live

**`stories/ui/**` (shadcn) and `stories/ai-elements/**` (AI Elements ports)**
— the large majority of both the mount crashes and the a11y violations.
These are vendored upstream components this repo displays but does not
author or publish. Fixing their axe violations means diverging from
upstream, which is a separate decision nobody has made.

**`stories/super-ai/**`** — this repo's own components, the registry's own
output. Almost entirely clean: 3 of the 14 shipped (pre-this-wave) components
have real violations, all `color-contrast`:

- `CostChip` — 2 color-contrast violations.
- `EntityRow` — 4 color-contrast violations.
- `PreviewTile` — 2 color-contrast violations.

These three are already flagged `contractExempt: true` in
`apps/docs/lib/catalog.manifest.ts` (they're 3 of the 14 shipped components
the wave's spec explicitly excludes from retrofit). This is the same
exemption expressed in a second place, not a new one.

**`stories/marketing/**`** — no violations found; fully enforced.

## What the gate enforces today

- **Blocking:** `stories/super-ai/**` and `stories/marketing/**`, minus the 3
  named-by-file exemptions above. Every story here — including every new
  super-ai component the pipeline ships from here on — must pass its a11y
  check and mount/interaction test to merge.
- **Excluded, by directory:** `stories/ui/**` and `stories/ai-elements/**` in
  full, as vendored upstream.
- **Excluded, by name:** the 3 mount-crash stories, and `CostChip`,
  `EntityRow`, `PreviewTile` for their pre-existing `color-contrast`
  violations.

Net effect: every new component — the pilot components later in this plan,
and everything shipped after them — must pass a11y to merge. That's the
contract this task exists to establish, and as of this baseline it actually
holds for the tier that matters (this repo's own registry output).

The exclusion list may only shrink, never grow. Adding a file to it to
silence a new failure defeats the point of the gate.
