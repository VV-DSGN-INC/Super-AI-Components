# Decisions and open questions

---

## 1. Decisions taken in this analysis

These were resolved while deriving the catalog. Each is revisitable, but each has a stated reason.

### D1 · The inclusion test

A component earns registry status only if it appears in **three or more unrelated products** on the
reference board. Anything appearing in one product is a demo, not a registry item.

This is what holds the catalog at 110 items while adding an entire missing family (first-run) and
five new primitives.

### D2 · Organise by app type × pattern, not by modality kit

The approved spec's Writing / Image / Audio / Video kits are four descriptions of the same three
components with different content poured in. Re-cutting along the board's own axes captures that
permanently instead of relying on discipline to avoid duplication.

### D3 · Promote shared pieces to L2 rather than importing sideways

L3 components never depend on each other. If two need the same piece, it moves up. This produced
A8–A12, five primitives that were previously hidden inside leaf components.

### D4 · Flow Kit collapses from 25 items to 9 + 1 hook

The 10 modality node presets (`text-node`, `llm-node`, `image-node`, …) are `ai-node` +
`node-prompt` + `node-result` + `model-bar` configured per type. They ship as **demo recipes**, not
registry items. This is the single largest saving in the recut.

### D5 · The four modality kits collapse into E + F

`style-picker`, `palette-picker`, `tone-selector`, `shot-controls`, `music-brief` and
`brush-controls` are all `preset-grid` + `parameter-panel` with different data. `video-gen-card`,
`generation-queue` slots and failed-card variants are all `result-card` states.

### D6 · `timeline-editor` is a block, not a component

It is `transport-controls` + `time-ruler` + `track-lane` composed. Shipping the parts means a single
track lane can be used standalone.

### D7 · Two new contracts

