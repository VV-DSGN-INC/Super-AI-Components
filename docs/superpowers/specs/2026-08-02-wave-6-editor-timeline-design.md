# Wave 6 — editor surfaces, timeline & the two studio blocks — Design Specification

**Date:** 2026-08-02
**Status:** Proposed — awaiting approval
**Wave:** 6 (`I` + `H` + O3 `studio-shell` + O4 `timeline-shell`)
**Covers:** I1–I5 · H1–H7 · O3 · O4 — 14 items

| | |
| --- | --- |
| Scope | 12 components, 2 blocks. The heaviest shells in the catalog and the first wave to ship two blocks from one component set. |
| Registry | `super-ai` namespace, `registry/super-ai/*.tsx` |
| Depends on shipped | A6 `field-row` · A8 `preview-tile` · A11 `reset-affordance` · A12 `section-header` |
| Blocked on unshipped | B4 · B7 (Wave 2) · E4 · F1 · F6 (Wave 4) — see §4.4 |
| Testing | One co-located `*.test.tsx` per item, per repo convention |

---

## 1. Consumer and dependency audit

Method fixed by **D13**: *"The table in [concept-model.md](../../design-system/concept-model.md) is a
derived summary, not a source of truth. The per-component entries in
[component-specs.md](../../design-system/component-specs.md) are authoritative."* Every claim below
was checked against the component's own entry, and every shipped primitive was read in
`apps/docs/registry/super-ai/`.

### 1.1 Declared dependencies of the twelve Wave 6 components

| # | Component | Declares (component-specs.md) | Catalog "shadcn base" column | Agree? |
| --- | --- | --- | --- | --- |
| I1 | `tool-panel` | **"Built on: A12, A8"** | `A12, A8` | ✅ |
| I2 | `property-inspector` | **"Built on: A6, A11"** | `A6, A11` | ✅ |
| I3 | `context-toolbar` | Base: Toolbar | `Toolbar` | ✅ |
| I4 | `ai-tools-menu` | **"Built on: A9"** | `A9` | ✅ |
| I5 | `drawing-tools` | Base: Toggle-group, Popover; *"Size, hardness and opacity are A6 instances"* | `Toggle-group, Popover` | ⚠️ A6 undeclared in the catalog row |
| H1 | `transport-controls` | Base: Button-group | `Button-group` | ✅ |
| H2 | `time-ruler` | Base: Slider (heavily extended) | `Slider (heavily extended)` | ✅ |
| H3 | `track-lane` | *(no base declared)* | `—` | ✅ |
| H4 | `transcript-editor` | *(no base declared)* | `—` | ✅ |
| H5 | `frame-strip` | **"Built on: A8"** | `built on A8` | ✅ |
| H6 | `waveform-editor` | **NO ENTRY EXISTS** | `—` | ❌ §1.2 |
| H7 | `stem-mixer` | **NO ENTRY EXISTS** | `Slider, Progress` | ❌ §1.2 |

### 1.2 CRITICAL — the eight D12 restorations were never written into the authoritative doc

`component-specs.md` contains **no entry for H6 `waveform-editor` or H7 `stem-mixer`**. Nor for the
other six restorations: E9, E10, J7, M7, N7, N8. Grepping the whole file for `H6|H7|waveform|
stem-mixer|E9|E10|J7|M7|N7|N8` returns exactly one hit — the word "waveform" inside H3's list of
lane types.

D12 recorded the restorations as done:

> **gaps.md §6 — all eight restorations are actioned (+8 items).** — decisions.md:128

and gaps.md agrees:

> Moves 1 and 2 are done: R1 and R3–R7 are restored… **All eight are now in
> [catalog.md](catalog.md)** — gaps.md:6–8

Both statements are true and both are incomplete: the restorations landed in `catalog.md` (a summary
table) and never in `component-specs.md` (the source of truth D13 designates). **Two of the twelve
components in this wave have no authoritative requirements.** The only requirement text for H6/H7 is
gaps.md §2 rows R3/R4 — a document whose own header reads `**Status:** Analysis`.

This is the same failure mode as D13, one layer up: D13 found that the *derived* table drifts from
the source of truth; this finds that the source of truth was never updated at all, so for these
eight items the derived table is the *only* record.

**Consequence for this spec:** H6 and H7 below are designed from gaps.md §2 and from the H3/H2
boundaries their restoration rationale names. They should be written back into `component-specs.md`
as entries before implementation starts (§7). I am flagging this rather than treating gaps.md as
authoritative by fiat.

### 1.3 A fourth wrong fan-out row — A6, which D13 did not check

D13 audited A9–A12 and found three of four rows wrong. It did not check A6, A2 or A7. Checking A6
now, because I2 is its consumer:

`concept-model.md:47` — **A6 field-row** | E3 parameter-panel · I2 property-inspector · G9 node-inspector · M1 settings-dialog · E1 generation-panel

| Claimed | Its own entry says | Verdict |
| --- | --- | --- |
| E3 `parameter-panel` | *"Rows are A6, so this and I2 align to the same column grid."* | ✅ |
| I2 `property-inspector` | **"Built on: A6, A11"** | ✅ |
| G9 `node-inspector` | listed as `A6, Collapsible` — **cut by D9** | ❌ |
| M1 `settings-dialog` | *"Rows are label + description + control"* — never names A6 | ❓ undeclared |
| E1 `generation-panel` | Base: Card, Collapsible — never names A6 | ❓ undeclared |

**Corrected: 2 confirmed, 1 cut component still listed, 2 unstated.** The identical D9-never-
propagated error D13 recorded against A10 is also present in A6 — and in **A2** (lists G6 `model-bar`)
and **A7** (lists G6 `model-bar`). Three rows still name components cut on 2026-07-31.

Running total: **every primitive fan-out row anyone has checked has been wrong — now seven of seven**
(A6, A8, A9, A10, A11, A12, plus A2/A7 carrying cut components).

### 1.4 CRITICAL — do the shipped A6/A8/A11/A12 satisfy I1 and I2?

Read from source: `field-row.tsx`, `preview-tile.tsx`, `reset-affordance.tsx`, `section-header.tsx`.

| # | Primitive | Required by | Satisfied? | Finding |
| --- | --- | --- | --- | --- |
| 1 | A6 `field-row` | I2, I5, E3 | **NO** | The reset slot is not a column. §1.4.1 |
| 2 | A6 `field-row` | I2 (`xy-pair`) | **NO** | One `htmlFor` per row cannot label two inputs. §1.4.2 |
| 3 | A12 `section-header` | I2 (group reset) | **NO** | Only trailing slot is documented *and tested* as "a link, never a button". §1.4.3 |
| 4 | A11 `reset-affordance` | I2 (collapsed group) | **PARTIAL** | The modified-dot is `aria-hidden` — the signal it exists to give is invisible to AT. §1.4.4 |
| 5 | A12 `section-header` | I1, I2 (persisted collapse) | **YES, with a coupling** | §1.4.5 |
| 6 | A8 `preview-tile` | I1, H5 | **YES** | §1.4.6 |

#### 1.4.1 A6 shipped the reset *prop* but not the reset *column*

A6's own entry states the contract:

> Label · control · unit · reset are four slots on one grid, **so every inspector in the system aligns
> to the same columns.** — component-specs.md:72

E3 restates it as a cross-component invariant:

