# The L2 promotion pass

**Date:** 2026-08-05
**Status:** approved, not yet implemented
**Closes:** `docs/CONTINUE.md` §5.11 (three shared pieces want promoting), and part of §5.12

---

## 1. Why this exists

Three times now, two builders working blind reached for the same piece. D3 says
what to do about that — _"promote shared pieces to L2 rather than importing
sideways"_ — and each time the piece was left duplicated rather than promoted,
because stalling the build queue was judged worse than carrying the debt.

The debt is now due. Family J is next in the wave order, and **J7 `track-list`
renders an inline waveform** — a fourth surface that needs the timeline
coordinate model. Promoting after J lands means promoting under four consumers
instead of two.

There is also a structural reason this recurred: **nothing enforces D3.**
`check:contract` verifies that a `consumes` entry _resolves_, never that it
points _downward_. D3 is a documented norm with no mechanical backing, which is
exactly the asymmetry that let three violations ship green.

## 2. What the survey actually found

The §5.11 table was written from builder reports. Reading the code changes two
of its three rows.

### 2.1 Timeline coordinates — real duplication, narrower than described

H2 [`time-ruler.tsx:68`](../../../apps/docs/registry/super-ai/time-ruler.tsx)
defines `timeToPixels(time, zoom) => time * zoom`, so its `zoom` **is
pixels-per-second**. H3 `track-lane.tsx` takes a `pixelsPerSecond` prop and
computes `clip.start * pixelsPerSecond` inline. The same scalar under two names,
and H2 already exports the functions H3 reimplements.

H3 additionally has no snapping — it carries a separate `trimStep` and rounds
nothing, so trims accumulate float drift that the ruler's `roundTime` would
have absorbed.

### 2.2 H6 is not a third implementation

`waveform-editor.tsx` is **percentage-based inside its own container**, with a
zoom control that walks a _samples-per-column exponent_ ladder. It never
converts seconds to pixels, because it is a self-contained editor rather than a
lane on a shared axis.

**H6 is out of scope, deliberately.** Forcing it onto a pixels-per-second model
would be a regression. This paragraph exists so the next reader does not "finish
the job".

### 2.3 `ParameterSlider` has one sideways consumer, not several

Only `drawing-tools.tsx:8` imports it from E3. `tts-composer` names the technique
in a comment and builds its own; that is prose, not a dependency.

### 2.4 The action row is already factored — one level below where I4 looked

F4 `action-stack.tsx:82` has a private `ActionRow`: `EntityRow` + a trailing
`cost-chip` + the locked treatment + an `interactive` flag that exists precisely
to avoid `nested-interactive` when the row sits inside a `DropdownMenuItem`.

I4 concluded it could not **compose F4** — correctly, because F4's root owns the
`DropdownMenu`, so composing per-group yields N menus where I4 needs one. It
then mirrored the shape rather than looking one level lower. _Cannot compose the
parent_ almost never means _cannot share the child_.

### 2.5 The gate would surface exactly three violations

Cross-family registry→registry imports, measured across all 82 shipped
components:

| From                     | To                   | Disposition |
| ------------------------ | -------------------- | ----------- |
| I5 `drawing-tools`       | E3 `parameter-panel` | fixed by §4 |
| C1 `hero-omnibox`        | D `mode-tabs`        | exempt, §6  |
| E `voice-clone-recorder` | N3 `disclaimer-note` | exempt, §6  |

Every other registry→registry import targets a family-A primitive or the `cost`
lib — already legal.

---

## 3. Piece 1 — `timeline`, the registry's second `registry:lib`

### 3.1 Shape

`registry/super-ai/timeline.ts`, target `lib/timeline.ts`. Pure functions, no
React, **no provider** — the `cost` precedent's optional-provider shape exists to
reconcile a _value_ across surfaces; coordinates are arithmetic and need no such
reconciliation.

Moved verbatim out of `time-ruler.tsx:34–130`:

| Export                            | Kind                           |
| --------------------------------- | ------------------------------ |
| `timeToPixels`, `pixelsToTime`    | seconds ↔ pixels               |
| `snapTime`, `roundTime`           | snapping and float hygiene     |
| `timeRulerScale`                  | the tick/label interval ladder |
| `TimeRulerTick`, `TimeRulerScale` | types                          |

`TICK_INTERVALS`, `MIN_TICK_GAP_PX` and `MIN_LABEL_GAP_PX` move too but stay
module-private. They are `timeRulerScale`'s internals; exporting them invites a
consumer to reimplement the ladder rather than call it.

### 3.2 The scalar is named `pixelsPerSecond`, not `zoom`

