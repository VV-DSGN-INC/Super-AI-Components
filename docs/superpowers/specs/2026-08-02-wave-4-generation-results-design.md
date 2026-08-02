# Wave 4 — generation, results, `generation-shell` and the cost contract — Design Specification

**Date:** 2026-08-02
**Status:** Proposed — awaiting approval
**Wave:** 4 (the lifecycle core; waves 6, 7 and 8 depend on it)
**Covers:** E1–E10 (10) · F1–F7 (7) · O6 `generation-shell` (1 block) · the cost contract module
**Depends on:** Wave 0 primitives (A2, A3, A4, A6, A7) and Wave 1 primitives (A8–A12), all shipped

| | |
| --- | --- |
| Scope | 17 components, one block, one shared contract module, two additive primitive retrofits |
| Registry | `super-ai` namespace, `registry/super-ai/*.tsx` |
| New tooling | `gen-registry.mts` must learn `registry:lib` and `registry:block` file targets (§9.3) |
| Testing | One co-located `*.test.tsx` per item, per repo convention |

This is the largest wave in the catalog and the one that everything downstream reads from. F1
`result-card` is the single most depended-on component in it: F2 is built on it, O3 `studio-shell`
and O13 `notebook-shell` both place it, and the asset lifecycle loop
([concept-model.md](../../design-system/concept-model.md) §3) runs through it.

---

## 1. Consumer and dependency audit

Method is the one that caught the A8 and A9–A12 errors, mandated by
[decisions.md](../../design-system/decisions.md) D13:

> **"The table in concept-model.md is a derived summary, not a source of truth.** The per-component
> entries in component-specs.md are authoritative."
> — `decisions.md:168–170`

Every "built on X" claim touching this wave was checked against the consuming component's own entry.

### 1.1 Claims that hold

| Claim | Source | The consumer's own entry says | Verdict |
| --- | --- | --- | --- |
| E4 `preset-grid` → A8 | `concept-model.md:45` | **"Built on: A8"** (`component-specs.md:382`) | ✅ |
| F1 `result-card` → A8 | `concept-model.md:45` | **"Built on: A8 · Base: Card"** (`component-specs.md:432`) | ✅ — declared, following the A8 spec's doc correction |
| F2 `generation-grid` → F1 + A3 | `catalog.md:94` | **"Built on: F1 + A3"** (`component-specs.md:444`) | ✅ declared — but see §1.4, it violates the layer rule |
| F3 `asset-detail` → A10 | `concept-model.md:50` | **"Base: Dialog, A10"** (`component-specs.md:453`) | ✅ |
| F4 `action-stack` → A9 | `concept-model.md:46` | **"Base: Dropdown-menu, A9"** (`component-specs.md:463`) | ✅ |
| F4 `action-stack` → A2 | `concept-model.md:48` | *"Each row carries its own cost chip"* (`component-specs.md:465`) | ✅ in prose; A2 is absent from its **Base:** line |
| E3 `parameter-panel` → A6 | `concept-model.md:47` | *"Rows are A6, so this and I2 align to the same column grid"* (`component-specs.md:377`) | ✅ |
| D1 `media-prompt-bar` → A7 | `concept-model.md:49` | *"The settings strip is A7 embedded"* (`component-specs.md:294`) | ✅ (Wave 3 component; recorded for the cost contract) |

### 1.2 Claims that are wrong

| # | Claim | Evidence against it | Verdict |
| --- | --- | --- | --- |
| 1 | **A2 → G6 `model-bar`** (`concept-model.md:48`) | G6 was cut by D9 | ❌ **stale — a cut component still listed.** Identical to the A10/G5 error D13 recorded; D9 never propagated to the A2 row either |
| 2 | **A7 → G6 `model-bar`** (`concept-model.md:49`) | same | ❌ same error, second row |
| 3 | **A2 → M2 `credits-indicator`** (`concept-model.md:48`) | M2's own entry: *"This is the app-level **'ring'** of the cost contract; **A2 is the per-action chip**, E5 the pre-commit line"* (`component-specs.md:905–906`) | ❌ **M2 is a sibling form of the same number, not a consumer of the chip.** The row conflates *consumers of the primitive* with *placements of the contract* — two different things (§2) |
| 4 | **A6 → E1 `generation-panel`** (`concept-model.md:47`) | E1's entry never mentions A6 (`component-specs.md:351–359`) | ❓ **unstated.** E1 as specced owns no rows at all — it owns section order (§5.1) |
| 5 | **A7 → E1 `generation-panel`** (`concept-model.md:49`) | E1's entry never mentions A7 | ❓ **unstated**, same reason |
| 6 | **catalog F1 base = "Card, Aspect-ratio"** (`catalog.md:93`) | `component-specs.md:432` says **"Built on: A8"** | ❌ **the two catalog documents disagree about F1's own base.** component-specs wins (D13) |
| 7 | **D5: E1–E5 replace `brush-controls`** (`decisions.md:36–38`) | I5's entry: *"**Absorbs the spec's `brush-controls`**"* (`component-specs.md:704`) | ❌ **double-claimed.** Brush controls are family I, Wave 6 — not E. D5's list is over-claimed by one item (§4) |

### 1.3 Consumers nobody listed

Found by reading the specs rather than the table:

| Found | Its own entry says | Consequence |
| --- | --- | --- |
| **A7 `gen-settings-bar` → A2 `cost-chip`** | *"Changing any segment re-estimates cost, **which is why A2 lives inside the bar** rather than beside it"* (`component-specs.md:85`) | A primitive-on-primitive dependency, the second in the catalog after A11→A6/A12. **A7 shipped in Wave 0 with no cost chip in it** — verified against `apps/docs/registry/super-ai/gen-settings-bar.tsx`, which has no cost anything. Same defect class as A6's missing reset slot (D13) |
| **I4 `ai-tools-menu` → A2** | *"Each row carries a cost chip where the action spends"* (`component-specs.md:690`) | Sixth A2 placement; Wave 6. Recorded so the contract is designed for it now |
| **E7 `member-gate-row` → A9** | Not declared. E7 is icon + title + description + trailing switch, which is A9's grid verbatim (`component-specs.md:106–110`) | Recommend E7 compose A9 rather than reinvent the row grid (promotion rule, D3) |
| **E9 `tts-composer` → A6** | Only `catalog.md:83` declares it ("Textarea, A6"); E9 has **no component-specs entry at all** (§1.5) | Design derived from the catalog row + gaps.md R6 |

