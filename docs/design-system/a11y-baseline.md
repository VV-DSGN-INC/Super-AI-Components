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
4. **This round** (component-pipeline, `GenerationPanel`/`GenerationQueue`/
   `GenerationWizard`/`ModelPicker`/`TtsComposer` batch) — per the task brief
   that opened this round, this pairing has now failed the browser gate in
   five separate rounds counting this one; the three before this file's (1)–(3)
   aren't all narrated here in prose (this document only names the ones fixed
   or confirmed at the time), so treat the count as coming from the task
   brief, not from arithmetic on this list. Two distinct failures landed, in
   four files:
   - `GenerationPanel.stories.tsx`'s `Presets`/`Settings`/`Cost And Generate`
     stories: the same shape as (2) above, one level removed. The story
     assembles `PRESETS` — three `PreviewTile`s (`contractExempt`, `bg-muted`
     frame) with placeholder label text set to `text-muted-foreground` — and
     passes it into `GenerationPanel` as the `presets` slot. `GenerationPanel`
     never touches that content; the fix is in the story's own composed
     children, same call-site-override principle as (2), just one composition
     layer further from the component whose default styling created the risk.
     `apps/docs/components/demos/generation-panel-demo.tsx` had the
     byte-for-byte same composed markup (it's the same demo content, not
     gated by `test:stories`, but a real bug on the live docs page) and got
     the identical fix.
   - `ModelPicker.stories.tsx`'s `Expanded Cards` story: `EntityRow`
     (`contractExempt`) again, the exact mechanism (3) already confirmed —
     `selected` sets `bg-accent` on the row but its internal description span
     keeps `text-muted-foreground`. Unlike (2)'s `CostChip`, `EntityRow`
     doesn't forward `className` to that inner span, so a plain
     `className="text-foreground"` override at the call site can't reach it.
     Fixed with an arbitrary-variant call-site override instead —
     `model-picker.tsx`'s `ENTITY_ROW_SELECTED_DESCRIPTION_FIX =
     "data-[state=on]:[&_[data-slot=entity-row-description]]:text-accent-foreground"`
     — retinting only that descendant, and only while the row itself carries
     `EntityRow`'s own `data-state="on"`, so an unselected row's muted
     description is untouched. Applied at both `ModelPicker` call sites that
     set `selected` (`expanded-cards` and `node-inline`); only
     `expanded-cards` renders inline without an interaction, so it's the only
     one axe reached, but both would have broken identically once opened.
   - A second, distinct pairing surfaced in the same round — see
     "The destructive-tint pairing" below.

   Running the new static rule (see "The static gate" below) against the
   whole registry also caught four **real, pre-existing** same-string
   instances that the browser gate happened not to be failing on yet — the
   exact four the previous round's audit (below) flagged as latent and
   deliberately left untouched. Since the static rule is meant to be a
   mechanical floor, not just a check against today's browser-measured
   pass/fail, all four were fixed rather than exempted:
   - `kbd.tsx` — `<kbd>`'s own `bg-muted text-muted-foreground` → `bg-muted
     text-foreground`.
   - `sidebar-nav.tsx` — the `sidebar-nav-count` badge's `bg-muted
     text-muted-foreground tabular-nums` → `bg-muted text-foreground
     tabular-nums`.
   - `gen-settings-bar.tsx` — the toolbar's `bg-muted/50 text-muted-foreground`
     → `bg-muted/50 text-foreground` (this also retires the `~4.54:1`,
     0.04-margin fragility the previous audit called out — `text-foreground`
     clears contrast regardless of what opacity-blended color sits behind it).
   - `recommendation-card.tsx` — the `aria-hidden` step-number span's
     `bg-muted text-muted-foreground` → `bg-muted text-foreground` (the
     previous audit's point stands: `aria-hidden` hides it from axe, not from
     the sighted user reading the digit).

   `cost-chip.tsx` and `entity-row.tsx` themselves still carry this pairing
   and are still deliberately unfixed — same `contractExempt`, out-of-scope
   status as (3), now additionally excluded by name from the static rule
   (see below) so the new gate doesn't force that separate decision.

### The destructive-tint pairing: `text-destructive` on `bg-destructive/10`

A second, distinct contrast failure landed in the same round, in
`GenerationQueue.stories.tsx`'s `Failed` story and
`TtsComposer.stories.tsx`'s `Per Segment Regenerate` story — both from
`components/ui/badge.tsx`'s own `variant="destructive"` style
(`bg-destructive/10 text-destructive`), measured by axe at **4.0:1**
(foreground `#e7000b`, background `#fde6e7`, 12px normal weight) against the
4.5:1 minimum.