H2's name loses. `zoom` is already taken inside family H: H6 uses it for a
sample-exponent ladder, an unrelated quantity. Unifying on `zoom` would have one
family using one word for two things, which is how the next duplication starts.

Consequences: H2's `zoom` prop is renamed to `pixelsPerSecond`; H3 keeps the
prop name it already has and stops computing with it directly.

### 3.3 H2 stops re-exporting the coordinate model

`time-ruler.tsx` currently exports `timeToPixels` / `pixelsToTime` / `snapTime` /
`timeRulerScale` with a comment explaining that H3 needs them. Once the lib
exists that rationale has moved, so the re-exports go and H2's guidance prose is
updated to point at `lib/timeline`. Registry components are copied rather than
installed as a package, so this is not a breaking change for anyone downstream.

### 3.4 H3 adopts it

`track-lane` imports `timeToPixels` and `snapTime`, replaces its three inline
`* pixelsPerSecond` expressions, and routes `trimStep` through `snapTime` so
trims stop accumulating float error.

### 3.5 The `.ts` extension needs three small changes

`registry:lib` support was written against `cost.tsx` and hardcodes the
extension in three places:

- `gen-registry.mts:262` — `registry/super-ai/${i.name}.tsx`
- `check-contract.mts:57` — the lib file-existence check
- `check-contract.mts:160` — the orphan scan, which reads only `.tsx`

Each resolves `.ts` before `.tsx` instead. Roughly six lines. This is the right
long-term shape: most future contracts will be pure TypeScript, and `cost.tsx`
is `.tsx` only because it ships a provider.

**Fallback if that proves invasive:** ship `timeline.tsx`. A `.tsx` file with no
JSX is legal, merely odd. Do not spend more than a short attempt on the clean
version.

---

## 4. Piece 2 — A13 `parameter-slider`

A straight application of the D3 precedent that produced A8–A12: a primitive
that was hidden inside a leaf component moves up.