**Empty** and **Provenance**, both derived from the board rather than from the spec. See
[concept-model.md](concept-model.md#4-cross-cutting-contracts).

### D8 · `chat-header` is absorbed by `app-topbar`

A chat title bar is `app-topbar` with fewer slots filled. Same for `credits-indicator`, which moves
into the monetization family as M2.

### D9 · Node builder cut from scope — 2026-07-31

Nick's call at the Wave-0 status review: **the node builder does not ship.** Cut: G1–G9,
`useFlowRunner`, and O5 `flow-shell` — 11 items, taking the catalog from 110 to **99 active items**
(12 primitives · 74 components · 13 blocks).

Consequences:

- The unmerged `wave-2-flow-foundation` branch (10 flow components + the hook, ~4k lines with
  tests, built against the approved spec) stays **parked, not merged**. It remains on the remote as
  the reference implementation; reversing this decision starts there.
- Q3 (build order) resolves by elimination: home-first.
- Q2's defensible subset drops to five shells: home, chat, studio, library, settings.
- R2 `run-controls` in [gaps.md](gaps.md) is moot — do not restore it.
- F3 is moot: `model-bar` (G6) no longer exists to drift from `gen-settings-bar` (A7).
- F2 is unaffected: none of `preview-tile`'s eleven consumers were G items.
- In the sequencing table below, Wave 5 is struck; later wave numbers are kept as-is so
  cross-references hold.
- G specs and wireframes are **retained as records** — marked cut, not deleted — in the catalog,
  spec docs, and on the Figma boards.

### D10 · This catalog is promoted over the spec — 2026-08-02

Resolves Q1. `docs/design-system/` is now the **authoritative catalog and sequencing**. §5 and §11
of the [design spec](../superpowers/specs/2026-06-10-super-ai-components-design.md) are marked
superseded and retained there as records, following the same treatment D9 gave family G.

Reason: two live catalogs guarantee divergence, and the spec's §5 no longer matches anything the
repo intends to build — it predates both the re-cut and the D9 cut.

Scope of the promotion:

- **§5 and §11 only.** Every other section of the design spec — positioning, principles,
  architecture, registry mechanics, repo structure, non-goals, risks — remains current and
  authoritative. This is not a wholesale replacement.
- The open questions Q2, Q4, Q5 and Q6 are **not** resolved by this. Promotion makes this document
  the place where they get answered; it does not answer them.
- The scope-statement mismatch raised in [gaps.md](gaps.md) §7 — the catalog covers creative and
  agentic AI products, while the spec positions the registry for AI products generally — is
  **inherited, not settled**. It sits against §2 of the spec, which this decision does not touch.

### D11 · `preview-tile` is one primitive — 2026-08-02

Resolves Q5. One primitive, not two.

Q5's content list — image, video, colour swatch, text excerpt, 3D model — is what made two primitives
look necessary. Two entries on it do not survive an audit of the actual consumers:

- **Text excerpt** came from J4 `artifact-grid`, which is not an A8 consumer. Its own spec makes the
  excerpt load-bearing and never mentions a thumbnail.
- **Audio** was already excluded in [gaps.md](gaps.md) §4: U3 `voice-picker` needs play/pause,
  exclusive playback and a shared audition sentence. That is a control, not a preview.

What remains is visual media at a fixed aspect ratio, which one component covers with an untyped
children slot that never branches on content type.

The audit also corrected the fan-out from eleven consumers to five direct plus one transitive. C3
declares A9, E2 is entity-row shaped, J4 is text-first, J6 is a dialog, and J3 `explore-gallery`
requires masonry — which contradicts A8's fixed frame outright. J3 and J4 each need their own
component. Full reasoning in
[the preview-tile spec](../superpowers/specs/2026-08-02-preview-tile-design.md) §2–3.

### D12 · Scope settled — 13 blocks, 8 restorations, broaden the sampling — 2026-08-02

Nick's calls on the four remaining open questions. Active catalog moves from **99 to 107 items**.

**Q2 — all thirteen blocks ship.** Full archetype coverage is the point; blocks are the strongest
differentiator in the catalog. This is the largest remaining chunk of work and the last that can be
started, since each block composes 5–10 finished components.

**Q4 — `auth-shell` is kept**, as a consequence of Q2. The recommendation to cut it stands on
record as the first candidate if block scope is ever revisited.

**gaps.md §6 — all eight restorations are actioned (+8 items).** Six are recovered errors rather
than new scope, and the audio family was the worst of the consolidation:

| # | Component | Family |
| --- | --- | --- |
| R1 | `env-status` | N (observability) |
| R3 | `waveform-editor` | H (timeline) |
| R4 | `stem-mixer` | H (timeline) |
| R5 | `track-list` | J (library) |
| R6 | `tts-composer` | new audio surface |
| R7 | `voice-clone-recorder` | new audio surface |
| T1 | `permission-prompt` | N (trust) |
| T5 | `connection-manager` | M (account) |

R2 `run-controls` is **not** restored — D9 made it moot. T1 is recorded in gaps.md as the single
most important missing component in the catalog: every tool-calling agent needs it, and it is a
safety surface rather than a convenience one.

**gaps.md §7 — broaden the sampling rather than narrow the positioning.** A second reference board
covering voice, extraction, vision, data, search and coding will be collected, and the 3+ inclusion
test re-run against the combined population. Until then the catalog's scope statement stays as
written and the twenty U-items in gaps.md §4 remain **candidates, not commitments**.

Consequence: **the catalog is not final.** Families the new categories touch — J, K, N, and any new
family the second board produces — should not be treated as closed until the re-sampling is done.
Primitives (A) and shell/composer families (B, C, D) are unaffected and safe to build now.

### D13 · The fan-out table is derived and drifts — 2026-08-02

Auditing A9–A12 before building them found **three of four rows wrong**, in three distinct ways:

- **A9** — wrong membership. `sidebar-nav` uses A12 not A9, and `recommendation-card` never declared
  it. The actual consumers are `feature-card-row` (*"Cards are A9 in a card layout"*) and
  `workspace-switcher` (*"A9 rows with descriptions"*). Still six, a different six.
- **A10** — listed G5 `node-result`, which D9 cut. D9 never propagated to this table.
- **A11** — had **no row at all**.
- **A12** — five consumers claimed, one declared, plus an unlisted one (B3 `sidebar-nav`).

Combined with the A8 audit in D11, **every primitive fan-out row checked so far has been wrong.**

**The table in [concept-model.md](concept-model.md) is a derived summary, not a source of truth.**
The per-component entries in [component-specs.md](component-specs.md) are authoritative. Every
future component must audit its consumers against those entries before its API is designed; the
fan-out row is a hint about where to look, nothing more.

The A11 audit also surfaced that **A6 `field-row` shipped in Wave 0 without the reset slot its own
spec requires.** Fixed additively: `field-row` gains an optional `reset` prop and, with it, its
first `registryDependency`. This is safe because shadcn registries copy code into consumer apps, so
a registry change never affects an already-installed component — only new installs see it. That
property makes "ship incomplete, complete later" a legitimate strategy here in a way it would not be
in a conventional component library.

### D14 · Move 3 actioned for one slice — the agent population — 2026-08-03

[gaps.md](gaps.md) §5 committed to collecting a second reference population and re-running D1 against
the combined set. **That is now done for one slice: enterprise assistants and tool-calling agents.**
See [agent-board-analysis.md](agent-board-analysis.md).

The slice was read by a **weaker method than the primary board** — documentation and published UI
analyses rather than a Figma read of screenshots — and the doc says so in §1. Rows resting on
framework docs rather than shipped UI are marked ⚠ and must be verified against the running product
before they earn a spec.

**This does not close Move 3.** Voice, extraction, vision, data and coding remain unsampled, and the
§1 sampling-bias limitation still stands for those categories. The twenty U-items are now nineteen
candidates plus one deferral — still not commitments.

### D15 · Dialog is the seventh contract — 2026-08-03

The agent slice found the conversation-state layer to be universal and **chrome-less**: Rasa ships it
as named default patterns, Google as confirmation policy, every CX agent as handoff behaviour.

`repair-prompt` (2 products) and `interrupted-flow-resume` (1 product) **failed D1 as components**,
and the reason they failed is the finding: the population expresses conversation state as behaviour,
not as UI. So it ships as a contract — frame, sourced slots, correction-without-restart, stack
visibility, declared expiry — binding B D F K N O. See
[concept-model.md](concept-model.md#4-cross-cutting-contracts).

**A contract that owns no component is not a weaker result than a component family.** Empty owns no
component either, and it changed more surfaces than any single item in the catalog.

### D16 · Six additions from the agent slice — 2026-08-03

Clearing D1 against the combined population: `escalation-handoff` `NEW`, plus `autonomy-selector`
(T2), `task-tray` (T3), `safety-block` (T4), `answer-block` (U12) and `source-cards` (U14) promoted
from PROPOSED to validated. `slot-summary` also passed at 3 ⚠ but is **held** — it is the surface the
Dialog contract governs, and specifying it before the contract has one consumer is the mistake D11
nearly made with `preview-tile`.

Two corrections to already-shipped items fall out of the same read, both additive:

- **N8 `permission-prompt`** — edit-first is confirmed unanimously across the framework population
  and is promoted to equal weight with allow, not a tertiary action.
- **The revocable-scope surface moves out of N8 and into T2.** A grant list with no review screen is
  the component nobody in the population ships well; it belongs with the autonomy control, not with
  the per-call prompt.

The catalog moves from 107 active items to **113** (12 primitives · 88 components · 13 blocks).
Placement: `answer-block` and `source-cards` join K beside `citation-ref`; the four control and
oversight items join N.

### D17 · `slot-summary` released from hold; `confidence-badge` stays deferred — 2026-08-03

D16 held `slot-summary` because it governs the Dialog contract and the contract had no consumer yet.
Building the grounded-answer chain (K6→K7→K8) supplied one: K7's per-claim sourcing is the same
obligation applied to retrieved values. **`slot-summary` ships as D7**, in the composer/context family
rather than in N — it is task state, and it belongs beside D3 `context-chips`, which it is
deliberately distinguished from in its spec.

Catalog 113 → **114** (12 primitives · 89 components · 13 blocks).

**`confidence-badge` (U5) is NOT promoted, despite now having four would-be consumers** — D7, K7, K8
and any future extraction surface. Four consumers is the strongest promotion argument in the catalog,
and it is still the wrong call: U5's own evidence lives in the extraction and vision slices, which are
unsampled. Promoting a primitive on its consumers' say-so rather than on observed anatomy is exactly
what the A8 audit in D11 caught.

Until that slice is sampled, each consumer renders its own band inline from a shared three-value
vocabulary (`high · medium · low`, never a raw score). This is deliberate, temporary duplication with
a named exit condition — not an oversight. **When the extraction slice lands, this is the first thing
to reconcile.**

---

## 2. Components dropped from the approved spec

Each appears in at most one product on the reference board.

| Dropped | Reason |
| ------- | ------ |
| `rewrite-panel` | Single product; N alternatives side-by-side is a `generation-grid` of text results |
| `outline-builder` | Single product |
| `inline-suggestion` | Ghost-text completion is an editor concern, not a registry component |
| `chunk-highlighter` | Single product |
| `retrieval-inspector` | Covered by `run-inspector` (N5) in practice |
| `memory-viewer` | Single product |
| `agent-board` | Single product |
| `eval-board` | Single product |
| `model-compare` | `compare-viewer` (F5) covers the surface; the voting bar is app logic |
| `response-diff` | `diff-review` (K3) covers it |
| `review-queue` | `approval-card` (F7) plus a list; not a distinct component |
| `voice-clone-recorder` | Single product |
| `inpaint-canvas` | `drawing-tools` (I5) mask mode covers the input; the canvas is a host concern |
| `timeline-editor` | Promoted to a block (D6) |
| 10 Flow Kit node presets | Demo recipes on `ai-node` (D4) |
| 6 modality picker/param components | `preset-grid` + `parameter-panel` (D5) |

---

## 3. Components added

28 items with no equivalent in the approved spec.

**Primitives (5):** `preview-tile` · `entity-row` · `stat-readout` · `reset-affordance` ·
`section-header`

**First-run family (6):** `empty-state` · `coach-mark` · `feature-announcement` (expanded) ·
`whats-new` · `onboarding-wizard` · (plus `shortcuts-sheet`, already shipped)

**Home & launcher (5):** `hero-omnibox` · `feature-card-row` · `recent-grid` ·
`recommendation-card` · (plus `suggestion-chips`, already specced)

**Shell & account (4):** `modality-rail` · `app-topbar` · `account-menu` · `settings-dialog`

**Composer (3):** `reference-strip` · `mode-tabs` · `skill-menu`

**Results & canvas (4):** `action-stack` · `node-result` · `canvas-toolbar` · `generation-wizard`

**Library & docs (5):** `artifact-grid` · `record-list` · `template-detail` · `source-panel` ·
`citation-ref`

**Timeline (3):** `time-ruler` · `track-lane` · `frame-strip`

**Trust & plan (3):** `paywall-message` · `trust-dialog` · `disclaimer-note` · `member-gate-row`

**Editor (1):** `drawing-tools`

---

## 4. Findings that change the plan, not just the drawings

### F1 · Monetization cannot be Wave 12

The approved spec defers the entire monetization kit to the last wave. The board shows the paywall is
a **state** on components that ship in waves 1–6:

- `paywall-message` (M5) lives inside the chat stream → needed with the chat shell
- `member-gate-row` (E7) is a settings row → needed with settings
- `run-button` (E5) insufficient-credits state → needed with the first generation surface
- `promo-card` (B5) → needed with the sidebar

Deferring means building those components twice. **Recommendation:** move the cost contract and its
four placements into the wave where each host component ships.

### F2 · `preview-tile` must be prototyped before anything else

Eleven consumers across six families inherit its API. The open question on its card: does one
component genuinely cover colour swatches and 3D models, or is it two primitives sharing a name?

### F3 · `gen-settings-bar` and `model-bar` are one engine

A7 renders inline in a panel; G6 renders docked in a node with a Run split-button. Building them
separately is the most likely source of drift in the catalog.

### F4 · Empty states are the default view

NotebookLM's three simultaneously-empty panes make this concrete. The approved spec has no
`empty-state` component at all, which means every one of the 84 components would invent its own.

---

## 5. Revised sequencing proposal

Replaces §11 of the approved spec. Each wave ships components plus the block that proves them.

| Wave | Scope | Rationale |
| ---- | ----- | --------- |
| **0** | *Shipped* — repo, CI, registry pipeline, 7 primitives, `shortcuts-sheet`, `thread-list` | — |
| **1** | New primitives A8–A12, starting with `preview-tile` | Eleven components depend on A8; validate the API first |
| **2** | B (app shell) + C (home) + `home-shell` | Fewest new dependencies; produces a demonstrable page fastest |
| **3** | D (composer) + N1/N3 + `chat-shell` | Composes AI Elements; second-cheapest shell |
| **4** | E + F + `generation-shell` + the cost contract placements | The lifecycle core; monetization states land here, not in Wave 12 |
| **5** | ~~G + `useFlowRunner` + `flow-shell`~~ | **Cut (D9, 2026-07-31).** Wave numbers 6–12 kept unchanged |
| **6** | I + H + `studio-shell` + `timeline-shell` | The heaviest shells; two blocks from one component set |
| **7** | J + `library-shell` + `explore-shell` + `artifact-shell` | Three shells from one family |
| **8** | K + `notebook-shell` + `docs-shell` | Documents and grounding |
| **9** | L (first-run) applied across everything shipped so far | Empty states are retrofitted once, deliberately |
| **10** | M + `settings-shell` | Plan management UI; the states already exist from Wave 4 |
| **11** | N4–N6 (observability) + `records-shell` | Team-facing surfaces |
| **12** | `auth-shell`, if kept | Pending the open question below |

**Departure from the approved spec:** it sequences Flow Kit first (waves 2–4). This proposal puts
home and chat first because they need the fewest new primitives and yield a demonstrable, installable
page soonest; Flow moves to Wave 5. Both orderings are defensible — see open question Q3.

---

## 6. Open questions

These need a decision before implementation starts.

### Q1 · Promote this over §5 of the approved spec? — RESOLVED

The catalog here replaces §5 and §11 of
[the design spec](../superpowers/specs/2026-06-10-super-ai-components-design.md). Options: promote it,
revise it first, or keep both and reconcile later.

**Recommendation:** promote. Keeping two catalogs guarantees they diverge.

**Resolved 2026-08-02 (D10):** promoted. §5 and §11 are marked superseded and retained as records.

### Q2 · All 14 shells, or a defensible 6?

Fourteen blocks is the most work in the catalog and the strongest differentiator. A defensible
subset is six: `home-shell`, `chat-shell`, `studio-shell`, `flow-shell`, `library-shell`,
`settings-shell`.

**No recommendation** — this is a scope call, not a design call.

**Post-D9:** `flow-shell` is cut, so the choice is now thirteen blocks vs five: `home-shell`,
`chat-shell`, `studio-shell`, `library-shell`, `settings-shell`.

**Resolved 2026-08-02 (D12): all thirteen ship.** Nick's call. Blocks are the strongest
differentiator and full archetype coverage is the point of the catalog.

### Q3 · Build order — home-first or flow-first?

The proposal above is home-first. The approved spec argues flow-first because Flow Builder exists as
a reference implementation to lift from, which is a real de-risking argument.

**Recommendation:** home-first, because Wave 2 then produces something installable and demonstrable
with almost no new primitives. But flow-first is a legitimate choice if momentum from an existing
implementation matters more.

**Resolved by D9 (2026-07-31):** the node builder is cut — home-first by elimination.

### Q4 · Does `auth-shell` belong in this registry? — RESOLVED

It is the one archetype with no AI content at all. UI-only is consistent with the non-goals, but a
sign-in screen is not what anyone installs an AI component registry for.

**Recommendation:** cut it. It costs catalog credibility more than it adds.

**Resolved 2026-08-02 (D12): kept.** Follows from the Q2 answer — all thirteen blocks ship, and
O14 is one of them. The recommendation above is overridden, not withdrawn: if block scope is ever
revisited, `auth-shell` is the first candidate to drop.

### Q5 · Is `preview-tile` one primitive or two? — RESOLVED

Does one API genuinely cover image, video, colour swatch, text excerpt and 3D model content?
Prototype before Wave 1 commits to it.

**Resolved 2026-08-02 (D11):** one primitive. The content types that argued for a second belong to
components that are not consumers.

### Q6 · Board sections with no coverage

`Presentation Apps` and `Text Editor` are empty sections on the reference board. This work assumes
they are covered by `studio-shell` + the K family. Confirm, or collect references.