This is not the muted-on-muted pairing above — `--destructive` is a
saturated red, not the same lightness family as `--muted`/`--accent`/
`--secondary` — but it's the same *shape* of bug: a vendored, non-`super-ai`
primitive's default styling only clears contrast in isolation, and this
token set has no `--destructive-foreground` variable defined at all (checked
`apps/docs/app/globals.css` — only `--destructive` exists, light and dark), so
`text-destructive-foreground` isn't an available semantic token here.

`promo-card.tsx` had already hit and fixed the identical failure for its
`quota-warning` flavour's CTA button (`Button`'s own `variant="destructive"`
stacked on that flavour's own `bg-destructive/10` card tint, measured at
`~3.4:1` — worse, because the tints compound): going solid, `bg-destructive
text-background`, which is white in light mode and near-black in dark mode
(i.e. it always inverts against the saturated destructive fill) and clears
4.5:1 in both themes. `text-background` isn't a token invented for this fix —
`--background` is the same root token every card and page already renders
against.

`generation-queue.tsx` and `tts-composer.tsx` both render `Badge
variant="destructive"` directly from their own component bodies (not from a
story's composed content), so the fix landed in the component, at the call
site of `Badge` — `components/ui/badge.tsx` itself, a vendored shadcn
primitive outside `stories/super-ai/**`, was left untouched, matching the
`cost-chip`/`entity-row` precedent of not editing exempt/vendored primitives
directly:

```tsx
<Badge variant="destructive" className="bg-destructive text-background">
  {STATE_TEXT.failed}
</Badge>
```

Contrast math: for two fully opaque colors, contrast ratio is symmetric in
which one is foreground vs. background — swapping `text-destructive` (fg) /
`bg-destructive/10`-over-white (bg, effectively `~#fde6e7`) for
`bg-destructive` (bg) / `text-background` (fg, pure white) changes the
*pairing* from a translucent tint blended toward white to the same
fully-saturated destructive red against pure white either way — which is why
it clears the identical `~4.77:1` regardless of which role each token plays,
comfortably over 4.5:1 and, unlike `bg-muted/50`, not dependent on whatever
ancestor background the translucent tint would otherwise blend toward.

### Audit: latent instances found elsewhere in the registry — now fixed

The previous round's audit (grepping `apps/docs/registry/super-ai/*.tsx` for
`text-muted-foreground` co-located with `bg-muted`/`bg-accent`/
`bg-secondary`) found four files carrying the identical class combination as
the failing ones, not yet failing the browser gate, and left them
deliberately untouched as a "retrofit task's target list." This round's new
static rule (below) forced the decision: all four are fixed now, listed under
item 4 above (`kbd.tsx`, `sidebar-nav.tsx`, `gen-settings-bar.tsx`,
`recommendation-card.tsx`).

Still correctly **not** flagged, same reasoning as before (confirmed again
this round, now also verified against the static rule specifically):
`filter-bar.tsx` and `modality-rail.tsx`'s overflow-trigger button pair
`text-muted-foreground` with `bg-accent` only on `:hover`, and the hover state
swaps the text color to `text-accent-foreground` in the same rule — never a
static muted-on-muted moment, and never a bare (unprefixed) background class
either. `promo-card.tsx`'s `text-muted-foreground` icon class isn't paired
with a muted/accent/secondary background at all (its tinted background is a
sibling element's class, not the icon's own).

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

