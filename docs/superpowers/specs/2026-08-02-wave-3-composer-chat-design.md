# Wave 3 — composer, chat feedback and `chat-shell` — Design Specification

**Date:** 2026-08-02
**Status:** Proposed — awaiting approval
**Wave:** 3 (`decisions.md` §5: *"D (composer) + N1/N3 + `chat-shell` | Composes AI Elements; second-cheapest shell"*)
**Covers:** D1 `media-prompt-bar` · D2 `reference-strip` · D3 `context-chips` · D4 `mode-tabs` ·
D5 `quote-reply` · D6 `skill-menu` · N1 `feedback` · N3 `disclaimer-note` · O2 `chat-shell`

| | |
| --- | --- |
| Scope | Eight components + the first block in the catalog. Doc corrections. |
| Registry | `super-ai` namespace, `registry/super-ai/*.tsx`; O2 needs a new registry group |
| Depends on shipped | A2 `cost-chip` · A4 `choice-chips` · A7 `gen-settings-bar` · A8 `preview-tile` · A9 `entity-row` · B6 `thread-list` |
| Depends on unshipped | B1 `app-sidebar` · B7 `app-topbar` (Wave 2) — O2 only |
| Testing | One co-located `*.test.tsx` per item, per repo convention |

This is the wave where the registry sits directly against AI Elements for the first time. §2 is the
part of this document that matters most.

---

## 1. Consumer and dependency audit

Method per D13: *"The per-component entries in `component-specs.md` are authoritative… Every future
component must audit its consumers against those entries before its API is designed; the fan-out row
is a hint about where to look, nothing more."* Every claim below was checked against the component's
own entry, not against `concept-model.md`'s summary table.

### 1.1 What each Wave-3 item depends on

| Item | Claimed base (catalog.md) | Its own entry declares | Verdict |
| --- | --- | --- | --- |
| D1 `media-prompt-bar` | Textarea, Button-group | *"The settings strip is A7 embedded. Cost re-estimates live as settings change."* | ⚠️ Base column is wrong — A7 is a declared dependency and is missing from it. A2 is implied and undeclared (see 1.3). |
| D2 `reference-strip` | Aspect-ratio | nothing beyond the roles | ⚠️ "Aspect-ratio" **is** A8 `preview-tile`'s base. Either D2 declares A8 or it re-rolls the primitive (see 1.4). |
| D3 `context-chips` | Badge | *"Shares machinery with D1 and **G4**"* | ⚠️ G4 `node-prompt` was **cut by D9**. Stale reference — the same class of error D13 found on A10's G5 row. |
| D4 `mode-tabs` | Toggle-group | nothing | ⚠️ A4 `choice-chips` is already a shipped ring-selected `Toggle-group` chip group (see 1.5). |
| D5 `quote-reply` | Card | nothing | ✅ No dependencies. |
| D6 `skill-menu` | Command, Popover | *"Rows are A9"* | ✅ A9 shipped. |
| N1 `feedback` | Popover, Button-group | nothing | ✅ No dependencies. |
| N3 `disclaimer-note` | — | nothing | ✅ No dependencies. Cheapest item in the wave. |

### 1.2 What depends on the Wave-3 items

Searched every block and component entry for D1–D6, N1, N3:

| Item | Declared consumers | Note |
| --- | --- | --- |
| D1 | O2 · O8 `explore-shell` (docked) · O13 `notebook-shell` · ~~O5~~ | O5 is cut and marked as such — not an error. |
| D3 | O2 · O13 | |
| D4 | O2 | Single consumer. |
| N1 | O2 · O10 `records-shell` | |
| N3 | O2 · O13 | |
| **D2** | **none** | No block and no component lists it. |
| **D5** | **none** | H5's entry mentions feeding D2, not consuming D5. |
| **D6** | **none** | A9's row lists D6 — that is the reverse direction. |