**Corrected A2 fan-out:** A7 (inside the bar) · E5 `run-button` · F4 `action-stack` · I4
`ai-tools-menu` · M5 `paywall-message` · E9 (per-segment). **Not** M2, **not** G6.

### 1.4 The layer rule collides with three declared dependencies

`concept-model.md:18` states the rule that holds the catalog together:

> **"L3 Components · 84 | Families B–N | Never depend on each other"**

Three items in this wave contradict it, in the catalog's own words:

| Item | The declaration | Why it collides |
| --- | --- | --- |
| **F2 `generation-grid`** | **"Built on: F1 + A3"** (`component-specs.md:444`) | F1 and F2 are both L3 |
| **E6 `generation-queue`** | D5: *"`video-gen-card`, **`generation-queue` slots** and failed-card variants are all `result-card` states"* (`decisions.md:37–38`) | E6 and F1 are both L3 |
| **E1 `generation-panel`** | *"Vertical order is fixed across every tool: inputs → directions → **presets → settings → cost + Generate**"* (`component-specs.md:354–355`) | Those are E4, E3/A7 and E5 — three L3 siblings |

**Flagged, not resolved.** Three ways out, and the choice is Nick's:

- **(a) Slots.** F2, E6 and E1 render *regions* and accept the cards/rows as children or through a
  `renderItem` callback. No sideways import, the rule survives untouched, and the host composes.
- **(b) Declare the dependency.** F2 gets `registryDependencies: [result-card]` and the layer rule is
  amended to "L3 may depend on L3 only where declared in component-specs".
- **(c) Promote.** Move the card frame to L2 — but A8 *is* that promotion, already done, and F1's
  remainder (footer, retry, streaming) is not reusable enough to justify a second primitive.

**This spec's APIs are written for (a),** because it is the only option that leaves the rule intact
and because it is what E1's own spec already implies — E1 is described entirely in terms of section
*order*, never section *content*. Under (a), F2 keeps its `registryDependencies` empty and the demo
(not the component) is what composes F1 into it. If Nick prefers (b), the APIs below are unchanged;
only `renderItem` becomes optional with an F1 default.

Note the shape of the risk: E1 composing four L3 siblings is the same argument D6 used to promote
`timeline-editor` out of the component layer — *"It is `transport-controls` + `time-ruler` +
`track-lane` composed"* (`decisions.md:42–43`). E1 under reading (b) is a block wearing a component's
name.

### 1.5 Two of this wave's eighteen items have no specification

`component-specs.md` runs E1 → E8 and stops. **E9 `tts-composer` and E10 `voice-clone-recorder` have
no entries.** They exist only as `catalog.md:83–84` rows plus the gaps.md R6/R7 justifications. The
same is true of every other D12 restoration (H6, H7, J7, M7, N7, N8) — D12 updated the catalog table
and never wrote the specs.

Their design below is derived from `gaps.md` §2 and the catalog row, and is explicitly weaker
evidence than the rest of this wave. **Recommendation: write the two entries before building them,
or build them last.**

### 1.6 Three state vocabularies for one lifecycle

The State contract fixes six names:

> **"`idle · queued · streaming · done · failed · locked` on every generation-aware component"**
> — `concept-model.md:108`

The wave's own components use three different sets:

| Component | States it declares | Divergence |
| --- | --- | --- |
| F1 `result-card` | `idle · streaming · done · failed · locked` | no `queued` |
| E5 `run-button` | `idle · estimating · running · done · failed · insufficient · locked` | `running` not `streaming`; adds two |
| E6 `generation-queue` | `queued · running · done · failed` | `running` again |
| A8 `preview-tile` *(shipped)* | `default · loading · locked · failed` | its own, deliberately smaller |

Flagged. §2.4 proposes a shared `GenerationState` union in the same module as the cost contract, and
per-component supersets that extend it rather than rename it. `running` vs `streaming` must not both
survive.

---

## 2. The cost contract

The most consequential API decision in the wave. Finding F1 is unambiguous about why:

> **"The board shows the paywall is a state on components that ship in waves 1–6"**
> — `decisions.md:241–242`

and E5's own entry states the failure mode in one sentence:

> **"The cost number here and in E1 / D1 come from one source. Two different prices is the failure
> mode."** — `component-specs.md:396`

A2 states it a second time from the other end:

> **"`insufficient` is the handoff to M5 and E5 — same numbers, three surfaces, one source of
> truth."** — `component-specs.md:32`

### 2.1 The choice: shared types, hook, context, or props

| Option | Why not, on its own |
| --- | --- |
| **Shared types only** | A `Cost` type stops the *shape* drifting, not the *value*. A panel rendering E5, E1 and A2 gets three props from the host and can still show three numbers |
| **Hook only** | A hook that computes cost is data-fetching in a component. The API conventions forbid it: *"no data fetching inside components"* (`2026-06-10-super-ai-components-design.md:307`) |
| **Context only** | Every component would need a provider before it renders anything. Registry components are **copied into a consumer's app one file at a time**; a mandatory provider makes a single-file install fail |
| **Props only** | Cannot satisfy E5's one-source rule when three siblings render the same number |

### 2.2 Decision — one value type, an optional provider, props always win

Ship **one `registry:lib` item, `cost.tsx`**, exporting a value type, a provider, and a hook.
Every placement takes an optional `cost` prop; when the prop is absent it reads the provider; when
neither exists it renders nothing rather than a zero.

```tsx
// registry/super-ai/cost.tsx      type: registry:lib

/** Estimate quality, not affordability. Affordability is always derived. */
type CostStatus = "estimate" | "estimating" | "confirmed" | "unavailable";

interface Cost {
  amount: number;
  unit?: string;              // "credits" | "tokens" | "minutes" — pricing is quota pricing
  per?: string;               // "run" | "minute" | "image" — the rate form
  status?: CostStatus;        // default "estimate"
}

interface CostContextValue {
  /** The estimate for the action currently being configured. */
  cost?: Cost;
  /** The account balance, in the same unit. */
  balance?: number;
  onTopUp?: () => void;
}

function CostProvider(props: CostContextValue & { children: React.ReactNode }): React.JSX.Element;

interface ResolvedCost {
  cost?: Cost;
  balance?: number;
  /** DERIVED. Never passed in, so two surfaces cannot disagree about affordability. */
  insufficient: boolean;
  shortfall: number;
  onTopUp?: () => void;
}

/** Props beat context; context beats nothing. */
function useCost(local?: Cost): ResolvedCost;

/** The single place a Cost becomes text. Every surface calls it. */
function formatCost(cost: Cost): string;

export { CostProvider, formatCost, useCost };
export type { Cost, CostContextValue, CostStatus, ResolvedCost };
```