**Separately: don't pair `text-destructive` with a translucent
`bg-destructive/NN` tint on the same element** — measures under 4.5:1 (4.0:1
alone, worse once tints compound, e.g. `promo-card`'s `~3.4:1`). Go solid
instead: `bg-destructive text-background`.

### The static gate

Five rounds of a documentation-only rule clearly wasn't preventing
recurrence — every fix above landed only after a browser already caught it in
CI. `apps/docs/scripts/check-tokens.mjs` (the existing static token-contract
gate, previously just raw-hex/`oklch()`/palette-class checks) now also flags
a bare (unprefixed by a variant like `hover:`/`dark:`) `text-muted-foreground`
appearing in the *same quoted class-list string* as a bare `bg-muted`,
`bg-accent`, or `bg-secondary` (opacity variants like `bg-muted/50`
included) — catching the single-element shape of this failure statically,
before anyone runs a browser.

**Tuned twice**, both documented in the script itself:

1. **Exempts `cost-chip.tsx`, `entity-row.tsx`, `preview-tile.tsx` by name** —
   the same three files the browser gate already exempts (see "What the gate
   enforces today" above). Without this, the new rule would fail
   `pnpm check:tokens` on decisions this task didn't make and isn't in a
   position to remake.
2. **Ignores variant-prefixed backgrounds** (`hover:bg-accent`,
   `dark:bg-muted`, etc.) — `filter-bar.tsx` and `modality-rail.tsx` both put
   bare `text-muted-foreground` and `hover:bg-accent` in one string, but the
   same hover rule also swaps the text to `hover:text-accent-foreground`, so
   the muted text and the muted background never render at the same time.
   Without this, the rule would have flagged two shipped, genuinely-fine
   files on day one — confirmed by running it before this tuning was added.

**Proven both directions.** A throwaway file
(`registry/super-ai/__contrast-proof-tmp.tsx`) with
`className="bg-muted text-muted-foreground"` made `pnpm check:tokens` fail
with `text-muted-foreground paired with bg-muted in one class list`, pointing
at the exact line; deleting it brought the registry back to `58 file(s)
clean.` Both runs are in this task's report.

**Known limitation, stated in the script's own comment so it doesn't get
lost:** this rule cannot catch, and does not attempt to catch, the
*cross-component* case — muted text inside a child whose ancestor (a
different element, or an entirely different component, e.g. `EntityRow`'s
selected row vs. its own description span) sets the muted background. Every
instance of this pairing that has actually shipped broken, across all five
rounds, was exactly that shape, not the single-string shape this rule can
see. **The browser a11y gate (`pnpm test:stories`) remains the real
backstop** — this rule only removes the easiest, single-element way to
reintroduce the failure, the way (1) `workspace-switcher.tsx` and the four
files fixed in item 4 above were all shaped.

## Excluded: Base UI's own focus-guard spans (`aria-hidden-focus`)

`Feedback`'s `Rating` story (and every future story that opens a Base UI
popup, menu, dialog, or tooltip in its default state) tripped
`aria-hidden-focus`:

```
Expected the HTML found at $('span[data-base-ui-focus-guard=""][aria-hidden="true"]:nth-child(2)')
to have no violations: "ARIA hidden element must not be focusable or contain
focusable elements (aria-hidden-focus)"
```

**What the element is.** `@base-ui/react`'s internal `FocusGuard` component
(`utils/FocusGuard.js`, used by every vendored `ui/popover.tsx`,
`ui/dropdown-menu.tsx`, `ui/dialog.tsx`, `ui/tooltip.tsx`, etc. that sit on
Base UI's popup layer) renders a visually-hidden `<span>` at each end of the
popup content to trap focus for screen-reader users tabbing past it. Reading
the component source confirms it unconditionally sets `tabIndex: 0` and
`data-base-ui-focus-guard=""`, and sets `aria-hidden="true"` on every browser
except when VoiceOver-on-Safari detection assigns it `role="button"`
instead. That `aria-hidden="true"` + `tabindex="0"` combination is exactly
what axe's `aria-hidden-focus` rule exists to catch — the element is
intentionally focusable-but-hidden by design, not a markup bug in this repo.
This looks like a genuine axe/Base UI friction point (axe can't tell a
deliberate ARIA-hidden focus-trap apart from an accidental one), but no
upstream issue was filed as part of this fix — this section only records
what was observed in the installed version (`@base-ui/react@1.5.0`).

**The exclusion.** `apps/storybook/.storybook/preview.tsx` sets:

```ts
a11y: { test: "error", context: { exclude: ["[data-base-ui-focus-guard]"] } }
```

`context.exclude` is axe-core's own context option, not an addon invention —
confirmed by reading `@storybook/addon-a11y`'s `dist/preview.mjs`: the
addon concatenates `parameters.a11y.context.exclude` onto its own default
excludes (`.sb-wrapper`, `#storybook-docs`, `#storybook-highlights-root`) and
passes the resulting `context` object straight to `axe.run(context,
options)`. It removes only elements matching
`[data-base-ui-focus-guard]` — an attribute Base UI stamps on nothing else —
from the entire axe scan, for every story, set once. `options.rules` (the
per-rule config axe-core exposes) only supports `{ enabled: boolean }` in the
installed `axe-core@4.12.1` — there is no per-rule selector/exclude option in
that shape, which is why the exclusion is applied via `context` instead.

**Still fires on real violations.** Verified by temporarily wrapping a
`<button>` in a plain `aria-hidden="true"` `<div>` (no
`data-base-ui-focus-guard`) inside `DisclaimerNote.stories.tsx`'s
`UnderComposer` story: `pnpm test:stories` failed with the same
`aria-hidden-focus` rule, on `div[aria-hidden="true"]`, distinct from the
excluded selector. Reverting the wrapper brought the suite back to 45 files /
100 tests passing. The rule is not disabled — only Base UI's own guard
elements are exempted.

**This exclusion must not be widened.** The selector is
`[data-base-ui-focus-guard]` and nothing broader — not `[aria-hidden]`, not a
class name, not the whole popup layer. Any future `aria-hidden-focus` failure
that doesn't carry this exact attribute is a real violation and must be
fixed, not added to this exclude list.