> Rows are A6, **so this and I2 align to the same column grid.** — component-specs.md:378

The shipped component has **two** grid tracks, and puts reset inside the control cell:

```tsx
<div className="grid grid-cols-[6rem_1fr] items-center gap-3">
  <label …>{label}</label>
  <div data-slot="field-row-control" className="flex items-center gap-2">
    {children(id, hintId)}
    {reset ? <span data-slot="field-row-reset">{reset}</span> : null}
  </div>
</div>
```

`field-row-control` is `flex … gap-2`, so the reset glyph sits immediately to the right of whatever
control the caller rendered. A slider, a select, a switch and a colour swatch have different widths,
so **a stack of A6 rows produces a ragged column of ↺ glyphs.** I2 is the component whose entire
justification is that alignment — I2's spec says *"row-level reset at the end of each A6 row"*, and
"the end of the row" is precisely what the shipped layout does not give.

This is the A11 audit's finding recurring in a subtler form. D13 recorded:

> **A6 `field-row` shipped in Wave 0 without the reset slot its own spec requires.** Fixed
> additively: `field-row` gains an optional `reset` prop — decisions.md:173–175

The prop landed. The grid did not.

**Fix (additive, Wave 6 step 1):** `grid-cols-[6rem_1fr_auto]`, reset rendered as a third grid child
rather than nested in the control cell. When `reset` is undefined the row has two children in a
three-track grid, an `auto` track with no content is zero-width, and no gap is emitted — **output is
byte-identical to today for every existing caller.** The same safety argument D13 used applies:
shadcn registries copy code, so only new installs see it.

#### 1.4.2 A6 cannot express `xy-pair` accessibly

A6's declared control set is `slider+unit · select · toggle · colour · **xy-pair**`
(component-specs.md:69). The shipped render-prop hands the caller **one** id:

```tsx
children: (controlId: string, describedBy?: string) => React.ReactNode;
```

and binds it with `<label htmlFor={id}>`. An x/y pair is two inputs; `htmlFor` can only point at one,
so the second input is unlabelled. Position and scale rows are the canonical inspector rows in Canva,
Spline, CapCut and Tripo — the four products I2's evidence line names.

**Fix (additive):** an optional `labelAs?: "control" | "group"` prop. `"control"` (default) is
today's `<label htmlFor>`; `"group"` renders the label as a `<span id>` and the row as
`role="group" aria-labelledby`, letting the caller label each sub-input. Default behaviour unchanged.

This is a gap in A6 against **A6's own spec**, not against I2's wish list. It is reported here rather
than fixed silently because it changes the accessible tree for one variant.

#### 1.4.3 A12 has no slot a group-level reset can legally occupy

A11's contract:

> Group-level reset **sits on the section header** and clears every row beneath it — same component,
> larger scope. — component-specs.md:132–133

I2's contract:

> **Group-level reset on the section header**; row-level reset at the end of each A6 row.
> — component-specs.md:672

A12 shipped with exactly one trailing slot, `action`, and both its doc comment and its test assert
that slot is a link:

```tsx
/** "View all" — a link, never a button. It navigates, it does not act. */
action?: React.ReactNode;
```

```tsx
it("renders the action as a link, never a button", () => {
  render(<SectionHeader title="Recent" action={<a href="/all">View all</a>} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();   // section-header.test.tsx:11
});
```

A11 at `scope="group"` renders a `<button>`. So passing the group reset through `action` violates
A12's stated rule, and the blanket `queryByRole("button")` assertion encodes that rule as a test.
**A12 and A11 contradict each other as shipped**, and the contradiction was invisible in Wave 1
because I2 did not exist — the Wave 1 spec explicitly deferred it:

> **Non-goals** — Retrofitting A11 into I2 `property-inspector`: I2 is a Wave 6 component and does
> not exist yet. — wave-1-primitives-design.md:208

Wave 6 is where that bill comes due.

**Fix (additive):** A12 gains `controls?: React.ReactNode`, rendered before `action`, semantically
"things that act on this section" as opposed to `action`, "the link that navigates away". A12's test
narrows from *no button anywhere* to *the `section-header-action` slot contains no button* — the rule
it actually meant. Existing callers pass no `controls` and render identically.

#### 1.4.4 The modified-dot is announced to nobody

A11's rationale for the collapsed variant:

> On a collapsed group it degrades to a modified-dot, **so a hidden section still signals changes.**
> — component-specs.md:134

Shipped:

```tsx
<span data-slot="reset-affordance-dot" data-state={state} aria-hidden="true" … />
```

For a sighted user the dot works. For a screen-reader user the collapsed section signals nothing at
all — which is the exact user for whom a collapsed section is hardest to discover. Not a blocker for
I2's visual design, but it defeats the stated purpose for one class of user.

**Fix (additive):** drop `aria-hidden` and render an `sr-only` string derived from `label`
(e.g. *"Position — modified"*). Visual output unchanged.

#### 1.4.5 A12 satisfies I1 and I2, at the cost of a controlled-mode coupling

I2 requires *"Sections remember collapsed state per element type"* (component-specs.md:673). A12's
uncontrolled state is component-local and keyed to nothing, so it cannot survive an element-type
switch that remounts the section list. I2 must therefore drive **every** A12 in controlled mode from
a `Record<elementType, Record<sectionId, boolean>>` it owns.

That is not a primitive defect — A12's `open`/`onOpenChange` pair exists for this — but it has a
second consequence worth stating: the collapsed modified-dot (§1.4.4) can only be rendered by a
caller that knows whether the section is open. **Controlled mode is not optional for I2.** The same
applies to I1, which must know `open` to honour *"Infinite section lists must lazy-render"* — A12
renders the header only (*"the panel below is a slot it knows nothing about"*), so the decision not
to render a closed panel belongs to I1.

#### 1.4.6 A8 satisfies I1 and H5 as shipped — no retrofit needed

I1 needs a labelled, selectable, ringed tile in a grid; H5 needs `labelPlacement="none"`, a ring, and
stable geometry while reordering. A8 provides `aspect`, `label`/`labelPlacement`, `badge`, `state`,
`selected`, `onSelect`, `action`, ring-not-border selection, and frame geometry invariant across all
four states. Both consumers are covered.

One note, not a gap: A8 spreads `...props` onto the **outer wrapper**, not the frame. H5's reorder
therefore attaches `draggable`/`onDragStart` to the wrapper, which is correct — a drag handle on a
`<button>` fights the button's own activation. No change required.

### 1.5 Other drift found while auditing

| Location | Problem |
| --- | --- |
| `concept-model.md:12,18` | "84 components" / "L3 Components · 84" — the catalog is at 82 since D9+D12 |
| `concept-model.md:14` | "L4 Blocks · 14" — 13 since D9 cut O5 |
| `concept-model.md:103` | "makes 95 components feel like one library" — a third, different count |
| `concept-model.md:47,48,49` | A6, A2 and A7 rows all still list D9-cut G items (G9, G6, G6) |
| `catalog.md:139` | I1's "shadcn base" column reads `A12, A8` — primitives, not a shadcn base. Cosmetic, but it is why the column disagrees with I5's row |
| `catalog.md:143` | I5's base column omits A6 though its entry says *"Size, hardness and opacity are A6 instances"* |
| design spec §6 | *"Compound components: `ThreadList.Root`, `ThreadList.Item`"* — the shipped idiom is flat prefixed named exports (`ThreadList`, `ThreadListItem`, `ThreadListSection`). Every Wave 6 component is multi-part; **the shipped idiom wins**, but the spec line is stale and will keep misleading |
| `apps/docs/lib/catalog.ts` | `group: "Primitives" \| "Components"` — no `"Blocks"` member |
| `apps/docs/scripts/gen-registry.mts` | `file()` hardcodes `type: "registry:component"` and one file per item. No `registry:block` support, no multi-file items. O3/O4 cannot be published without extending it |