**Finding A — half of family D has no declared consumer anywhere in the catalog.** D2, D5 and D6 are
proven by no block. That does not make them wrong (D1's *"Reference thumbnails mirror D2"* on G4 and
H5's *"The in/out variant feeds D2"* are real usage signals), but it means nothing in Wave 3 exercises
them, and D1's spec does not name them either. They are built on their own evidence, not on a
consumer's demand — which is a weaker footing than any Wave-1 primitive had.

### 1.3 Two more fan-out rows are wrong

D13 states *"every primitive fan-out row checked so far has been wrong."* Wave 3 forces two
previously-unchecked rows, and both are wrong in the way D13 predicts:

| Row (`concept-model.md`) | Problem |
| --- | --- |
| `A2 cost-chip` → E5 · F4 · M5 · M2 · **G6** | G6 `model-bar` was cut by D9. D9 never propagated here either. **Also omits D1**, which E5's own entry names: *"The cost number here and in E1 / D1 come from one source. Two different prices is the failure mode."* |
| `A7 gen-settings-bar` → **G6** · D1 · E1 | Same cut component. Real consumers: D1, E1. |

Corrected: **A2 → E5, F4, M5, M2, D1** and **A7 → D1, E1**. Two stale-cut entries and one missing
consumer, found by the same method that produced D11 and D13. The score is now six rows checked, six
wrong.

### 1.4 D2 and A8 — an unresolved contradiction, not a silent fix

A8's own entry (post-D11) fixes its consumers at *"E4 `preset-grid` · H5 `frame-strip` · I1
`tool-panel` · F1 `result-card` · C4 `recent-grid` (· F2 transitively)"*. D2 is not on it, yet D2's
catalog base is `Aspect-ratio` — literally A8's base — and its content is thumbnails at a fixed frame.

The one place the two genuinely diverge is D2's defining rule: *"Empty slots stay visible rather than
collapsing, so the set of possible inputs is discoverable."* A8's four states are
`default · loading · locked · failed`. **There is no `empty` state**, and adding one would touch the
highest-fan-out primitive in the catalog after it shipped.

It does not need one. A8 §4.1 settles this: *"`children` is untyped… it holds them, it does not
inspect them."* An empty reference slot is an A8 whose child is a dashed placeholder — no new state,
no primitive change, and the role label uses the existing `label` / `labelPlacement="below"` slots.

**Recommendation (not applied here):** declare D2 `Built on: A8`, taking A8's direct fan-out from five
to six. **Flagged rather than resolved** because it edits a row D11 spent a whole spec establishing;
it needs the same sign-off D11 got.

### 1.5 D4 duplicates A4 `choice-chips`, which is already shipped

A4's shipped implementation (`registry/super-ai/choice-chips.tsx`) is a `role="radiogroup"` of
ring-selected chips with controlled/uncontrolled value — which is D4's entire mechanism. D4's own
entry adds exactly three things beyond it:

1. *"Two to five options only. Past five, the control is a select."* — a constraint, not a mechanism.
2. *"Mode changes the interpretation of the prompt, not the model."* — a semantic, not a mechanism.
3. *"The selected mode must survive a reload"* — **not implementable by a component at all.** No React
   component can guarantee its value survives a reload; that is host state. This rule belongs in D4's
   docs as a usage requirement, not in its API.

**Recommendation:** build D4 as a thin composition over A4 (`registryDependencies: [choice-chips]`),
adding icon, tooltip and the 2–5 dev-time warning — or cut it and ship it as a documented A4 recipe,
the precedent D4-the-decision set for the ten node presets (*"They ship as demo recipes, not registry
items"*). This is a scope call, so no unilateral resolution: **flagged.**

### 1.6 O2 `chat-shell` cannot be completed in Wave 3

O2's declared fillers vs. what exists at the end of Wave 3:

| Filler | Wave | Available? |
| --- | --- | --- |
| B6 `thread-list` | 0 | ✅ shipped |
| D1 · D3 · D4 | 3 | ✅ this wave |
| N1 · N3 | 3 | ✅ this wave |
| B1 `app-sidebar` · B7 `app-topbar` | 2 | ⚠️ specced, not in the registry |
| L1 `empty-state` | **9** | ❌ |
| J4 `artifact-grid` | **7** | ❌ |
| M5 `paywall-message` | **10** | ❌ |

**Finding B — three of ten fillers sit four to seven waves later, and the docs already know it.**
Block-specs O2: *"M5 lives in the stream, which is why monetization cannot be deferred to a late wave
in this shell."* `decisions.md` §4 F1 agrees and recommends *"move the cost contract and its four
placements into the wave where each host component ships."* The §5 sequencing table was never updated
to match — M is still Wave 10. **This is a live contradiction between §4 and §5 of the same document.**
Flagged, not resolved: it is a sequencing call.

Two of the three resolve cheaply and one does not:

- **L1 is not a blocker.** AI Elements ships `ConversationEmptyState` (`conversation.tsx:36`) with
  `title` / `description` / `icon`. The chat pane's empty state is already covered by the library O2
  is required to compose. L1 remains needed for the *sidebar* and *artifact* regions later.
- **J4 and M5 are slots.** O2 renders regions, not messages (§4.9). An artifact card and a paywall
  card are both `children` of the stream region, which the host supplies. O2 ships without them and
  gains nothing when they arrive.
- **B1/B7 are real.** O2 is genuinely gated on Wave 2 for its sidebar and topbar regions, and must
  degrade to a valid two-region chat when they are absent (§4.9).

### 1.7 Eight catalog rows have no spec entry at all

`component-specs.md` ends at N6. Every one of D12's eight restorations — **N7 `env-status`,
N8 `permission-prompt`**, E9, E10, H6, H7, J7, M7 — exists as a catalog row and nothing else.

D13 designates `component-specs.md` as *"authoritative"* and the catalog as a *"summary table."* Eight
components therefore have summaries and no source of truth. This is directly load-bearing for §6: N8
cannot be built to spec because it has no spec.

---

## 2. AI Elements boundary analysis

The governing rules, quoted from §3 of the design spec (still current — D10 superseded only §5 and §11):

> **Decision: companion registry, not fork, not superset.**
> - AI Elements components are referenced via **cross-registry dependencies**, never copied.
> - We never rebuild what AI Elements ships (48 components as of June 2026: conversation, message,
>   prompt-input, reasoning, tool, sources, canvas/node/edge, context, queue, task, plan,
>   model-selector, voice inputs, etc.).
> - Overlap audits are part of the component workflow: before building, check the AI Elements catalog;
>   compose where possible.

**Scope caveat on this audit.** `apps/storybook/src/components/ai-elements/` vendors **30** components,
not 48. Everything below is checked against those 30 sources. *Absent from this checkout* is not the
same as *absent from AI Elements* — before any "genuinely absent" verdict is built on, it should be
re-checked against the live catalog at elements.ai-sdk.dev.

### 2.1 Verdicts

| Item | Verdict | Basis |
| --- | --- | --- |
| **D1** `media-prompt-bar` | **EXTENDS — highest overlap in the catalog** | §2.2 |
| **D2** `reference-strip` | **ABSENT (adjacent machinery exists)** | §2.3 |
| **D3** `context-chips` | **ABSENT — name collision only** | §2.4 |
| **D4** `mode-tabs` | **ABSENT from AI Elements; duplicates our own A4** | §2.5 |
| **D5** `quote-reply` | **ABSENT** | §2.6 |
| **D6** `skill-menu` | **ABSENT (structural precedent exists)** | §2.7 |
| **N1** `feedback` | **ABSENT — its host row exists** | §2.8 |
| **N3** `disclaimer-note` | **ABSENT** | §2.9 |
| **O2** `chat-shell` | **COMPOSES — mandatory** | §2.10 |

### 2.2 D1 `media-prompt-bar` — extends `@ai-elements/prompt-input`

`prompt-input.tsx` is **1,399 lines** and ships: a controlled/uncontrolled form with a provider,
auto-resizing textarea, attachment state (`accept`, `multiple`, `maxFiles`, `maxFileSize`,
`globalDrop`, `syncHiddenInput`, typed `onError`), drag-and-drop, file dialog, attachment chips with
hover previews and remove, `Header` / `Body` / `Footer` / `Tools`, an action menu, a submit button
with status, a speech button, a select, and a command palette.

The catalog's base column for D1 says **"Textarea, Button-group."** Building against that column means
reimplementing all of the above. **The catalog row is itself the overlap risk.**

What D1 genuinely adds, from its own entry:

- *"Three presentations of one component. Floating collapses the settings strip; node-embedded drops
  the negative prompt."* (node-embedded is moot post-D9 and retained only as a record)
- *"The settings strip is A7 embedded. Cost re-estimates live as settings change."*
- *"`locked` replaces the input row in place — gate at the point of creation, not at a billing page."*
- The negative-prompt field.

None of that exists in AI Elements. All of it is **frame, state and slots around** an input that
already exists. **D1 is a layout-and-lifecycle wrapper, not an input.** §4.1 designs it accordingly:
the field itself arrives as `children`, so the same component works with `PromptInput` in a chat app
and a bare `Textarea` in a tool app — exactly the argument A8 §4.1 makes for its own opaque children.

### 2.3 D2 `reference-strip` — absent, but adjacent machinery must not be duplicated

`PromptInputAttachments` (`prompt-input.tsx:372`) renders a flat, untyped, order-agnostic list, and
`return null` when `files.length === 0`. `PromptInputAttachment` keys off `data.mediaType` to pick
image-vs-file chrome. There is no role, no fixed slot, and no persistent empty.

D2's rule is the opposite on every axis: *"Slots are typed and role-labelled. **The role IS the data**
— it changes what the model does"* and *"Empty slots stay visible rather than collapsing."* A
first-frame slot is not a file with a tag; a video model behaves differently because of it.

**Verdict: genuinely absent — build it.** With one hard constraint: **D2 must not reimplement file
ingestion** (drag/drop, dialog, size and type validation). It is a controlled view over a `slots`
array and reports intent (§4.2). It must also **not** consume `usePromptInputAttachments`: that
context models an untyped file list, and binding a typed role strip to it would put two competing
attachment models in one composer.

### 2.4 D3 `context-chips` — absent; the name collision is the finding

AI Elements ships a component called `Context` — and it is a **token-window usage meter**:

```
type ContextSchema = { usedTokens: number; maxTokens: number; usage?: LanguageModelUsage; modelId?: ModelId };
```

built on `HoverCard` + `Progress` + `tokenlens`, with `ContextInputUsage`, `ContextOutputUsage`,
`ContextReasoningUsage`, `ContextCacheUsage`. It has nothing to do with *"Removable entity/range/file
references."*

`concept-model.md:20` lists **"context"** in the L1 AI Elements row with no gloss. A reader checking
"is context covered upstream?" gets the wrong answer from our own layer table. **Verdict: genuinely
absent; annotate the L1 row (§7).**

### 2.5 D4 `mode-tabs` — absent upstream, duplicated internally

`PromptInputTabsList` / `PromptInputTab` / `PromptInputTabLabel` / `PromptInputTabBody` /
`PromptInputTabItem` are unstyled `<div>`s that group items inside the composer's command popover —
sectioned lists, not a mode switch. Nothing in AI Elements switches prompt interpretation.

**Verdict: absent from AI Elements.** The duplication here is with our own A4 — see §1.5.

### 2.6 D5 `quote-reply` — absent

Nearest neighbours checked and rejected: `MessageBranch*` is response versioning; `InlineCitation` is
source attribution inside generated text; `Sources` is a source list. None carries a selection anchor
back into the composer. **Verdict: genuinely absent.**

### 2.7 D6 `skill-menu` — absent; `ModelSelector` is the structural precedent

`ModelSelector` is `Command` inside a `Dialog` with `Group` / `Item` / `Shortcut` / `Logo` parts. Same
shape, different subject, and no hover preview — which is precisely D6's differentiator: *"the hover
preview is the differentiator. A skill you cannot see the output of is a name, not a choice."*

**Verdict: genuinely absent.** Do not import `ModelSelector*` to build it — the parts are model-typed
(`ModelSelectorLogo` maps provider ids). Build on shadcn `Command` + `Popover` + A9, as its entry says.

### 2.8 N1 `feedback` — absent; its host row exists upstream

`MessageActions` is a flex row; `MessageAction` is a ghost icon `Button` with an optional tooltip and
an `sr-only` label. That is the container a thumbs-up sits in — not the feedback control. There is no
rating state, no reason popover, no submitted-with-undo anywhere in the 30 vendored components
(`grep -i "thumbs|feedback|rating"` returns nothing).

**Verdict: genuinely absent.** Design consequence: **N1 renders inside `MessageActions` and must not
assume its own container** — no card, no border, no fixed width (§4.7).

### 2.9 N3 `disclaimer-note` — absent

Nothing matching (`grep -i "mistake|disclaimer"` returns nothing across all 30). **Verdict: absent.**

### 2.10 O2 `chat-shell` — composes, and the block's own spec says so

> *"Composes AI Elements' conversation and message rather than reimplementing them."*
> — `block-specs.md:41`

`Conversation` (a `StickToBottom` container), `ConversationContent`, `ConversationScrollButton`,
`ConversationEmptyState`, `Message`, `MessageContent`, `MessageResponse` (memoised `Streamdown`),
`MessageActions`, `MessageAttachments` and `MessageToolbar` all ship. **O2 must never map over
messages.** §4.9 makes that structural: the stream is a `ReactNode` region the shell positions and
scroll-contains, and nothing more.

### 2.11 Infrastructure: no cross-registry dependency has ever shipped here

Wave 3 is the first wave that needs one, and the plumbing is not in place:

- `apps/docs/components.json` and `apps/storybook/components.json` both have `"registries": {}`.
- No item in `gen-registry.mts`'s `extras` map declares an `@ai-elements/*` dependency — every current
  entry is a bare shadcn name or `self(name)` (a full URL to our own registry).
- **`apps/docs/scripts/consumer-test.sh` will fail** on a namespaced dependency: it scaffolds with
  `shadcn init --defaults`, which writes no `registries` block, then installs **every** registry item.
  A `@ai-elements/prompt-input` dep resolves against a registry the consumer app has never heard of.

**Recommendation:** mirror the existing `self()` helper with an `aiElement()` helper emitting the full
AI Elements registry item URL (verify the exact URL before use), so cross-registry deps travel as URLs
and need no consumer configuration — the pattern already proven by `self()`. Prove it on the smallest
possible case, and see §3 for which case that is.

---

## 3. Build order

Forced by dependencies and by the boundary work, not by preference. One rule from `concept-model.md`
constrains the whole order:

> **L3 Components · 84 | Families B–N | Never depend on each other**

D1 therefore **cannot import** D2, D3, D4 or D5, even though `block-specs.md:32` calls them *"the
D1/D3/D4 composer family."* They meet as `ReactNode` slots on D1 (§4.1) or as siblings in O2. This is
the single most important constraint on D1's API, and it is why the composer parts can be built in any
order relative to each other.

1. **N3 `disclaimer-note`** — zero dependencies, zero overlap, smallest surface in the catalog. Ship it
   first as the wave's smoke test.
2. **N1 `feedback`** — zero dependencies. Both N items land before the composer so O2's stream region
   has something to render.
3. **D3 `context-chips`** — zero primitive dependencies; the most-referenced composer part (O2 + O13).
4. **D2 `reference-strip`** — needs the A8 declaration in §1.4 signed off first.
5. **D5 `quote-reply`** — standalone. Ordered here because nothing blocks on it.
6. **D4 `mode-tabs`** — gated on the §1.5 compose-or-cut call. Do not build before that is answered.
7. **D1 `media-prompt-bar`** — last of the composer, because it is the frame the others sit in and the
   place the AI Elements boundary is decided. **Also the right place to prove `aiElement()`** (§2.11):
   its demo is the first real cross-registry composition.
8. **O2 `chat-shell`** — after everything above, and after Wave 2 lands B1/B7. Introduces a new
   registry group (`catalog.ts` knows only `"Primitives" | "Components"`).

If N8 is pulled in (§6), it slots at **2.5** — after N1, before the composer — because it is a stream
component and shares N1's zero-dependency profile.

---

## 4. APIs

All follow the shipped conventions: `"use client"`, `data-slot`, `cn()` from `@/lib/utils`, semantic
shadcn CSS variables only (the token gate rejects raw hex, `oklch()` and Tailwind palette classes),
named exports at the file foot, co-located tests. Interactive elements follow the settled A8/A9
pattern: **button semantics only when interactive, two explicit branches rather than a dynamic tag
where a button-only prop like `disabled` is involved.**

### 4.1 D1 `media-prompt-bar`

```tsx
type MediaPromptBarPresentation = "docked" | "floating";
type MediaPromptBarState = "idle" | "generating" | "locked";

interface MediaPromptBarProps extends React.ComponentProps<"div"> {
  presentation?: MediaPromptBarPresentation;  // default "docked"
  state?: MediaPromptBarState;                // default "idle"

  // Slots. Every one is a ReactNode: the L3 rule forbids importing D2–D5 directly.
  references?: React.ReactNode;      // D2 — above the field
  quote?: React.ReactNode;           // D5 — above the field, below references
  context?: React.ReactNode;         // D3 — inside the field's header
  modes?: React.ReactNode;           // D4 — footer, leading
  settings?: React.ReactNode;        // A7 gen-settings-bar — footer; hidden when floating
  cost?: React.ReactNode;            // A2 cost-chip — footer, trailing
  negativePrompt?: React.ReactNode;  // below the field; hidden when floating
  lockedAction?: React.ReactNode;    // replaces the field when state="locked"
  disclaimer?: React.ReactNode;      // N3 — below the bar

  children: React.ReactNode;         // the field itself: @ai-elements PromptInput, or a Textarea
}
```

**`children` is the composer field and D1 never inspects it.** This is the mechanism that keeps D1 on
the right side of the AI Elements boundary: in O2 the host passes a `<PromptInput>` subtree; in a tool
app it passes a `<Textarea>`. D1 supplies frame, presentation, lock and slot geometry. Same argument
as A8 §4.1, applied one layer up. D1 therefore carries **no** cross-registry dependency; its demo
does.

Load-bearing rules, quoted:

- *"`locked` replaces the input row **in place**"* — `children` is not rendered when
  `state === "locked"`; `lockedAction` takes the same box. The bar's outer geometry is unchanged, so a
  docked composer does not jump when the quota runs out.
- *"Floating collapses the settings strip"* — `presentation="floating"` suppresses `settings` and
  `negativePrompt`. They are suppressed, not unmounted-by-the-host: the host passes the same tree in
  both presentations.
- *"Cost re-estimates live as settings change"* — D1 owns no cost state; `cost` is a slot fed by the
  host from the same source as E5 and E1 (§1.3).

### 4.2 D2 `reference-strip`

```tsx
type ReferenceRole = "reference" | "first-frame" | "last-frame" | "video" | "character";

interface ReferenceSlot {
  id: string;
  role: ReferenceRole;
  label?: React.ReactNode;      // defaults to a role label
  content?: React.ReactNode;    // absent = empty slot, which still renders
}

interface ReferenceStripProps extends React.ComponentProps<"div"> {
  slots: ReferenceSlot[];       // fully controlled; the strip owns no state
  aspect?: "square" | "video" | "portrait" | "wide";  // passed to A8
  onAdd?: (role: ReferenceRole, index: number) => void;
  onRemove?: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
}
```

- Each slot is an A8 `preview-tile` with `labelPlacement="below"`; an empty slot is the same tile with
  a placeholder child. No new A8 state (§1.4).
- *"Removing a first frame must not silently promote another reference."* Enforced structurally:
  `onRemove` **reports**, it never mutates. Roles live in the caller's array and only the caller can
  change them.
- No file ingestion (§2.3). `onAdd` reports intent; the host opens whatever picker it uses.

### 4.3 D3 `context-chips`

```tsx
type ContextChipKind = "file" | "selection" | "url" | "mention";
type ContextChipStatus = "resolved" | "resolving" | "unresolved";

interface ContextChipItem {
  id: string;
  kind: ContextChipKind;
  label: React.ReactNode;
  status?: ContextChipStatus;   // default "resolved"
  icon?: React.ReactNode;
}

interface ContextChipsProps extends React.ComponentProps<"div"> {
  items: ContextChipItem[];
  max?: number;                 // beyond this, collapse to a +N chip
  onRemove?: (id: string) => void;
  onOverflowClick?: () => void;
  onChipClick?: (id: string) => void;
}
```

- *"Overflow collapses to a count chip — **never** a horizontal scroll inside a text input."* No
  scroll container anywhere in the component; `max` is the only overflow mechanism.
- *"`unresolved` is a real state."* It is rendered, announced (`aria-invalid` on the chip) and never
  silently dropped.
- Follows A5's rule for the same shape: the remove control is a **sibling** of the label, not nested,
  so assistive tech gets two distinct targets per chip.

### 4.4 D4 `mode-tabs` — pending the §1.5 call

```tsx
interface ModeTabsItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
}

interface ModeTabsProps extends React.ComponentProps<"div"> {
  modes: ModeTabsItem[];        // 2–5; a dev-time warning past 5, never a throw
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
```

If §1.5 resolves to *compose*, the body is A4 `choice-chips` plus icon/tooltip and the warning, with
`registryDependencies: [self("choice-chips")]`. **Persistence is explicitly not in the API** — *"must
survive a reload"* is a host requirement documented in the demo, because no component can honour it.

### 4.5 D5 `quote-reply`

```tsx
type QuoteSource = "text" | "image" | "cell" | "timeline";

interface QuoteReplyProps extends React.ComponentProps<"div"> {
  source: QuoteSource;
  anchor: string;               // opaque and stable; never parsed by the component
  preview: React.ReactNode;     // the excerpt, region thumbnail, cell value or range
  unresolved?: boolean;
  onNavigate?: (anchor: string) => void;
  onDismiss?: () => void;
}
```

- *"The quote carries a stable anchor, not just the text."* `anchor` is opaque — resolution is the
  host's job, so the same component serves a text range and a timeline range.
- *"Quotes are removable without clearing the typed message. Two independent pieces of state."*
  Enforced structurally: D5 contains **no input**. It is a sibling of the field in D1's `quote` slot,
  which makes the two-state rule impossible to violate.

### 4.6 D6 `skill-menu`

```tsx
interface Skill {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;    // shown on hover/focus — the differentiator
}

interface SkillMenuProps {
  skills: Skill[];
  value?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (id: string) => void;
  onCreate?: () => void;        // "author it yourself"
  onGenerate?: () => void;      // "have the agent author it"
  emptyMessage?: React.ReactNode;
  children?: React.ReactNode;   // the trigger
}
```

- Rows are A9 `entity-row` (`registryDependencies: [self("entity-row")]`).
- *"Search filters titles AND descriptions — skills are discovered by what they do."*
- *"The footer is two verbs."* Both callbacks optional; the footer renders only what it is given.
- Preview appears on **hover and keyboard focus** — hover-only makes the differentiator
  mouse-exclusive.

### 4.7 N1 `feedback`

```tsx
type FeedbackScale = "thumbs" | "stars";

interface FeedbackValue {
  rating: number;               // thumbs: -1 | 1 · stars: 1..5
  reasons?: string[];
  comment?: string;
}

interface FeedbackProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  scale?: FeedbackScale;        // default "thumbs"
  value?: FeedbackValue | null; // controlled; null = not yet rated
  reasons?: string[];           // chips offered when a reason is requested
  askReasonBelow?: number;      // default: 1 for thumbs, 4 for stars
  onSubmit?: (value: FeedbackValue) => void;
  onUndo?: () => void;
}
```

- *"Positive feedback is one click; negative asks why."* A rating at or above `askReasonBelow` submits
  immediately with no popover. Below it, the reason popover opens.
- *"Every reason chip is optional and free text never blocks submission."* The popover's submit is
  **never disabled**.
- *"Thumbs and 5-star are two presentations of one component — pick one per product."* One prop, no
  fork.
- Renders as a bare inline group with no container chrome, so it drops into `MessageActions` (§2.8).

### 4.8 N3 `disclaimer-note`

```tsx
interface DisclaimerNoteProps extends React.ComponentProps<"p"> {
  placement?: "composer" | "card" | "inline";   // spacing only
  children: React.ReactNode;
}
```

**What this API omits is the specification.** There is no `dismissible`, no `onDismiss`, no `open`:

> *"Permanent and non-dismissible. A disclaimer that can be dismissed is one that did not need to
> exist."*

Renders a `<p>` at `text-muted-foreground text-xs` — *"Quiet by design — findable when questioned, not
competing with the content."* `placement` changes margins only; it never changes what is rendered,
because *"Adjacent to the output it qualifies, never in a settings page"* is enforced by the consumer
putting it in the right region, not by a variant.

### 4.9 O2 `chat-shell` — the region contract

```tsx
interface ChatShellProps extends React.ComponentProps<"div"> {
  sidebar?: React.ReactNode;    // B1 + B6 · omit before Wave 2 lands
  topbar?: React.ReactNode;     // B7 · omit before Wave 2 lands
  stream: React.ReactNode;      // @ai-elements Conversation subtree — REQUIRED
  composer: React.ReactNode;    // D1
  disclaimer?: React.ReactNode; // N3, pinned under the composer
  aside?: React.ReactNode;      // the artifact surface a stream card opens into

  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  asideOpen?: boolean;
  onAsideOpenChange?: (open: boolean) => void;
}
```

Five regions, and the contract is about what the shell is **forbidden** to do:

1. **The shell owns geometry and scroll containment. Nothing else.** It renders no message, no chip, no
   button, no empty state.
2. **The stream region is AI Elements'.** O2 never maps over messages, never knows a message shape, and
   never imports `Message`. `block-specs.md:41` — *"Composes AI Elements' conversation and message
   rather than reimplementing them"* — is enforced by the region being an opaque `ReactNode`.
3. **Exactly one scroll container: the stream.** Sidebar, topbar, composer and disclaimer never scroll
   with it. `Conversation` is a `StickToBottom`; a second scroll parent breaks its bottom-pinning.
4. **The composer is pinned to the bottom of the stream column**, inside it — not a page-level footer —
   so it inherits the column's width and the `aside` open/closed geometry.
5. **`disclaimer` is the last child of the composer region.** N3: *"Adjacent to the output it
   qualifies."*
6. **`aside` shrinks the stream column; it never overlays it.** *"Artifacts render as cards inside the
   stream and open into their own surface. The conversation is an index, not a container."* An overlay
   would sever the index from the artifact.
7. **The sidebar is a job queue as well as a nav.** *"running tasks show spinners in B6, so background
   work is visible without leaving the thread"* — which means the sidebar region must remain mounted
   and visible when `aside` is open. Collapsing it to make room for an artifact hides running work.
8. **M5 and J4 are stream children, not regions** (§1.6). No prop is added for them.
9. **Degradation is part of the contract.** With `sidebar`, `topbar` and `aside` omitted, the shell is
   a valid two-region chat. This is what lets O2 ship in Wave 3 against Wave 2's absence, and it is a
   tested assertion, not a nicety.

---

## 5. Load-bearing test assertions

One co-located test per component. Each assertion below protects a rule quoted above; assertions that
only restate React's behaviour are omitted.

**D1 `media-prompt-bar`**
- `state="locked"` renders `lockedAction` and **not** `children`; the bar's own box is unchanged
  between `idle` and `locked` (the in-place rule).
- `presentation="floating"` suppresses `settings` and `negativePrompt` while the same props are passed;
  `docked` renders both.
- Every slot omitted renders no empty wrapper element — a composer with no references must not reserve
  the strip's height.
- `state="generating"` does not unmount `children` (a regenerating composer keeps the draft).

**D2 `reference-strip`**
- A slot with no `content` still renders, with its role label (the discoverability rule).
- `onRemove` fires with the removed id and the rendered slot array is unchanged until the caller
  updates `slots` — the no-silent-promotion rule.
- Slot count and frame geometry are identical whether slots are empty or filled.
- No `input[type=file]` and no drop handler exist in the rendered output (§2.3).

**D3 `context-chips`**
- With `items.length > max`, the excess renders as a single count chip and **no element in the tree has
  an overflow-scroll class** (the never-a-scroll rule).
- Each chip's remove control is a sibling of the label, not a descendant, and has its own accessible
  name.
- `status="unresolved"` renders a distinct state and is exposed to assistive tech.
- `onRemove` fires per chip with the right id.

**D4 `mode-tabs`** (if built)
- Controlled and uncontrolled selection both work.
- Exactly one option carries the checked state; the group has radio semantics.
- Selection changes add no layout box (ring, not border) — the row does not reflow.
- More than five modes logs a dev warning and still renders.

**D5 `quote-reply`**
- Renders **no input element** — the structural guarantee behind "two independent pieces of state".
- `anchor` is passed to `onNavigate` verbatim and is never parsed or normalised.
- `unresolved` renders without dropping `preview`.
- `onDismiss` fires on click and on Enter/Space.

**D6 `skill-menu`**
- Search matches a skill whose **description** matches but whose name does not.
- `preview` appears on keyboard focus, not only on hover.
- Footer renders only the verbs whose callbacks were supplied; neither supplied renders no footer.
- Row height is stable between skills with and without a description (inherited from A9).

**N1 `feedback`**
- A positive rating calls `onSubmit` immediately and opens **no** popover.
- A negative rating opens the popover and calls `onSubmit` only on explicit submit.
- The popover's submit control is enabled with zero reasons selected and empty free text.
- After submission an undo control is exposed and `onUndo` fires from it.
- `scale="stars"` and `scale="thumbs"` render from one component with no fork in the emitted structure.

**N3 `disclaimer-note`**
- **No dismiss control exists in the rendered output for any prop combination** — the entire point of
  the component.
- `placement` changes classes only; the rendered text is byte-identical across all three.

**O2 `chat-shell`**
- Renders with only `stream` and `composer` supplied (the Wave-2 degradation contract).
- The stream node is rendered verbatim; the shell adds no message-shaped markup around it.
- Exactly one element in the tree is a scroll container.
- `disclaimer` renders inside the composer region, after the composer node.
- Opening `aside` does not unmount `sidebar` (the running-tasks rule).
- `aside` is a sibling of the stream in the layout flow, not positioned over it.

---

## 6. The sequencing gap: N2, N7, N8

`decisions.md` §5 assigns waves to N1/N3 (Wave 3) and N4–N6 (Wave 11). **N2 `trust-dialog`,
N7 `env-status` and N8 `permission-prompt` appear in no wave at all.** N7 and N8 were added by D12
after the table was written and the table was never revisited; N2 predates it and was simply missed.

### 6.1 N8 `permission-prompt` — pull into Wave 3. Recommended.

**The case for.**

1. **Wave 3 is the only wave that can prove it.** A permission prompt is a stream component: the agent
   asks mid-conversation. O2 `chat-shell` is the block that renders a stream, and it is built here.
   Anywhere later, N8 ships without a block that exercises it — which is the exact situation §1.2
   flags as a weakness for D2, D5 and D6.
2. **It has no unbuilt dependencies.** Base is Alert-dialog (shadcn, L0). The visible scope rows are
   A9-shaped, and A9 shipped in Wave 1. Nothing blocks it.
3. **The docs already rate it the top priority.** gaps.md §3: *"T1 is the most important missing
   component in the entire catalog. Every tool-calling and computer-use agent needs it, and it is a
   safety surface rather than a convenience one."* D12 restates it verbatim. A component with that
   billing and no wave is a scheduling accident, not a decision.
4. **The AI Elements boundary must be settled now, while it is open.** This wave is auditing the
   boundary across eight components. N8 is the one item in the catalog with a **partial** upstream
   implementation, and getting that partition wrong is expensive in both directions.

**The AI Elements finding — N8 is partially covered, and this changes what to build.**

`confirmation.tsx` ships `Confirmation`, `ConfirmationTitle`, `ConfirmationRequest`,
`ConfirmationAccepted`, `ConfirmationRejected`, `ConfirmationActions`, `ConfirmationAction`. It is
bound to the AI SDK's tool lifecycle:

```tsx
export type ConfirmationProps = ComponentProps<typeof Alert> & {
  approval?: ToolUIPartApproval;   // { id, approved?: boolean, reason?: string }
  state: ToolUIPart["state"];      // gates on "approval-requested" | "approval-responded" | …
};
```

What it **covers**: the in-stream `Alert` shell, the request/accepted/rejected branching, and an
actions row that disappears once answered.

What it **does not cover**, item by item against N8's catalog row (*"allow once · always allow · deny ·
edit-first; visible revocable scope"*):

| N8 requirement | In `Confirmation`? |
| --- | --- |
| allow once | ✅ an action |
| deny | ✅ `approved: false` |
| **always allow** | ❌ `approved` is a boolean — there is no durable-grant concept |
| **edit-first** | ❌ no mechanism to amend the tool input before approving |
| **visible, revocable scope** | ❌ nothing renders or revokes a standing grant |

**Recommendation: build N8 as an extension of `@ai-elements/confirmation`, not a replacement.** N8
supplies the four-verb decision model, the parameter preview, and the standing-grant scope display;
the in-stream alert shell comes from upstream. This is the same relationship §2.2 establishes for D1
and `prompt-input`, and it keeps the registry on the right side of *"We never rebuild what AI Elements
ships."*

**The blocker, and it is real.** Per §1.7, **N8 has no entry in `component-specs.md`** — the document
D13 designates as authoritative. All that exists is a one-line catalog row. Every other component in
this wave was designed against quoted design rules; N8 has none to quote.

**Therefore: pull N8 into Wave 3 conditionally.** Write its `component-specs.md` entry first —
purpose, design rules, evidence, in the format of every other entry — and have it reviewed as a spec
change. Then build it at position 2.5 in §3. If the entry is not written, N8 does not enter this wave;
building from a table row is how the fan-out table drifted in the first place.

### 6.2 N2 `trust-dialog` — do not pull in. Give it a wave elsewhere.

1. **It fails the catalog's own inclusion test on the face of its entry.** D1-the-decision: *"A
   component earns registry status only if it appears in **three or more unrelated products**."* N2's
   evidence line is *"**v0 template dialog.** Running other people's prompts and code is becoming
   routine."* One product plus a trend argument. Every other component in this wave cites three to
   five. Flagged, not resolved — but it is a real inconsistency and it should be answered before N2 is
   scheduled, not after.
2. **It depends on account concepts from Wave 2 and later.** *"The account picker on Continue chooses
   where untrusted code executes — as important as whether."* That is B2 `workspace-switcher` /
   B8 `account-menu` territory.
3. **It has no placement in O2.** N2 is a modal about running third-party content, gating an import or
   a template run. O2's regions have no seam for it and no block in the catalog lists it.
4. **D12 explicitly parked family N.** *"Families the new categories touch — J, K, N, and any new
   family the second board produces — should not be treated as closed until the re-sampling is done."*
   N2 is precisely the kind of item that second board should test.

**Recommendation:** schedule N2 with **Wave 10 (M + `settings-shell`)**, alongside M7
`connection-manager` and the account surfaces it needs, and re-test it against the second reference
board first.

### 6.3 N7 `env-status` — also not Wave 3, and it exposes a split

N7 is a provider-reachability badge with no chat placement. Its natural wave is **11** (N4–N6,
observability). But gaps.md §3 states *"T5 is the config counterpart to R1, which is the runtime
view"* — T5 is M7 `connection-manager`, which sits in Wave 10 with the M family. **Under every current
reading the two counterparts land in different waves.** Flagged: either pull N7 forward to Wave 10 with
M7, or push M7 to Wave 11 with N7. Building the runtime view a wave apart from its config view is how
the two drift.

### 6.4 Summary of the recommendation

| Item | Recommendation |
| --- | --- |
| **N8 `permission-prompt`** | **Pull into Wave 3**, conditional on writing its `component-specs.md` entry first. Build as an extension of `@ai-elements/confirmation`. |
| **N2 `trust-dialog`** | Schedule at **Wave 10**; re-test against the second reference board first; answer the 3+-products question. |
| **N7 `env-status`** | Schedule at **Wave 10 or 11 — but in the same wave as M7 `connection-manager`.** |

---

## 7. Doc corrections implied

Shipping alongside the wave:

**`concept-model.md`**
1. `:48` A2 row — drop the cut G6, add D1 (evidenced by E5's own entry).
2. `:49` A7 row — drop the cut G6. Real consumers: D1, E1.
3. `:45` A8 row — add D2, **if** §1.4 is approved.
4. `:20` L1 row — annotate that AI Elements' `context` is a **token-window usage meter**, unrelated to
   D3 `context-chips` (§2.4).
5. `:18` — the L3 "never depend on each other" rule needs a note that slots are how composer parts meet
   (§3), because `block-specs.md:32`'s "D1/D3/D4 composer family" reads as an exception.

**`component-specs.md`**
6. D3 — *"Shares machinery with D1 and G4"*: G4 was cut by D9. Remove or mark.
7. D1 — declare A7 and A2 explicitly, and record the AI Elements boundary (extends `prompt-input`;
   the field is a children slot).
8. D2 — record the A8 relationship, whichever way §1.4 resolves.
9. D4 — record the A4 relationship and that persistence is a host requirement, not an API.
10. **Add the eight missing D12 restoration entries** — N7, N8, E9, E10, H6, H7, J7, M7. N8's is a
    precondition for §6.1.

**`catalog.md`**
11. D1's base column — "Textarea, Button-group" understates it. Should read A7 + `@ai-elements/prompt-input`.
12. D2's base column — "Aspect-ratio" should name A8 if §1.4 is approved.

**`block-specs.md`**
13. O2 — record which fillers are unavailable at Wave 3 and that `ConversationEmptyState` covers the
    stream's empty state, so L1 is not a blocker (§1.6).

**`decisions.md`**
14. §5 — add rows for N2, N7, N8 (§6), and reconcile the §4-F1 vs §5 contradiction on M5 (§1.6).
15. §3 — "Trust & plan (3)" lists four items (`paywall-message`, `trust-dialog`, `disclaimer-note`,
    `member-gate-row`).
16. Record this audit as **D14**: two more stale-cut fan-out rows (A2, A7); the eight spec-less
    restorations; the AI Elements boundary verdicts; the cross-registry infrastructure gap.

**Infrastructure**
17. `gen-registry.mts` — add an `aiElement()` helper mirroring `self()` (§2.11).
18. `consumer-test.sh` — prove a cross-registry install, or confirm the URL form needs no consumer
    config.
19. `apps/docs/lib/catalog.ts` — `group` is typed `"Primitives" | "Components"`; O2 needs a third.

---

## 8. Non-goals

- **Rebuilding any part of the conversation pane.** Conversation, message, streaming markdown, branch
  navigation, scroll-to-bottom and the message toolbar are AI Elements'. O2 positions them.
- **Rebuilding attachment ingestion.** Drag-and-drop, file dialogs, `maxFiles` / `maxFileSize` /
  `accept` validation belong to `PromptInput`. D2 is a typed view, not an uploader (§2.3).
- **Voice and speech input.** `PromptInputSpeechButton` exists; U1/U2 in gaps.md §4 are unsampled
  candidates, not commitments.
- **Model selection UI.** E2 `model-picker` is Wave 4, and `@ai-elements/model-selector` ships today.
- **Persisting anything.** Mode selection, drafts, quotes and reference slots are host state. D4's
  *"must survive a reload"* is a documented usage requirement, not an API (§4.4).
- **Anchor resolution for D5.** The component takes an opaque anchor and hands it back.
- **D1's node-embedded presentation.** G was cut by D9; the catalog row retains it as a record.
- **Building O2's J4 and M5 regions.** They are stream children supplied by the host (§4.9).
- **N7 `env-status` and N2 `trust-dialog`.** See §6.
- **Resolving §1.4 (D2→A8), §1.5 (D4 vs A4) or §1.6 (M5's wave).** All three are flagged for a
  decision, deliberately not taken here.