- New family-A item **A13 `parameter-slider`**, with the standard five files.
- The implementation moves out of `parameter-panel.tsx:76–180` unchanged,
  including its two load-bearing comments: why it composes Base UI's `Slider`
  directly (the vendored wrapper forwards neither `getAriaLabel` nor
  `getAriaValueText`), and why the label is duplicated onto the thumb
  (`FieldRow`'s `<label for>` cannot reach a non-labelable nested control).
- E3 `parameter-panel` imports and composes it, and **drops the re-export** —
  its tests import from the new module instead.
- I5 `drawing-tools` imports `@/registry/super-ai/parameter-slider`. The import
  is now downward and legal.

## 5. Piece 3 — A14 `action-row`

- New family-A item **A14 `action-row`**, lifted from `action-stack.tsx:82–125`.
- Props: `action` (the existing `AssetAction` shape), `onAction`, `interactive`.
  `AssetAction` moves with it; F4 re-exports the type, since it is part of F4's
  published API today.
- F4 composes it and keeps the menu/inline split — the part I4 correctly said
  could not be shared.
- I4 `ai-tools-menu` replaces its mirrored row with the primitive.

**The main implementation risk is DOM identity.** F4's and I4's tests key on
`data-action-id` and `data-slot="action-stack-locked"`. The promoted primitive
must keep `data-action-id`, and the locked slot is renamed to
`data-slot="action-row-locked"` with both components' tests updated in the same
commit — a slot name should name its owner, and F4 no longer owns it.

The call-site contrast fix on the cost chip (`className="text-foreground"`,
because A2 sets `text-muted-foreground` on its own `bg-muted` at 4.34:1) moves
with the row, comment intact. It comes out when A2's retrofit lands.

## 6. Piece 4 — teach `check:contract` about layers

### 6.1 The rule

A registry component may import:

1. any **family-A** item (the primitive layer),
2. any **`registry:lib`** item,
3. any item **in its own family**.

Anything else fails. Intra-family is permitted on existing precedent — K7
`answer-block` consumes K6 `citation-ref` and has shipped green since wave 4.

Family O (blocks, L4) composes across families by definition and is exempt from
the rule wholesale. `registry:lib` items are exempt in the other direction: they
have no family, sit below every component, and are checked only for the reverse
— **a lib item may not import a registry component**, which would invert the
layering.

### 6.2 The escape hatch, and why it is not just a list

Two violations survive §4 and §5, and both are **single-consumer**. Promoting on
one caller's say-so is the exact mistake D12 records for `confidence-badge`:
_"Promoting a primitive on its consumers' say-so rather than on observed anatomy
is what the A8 audit in D11 caught."_

So the rule this pass writes down is:

> **Promote at two consumers. Exempt at one, with a written reason and a named
> exit condition.**

An exemption is a manifest field, not a config file — it lives next to the
component it excuses:

```ts
// on the C1 hero-omnibox manifest row
allowSideways: [
  {
    target: "mode-tabs",
    reason:
      "The hero omnibox is a composer with mode tabs in it; the overlap was reconciled deliberately in wave 2.",
    until: "A second consumer of mode-tabs outside family D.",
  },
];
```

The gate **rejects an exemption whose `reason` or `until` is empty.** That is
what keeps the hatch from being used silently; an exemption costs a sentence of
justification, which is roughly what it should cost.

### 6.3 The two exemptions, written out

- **C1 `hero-omnibox` → D `mode-tabs`.** The hero omnibox _is_ a composer with
  mode tabs in it; the overlap was reconciled deliberately during wave 2.
  Exit: a second consumer of `mode-tabs` outside family D.
- **E `voice-clone-recorder` → N3 `disclaimer-note`.** `disclaimer-note` is
  primitive-shaped (three states, no dependencies) and is the strongest future
  promotion candidate in the catalog. Exit: a second consumer outside family N —
  at which point it becomes A15 rather than an exemption.

---

## 7. Bookkeeping

Adding A13 and A14 moves the catalog from 114 to **116** active items, family A
from 12 to 14. `check:contract` reconciles these counts, so a miss fails loudly
rather than drifting — which is the whole point of D13.

| File                                    | Change                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/docs/lib/catalog.manifest.ts`     | A13, A14 rows; `allowSideways` on two items; `consumes` updated on E3, I5, F4, I4, H2, H3 |
| `apps/docs/lib/lib.manifest.ts`         | `timeline` entry                                                                          |
| `apps/docs/lib/manifest-types.ts`       | `allowSideways` field + its type                                                          |
| `docs/design-system/catalog.md`         | two rows, Totals table (A 12 → 14, total 114 → 116)                                       |
| `docs/design-system/component-specs.md` | A13 and A14 entries                                                                       |
| `docs/design-system/decisions.md`       | new entry: the promotions, the two-consumer rule, and why H6 is excluded                  |
| `docs/CONTINUE.md`                      | §5.11 resolved; §5.12 partially resolved                                                  |

## 8. Testing

Each promoted primitive gets the full contract — per-state stories, guidance
module, tests pinning the spec's load-bearing sentences. Beyond that:

- **The coordinate model gets unit tests it has never had**, now that it is a
  standalone module: round-tripping `timeToPixels`/`pixelsToTime`, `snapTime`
  with a falsy snap, and the property that every label interval lands on a tick
  at every zoom — the invariant `timeRulerScale`'s `divides()` check exists to
  guarantee, currently asserted nowhere.
- **A cross-component test that H2 and H3 agree**: the same `pixelsPerSecond`
  puts a clip boundary and a ruler tick at the same offset. This is the
  "playhead spans every track" promise, and nothing tests it today.
- **The layer gate gets tests** against a fixture manifest: a legal downward
  import passes, a cross-family one fails, an exemption with a reason passes,
  an exemption with an empty reason fails.

## 9. Explicitly out of scope

- **H6 `waveform-editor`** — §2.2.
- **Real playhead synchronisation** (`compare-viewer`'s `syncKey`, CONTINUE §5.12).
  This pass gives it the shared coordinate model it was always going to need,
  but the sync mechanism itself is a separate design.
- **A2 `cost-chip`'s contrast retrofit.** The call-site workaround moves with
  the action row; the fix is its own task.
- **Promoting `disclaimer-note` or `mode-tabs`** — §6.3.

## 10. What done looks like

All gates green, at or above the baselines this pass must not regress:

```
pnpm typecheck · pnpm lint · pnpm check:tokens
pnpm check:contract          # now including the layer rule
pnpm test                    # ~870 expected
pnpm build                   # ~101 pages expected
pnpm test:stories            # ~263 expected, run twice to rule out flake
registry.json                # 98 → 101 items (measured: 98 today)
```

Only the `registry.json` count is measured. The other three come from
CONTINUE.md §1, and CONTINUE.md §6 still carries a stale, much lower set
(366 / 62 / 144) from an earlier wave. **The plan's first step is to run the
gates on an unmodified tree and record the real numbers**, both to get a true
baseline and to correct §6 — a handoff that states two different baselines is
worse than one that states none.

And one thing no gate can check: after this pass, a builder starting J7
`track-list` finds one coordinate model, imports it, and never writes
`time * pixelsPerSecond` again.