Four properties do the work:

1. **`insufficient` is derived, never passed.** `balance < amount` is computed in one function. This
   is the mechanical enforcement of *"same numbers, three surfaces, one source of truth"* — the
   states cannot disagree because only one of them is stored.
2. **`formatCost` is the only formatter.** "55 credits", "900 credits/min" and "Need 4, you have 2"
   all come out of one function, so rounding and unit pluralisation cannot fork.
3. **`status: "estimating"` exists** because A2's spec says *"A cost chip that goes stale is worse
   than showing no cost"* (`component-specs.md:31`). A stale number is never rendered; the chip
   renders its estimating treatment while the host recomputes.
4. **The provider holds a value, it does not compute one.** Re-estimation on settings change is the
   host's job. This keeps the no-data-fetching convention intact.

`useCost(local)` returning props-over-context means a demo can pass `cost={{amount: 55}}` to a bare
`RunButton` with no provider anywhere, which is the shadcn install experience the registry sells.

### 2.3 How the four placements consume it

The placements named in finding F1 (`decisions.md:244–247`) and the table at `concept-model.md:127–132`:

| Placement | Component | Ships in | How it consumes the contract |
| --- | --- | --- | --- |
| **At the point of spend** | **E5 `run-button`** | **Wave 4** | `useCost(props.cost)`. Renders `formatCost` inline in the button; `insufficient` derived → the button becomes the "Need 4 credits, you have 2" state with `onTopUp` as its action. Never accepts an `insufficient` prop |
| **Locked row** | **E7 `member-gate-row`** | **Wave 4** | Cost is optional here — a tier gate is not always priced. When present it renders A2 in A9's trailing slot. `locked` is a tier fact, not an affordability fact, so it is a prop and not derived |
| **In-stream** | **M5 `paywall-message`** | Wave 10 | Reads the same context. **In this wave it appears only as F1's `lockedAction` slot** — F1 renders the shape of what would have been made, and the CTA that lands in it is M5-shaped. F1 must not import M5 (layer rule) |
| **Ambient** | **B5 `promo-card`** | Wave 2 | Balance only, never a per-action estimate — *"the only placement not tied to an action, and the only dismissible one"* (`concept-model.md:132`). Consumes `balance` and `onTopUp`, ignores `cost` |

Plus the two forms that are not placements: **A2 `cost-chip`** is the per-action chip that three of
these render, and **M2 `credits-indicator`** is the app-level ring — the same `balance`, a different
component, *not* a consumer of A2 (§1.2, finding 3).

Because waves 2 and 3 have not shipped (the registry holds 14 items: Wave 0 + Wave 1), **Wave 4 is
where the module lands**, and B5, D1 and M5 consume it when they are built. That is exactly finding
F1's recommendation — *"move the cost contract and its four placements into the wave where each host
component ships"* (`decisions.md:249–250`) — read forwards rather than backwards.

### 2.4 Two additive retrofits this forces

Both are safe for the same reason D13 gave for the A6 retrofit: *"shadcn registries copy code into
consumer apps, so a registry change never affects an already-installed component — only new installs
see it"* (`decisions.md:175–177`).

**A2 `cost-chip` — shipped incomplete against its own spec.** `catalog.md:23` and
`component-specs.md:27` declare four states — `estimate · confirmed · insufficient · rate form`. The
shipped `cost-chip.tsx` has `amount` and `unit` and nothing else: no state, no rate form, no
tooltip, no balance awareness. Additive fix:

```tsx
interface CostChipProps extends React.ComponentProps<"span"> {
  amount?: number | string;              // was required; optional once `cost` exists
  unit?: string;                         // default "credits" — unchanged
  cost?: Cost;                           // preferred; falls back to useCost()
  per?: string;                          // the rate form: "900 credits/min"
  state?: "estimate" | "estimating" | "confirmed" | "insufficient";
}
```

Omitting everything new renders exactly what ships today. The chip gains `"use client"` (it needs
`useContext`) and a registry dependency on `cost`.

**A7 `gen-settings-bar` — the second Wave 0 incompleteness.** Its spec says *"A2 lives inside the
bar rather than beside it"* (`component-specs.md:85`); the shipped component has no cost slot.
Additive fix: an optional `cost` slot rendered at the trailing edge of the toolbar. **This is the
same defect D13 found in A6 and should be recorded as such** — two of seven Wave 0 primitives shipped
without a slot their own spec requires.

### 2.5 The shared state union, same module

Given §1.6, `cost.tsx` should also export the lifecycle union, because both are cross-cutting
contracts and shipping two `registry:lib` items doubles the `gen-registry.mts` change:

```tsx
type GenerationState = "idle" | "queued" | "streaming" | "done" | "failed" | "locked";
```

F1 uses it verbatim. E5 extends it (`| "estimating" | "insufficient"`, with `running` **renamed to
`streaming`** to match the contract). E6 narrows it. **Open naming question for Nick:** if the file
carries both contracts it is misnamed as `cost` and should be `contracts.tsx`. Flagged rather than
decided.

---

## 3. F1 `result-card` — compose A8 or reimplement the frame

### 3.1 Decision: **compose `preview-tile`.**

Four reasons, in descending weight.

**1. F1's own entry declares it.** `component-specs.md:432` reads **"Built on: A8 · Base: Card"**.
Post-D13 that is the authoritative statement and it is not ambiguous. (`catalog.md:93` still says
"Card, Aspect-ratio" — §1.2, finding 6, a doc correction not a design question.)

**2. A8 already implements F1's stated contract, verbatim.** F1 says:

> *"Card geometry is identical in all states. Only the media slot and footer change, so grids never
> reflow when a result resolves."* — `component-specs.md:434–435`

A8's spec answers with the same sentence from the other side — *"`locked` / `loading` / `failed`
replace the content, never the frame. Grid geometry stays stable"* (`component-specs.md:98`) — and
the shipped `preview-tile.tsx` enforces it: one `ASPECT[aspect]` class on the frame, all four states
rendered *inside* it, selection as `ring-2` because *"a ring is a box-shadow: zero layout
contribution"* (`preview-tile.tsx:63–65`).

**3. A8's `locked` was built for F1 specifically.** The shipped code carries the requirement as a
comment:

```tsx
// F1: locked shows the shape of what would have been made, then the
// CTA — never an empty box with a padlock. Children stay, scrim over.
```
— `preview-tile.tsx:81–82`