The last two are inherited, not caused by Wave 6 — `home-shell` in Wave 2 hits them first — but Wave
6 is the first wave that ships **two** blocks, and the second is a preset over the first (§2), which
is the case that actually needs multi-file/registry-dependency support in the generator.

---

## 2. Is `timeline-shell` a variant of `studio-shell`, or a separate block?

The standing claim, asserted in two places:

> **S3 and S4 are one shell with a variant**, not two. The difference is whether the bottom dock is a
> page strip or a time ruler. — reference-board-analysis.md:74–75

> Same five regions as O3, but the bottom dock is a time ruler with tracks instead of a page strip.
> **One shell, one variant flag.** — block-specs.md:66–67

### 2.1 Verification — the claim holds in kind, but not as written

Region-by-region, from block-specs.md:45 and :61:

| O3 region | O4 region | Occupant O3 | Occupant O4 | Same? |
| --- | --- | --- | --- | --- |
| modality rail | rail | B4 | B4 | ✅ identical |
| tool panel | content panel | I1 | I1 | ✅ identical |
| canvas | preview | *(caller)* | *(caller)* | ✅ identical — a slot in both |
| inspector | inspector | I2 | I2 | ✅ identical |
| page strip | tracks + ruler | H5 | H2 + H3 | ⛔ **the one divergence** |
| — | **transport** | — | H1 | ⚠️ a sixth region O3 has no counterpart for |

Three discrepancies against the literal wording:

1. **"Same five regions" is false as counted.** O4's region list has six entries. Transport (H1) has
   no O3 counterpart.
2. **"One variant flag" understates the dock.** The dock has *three* occupants, not two, because
   O4's own text says *"The transcript variant (H4) **replaces the track stack entirely**"*
   (block-specs.md:68). Pages · timeline · transcript. A boolean cannot express three.
3. **O4's fill list omits B7 `app-topbar`**, which O3 lists. Descript and CapCut both have one; this
   reads as an omission in O4's list rather than a real difference. Flagged, not silently corrected.

### 2.2 Verdict: one shell implementation, two registry items

**The claim survives.** Transport is not a peer region — it is the header strip of the dock assembly,
which is why it appears and disappears with the dock rather than independently. Fold it in and the
region count is five in both, four of which are filled by the *same components* (B4, I1, I2, plus a
caller-owned canvas). One region varies. A region whose occupant varies is the definition of a slot,
and providing slots is what a block does.

Justification for not forking:

- **Four of five regions would be duplicated verbatim**, including the resize behaviour, the
  panel/inspector collapse contracts, and the empty-state requirement on the inspector.
- **The rail→panel rule is shared and load-bearing**: *"The rail selects which tool panel is shown.
  It never changes the canvas — that separation is what keeps the shell legible."* (block-specs.md:52).
  A fork gives two places for that rule to drift.
- **The divergent occupants are all L3 components the block does not implement.** Nothing about
  H2+H3 vs H5 reaches above the dock region.

But there is an unresolved bookkeeping contradiction I will not paper over:

> **`catalog.md` counts O3 and O4 as two of the thirteen blocks** (catalog.md:216–217, totals table
> line 250), while `block-specs.md` and `reference-board-analysis.md` say they are one shell. If they
> are one shell, the block count is twelve. **Flagged for the catalog owner — I am not resolving a
> scope number in a design spec.**

The implementation reconciles both readings without deciding it: **one implementation, two registry
items.** `studio-shell.tsx` exports `StudioShell` (with a `dock` discriminant) and `TimelineShell`
(a preset that pins `dock` to `"timeline" | "transcript"` and adds the transport slot). The registry
publishes `studio-shell` and `timeline-shell` as separate installables, `timeline-shell` declaring
`registryDependencies: [self("studio-shell")]`. `npx shadcn add timeline-shell` works because people
install by archetype name; the layout logic exists once.

---

## 3. H2 / H3 / H6 / H7 — how audio and video divide the timeline

D12 restored H6 and H7 on this reasoning:

> **R3 `waveform-editor`** — Collapsed into H3 `track-lane`, which selects whole clips. Region
> selection has no equivalent there, and **H2's ruler tops out at frames rather than samples.**
> — gaps.md:41

> **R4 `stem-mixer`** — **Exclusive-vs-additive solo is a real behavioural decision H3 does not
> model.** Stem lineage back to the source must stay visible. — gaps.md:42

> **The audio family (R3–R6) was the worst of it.** Audio editing genuinely differs from video, and
> the board's own Requirements table E named three of these. I overrode it without saying so. — gaps.md:47–48

The four components divide along **three orthogonal axes**, and each axis is owned by exactly one
component. That is the anti-duplication rule.

### 3.1 The three axes

| Axis | Owner | Never owned by |
| --- | --- | --- |
| **Horizontal coordinate** — time↔pixel, zoom, snapping, playhead, in/out | **H2** (frames/seconds) · **H6** (samples, its own surface) | H3, H7, H4, H5 |
| **Selection granularity** — what a click selects | **H3** = whole clip · **H6** = arbitrary region | H2, H7 |
| **Mix state** — mute/solo policy, volume, pan, metering, lineage | **H7** | H2, H3, H6 |

### 3.2 H2 `time-ruler` — the coordinate authority

H2 is the only component in the timeline that knows `pxPerUnit`. It publishes a **time scale** —
`{ pxPerUnit, offset, toPx, toTime }` — and every other component in the dock receives it as a prop.
H3 renders identically whether the scale came from a video ruler or, hypothetically, anything else.

H2's unit floor is the frame. That is a decision, not a limitation to fix later, and it is precisely
why H6 exists (§3.4).

### 3.3 H3 `track-lane` — one row of clips, positioned by a scale it does not own

H3's atom is a **clip**: an object with an identity, a start and a duration. Selection is
`selectedClipIds: string[]`. Trim adjusts clip boundaries:

> Trim handles appear only on selection and **belong to the clip, not the lane.**
> — component-specs.md:632

H3 has four renderers (filmstrip · waveform · text · adjustment) and one behaviour:

> Track type changes clip rendering but not lane behaviour. **One component, four renderers.**
> — component-specs.md:633

The `waveform` renderer here is a **clip thumbnail** — a static peak drawing sized to the clip's box.
It is not an editor. Confusing the two is exactly the consolidation error D12 reversed.

### 3.4 H6 `waveform-editor` — one buffer, sample resolution, region selection

H6 is not a lane and does not stack. It renders **one** audio buffer across its full width and owns
its own coordinate system, because its unit is the sample and H2's is the frame. Its selection model
is an interval `{ start, end } | null`, not a set of clip ids.

The relationship to H3 is the same one F3 `asset-detail` has to a tile in F2's grid: **the lane is
the index, the editor is the detail surface.** A caller wanting region selection on a clip opens H6
*on that clip*; H3 never grows a region model, and H6 never grows lanes.

