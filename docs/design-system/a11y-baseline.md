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

## Recurring failure: `text-muted-foreground` on `bg-muted`/`bg-accent`/`bg-secondary`

Two more blocking failures landed after the baseline above, both in
`stories/super-ai/**` (component-pipeline wave, B/C family). One was this same
recurring contrast pairing; the other was unrelated — recorded here for
accuracy, since it's tempting to lump "two failing files" into one cause when
they aren't.

- `HeroOmnibox` (`Idle`/`Focused`/`Generating`) — `color-contrast`, this
  pairing. `CostChip`, embedded in the omnibox toolbar via
  `apps/docs/registry/super-ai/cost-chip.tsx`, sets `bg-muted
  text-muted-foreground` at `text-xs` on `<span data-slot="cost-chip">`. Axe
  measured **4.34:1** (foreground `#737373`, background `#f5f5f5`, 12px
  normal weight) against a **4.5:1** requirement.
- `ModalityRail` (`Active`/`Overflow`/`With Badge`/`Bottom Pinned`) —
  `aria-allowed-attr`, unrelated to contrast. `components/ui/toggle-group.tsx`
  never forwards its `orientation` prop to the underlying Base UI
  `ToggleGroupPrimitive`, which independently renders `role="group"` with an
  `aria-orientation` attribute computed from its own (always-default
  `"horizontal"`) orientation. Per the ARIA attribute-allowance table (and
  axe's `aria-allowed-attr` rule), plain `role="group"` does not support
  `aria-orientation` at all — the attribute name itself is invalid on that
  role, independent of its value. Fixed by explicitly suppressing the
  attribute at the three `<ToggleGroup>` call sites in `modality-rail.tsx`
  (`aria-orientation={undefined}`, which wins the rightmost-prop-merge Base UI
  uses); the shared `ui/toggle-group.tsx` wrapper was left untouched to keep
  the fix scoped to the two components in question.

### The contrast pairing, measured

`--muted`, `--accent`, and `--secondary` are the same `oklch(0.97 0 0)` value
in this token set (light mode) — so "muted-on-muted" and "muted-on-accent"
and "muted-on-secondary" are the identical failure, not three different ones:

| Foreground | Background | Ratio | Passes 4.5:1? |
| --- | --- | --- | --- |
| `text-muted-foreground` (`#737373`) | `bg-muted` / `bg-accent` / `bg-secondary` (`#f5f5f5`) | 4.34–4.35:1 | No |
| `text-muted-foreground` (`#737373`) | `bg-muted/50` over `bg-background` (`~#fafafa`) | ~4.54:1 | Barely — 0.04 of margin |
| `text-foreground` (`#0a0a0a`) | `bg-muted` (`#f5f5f5`) | ~18:1 | Yes, wide margin |
| `text-accent-foreground` / `text-secondary-foreground` (`#171717`) | `bg-accent` / `bg-secondary` (`#f5f5f5`) | ~16.4:1 | Yes, wide margin |

Verified with the actual light-mode token values in `apps/docs/app/globals.css`
(`--muted-foreground: oklch(0.556 0 0)`, `--muted: oklch(0.97 0 0)`, etc.),
converted oklch → sRGB and run through the WCAG contrast formula — the
`#737373`/`#f5f5f5`/4.34 result matches what axe itself reported. Regardless
of which same-lightness surface token is used, `text-muted-foreground` alone
never reaches 4.5:1 as *foreground* text on it. `bg-muted/50` only clears the
bar by blending toward a lighter ancestor background (`bg-background`) —
fragile, and the exact number moves with whatever sits behind it.

### Where this has already bitten

1. `workspace-switcher.tsx` (`WorkspaceSwitcherAvatar`, pre-existing) — fixed
   by moving the avatar-initials span from `text-muted-foreground` to
   `text-foreground`, keeping `bg-muted` unchanged.
2. `hero-omnibox.tsx` (this task) — `CostChip` itself is one of the three
   `contractExempt` legacy files above and was deliberately **not** touched
   (fixing it is out of scope and would be a separate, wider decision — its
   own story stays exempt). Instead, the call site overrides just this
   embedding: `<CostChip amount={cost} className="text-foreground" />`,
   the same token substitution as (1), leaving `CostChip`'s own default
   styling and its `contractExempt` story untouched.
3. `cost-chip.tsx`, `entity-row.tsx` (already `contractExempt`, see above) —
   confirmed by inspection to be this exact pairing, not a different
   contrast bug: `EntityRow`'s `selected` state sets `bg-accent
   text-accent-foreground` on the row, but the icon and description spans
   keep `text-muted-foreground` instead of switching to
   `text-accent-foreground`, landing back on the same 4.34:1 failure against
   `bg-accent` (which shares `bg-muted`'s lightness). `PreviewTile`, the
   third `contractExempt` file, is **not** this pattern — its two violations
   are `text-destructive` on the default surface and label text in a
   translucent overlay above unpredictable image content; unrelated defects
   that happen to share the same exemption flag.

### Audit: latent instances found elsewhere in the registry (not fixed — out of scope)

Grepped `apps/docs/registry/super-ai/*.tsx` for `text-muted-foreground`
co-located with `bg-muted`/`bg-accent`/`bg-secondary` on the same element or
visual state. Two are already covered above (`cost-chip.tsx`,
`entity-row.tsx`, both pre-existing `contractExempt`). Four more carry the
identical class combination but are **not currently failing** the gate —
listed here as the retrofit task's target list, not touched per this task's
scope:

| File | Element | Classes | Why it isn't failing today |
| --- | --- | --- | --- |
| `recommendation-card.tsx` | step-number badge (`recommendation-card-steps` `<li>`) | `bg-muted text-muted-foreground` `text-xs font-medium` | `aria-hidden="true"` on the span removes it from axe's scan entirely — but the step number is still real, sighted-user-visible text. Same failure mode as (1) above before it was fixed: aria-hidden hides it from the gate, not from users. |
| `kbd.tsx` | `<kbd>` element itself | `bg-muted text-muted-foreground` `text-xs font-medium` | Passes today (verified: `Kbd.stories.tsx` is green), but it is the byte-for-byte same class combination as `cost-chip.tsx`'s failing span. Sitting at the exact 4.34:1 boundary — a one-line change elsewhere (font stack, weight) could tip it over without this file changing at all. |
| `sidebar-nav.tsx` | unread-count `Badge` (`sidebar-nav-count`) | `Badge variant="secondary"` overridden with `bg-muted text-muted-foreground tabular-nums` | Passes today (verified), same combination as the two above. |
| `gen-settings-bar.tsx` | toolbar container | `bg-muted/50 text-muted-foreground` `text-xs` | Passes today (verified) — the `/50` opacity lightens the effective background toward `bg-background` to `~#fafafa`, measuring `~4.54:1`. Passes by a 0.04 margin; fails again against any darker ancestor background or if the opacity value changes. |

Not flagged (same grep hit, different mechanism, ruled out by inspection):
`filter-bar.tsx` and `modality-rail.tsx`'s overflow-trigger button pair
`text-muted-foreground` with `bg-accent` only on `:hover`, and the hover state
swaps the text color to `text-accent-foreground` in the same rule — never a
static muted-on-muted moment. `promo-card.tsx`'s `text-muted-foreground` icon
class isn't paired with a muted/accent/secondary background at all.

One more instance worth naming even though it isn't a static pairing: several
menu/list rows (e.g. `workspace-switcher.tsx`'s trailing "plan" text,
rendered inside a highlightable `DropdownMenuRadioItem`) carry
`text-muted-foreground` trailing text that doesn't repaint when the row's
*hover/highlighted* background becomes `bg-accent`. Axe only evaluates the
DOM at rest, so hover-only instances of this exact failure are structurally
invisible to a static story scan — a gap in what this gate can catch, not
evidence the pairing is safe there.

### The rule

**Don't pair `text-muted-foreground` with `bg-muted`, `bg-accent`, or
`bg-secondary`, at any text size, on the same element or the same visual
state — they're the same lightness value in this token set and the pairing
measures 4.34:1, under the 4.5:1 normal-text minimum.** Keep the muted
*background* for hierarchy if that's the intent; pair it with
`text-foreground` (matches the surface's own background, ~18:1) or with that
surface's own foreground token (`text-accent-foreground` on `bg-accent`,
`text-secondary-foreground` on `bg-secondary`, ~16:1) instead. `bg-muted/50`
is not a safe workaround — it only passes by blending toward whatever's
behind it, and moves with that background.