`children` are retained under a `bg-background/60` scrim with `action` overlaid. Reimplementing means
rebuilding the one behaviour A8 was shaped around, and then keeping two implementations of it in
agreement forever.

**4. The promotion rule already ran.** *"`preview-tile` was hiding inside `preset-grid`,
`result-card`, `frame-strip`…"* (`concept-model.md:29`). Reimplementing would un-promote it.

### 3.2 What F1 adds, and why it is not A8's job

| F1 owns | Why it cannot move into A8 |
| --- | --- |
| **Footer** — prompt excerpt, actions, cost, provenance handles | A8 has a label and a badge, both inside the frame. A footer is *outside* the media box; putting it in A8 would give every preset tile and frame-strip cell a footer |
| **`streaming` + progress** | A8 has no `streaming` state and should not gain one — H5 frame strips and E4 preset grids never stream |
| **Retry inside the card** | *"Failure renders where the result would have been, with retry inside the card. A toast alone loses the association"* (`component-specs.md:436–437`). A8 exposes a generic `action` slot; F1 gives it the retry meaning |
| **Select-mode checkbox** | F2 drives it (*"Select mode replaces hover actions with checkboxes"*, `component-specs.md:447`); A8's `selected`/`onSelect` is single-tile selection, a different concept |

### 3.3 State mapping — F1 → A8

The mapping is the load-bearing detail, because A8's four states and F1's six do not line up.

| F1 state | A8 `state` | A8 content | F1 adds |
| --- | --- | --- | --- |
| `idle` | `loading` | pulse skeleton | nothing — the slot is reserved at final aspect (E6: *"Slots are reserved at submit time, at final aspect ratio, so results fill in place"*, `component-specs.md:403`) |
| `queued` | `loading` | pulse skeleton | queue-position text in the badge slot |
| `streaming` | `loading` | pulse skeleton | progress overlay + shimmer in F1's own layer |
| `done` | `default` | `children` (the media) | footer actions |
| `failed` | `failed` | failure treatment | retry passed as A8's `action` |
| `locked` | `locked` | `children` under a scrim | CTA passed as A8's `action` |

**No change to A8 is required.** `streaming` is expressed as `loading` plus an F1-owned overlay; the
alternative — adding `streaming` to A8 — would put a state in the primitive that four of its five
consumers can never enter. Recorded as a deliberate choice, not an oversight.

The one thing F1 must get right on its own: **the footer reserves its height in every state.** A8
guarantees the media box; nothing guarantees the footer, and a footer that appears only in `done`
reintroduces exactly the reflow A8 exists to prevent.

---

## 4. D5 revisited — does the consolidation still hold?

D5: *"`style-picker`, `palette-picker`, `tone-selector`, `shot-controls`, `music-brief` and
`brush-controls` are all `preset-grid` + `parameter-panel` with different data"* (`decisions.md:36–38`).

| Replaced | Absorbed by | Holds? |
| --- | --- | --- |
| `style-picker` | E4 | ✅ *"Presets are data, not code. Style, palette, environment, avatar and filter grids are one component with a different array"* (`component-specs.md:385–386`) |
| `palette-picker` | E4 | ✅ same sentence. A8's untyped `children` holds a colour-filled div as readily as an `<img>` (`preview-tile.tsx` §4.1 of the A8 spec) |
| `tone-selector` | E4 / A4 | ✅ a categorical choice with or without thumbnails |
| `shot-controls` | E3 + A7 | ✅ camera params are A6 rows; duration/aspect are A7 segments |
| `music-brief` | E3 + D1 | ⚠️ **weakened by D12** — see below |
| `brush-controls` | **I5, not E** | ❌ **double-claimed.** I5's entry: *"Absorbs the spec's `brush-controls`"* (`component-specs.md:704`) |

**A8's arrival strengthens the consolidation rather than threatening it.** E4 is now genuinely a
data-driven grid of a shipped primitive; before A8 existed, "one component with a different array"
was an assertion. Five of six still collapse.

**The `music-brief` tension is real.** D12 restored E9 `tts-composer` on the argument that a script
editor is *"a structured document, not a textarea with settings"* (`gaps.md` R6). A music brief —
genre, mood, tempo, plus a structured lyric/section field — is the same shape. If E9 earns registry
status on that argument, `music-brief` has a live claim to reopen. **Flagged, not resolved:** the
honest answer is that both belong to the second reference board D12 commissioned.

### 4.1 Do E9 and E10 belong in family E?

| | Verdict |
| --- | --- |
| **E9 `tts-composer`** | **Yes, E is right.** It is a generation surface: script in, audio out, per-segment regenerate, per-segment cost. It sits on the GENERATE stage of the lifecycle loop. Its board evidence is Requirements table E, *"TTS editor layout"* (`reference-board-analysis.md:32`). What must **not** drift into it is audio *editing* — region selection and sample-level zoom are H6 `waveform-editor`'s job (`gaps.md` R3) |
| **E10 `voice-clone-recorder`** | **Misfiled, and its inclusion is contradicted.** It satisfies none of family E's contracts: no model, no cost estimate, no result card, no generation state. It is a capture-plus-consent surface, closer to L6 `onboarding-wizard` (guided steps) and N2 `trust-dialog` (consent gate). Worse, **`decisions.md` contradicts itself**: §2 still lists `voice-clone-recorder` as dropped with reason *"Single product"* (`decisions.md:199`) while D12 restores it (`decisions.md:138`). It also fails D1's 3+ inclusion test on the catalog's own record. **Recommendation: build it last in the wave, or defer it to the second-board re-run.** Not a design call to make silently |

---

## 5. Build order

Forced by dependencies, not preference. F1 as early as the contract module allows, because F2, E6,
O6 and waves 6/7/8 all read from it.