**The promotion rule fires here and I am deliberately not obeying it.** `concept-model.md:25` says
*"If two L3 components need the same piece, that piece moves up to L2."* H2 and H6 both need a
time↔pixel mapping. Promoting it would create a 13th primitive — a slot gaps.md §4 already reserves
for U5 `confidence-badge` — and would couple frame-domain and sample-domain zoom policy, which
differ by six orders of magnitude in range. The shared surface is roughly fifteen lines. **Recorded
as a deliberate, named exception to the promotion rule**, revisitable if a third consumer appears.

### 3.5 H7 `stem-mixer` — mix state, and the H3 contradiction it exposes

H7 owns per-stem mute, solo, volume, pan, live meters and lineage. In its minimal form it has **no
time axis at all** — it is the lane gutter blown up into a mixer strip.

But H3's own entry claims the same controls:

> The lane header is a fixed-width gutter with **mute, solo and lock**. It never scrolls
> horizontally. — component-specs.md:631

while gaps.md says H3 does not model solo:

> Exclusive-vs-additive solo is a real behavioural decision **H3 does not model.** — gaps.md:42

**These contradict.** Flagged, and resolved here only as a proposal for the catalog owner to ratify:
the *control* lives in H3's gutter, the *policy* lives in H7. H3 renders `muted`/`soloed`/`locked` as
controlled booleans with `on*Change` callbacks and has **no** opinion about what soloing one lane
does to the others. H7 owns `soloMode: "exclusive" | "additive"` and computes the resulting
per-stem effective state, which a shell feeds back into H3's props. One control, one policy, no
duplication — and H3 stays usable standalone, which is the whole point of D6.

### 3.6 D6 guard — no monolith

> **D6 · `timeline-editor` is a block, not a component.** It is `transport-controls` + `time-ruler` +
> `track-lane` composed. Shipping the parts means a single track lane can be used standalone.
> — decisions.md:40–43

No component in this wave composes H1+H2+H3. The only place they meet is O4's dock region, which is
a block. Each of H1, H2, H3, H6, H7 must render and be testable with no sibling present.

### 3.7 H5 vs the `filmstrip` lane — a boundary worth stating

Both show frames; they are not variants of each other. **H5 `frame-strip` has no time axis** — it is
a row of A8 tiles at fixed aspect with selection, reorder and add, and it is why O3's dock and O4's
dock are different components rather than one. H3's filmstrip positions frames *by time inside a
clip*, at whatever density the scale dictates. Different coordinate models is why H5 is built on A8
and H3 is not.

---

## 4. Build order

### 4.1 Forced by dependencies

| Step | Item | Why here |
| --- | --- | --- |
| **1** | **Primitive retrofits** — A6 reset column + `labelAs`; A12 `controls`; A11 dot a11y | I2 cannot be built correctly without all three (§1.4). All additive; no existing output changes |
| **2** | **H2 `time-ruler`** | Same argument A8 had in Wave 1: its coordinate contract propagates into H3, H4, H1's timecode and O4's dock. Hardest component, earliest slot — committing to the wrong scale shape costs four rewrites |
| **3** | H1 `transport-controls` | Consumes H2's unit/timecode model; cheap; proves the unit model end-to-end before H3 depends on it |
| **4** | H3 `track-lane` | Consumes the scale; defines the clip/EDL type H4 and H7 both key off |
| **5** | H4 `transcript-editor` | Same EDL, different projection — *"both are views of the same edit-decision list"* (block-specs.md:68). After H3 so the type is settled |
| **6** | H7 `stem-mixer` | Needs H3's gutter prop shape settled (step 4, §3.5) |
| **7** | I2 `property-inspector` | After step 1 |
| **8** | O3 `studio-shell` | After I1, I2, I3, I5, H5 |
| **9** | O4 `timeline-shell` | After O3 and H1–H4 |

### 4.2 Parallelisable — no intra-wave dependencies

H5 (A8 only, shipped) · H6 (own coordinate system) · I1 (A12+A8, shipped) · I3 (Toolbar) ·
I4 (A9, shipped) · I5 (Toggle-group + A6 — after step 1 if it uses the reset column, otherwise
immediately).

### 4.3 Why H2 is not last despite being hardest

Deferring it is the tempting order and the wrong one. H3's props, H4's seek behaviour, H1's timecode
formatting and O4's dock layout are all shaped by decisions H2 makes about units, zoom and scroll
ownership. Wave 1 established this ordering rule with A8 and the reasoning transfers verbatim:
commit to the propagating API first.

### 4.4 A sequencing finding: O3 and O4 are gated outside this wave

O3's fill list requires **B4** and **B7** (Wave 2) and **E4** and **F1** (Wave 4). O4 additionally
requires **F6** (Wave 4). The repo currently contains Wave 0 and Wave 1 only. **The twelve components
of Wave 6 can be built now; the two blocks cannot be completed until Waves 2–4 have shipped five
specific components.** Either Wave 6's blocks slip behind Waves 2–4, or the blocks ship with those
five regions as required slots and no bundled demo. Recommend the latter — it is consistent with
"regions are slots" (§5.13) — but it is a scheduling call, not a design one.

---

## 5. APIs

All follow the shipped conventions: `"use client"`, `data-slot` on every part, `cn()` from
`@/lib/utils`, semantic shadcn CSS variables only (the token gate rejects raw hex, `oklch()` and
Tailwind palette classes), **flat prefixed named exports** (not dot-notation — see §1.5), controlled
and uncontrolled modes where state exists, co-located `.test.tsx`, no data fetching.

Where an element is interactive-or-not and a button-only prop such as `disabled` is involved, the
component renders **two explicit branches**, following `entity-row.tsx:69–97`:

> Rendered as two explicit branches rather than a dynamic tag: `disabled` is button-only, so a union
> element type cannot be checked against div props.

### 5.0 The shared shape that lets H2 and H3 agree without importing each other

L3 components may never depend on each other (`concept-model.md:18`). H2 and H3 must nonetheless
share a coordinate system. The mechanism:

```tsx
// Declared independently, structurally identically, in BOTH h2 and h3.
interface TimeScale {
  pxPerUnit: number;              // pixels per `unit`
  offset: number;                 // px of domain scrolled off the left edge
  toPx: (t: number) => number;
  toTime: (px: number) => number;
}
```

TypeScript is structural: an object H2 produces satisfies H3's independently-declared interface with
**no import, no runtime dependency, and no registry dependency.** Installing `track-lane` without
`time-ruler` still typechecks and still works — the shell (or any caller) constructs the scale. This
is the whole reason H3 stays standalone-usable, which is D6's stated purpose.

### 5.1 H2 `time-ruler` — the hard one

**Base decision: custom implementation, ARIA slider semantics retained, shadcn/Radix `Slider` not
used.** The catalog calls it *"Slider (heavily extended)"*; on inspection "extended" is doing more
work than it can bear. Radix Slider owns one continuous domain with a fixed step, renders its own
track/range/thumb, and offers no tick layer, no scroll viewport, and no zoom. H2 needs **three
interacting value domains** (playhead, in, out) over a **zoomable, scrollable viewport** with a
**derived tick layer**. That is outside Radix's model. What is worth keeping is the ARIA contract:
each draggable value is a `role="slider"` with `aria-valuemin/max/now` and an `aria-valuetext`
carrying a human timecode.