| # | Item | Why here |
| --- | --- | --- |
| **1** | **`cost` module** + A2 retrofit + A7 retrofit | Nothing else can be built against a contract that does not exist. Cheap — a types file, a provider, one hook |
| **2** | **F1 `result-card`** | The wave's keystone. F2, E6's slots, O6's canvas, O3, O13 and every later grid inherit its geometry. Composes A8 (shipped) and shadcn Card only |
| **3** | **F2 `generation-grid`** | F1 + A3, both now available. Proves F1's geometry at grid scale — the assertion that matters most |
| **4** | **E5 `run-button`** | First cost placement. Validates `useCost` and `insufficient`-as-derived before three more components depend on it |
| **5** | **E4 `preset-grid`** | A8 only, no new dependencies. Parallelisable with 4 |
| **6** | **E3 `parameter-panel`** · **E2 `model-picker`** | A6 + A11 (E3); standalone (E2). E2 rewrites A7's segments, so it lands before E1 |
| **7** | **E6 `generation-queue`** | Slot geometry must match F1's; build after F1 exists to copy from |
| **8** | **E1 `generation-panel`** | Pure arrangement of 4–7. Cannot be meaningfully built or demoed before them |
| **9** | **E7 `member-gate-row`** · **E8 `generation-wizard`** | E7 is the second cost placement (A9 + A2). E8 is standalone |
| **10** | **F4 `action-stack`** · **F3 `asset-detail`** | A9 + A2 (F4); A10 + provenance (F3). Both operate *on* a result and read best after F1 |
| **11** | **F7 `approval-card`** · **F5 `compare-viewer`** · **F6 `render-queue`** | No dependencies within the wave |
| **12** | **E9 `tts-composer`** · **E10 `voice-clone-recorder`** | Specs do not exist yet (§1.5); E10's inclusion is contested (§4.1) |
| **13** | **O6 `generation-shell`** | A block: composes everything above and is the demo that proves the wave |

---

## 6. APIs

All follow the shipped conventions: `"use client"` where state or context is read, `data-slot` on
every part, `cn()` from `@/lib/utils`, semantic shadcn CSS variables only (the token gate rejects raw
hex, `oklch()` and Tailwind palette classes), named exports, co-located tests.

Two settled conventions carry forward: **button semantics only when interactive**
(`preview-tile.tsx:41–42`), and **two explicit branches rather than a dynamic tag when a button-only
prop like `disabled` is involved** — *"`disabled` is button-only, so a union element type cannot be
checked against div props"* (`entity-row.tsx:69–70`).

### 6.1 F1 `result-card`

```tsx
interface ResultCardProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  state?: GenerationState;              // idle · queued · streaming · done · failed · locked
  aspect?: PreviewTileAspect;           // passthrough to A8; fixes the frame
  progress?: number;                    // 0–100, streaming only
  label?: React.ReactNode;              // prompt excerpt, in A8's label slot
  badge?: React.ReactNode;              // type · duration · queue position
  footer?: React.ReactNode;             // actions · cost · provenance. Height reserved in ALL states
  actions?: React.ReactNode;            // hover actions; suppressed when selectable
  selectable?: boolean;                 // select-mode checkbox (F2 drives it)
  selected?: boolean;
  onSelect?: () => void;
  onRetry?: () => void;                 // failed: retry INSIDE the card
  lockedAction?: React.ReactNode;       // the CTA — M5-shaped, never an M5 import
  children?: React.ReactNode;           // the media; opaque, exactly as A8 treats it
}
```

`registryDependencies: [card, self(preview-tile)]`.

### 6.2 F2 `generation-grid`

```tsx
interface GenerationGroup<T> {
  id: string;
  label: string;                        // A3 renders it; relative buckets first
  items: T[];
}

interface GenerationGridProps<T> extends Omit<React.ComponentProps<"div">, "children"> {
  items?: T[];                          // ungrouped
  groups?: GenerationGroup<T>[];        // grouped — renders A3 per group
  getItemId: (item: T) => string;
  renderItem: (item: T, ctx: { selected: boolean; selectMode: boolean }) => React.ReactNode;
  density?: "compact" | "default" | "comfortable";   // 8-up · 6-up · 4-up. A prop, not a fork
  selectMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;        // the bulk bar; only rendered in select mode
  empty?: React.ReactNode;              // an in-grid tile, never a page takeover
}
```

`renderItem` is what keeps F2 off F1 in the import graph (§1.4). `registryDependencies:
[self(date-section)]`.

### 6.3 E1 `generation-panel`

```tsx
interface GenerationPanelProps extends Omit<React.ComponentProps<"div">, "children"> {
  inputs?: React.ReactNode;             // dropzone · D2 reference-strip
  directions?: React.ReactNode;         // the prompt
  presets?: React.ReactNode;            // E4
  settings?: React.ReactNode;           // E3 · A7
  run: React.ReactNode;                 // E5 — required, pinned, never scrolls
  cost?: React.ReactNode;               // the pre-commit line beside Generate
  collapsibleSections?: boolean;
  defaultCollapsed?: string[];          // section ids
}
```

Named slots rather than `children` **because the order is the specification**: *"Vertical order is
fixed across every tool… Deviating breaks muscle memory"* (`component-specs.md:354–355`). With
`children`, order becomes the caller's problem and the rule is unenforceable. `run` is required and
rendered outside the scroll container — *"the Generate row is pinned to the bottom — never requires
scrolling"* (`component-specs.md:356`).

**Open:** E1's sections should compose A12 `section-header`, which exists for exactly this (title +
count + action + collapse). `catalog.md:75` gives E1 the base "Card, Collapsible", i.e. it
reimplements the header. Flagged — recommend A12.

### 6.4 E2 `model-picker`

```tsx
interface ModelOption {
  id: string;
  name: string;
  group?: string;                       // task signature: "text→video", "image→video"
  description?: string;
  runtime?: "cloud" | "local";          // first-class badge, not a footnote
  hardware?: string;                    // local models only
  cost?: Cost;
  capabilities?: string[];              // what A7 renders; the picker owns them
  badge?: React.ReactNode;
  disabled?: boolean;
  locked?: boolean;                     // tier gate → cost contract
}

interface ModelPickerProps {
  models: ModelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  variant?: "dropdown" | "cards";
  onCapabilitiesChange?: (capabilities: string[]) => void;   // "Selecting a model rewrites the settings strip"
}
```

Grouping is by `group` and never alphabetical. The `node-inline` variant listed at `catalog.md:76`
is **dropped** — G was cut by D9 (doc correction, §9).

### 6.5 E3 `parameter-panel`

```tsx
interface ParameterDef {
  id: string;
  label: string;
  control: "slider" | "segmented" | "select" | "switch";
  value: number | string | boolean;
  defaultValue?: number | string | boolean;   // drives A11's modified/at-default state
  min?: number; max?: number; step?: number;
  unit?: string;                              // rendered as a suffix inside the field (A6)
  ends?: [string, string];                    // "More variable" ↔ "More literal" — never "0.0 ↔ 1.0"
  education?: React.ReactNode;                // a one-line SLOT under the control, never a tooltip
  options?: { label: string; value: string }[];
  group?: string;
}

interface ParameterPanelProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  parameters: ParameterDef[];
  onChange?: (id: string, value: number | string | boolean) => void;
  onReset?: (id: string) => void;
  onResetAll?: () => void;
  presentation?: "stacked" | "tabbed";
}
```

`ends` and `education` are the two props carrying the rules that make this component worth having:
*"Endpoints speak human… The raw number stays visible"* and *"One-line education under a slider is a
slot, not a tooltip. Tooltips hide the explanation that makes the control usable"*
(`component-specs.md:373–376`). `registryDependencies: [self(field-row), self(reset-affordance), slider, tabs]`.

### 6.6 E4 `preset-grid`

```tsx
interface Preset {
  id: string;
  label: React.ReactNode;
  preview: React.ReactNode;             // image · colour fill · video frame — opaque to A8
  badge?: React.ReactNode;
  locked?: boolean;
}

interface PresetGridProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  presets: Preset[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  onValueChange?: (value: string | string[]) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
  aspect?: PreviewTileAspect;           // default "square"
  labelPlacement?: "overlay" | "below"; // default "overlay" — E4's own rule
  visibleCount?: number;                // collapsed length
  onSeeMore?: () => void;               // rendered as a TILE in the grid, not a link below it
}
```

`registryDependencies: [self(preview-tile)]`. E4 does **not** compose A4 `choice-chips` despite A4's
claim that *"`preview-content` chips embed A8. This is the seam where A4 and E4 `preset-grid` meet"*
(`component-specs.md:53`) — E4's own entry declares A8 alone, and a chip row and a preset grid are
different layouts. Flagged as a doc reconciliation, not a dependency.

### 6.7 E5 `run-button`

```tsx
type RunButtonState =
  | "idle" | "estimating" | "streaming" | "done" | "failed" | "insufficient" | "locked";

interface RunButtonProps extends Omit<React.ComponentProps<"button">, "onClick" | "children"> {
  state?: RunButtonState;               // "insufficient" is DERIVED when omitted
  cost?: Cost;                          // falls back to useCost()
  progress?: number;                    // 0–100, drawn INSIDE the button
  label?: React.ReactNode;              // default "Generate"
  onRun?: () => void;
  onCancel?: () => void;                // required while streaming
  onTopUp?: () => void;                 // insufficient / locked
}
```

Three rules are structural rather than cosmetic: *"Progress is drawn inside the button. A separate
bar makes people wonder whether the button is live"*; *"Running state must expose Cancel. A
generation you cannot stop burns credits and trust"*; and the one-source rule
(`component-specs.md:394–396`). `running` is renamed `streaming` per §2.5.

### 6.8 E6 `generation-queue`

```tsx
interface QueueSlot {
  id: string;
  state: "queued" | "streaming" | "done" | "failed";
  progress?: number;                    // per-slot
  aspect?: PreviewTileAspect;           // reserved at submit time, at FINAL aspect
}

interface GenerationQueueProps extends React.ComponentProps<"div"> {
  slots: QueueSlot[];
  batchProgress?: number;               // a different number from per-slot, and both are needed
  columns?: number;
  renderSlot?: (slot: QueueSlot) => React.ReactNode;   // host injects F1; avoids the L3→L3 import
  onCancelSlot?: (id: string) => void;
  onCancelBatch?: () => void;           // must not orphan completed slots
}
```

### 6.9 E7 `member-gate-row`

```tsx
interface MemberGateRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tier: string;                         // the badge text — "Pro", "Team"
  state?: "locked" | "unlocked" | "trial";
  trialLabel?: string;                  // "Free trial ×1" — a distinct state, not a variant of locked
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  upsell?: React.ReactNode;             // revealed INLINE when a locked row is toggled, never a modal
  cost?: Cost;
  onUpgrade?: () => void;
}
```

Composes A9 (§1.3): icon · title · description · trailing switch is A9's grid exactly.
`registryDependencies: [self(entity-row), switch, badge, self(cost)]`.

### 6.10 E8 `generation-wizard`

```tsx
interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  skippable?: boolean;                  // default true — and the UI says so
  complete?: boolean;                   // completed steps stay clickable
}

interface GenerationWizardProps {
  steps: WizardStep[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  preview?: React.ReactNode;            // updates per step
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSkip?: (id: string) => void;
  onFinish?: () => void;
  cost?: Cost;
}
```

### 6.11 E9 `tts-composer` *(no component-specs entry — derived, §1.5)*

```tsx
interface ScriptSegment {
  id: string;
  text: string;
  voiceId?: string;
  emotion?: string;
  speed?: number;
  state?: GenerationState;
  duration?: number;
}

interface TtsComposerProps {
  segments: ScriptSegment[];
  voices: { id: string; name: string; description?: string }[];
  emotions?: string[];
  selectedSegmentId?: string;
  onSelectSegment?: (id: string) => void;
  onSegmentChange?: (id: string, patch: Partial<ScriptSegment>) => void;
  onRegenerateSegment?: (id: string) => void;     // THE primary loop
  onPlaySegment?: (id: string) => void;
  onPlayAll?: () => void;
  playingSegmentId?: string | null;               // exclusive playback, host-owned
  segmentCost?: Cost;
}
```

Per-segment regenerate is the primary action and whole-script regeneration is deliberately not the
default — *"Per-segment regenerate is the primary loop; whole-script regeneration wastes credits and
discards good takes"* (`gaps.md` R6). Per-segment controls are A6 rows; the cost chip sits per
segment, which is why the wave's cost contract has to reach a row and not just a button.

### 6.12 E10 `voice-clone-recorder` *(no component-specs entry — derived, §1.5; inclusion contested, §4.1)*

```tsx
type RecorderState = "idle" | "recording" | "reviewing" | "uploading" | "done" | "failed";

interface VoiceCloneRecorderProps {
  script: string[];                     // the prompt lines to read
  currentLine?: number;
  state?: RecorderState;
  level?: number;                       // 0–1 input level. Host-provided — no device access here
  elapsed?: number;
  minDuration?: number;
  consent: {                            // required. Consent belongs in the flow, not in settings
    text: React.ReactNode;
    accepted: boolean;
    onAcceptedChange: (accepted: boolean) => void;
  };
  onStart?: () => void;
  onStop?: () => void;
  onRetake?: () => void;
  onSubmit?: () => void;                // disabled until consent.accepted
}
```

The component renders metering and state; it never touches `MediaRecorder` or `getUserMedia`. That
follows the no-data-fetching convention and is what keeps it testable.

### 6.13 F3 `asset-detail`