```tsx
type TimeUnit = "seconds" | "frames";

interface TimeRulerProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  // --- domain ---
  duration: number;                     // domain end, expressed in `unit`
  unit?: TimeUnit;                      // default "seconds"
  fps?: number;                         // required when unit === "frames"; also drives timecode
  formatLabel?: (t: number) => string;  // default: timecode derived from unit + fps

  // --- viewport: zoom and scroll are the caller's, so lanes stay in lockstep ---
  pxPerUnit?: number;                   // controlled
  defaultPxPerUnit?: number;
  onPxPerUnitChange?: (px: number) => void;
  offset?: number;                      // px scrolled; controlled
  onOffsetChange?: (px: number) => void;
  minPxPerUnit?: number;
  maxPxPerUnit?: number;

  // --- playhead ---
  playhead: number;                     // always controlled — H2 owns no clock
  onPlayheadChange?: (t: number) => void;      // fires continuously during a scrub
  onScrubStart?: () => void;
  onScrubEnd?: (t: number) => void;

  // --- in / out ---
  inPoint?: number | null;
  outPoint?: number | null;
  onRangeChange?: (r: { in: number | null; out: number | null }) => void;

  // --- snapping ---
  snapTargets?: number[];                       // clip edges, markers, playhead
  snapResolver?: (t: number) => number;         // wins over snapTargets when given
  snapThreshold?: number;                       // px, default 8

  disabled?: boolean;
}

// Emitted for consumers of the coordinate system (see §5.0).
function timeScaleFrom(props: { pxPerUnit: number; offset: number }): TimeScale;

export { TimeRuler, timeScaleFrom };
export type { TimeRulerProps, TimeScale, TimeUnit };
```

**Interaction model**

| Gesture | Behaviour |
| --- | --- |
| Click on the ruler body | Seek. Playhead jumps to `toTime(clientX)`, snapped |
| Press-drag | Continuous scrub under pointer capture; `onPlayheadChange` fires per frame, `onScrubEnd` once |
| `alt`-drag | Bypasses snapping — the standard NLE escape hatch, and cheap |
| Drag an in/out handle | Moves that bound only. Handles are a **separate layer above the playhead** (component-specs.md:624) and never trade z-order with it |
| Plain wheel / trackpad-x | Scrolls the viewport (`onOffsetChange`) |
| `ctrl`/`⌘` + wheel | Zooms **about the pointer**, not about the viewport's left edge. Load-bearing: anchoring zoom to the edge makes precise work impossible, and it is the single detail that separates a usable ruler from a demo |
| `←` / `→` | Step one unit (one frame when `unit === "frames"`) |
| `shift` + `←`/`→` | Step ten |
| `Home` / `End` | Domain bounds |
| `i` / `o` | Set in / out at the playhead — only when the ruler has focus |

**Coordinate and units model**

- The domain is a number line in **one declared unit**. `seconds` is the default; `frames` requires
  `fps` and makes every step integral.
- `pxPerUnit` is the single zoom quantity. **Tick density is derived from it, never passed in**:
  *"Tick density is derived from zoom. Labels thin out rather than overlapping."*
  (component-specs.md:622). H2 picks the coarsest tick interval from a fixed 1-2-5 ladder whose
  spacing exceeds a minimum label width, then draws two subordinate levels unlabelled.
- **Zoom and scroll are controlled by the caller.** H2 proposes changes; it does not own them. This
  is not ceremony — the dock has N lanes plus a ruler that must scroll as one surface, and a ruler
  that owned its own offset would desynchronise on the first lane-driven scroll.
- **H2 owns no clock.** `playhead` is always controlled. A ruler with an internal timer fights the
  media element that actually knows the time.
- **The playhead spans every track, not just the ruler** (component-specs.md:623). H2 renders its own
  head and reports position; the *stem* across the lanes is drawn by the dock from the same value.
  H2 cannot render into a sibling's box, and pretending otherwise would make it a layout component.
- Only ticks intersecting the visible viewport are rendered. At 4 hours and 60fps a naive render is
  ~864 000 nodes.

**Genuinely out of scope**

- **Sample resolution.** The floor is the frame. gaps.md:41 records this as the reason H6 exists.
- **Bars, beats and time signatures.** A musical grid is a different tick derivation entirely, and
  **nothing in the catalog records this gap** — gaps.md R5 names BPM and key as music *library*
  facets but never the matching timeline requirement. **New gap; recorded in §7.**
- Playback, transport and media elements — H1 and the caller.
- Clips, thumbnails, waveforms, lane rendering — H3.
- Markers and chapters as first-class objects. `snapTargets` is where they would feed in when they
  exist.
- Multiple or remote playheads (collaboration — gaps.md §5).
- Canvas/WebGL rendering. DOM ticks with viewport culling; if that proves insufficient it is a
  contained internal change, not an API one.
- Vertical scroll. The lane stack scrolls vertically; the ruler is pinned.

### 5.2 H1 `transport-controls`

```tsx
interface TransportControlsProps extends React.ComponentProps<"div"> {
  variant?: "simple" | "frame-accurate";     // frame-accurate adds timecode, frame step, in/out
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  current: number;
  duration: number;
  unit?: TimeUnit;
  fps?: number;
  onSeek?: (t: number) => void;              // typing a timecode seeks
  speed?: number;
  speeds?: number[];
  onSpeedChange?: (s: number) => void;
  inPoint?: number | null;
  outPoint?: number | null;
  onSetIn?: () => void;
  onSetOut?: () => void;
  disabled?: boolean;
}
```

*"Two variants, one component… **button order is unchanged**"* (component-specs.md:612) — the
frame-accurate controls are appended, never interleaved. *"Elapsed/total is text and editable —
typing a timecode should seek."* *"Every control has a keyboard equivalent. Transport without
keyboard is preview, not editing."*

### 5.3 H3 `track-lane`

```tsx
type TrackType = "filmstrip" | "waveform" | "text" | "adjustment";

interface Clip { id: string; start: number; duration: number; label?: React.ReactNode }

interface TrackLaneProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  type: TrackType;
  scale: TimeScale;                       // structural; no import of H2 (§5.0)
  clips: Clip[];
  renderClip?: (clip: Clip) => React.ReactNode;   // the four renderers are content, not behaviour

  // gutter — fixed width, never scrolls horizontally
  title: React.ReactNode;
  muted?: boolean;   onMutedChange?: (v: boolean) => void;
  soloed?: boolean;  onSoloedChange?: (v: boolean) => void;   // NO policy — see §3.5
  locked?: boolean;  onLockedChange?: (v: boolean) => void;

  selectedClipIds?: string[];             // whole-clip granularity, never a region
  onSelectClips?: (ids: string[]) => void;
  onTrimClip?: (id: string, next: { start: number; duration: number }) => void;
  height?: number;
}

export { TrackLane, TrackLaneGutter };
```

`soloed` is a boolean with a callback and no cross-lane effect. Whether soloing one lane mutes the
others is H7's decision (§3.5). Trim handles render only for clips in `selectedClipIds`, and only
when `locked` is false.

### 5.4 H4 `transcript-editor`