```tsx
interface AssetDetailProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  media: React.ReactNode;
  prompt?: string;
  highlightedSpans?: { start: number; end: number }[];
  onSpanSelect?: (text: string, span: { start: number; end: number }) => void;  // feeds Remix
  params?: { label: React.ReactNode; value?: React.ReactNode; copyable?: boolean }[];  // A10
  onCopyPrompt?: () => void;
  onRemix?: (payload: { prompt?: string; span?: string }) => void;
  onEdit?: () => void;
  moreLikeThis?: React.ReactNode;
  cost?: Cost;
}
```

`params` is A10's `items` shape verbatim, so provenance renders identically here and in N5
`run-inspector` — *"the same grid N5 uses"* (`component-specs.md:458`).

### 6.14 F4 `action-stack`

```tsx
interface AssetAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  cost?: Cost;                          // per row — "chaining is where credits vanish fastest"
  disabled?: boolean;
  locked?: boolean;
}

interface ActionStackProps {
  actions: AssetAction[];
  onAction?: (id: string) => void;
  trigger?: React.ReactNode;
  presentation?: "menu" | "inline";
}
```

Rows are A9 with A2 in the trailing slot. *"Visually identical to I4 on purpose, because conceptually
they are the same thing"* (`component-specs.md:467`) — so I4 in Wave 6 must reuse this shape, not
re-derive it.

### 6.15 F5 `compare-viewer`

```tsx
interface ComparePane {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface CompareViewerProps {
  panes: ComparePane[];                 // numbered as well as labelled
  mode?: "side" | "single" | "wipe";
  onModeChange?: (mode: "side" | "single" | "wipe") => void;
  activePaneId?: string;                // single mode
  wipePosition?: number;                // 0–100
  onWipePositionChange?: (position: number) => void;
  syncKey?: string;                     // zoom/pan/playhead sync group
}
```

### 6.16 F6 `render-queue`

```tsx
interface RenderJob {
  id: string;
  name: string;
  spec: { format?: string; codec?: string; resolution?: string; fps?: number };  // rows carry their spec
  stage: "preview" | "export";          // separate stages, separate economics
  state: "queued" | "streaming" | "done" | "failed";
  progress?: number;
  cost?: Cost;
  downloadUrl?: string;
  error?: React.ReactNode;
}

interface RenderQueueProps {
  jobs: RenderJob[];
  onRetry?: (id: string) => void;       // failed rows KEEP their spec
  onCancel?: (id: string) => void;
  onDownload?: (id: string) => void;
}
```

### 6.17 F7 `approval-card`

```tsx
interface ApprovalCardProps {
  title: React.ReactNode;
  summary?: React.ReactNode;
  detail?: React.ReactNode;             // truncated with an EXPLICIT expand
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  state?: "pending" | "submitting" | "resolved";
  resolution?: "confirmed" | "edited" | "regenerated" | "skipped";
  onConfirm?: () => void;               // terminal
  onEdit?: () => void;                  // returns you to the artifact
  onRegenerate?: () => void;            // returns you to the artifact
  onSkip?: () => void;                  // terminal
  onUndo?: () => void;
  undoWindowMs?: number;                // default 8000
}
```

Verb order is fixed in the component, not by caller order: *"Four verbs, always in the same order"*
(`component-specs.md:494`). This is the Approval contract's only implementation in the catalog, so
K and N inherit it.

---

## 7. O6 `generation-shell` — region contract

```tsx
interface GenerationShellProps extends Omit<React.ComponentProps<"div">, "children"> {
  topbar?: React.ReactNode;             // B7 app-topbar + M2 credits-indicator
  panel: React.ReactNode;               // E1 generation-panel — the config column
  panelWidth?: "sm" | "default" | "lg";
  children: React.ReactNode;            // the result canvas: F2 · F1 · L1 empty-state
  panelSide?: "left" | "right";         // default "left"
}
```

Four regions, from `block-specs.md:92`: **config panel · cost + Generate · topbar · result canvas.**

- The **cost + Generate** region is not a shell prop. It is pinned by E1 itself (`run` is required
  there), because *"Generate pinned to the bottom of the panel so it never requires scrolling"*
  (`block-specs.md:97–98`) is a property of the panel's scroll container, and a shell-level slot
  would put it outside that container and break the relationship.
- The **result canvas** is `children`, untyped, because the empty state, a single F1 and a full F2
  all occupy it: *"The empty right pane carries an L1 example pair (before → after)"*
  (`block-specs.md:99–100`).
- **Two of O6's declared fillers ship in later waves.** `block-specs.md:94–95` lists L1
  `empty-state` (Wave 9) and M2 `credits-indicator` (Wave 10). O6 therefore ships in Wave 4 with
  those regions as slots and a plain placeholder in the demo; it is *filled* completely only after
  Wave 10. Flagged as a sequencing consequence, not a blocker.
- **O6's region list names a topbar but its Filled-by line omits B7** (`block-specs.md:92–95`) —
  every other shell names its topbar filler. Doc correction (§9).

---

## 8. Load-bearing test assertions

One co-located `*.test.tsx` per item. Only the assertions that protect a stated rule are listed.