```tsx
interface TranscriptWord { id: string; text: string; start: number; end: number; speakerId?: string; deleted?: boolean }
interface Speaker { id: string; name: string; color?: string }

interface TranscriptEditorProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  words: TranscriptWord[];
  speakers?: Speaker[];
  playhead?: number;                       // highlights the current word
  selectedWordIds?: string[];
  onSelectWords?: (ids: string[]) => void;
  onDeleteWords?: (ids: string[]) => void;     // marks deleted; does not remove
  onRestoreWords?: (ids: string[]) => void;
  onRenameSpeaker?: (id: string, name: string) => void;
  onSeek?: (t: number) => void;                // clicking a word seeks
  media?: (word: TranscriptWord) => React.ReactNode;   // inline media chips
  readOnly?: boolean;
}
```

*"Deleted words are struck through before removal, so a destructive edit is visible and reversible."*
`deleted` is therefore a **flag on the word**, never a splice — `onDeleteWords` marks, `onRestoreWords`
unmarks, and the caller decides when a commit removes them. *"Speaker labels are editable and drive
diarisation corrections."*

### 5.5 H5 `frame-strip`

```tsx
interface FrameStripItem { id: string; label?: React.ReactNode; thumbnail?: React.ReactNode; badge?: React.ReactNode }

interface FrameStripProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items: FrameStripItem[];
  activeId?: string | null;
  onActivate?: (id: string) => void;
  selectable?: "single" | "multiple" | "in-out";     // in-out feeds D2 (first/last frame)
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  range?: { in: string | null; out: string | null };
  onRangeChange?: (r: { in: string | null; out: string | null }) => void;
  reorderable?: boolean;
  onReorder?: (from: number, to: number) => void;
  onAdd?: () => void;
  aspect?: "square" | "video" | "portrait" | "wide";   // passed to A8
}
```

Built on A8 with `labelPlacement="none"` by default. *"Active item is ringed, not bordered, so the
strip does not shift when selection moves"* — inherited from A8's ring, not reimplemented.
*"The in/out variant feeds D2 — picking first and last frames is how image→video conditioning is set."*

### 5.6 H6 `waveform-editor`

```tsx
interface WaveformRegion { start: number; end: number }        // in samples

interface WaveformEditorProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  peaks: Float32Array | number[];        // pre-computed min/max peaks; H6 never decodes audio
  sampleRate: number;
  length: number;                        // total samples
  samplesPerPx?: number;                 // controlled zoom; floor is 1 (sample resolution)
  defaultSamplesPerPx?: number;
  onSamplesPerPxChange?: (v: number) => void;
  offset?: number;                       // px scrolled
  onOffsetChange?: (px: number) => void;
  playhead?: number;                     // samples
  onPlayheadChange?: (s: number) => void;
  region?: WaveformRegion | null;        // arbitrary interval — never a clip id
  onRegionChange?: (r: WaveformRegion | null) => void;
  regionActions?: React.ReactNode;       // trim · silence · fade · normalise — supplied by the caller
  snapToZeroCrossing?: boolean;
  disabled?: boolean;
}
```

**H6 never decodes audio.** `peaks` are pre-computed by the caller: decoding is I/O, the design spec
forbids data fetching inside components, and peak generation for a 60-minute file belongs in a worker.
`samplesPerPx` bottoming out at 1 is the literal expression of *"zoom to sample"*, and is the reason
H6 cannot reuse H2 (§3.4). `snapToZeroCrossing` is the audio analogue of frame snapping — cutting off
a zero crossing is what produces clicks.

### 5.7 H7 `stem-mixer`

```tsx
interface Stem {
  id: string;
  name: string;
  lineage?: React.ReactNode;             // "separated from mix.wav" — must stay visible
  volume: number;                        // 0..1
  pan: number;                           // -1..1
  muted: boolean;
  soloed: boolean;
}

interface StemMixerProps extends React.ComponentProps<"div"> {
  stems: Stem[];
  soloMode?: "exclusive" | "additive";   // default "additive". THE behavioural decision (gaps.md:42)
  onStemChange?: (id: string, patch: Partial<Stem>) => void;
  levels?: Record<string, number>;       // live meter values, 0..1; caller-driven from an analyser
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
}

// The policy H3 deliberately does not own (§3.5).
function effectiveMuted(stems: Stem[], soloMode: "exclusive" | "additive"): Record<string, boolean>;

export { StemMixer, StemMixerStrip, effectiveMuted };
```

`effectiveMuted` is exported because the shell needs to push the result into H3's `muted` props.
Under `additive`, any soloed stem mutes every non-soloed stem; under `exclusive`, soloing one stem
clears every other solo first. Meters are caller-driven — H7 owns no `AudioContext`.

### 5.8 I1 `tool-panel`

```tsx
interface ToolPanelSection {
  id: string;
  title: React.ReactNode;
  count?: number;
  action?: React.ReactNode;              // "See all" — a LINK, per A12
  items: React.ReactNode;                // usually A8 tiles
  defaultOpen?: boolean;
}

interface ToolPanelProps extends React.ComponentProps<"div"> {
  tabs?: { id: string; label: React.ReactNode }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  sections: ToolPanelSection[];
  openSections?: Record<string, boolean>;        // CONTROLLED — required for lazy render (§1.4.5)
  onOpenSectionsChange?: (next: Record<string, boolean>) => void;
  prompt?: React.ReactNode;              // the docked prompt box — what makes it a modality panel
  empty?: React.ReactNode;
}
```

*"The docked prompt box is what makes it a modality panel rather than an asset browser"* — so
`prompt` is a first-class region, not a footer slot. *"Infinite section lists must lazy-render"*:
a closed section renders its header only, and an open section's `items` are mounted on first open
and kept thereafter. I1 is *"almost entirely composition, which is why it is cheap to build."*

### 5.9 I2 `property-inspector`

```tsx
interface InspectorSection {
  id: string;
  title: React.ReactNode;
  rows: React.ReactNode;                 // A6 field-rows
  resetState?: "modified" | "default" | "keyframed";   // drives the A11 group affordance
  onResetGroup?: () => void;
}

interface PropertyInspectorProps extends React.ComponentProps<"div"> {
  elementType: string | null;            // null → empty state. The most common state.
  sections: InspectorSection[];
  openSections?: Record<string, boolean>;
  onOpenSectionsChange?: (next: Record<string, boolean>) => void;
  empty?: React.ReactNode;
}
```

Three rules, all from I2's own entry:

- *"Content is selection-driven: one variant per element type, plus an empty state."* `elementType`
  is a plain string, not a union — element taxonomies are app-specific, and a closed union would make
  the component un-installable in any app whose objects differ from ours.
- *"Group-level reset on the section header"* → A11 at `scope="group"` in A12's **new `controls`
  slot** (§1.4.3), degrading to the modified-dot when that section is closed.
- *"Sections remember collapsed state per element type"* → I2 keys its disclosure map by
  `elementType`, which is why A12 must run controlled (§1.4.5).

### 5.10 I3 `context-toolbar`

```tsx
interface ContextToolbarProps extends React.ComponentProps<"div"> {
  anchor: DOMRect | null;                // selection bounds; null hides the toolbar
  boundary?: DOMRect;                    // viewport/canvas bounds for flip logic
  aiAction: React.ReactNode;             // ALWAYS first, and always opens I4
  actions: React.ReactNode[];            // 6–8 max before overflow
  overflow?: React.ReactNode;
  side?: "auto" | "top" | "bottom";      // default "auto"
  offset?: number;
}
```

*"Six to eight actions maximum. Past that it competes with the inspector."* — enforced by collapsing
the tail into `overflow`, not by a runtime error. *"The AI entry is always first and always opens
I4"* — hence a dedicated `aiAction` prop rather than position 0 of `actions`, so the rule survives a
caller reordering the array. *"Flips above or below the selection to stay in the viewport, and never
covers the selection."*

### 5.11 I4 `ai-tools-menu`

```tsx
interface AiToolGroup { id: string; label?: React.ReactNode; separated?: boolean; tools: AiTool[] }
interface AiTool {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  cost?: React.ReactNode;                // A2 cost-chip, rendered into A9's trailing slot
  disabled?: boolean;
}

interface AiToolsMenuProps extends React.ComponentProps<"div"> {
  groups: AiToolGroup[];
  onSelectTool: (id: string) => void;
  selectionLabel?: React.ReactNode;      // "3 objects" — the selection IS the prompt context
  empty?: React.ReactNode;
}
```

Rows are A9 with `trailing={cost}`. *"Grouped by intent, with expensive or destructive options below
a rule"* → `separated: true` draws that rule.

### 5.12 I5 `drawing-tools`

```tsx
type DrawingTool = "select" | "brush" | "eraser" | "shape" | "text" | "mask";

interface DrawingToolsProps extends React.ComponentProps<"div"> {
  tool: DrawingTool;
  onToolChange: (t: DrawingTool) => void;
  shapes?: { id: string; icon: React.ReactNode; label: string }[];
  activeShape?: string;
  onShapeChange?: (id: string) => void;
  size?: number;      onSizeChange?: (v: number) => void;        // A6 rows
  hardness?: number;  onHardnessChange?: (v: number) => void;
  opacity?: number;   onOpacityChange?: (v: number) => void;
  swatches?: string[];                   // caller-supplied CSS custom-property references
  color?: string;     onColorChange?: (c: string) => void;
  maskMode?: boolean; onMaskModeChange?: (v: boolean) => void;
  orientation?: "vertical" | "horizontal";
}
```

*"Rails are toggle-groups with flyouts, not nested menus. Switching tool is never more than one click
deep."* *"Size, hardness and opacity are A6 instances, so brush controls and the inspector share one
grid"* — which is a second consumer of the §1.4.1 column fix. **Token-gate note:** `swatches` and
`color` carry user document colours, not theme colours. They are runtime `style` values supplied by
the caller and must never be emitted as class names, or the check would either fail or be defeated.

### 5.13 O3 `studio-shell` — region contract

```tsx
type StudioDock = "pages" | "timeline" | "transcript" | "none";

interface StudioShellProps extends React.ComponentProps<"div"> {
  rail: React.ReactNode;                 // B4 modality-rail — invariant
  topbar?: React.ReactNode;              // B7 app-topbar
  panel?: React.ReactNode;               // I1 tool-panel — selected BY the rail
  canvas: React.ReactNode;               // the only required region
  overlay?: React.ReactNode;             // I3 context-toolbar / I5 drawing-tools, positioned over canvas
  inspector?: React.ReactNode;           // I2 — MUST render its own empty state
  dock?: React.ReactNode;                // H5 | H2+H3 | H4
  dockVariant?: StudioDock;              // default "pages"
  transport?: React.ReactNode;           // H1 — rendered only when dockVariant === "timeline"

  panelOpen?: boolean;      onPanelOpenChange?: (v: boolean) => void;
  inspectorOpen?: boolean;  onInspectorOpenChange?: (v: boolean) => void;
  dockOpen?: boolean;       onDockOpenChange?: (v: boolean) => void;
}
```

Invariants, all from block-specs.md:50–55:

- *"Five regions, fixed positions. Rail and inspector are the invariants; the middle three vary by
  what is being edited."*
- *"The rail selects which tool panel is shown. **It never changes the canvas** — that separation is
  what keeps the shell legible."* The shell therefore has no coupling at all between `rail` and
  `canvas`; both are opaque slots and the caller wires the rail to swap `panel`.
- *"The inspector is selection-driven and must ship an empty state, because 'nothing selected' is
  the most common state."* The shell does not enforce this — I2 does — but the region must remain
  mounted when nothing is selected, or the layout jumps on every deselect.
- **The shell imports no L3 component.** Every region is a slot. This is what makes it installable
  before B4/B7/E4/F1 exist (§4.4).
- Panel and inspector widths use shadcn `Resizable` (L0). Persistence is the caller's.

### 5.14 O4 `timeline-shell` — region contract

```tsx
interface TimelineShellProps extends Omit<StudioShellProps, "dockVariant"> {
  dockVariant?: Extract<StudioDock, "timeline" | "transcript">;   // default "timeline"
}

function TimelineShell(props: TimelineShellProps) { /* StudioShell with the dock pinned */ }
```

Same five regions; the dock carries H2+H3 (or H4) and the transport strip instead of H5's page strip.

- *"The transcript variant (H4) **replaces the track stack entirely** — both are views of the same
  edit-decision list."* So `dockVariant="transcript"` renders `dock` full-height with no transport
  strip above it and no ruler.
- *"Export is staged through F6: a cheap preview render precedes the expensive full export."* F6 is
  not a region — it mounts inside `topbar`'s actions or as a caller-owned dialog. **O4's fill list
  names F6 without saying where it goes**; recorded in §7.
- **O4's fill list omits B7 `app-topbar`** which O3 includes. Treated here as an omission — `topbar`
  is inherited from `StudioShellProps` — and flagged in §7 rather than silently corrected.

---

## 6. Load-bearing test assertions

One co-located test file per item. These are the assertions that protect a stated contract; regression
in any of them means the component no longer does the thing it exists to do.