| Item | Assertions |
| --- | --- |
| **`cost` module** | `insufficient` is derived from `balance < amount` and cannot be overridden by a prop · props beat context · context beats nothing · absent cost renders nothing, never `0` · `formatCost` output is identical for the same `Cost` across every consumer · `status: "estimating"` never renders a stale amount |
| **A2 retrofit** | Output with only `amount`/`unit` is byte-identical to what shipped · `state="insufficient"` derives from context when `balance` is short · rate form renders `per` · new props are all optional |
| **A7 retrofit** | Output without `cost` is unchanged · with `cost`, A2 renders inside the toolbar, not beside it |
| **F1** | **The card's box is identical in all six states** — the wave's defining assertion; if it regresses every grid reflows · **the footer reserves height even when empty** · `locked` retains `children` under a scrim (inherited from A8, asserted again here because F1's spec states it independently) · `failed` renders retry inside the card, not a toast · `streaming` renders progress without changing the frame · button semantics only when `onSelect` is passed |
| **F2** | Grid geometry is unchanged when one item transitions `streaming → done` · `density` changes columns, not content · select mode and hover actions are never both live · `empty` renders as a tile inside the grid, not as a replacement for it · grouped mode renders one A3 per group |
| **E1** | Sections render in the fixed order regardless of prop declaration order · `run` renders outside the scrollable region · a collapsed section does not move the Generate row |
| **E2** | Options group by task signature, never alphabetically · selecting a model emits `onCapabilitiesChange` · `runtime: "local"` renders the hardware note · both variants render the same option set |
| **E3** | `ends` renders both endpoint labels **and** the raw value simultaneously · `education` renders as visible text, not a tooltip (`title`/`aria-describedby` alone fails) · a modified row shows A11 in the modified state · `onResetAll` resets every row |
| **E4** | Selection adds no layout box (inherited ring) · see-more renders as a grid child, not a sibling · expanding does not change column count · `multiple` toggles rather than replaces |
| **E5** | Progress renders inside the button element · `streaming` exposes Cancel · `insufficient` is derived, not accepted as a prop · the rendered amount equals `formatCost(cost)` exactly · `locked` replaces the action with the CTA |
| **E6** | Slots reserve final aspect while `queued` · batch and per-slot progress are independent values · cancelling the batch leaves `done` slots intact |
| **E7** | Toggling a locked row reveals the inline upsell and opens no dialog · `trial` renders distinctly from both `locked` and `unlocked` · the tier badge is present in every state |
| **E8** | Every step advertises skippability · completed steps remain clickable · the preview re-renders on step change |
| **E9** | Regenerating one segment leaves other segments' state untouched · only one segment plays at a time · per-segment cost renders per row |
| **E10** | Submit is disabled until `consent.accepted` · retake returns to `idle` and clears elapsed · the component makes no media-device calls (assert by absence of `navigator.mediaDevices` usage) |
| **F3** | Selecting a prompt span emits `onSpanSelect` with the exact text · missing params render an em-dash (A10) · Copy · Remix · Edit are all present |
| **F4** | Every row with a `cost` renders a chip · row set changes with asset type · locked rows are not actionable |
| **F5** | Pane numbers persist in `single` and `wipe` where labels do not · mode change preserves wipe position |
| **F6** | Failed rows keep their full spec and offer retry · preview and export rows are visually distinguishable |
| **F7** | Verb order is Confirm · Edit · Regenerate · Skip regardless of which callbacks are supplied · resolved state exposes Undo for the window · `detail` is truncated until explicitly expanded |
| **O6** | Panel scrolls while the Generate row stays visible · empty canvas renders the empty slot · `panelWidth` changes the panel, not the canvas |

---

## 9. Doc corrections implied

### 9.1 `concept-model.md`

1. **Line 48, A2 row** — drop **G6** (cut by D9, never propagated: the same error D13 recorded for
   A10/G5). Drop **M2**, which its own entry defines as the ring rather than a chip consumer. Add
   **A7** (primitive-on-primitive) and **I4**. Corrected row: A7 · E5 · F4 · I4 · M5 · E9.
2. **Line 49, A7 row** — drop **G6**.
3. **Line 47, A6 row** and **line 49, A7 row** — mark **E1** *(unstated)*; E1's entry declares
   neither.
4. **Line 18, the layer rule** — either amend it or record the three exceptions in §1.4. As written
   it is contradicted by the catalog's own F2, E6 and E1 entries.
5. **§4 Cost row (line 109) vs the placement table (127–132)** — "three forms of one number" and
   "four placements" are two taxonomies of one contract. B5 is a placement but not a form; A2 is a
   form used by three placements. Reconcile the wording.

### 9.2 `catalog.md` / `component-specs.md` / `decisions.md` / `block-specs.md` / `README.md`

6. **`catalog.md:93`** — F1's base column reads "Card, Aspect-ratio"; `component-specs.md:432` says
   **"Built on: A8"**. Make the catalog match.
7. **`catalog.md:76`** — E2's `node-inline` variant is stale post-D9. Same for A7's `node-docked`
   (`catalog.md:28`) and D1's `node-embedded` (`catalog.md:64`, `component-specs.md:290`).
8. **`component-specs.md:86`** — A7's entry still reads *"G6 `model-bar` is this component with a Run
   split-button appended"*, referring to a cut component in a live spec. Mark as a record or remove.
9. **`component-specs.md`** — add the missing **E9** and **E10** entries (and, outside this wave, H6,
   H7, J7, M7, N7, N8). D12 updated the catalog table and left six of eight restorations unspecified.
10. **`decisions.md:199` vs `decisions.md:138`** — §2 lists `voice-clone-recorder` as dropped
    ("Single product") while D12 restores it. One of the two must go.
11. **`decisions.md:36–38` (D5)** — remove `brush-controls`; `component-specs.md:704` assigns it to
    I5. D5's replacement list is five items, not six.
12. **`block-specs.md:92–95` (O6)** — the Regions line names a topbar, the Filled-by line omits B7
    `app-topbar`. Add it.
13. **`README.md`** — still states *"Active catalog: 99 items (was 110)"* and *"86 active items"* in
    the document table; D12 moved the catalog to **107**. Stale.
14. **New decision record** — A7 shipped in Wave 0 without the cost slot its own spec requires
    (`component-specs.md:85`), and A2 shipped without three of its four declared states. Both are the
    same defect class as the A6 reset slot in D13, and both are fixed additively here. Worth
    recording as **D14** so the pattern ("Wave 0 primitives shipped against summary rows, not
    against their specs") is visible rather than discovered a third time.

### 9.3 Tooling

15. **`apps/docs/scripts/gen-registry.mts`** — `file()` (lines 16–20) hardcodes
    `type: "registry:component"` and `target: components/super-ai/*.tsx`. The `cost` module is a
    `registry:lib` and belongs at `lib/`; O6 is a `registry:block`. Both need `file()` to take the
    item's type and derive its target. This is the first time the wave structure has needed a
    non-component item.

---

## 10. Non-goals

- **Audio previews inside A8.** U3 `voice-picker` remains a separate component (gaps.md §4, D11).
  E9's per-segment play controls are E9's own, not a primitive.
- **Audio *editing*.** Region selection, sample zoom and stem mixing are H6/H7 in Wave 6. E9 stops at
  the script and the per-segment take.
- **Any capture, upload, polling or model call.** Every component in this wave is a rendering of
  state the host owns — including E10's level meter, which never touches `getUserMedia`.
- **Masonry results.** F2 is a fixed grid; J3 `explore-gallery` is a separate component (D11).
- **Building M5 `paywall-message`, B5 `promo-card` or M2 `credits-indicator`.** This wave ships the
  contract they consume and the slot F1 gives them, not the components.
- **Retrofitting A11 into E3's rows beyond the shipped `reset` prop.** A6 already carries it.
- **A `streaming` state on A8.** Expressed as `loading` + an F1-owned overlay (§3.3); four of A8's
  five consumers can never enter it.
- **Resolving the layer-rule collision (§1.4), the E10 inclusion contradiction (§4.1), or the
  `music-brief` reopening (§4).** All three are flagged for Nick; the APIs here are written for the
  reading that leaves the existing rules intact.