| Item | Assertions |
| --- | --- |
| **A6 retrofit** | Without `reset`, the rendered DOM is unchanged from today (regression fixture). With `reset`, the affordance is a **direct grid child**, not a descendant of `field-row-control`. Two rows with different control widths place their resets at the same offset. `labelAs="group"` exposes `role="group"` and no `htmlFor`; default still emits `htmlFor` |
| **A12 retrofit** | `controls` renders a button without failing the `action`-is-a-link rule; the narrowed assertion checks only `section-header-action`. No `controls` → no extra node |
| **A11 retrofit** | The collapsed dot exposes an accessible name; visual classes unchanged |
| **H1** | `simple` and `frame-accurate` render the shared controls **in the same order**; typing a timecode calls `onSeek` with the parsed value; every control is reachable and operable by keyboard |
| **H2** | `toTime(toPx(t)) === t` across zoom levels (the coordinate round-trip — if this breaks, every lane misdraws). Tick **count** falls as `pxPerUnit` falls and no two labels overlap. Zoom about the pointer keeps the time under the pointer fixed. A scrub emits many `onPlayheadChange` and exactly one `onScrubEnd`. `alt`-drag bypasses snapping. Playhead, in and out each expose `role="slider"` with an `aria-valuetext` timecode. `unit="frames"` produces only integral values |
| **H3** | Clip x/width derive from the passed `scale` — swapping the scale moves clips with **no internal state change**. Selection is whole-clip: no API can express a sub-clip range. Trim handles appear only for selected clips and never when `locked`. `onSoloedChange` fires and **nothing else in the lane changes** (no cross-lane policy). The gutter does not translate when the clip area scrolls horizontally |
| **H4** | Deleting words marks `deleted` and keeps them mounted with strikethrough; restore reverses it. Clicking a word calls `onSeek` with that word's `start`. `playhead` highlights exactly one word. Speaker rename commits and fires once |
| **H5** | Reorder preserves item count and identity. `in-out` mode yields at most one in and one out. Active item adds no layout box (A8's ring inherited). `labelPlacement` default renders no label |
| **H6** | Region selection produces an arbitrary interval, not an item id. `samplesPerPx` reaches 1 (true sample zoom). `snapToZeroCrossing` moves boundaries to a peak sign change. Region actions render only when a region exists. **H6 never calls `decodeAudioData`** — peaks in, drawing out |
| **H7** | `soloMode="exclusive"` — soloing B clears A's solo; `"additive"` — both stay soloed. `effectiveMuted` mutes every non-soloed stem when any stem is soloed, and mutes none when none is. Volume and pan changes emit patches and hold no internal state. Meters render from `levels` with no `AudioContext` constructed |
| **I1** | A closed section renders its header and **no items**; opening mounts them; re-closing keeps them mounted. `action` renders as a link. The docked prompt renders outside the scrolling section list and does not scroll with it |
| **I2** | `elementType={null}` renders the empty state and nothing else. Disclosure state survives an `elementType` change and is restored on switching back. Group reset renders in A12's `controls` slot; when the section is closed it degrades to the modified-dot. Row resets across mixed control types share one x-offset (the §1.4.1 contract, asserted from the consumer's side too) |
| **I3** | `anchor=null` renders nothing. The toolbar's rect never intersects the anchor rect. Near the boundary top it flips to `bottom`. `aiAction` is the first focusable item regardless of `actions` order. Past the action cap the tail moves into `overflow` |
| **I4** | Rows expose A9's button semantics; cost renders in the trailing slot without changing row height. `separated` groups draw a rule above them. `onSelectTool` fires with the row's id |
| **I5** | Switching tool is one interaction (no intermediate menu). Size/hardness/opacity render as A6 rows sharing the inspector grid. Swatch colours are applied via `style`, never as class names (token-gate safety) |
| **O3** | All five regions render their slot content and nothing else. Changing `rail` content does not re-render `canvas`. `dockVariant="none"` removes the dock without shifting the other four regions. Collapsing the inspector keeps it mounted. **The module imports no L3 component** (asserted by reading its own import list) |
| **O4** | `dockVariant="timeline"` renders the transport strip; `"transcript"` renders neither transport nor ruler and gives the dock full height. `TimelineShell` and `StudioShell` produce identical markup for the four non-dock regions given identical props |

---

## 7. Doc corrections implied

Ordered by severity.

1. **`component-specs.md` — write entries for all eight D12 restorations** (§1.2). H6 and H7 block
   this wave; E9, E10, J7, M7, N7, N8 block Waves 4, 7, 10 and 11. Until then the authoritative doc
   silently omits eight catalog items.
2. **`concept-model.md:47` — correct the A6 fan-out row**: drop G9 (cut by D9), mark M1 and E1 as
   unstated, confirm E3 and I2.
3. **`concept-model.md:48,49` — A2 and A7 rows still list G6 `model-bar`**, cut by D9. D13 recorded
   this class of error against A10 only; it is present in three more rows.
4. **`decisions.md` — extend D13** to record that the audit is now seven-for-seven, and that the
   propagation failure of D9 reached A2, A6 and A7 as well as A10.
5. **`decisions.md` — record the A6/A12/A11 retrofits** (§1.4.1–1.4.4) the same way D13 recorded the
   first A6 retrofit, including that A6 shipped the reset *prop* without the reset *column*.
6. **`component-specs.md` A6** — state that the reset is a third grid track, and that `xy-pair`
   requires the group-labelling variant.
7. **`component-specs.md` A12** — distinguish `controls` (acts on this section) from `action`
   (navigates away); the "a link, never a button" rule applies to `action` only.
8. **`component-specs.md` H3 vs `gaps.md` R4 — resolve the solo contradiction** (§3.5). H3's entry
   puts solo in the lane gutter; gaps.md says H3 does not model solo. Proposal: control in H3, policy
   in H7.
9. **`block-specs.md` O4** — the region list has six entries against O3's five; either fold transport
   into the dock (recommended, §2.1) or stop calling it "the same five regions". Add B7 to O4's fill
   list. State where F6 mounts.
10. **`catalog.md` vs `block-specs.md` — the block count** (§2.2). Thirteen blocks counts O3 and O4
    separately; "one shell with a variant" implies twelve. Owner's call.
11. **`concept-model.md:12,14,18,103` — the component counts** (84 / 14 / 84 / 95) are all stale
    against the catalog's 82 components and 13 blocks.
12. **`catalog.md:143`** — add A6 to I5's base column.
13. **`gaps.md` — record the missing musical-time gap** (§5.1): a bars/beats/time-signature ruler has
    no entry anywhere, though R5 `track-list` establishes that music is in scope.
14. **Design spec §6** — the compound-component convention (`ThreadList.Root`) never matched what
    shipped. Mark it superseded by the flat prefixed-export idiom, per the treatment D10 gave §5/§11.
15. **`decisions.md` — record the promotion-rule exception** for the H2/H6 time-mapping duplication
    (§3.4), so it reads as a decision rather than an oversight to a future auditor.
16. **Registry infrastructure** — `lib/catalog.ts` needs a `"Blocks"` group and `gen-registry.mts`
    needs `registry:block` plus multi-file items (§1.5). Inherited from Wave 2; Wave 6 is the first
    consumer of the registry-dependency-between-blocks case.

---

## 8. Non-goals

- **A `timeline-editor` monolith.** D6 dissolved it into H1+H2+H3 composed as a block. Nothing in
  this wave composes them outside O4.
- **Sample-resolution ticks in H2.** The frame is the floor; H6 owns samples. This is the boundary
  D12 restored H6 to defend.
- **Bars, beats and time signatures.** Recorded as a new gap (§7.13), not built.
- **Audio decoding, playback or an `AudioContext`** anywhere in H1, H6 or H7. Peaks and levels come
  in as props; components render.
- **A clock.** No component in this wave owns a timer. `playhead` is controlled everywhere.
- **Canvas rendering, image processing or brush engines.** I5 emits tool intent; the canvas is a slot
  in O3 and always the caller's.
- **An element-type taxonomy for I2.** `elementType` stays a string. A closed union would make the
  inspector un-installable in any app whose objects differ from ours.
- **Promoting the time-scale helper to L2.** Deliberate exception to the promotion rule (§3.4),
  revisitable at a third consumer.
- **Region selection on H3, or lanes on H6.** The two selection models never merge.
- **Solo policy in H3.** Control there, policy in H7 (§3.5).
- **Collaboration** — remote playheads, presence, comments. gaps.md §5.
- **Virtualising the lane stack vertically.** Horizontal tick culling is in scope; a windowed
  N-track list is not, and there is no evidence for the track counts that would require it.
- **Building O3 and O4 to completion in this wave** if Waves 2–4 have not shipped B4, B7, E4, F1 and
  F6 (§4.4). The shells ship as slot contracts; their bundled demos wait.
- **Retrofitting A11 into E3 `parameter-panel`.** E3 is a Wave 4 component and inherits the fixed A6
  for free.
