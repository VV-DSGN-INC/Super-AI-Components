# `preview-tile` (A8) — Design Specification

**Date:** 2026-08-02
**Status:** Approved design
**Resolves:** Q5 in [`docs/design-system/decisions.md`](../../design-system/decisions.md)
**Wave:** 1 (first of primitives A8–A12)

| | |
| --- | --- |
| Scope | One primitive: `preview-tile`. Catalog corrections to its consumer list. |
| Registry | `super-ai` namespace, `registry/super-ai/preview-tile.tsx` |
| Base | Tailwind `aspect-*` utilities; no new npm or registry dependencies |
| Testing | One co-located `preview-tile.test.tsx`, per repo convention |

---

## 1. Why this is first

The revised sequencing (decisions.md §5) puts A8–A12 in Wave 1 and `preview-tile` first within it,
because finding F2 states that eleven components inherit its API. Committing to the wrong API would
propagate into every downstream family.

That premise was audited before designing, and it was partly wrong. See §2.

## 2. The consumer audit

`concept-model.md:45` lists eleven consumers of A8. Checking each against its own entry in
`component-specs.md`:

| # | Consumer | What its own spec declares | Real consumer? |
| --- | --- | --- | --- |
| E4 | `preset-grid` | **"Built on: A8"** | Yes |
| H5 | `frame-strip` | **"Built on: A8"** | Yes |
| I1 | `tool-panel` | **"Built on: A12, A8"** | Yes |
| F1 | `result-card` | Base: Card, Aspect-ratio — but *"Card geometry is identical in all states… so grids never reflow when a result resolves"* | Yes — restates A8's contract without naming it |
| C4 | `recent-grid` | Base: Card, Aspect-ratio — *"card height fixed regardless"* | Yes — same contract, label below rather than overlaid |
| F2 | `generation-grid` | "Built on: F1 + A3" | Transitively, through F1 |
| C3 | `feature-card-row` | *"Cards are **A9** in a card layout"* | No — entity-row, not preview-tile |
| E2 | `model-picker` | Base: Select, Popover, Card | No — model cards carry badges and hardware notes, not previews |
| J4 | `artifact-grid` | Base: Card — *"**Excerpt** is the load-bearing field"* | No — text-first, no thumbnail |
| J3 | `explore-gallery` | *"**Masonry, not a grid.** Community feeds are browsed for surprise; equal-height rows suppress it"* | No — contradicts A8's fixed frame |
| J6 | `template-detail` | Base: Dialog, Carousel | No — a modal, not a tile |

**Real fan-out: five direct consumers plus one transitive, not eleven.**

Board evidence corroborates the exclusions: S8 Explore gallery is listed as masonry, S9 Artifact index
as a card grid grouped by session, and Requirements table E lists "voice card + voices grid" as its
own item rather than a preset grid.

`preview-tile` is still the highest fan-out primitive in the catalog and still correctly sequenced
first. The claim that needed correcting is the size of the blast radius, not the order.

## 3. Q5 resolved: one primitive

Q5 asks whether one API genuinely covers *image, video, colour swatch, text excerpt and 3D model*, or
whether it is two primitives sharing a name.

Two entries on that content list do not survive the audit:

- **Text excerpt** derives from J4 `artifact-grid`, which is not a consumer. Its own spec makes the
  excerpt load-bearing and never mentions a thumbnail. It is a text card and belongs in its own
  component.
- **Audio** is already recorded in [`gaps.md`](../../design-system/gaps.md) §4 as something A8 cannot
  express: U3 `voice-picker` was wrongly collapsed into `preset-grid`, and auditioning a voice
  requires play/pause, exclusive playback across the grid, and a shared audition sentence. That is a
  control, not a preview.

What remains — image, video frame, colour fill, 3D still — is one thing: **visual media held at a
fixed aspect ratio**. The primitive never needs to branch on which.

**Decision: one primitive.** The cases that argued for a second are separate components that were
mislabelled as consumers. This should be recorded as D11 and Q5 marked resolved.

## 4. API

```tsx
type PreviewTileAspect = "square" | "video" | "portrait" | "wide";
type PreviewTileState = "default" | "loading" | "locked" | "failed";

interface PreviewTileProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  aspect?: PreviewTileAspect;          // default "square"
  label?: React.ReactNode;
  labelPlacement?: "overlay" | "below" | "none";  // default "overlay"
  badge?: React.ReactNode;
  state?: PreviewTileState;            // default "default"
  selected?: boolean;
  onSelect?: () => void;
  action?: React.ReactNode;            // rendered inside locked / failed content
}
```

Aspect presets resolve to fixed ratios:

| Preset | Ratio | Tailwind | Observed in |
| --- | --- | --- | --- |
| `square` | 1 / 1 | `aspect-square` | preset grids, style/palette pickers (default) |
| `video` | 16 / 9 | `aspect-video` | frame strips, video results |
| `portrait` | 3 / 4 | `aspect-[3/4]` | avatar and character tiles |
| `wide` | 21 / 9 | `aspect-[21/9]` | banner and cover thumbnails |

### 4.1 Content is opaque

`children` is untyped. An `<img>`, a `<video>`, a colour-filled `<div>` and a rendered 3D still are
all the same to the primitive — it holds them, it does not inspect them. This is precisely what lets
one component cover the content range without branching, and it is the mechanism behind the "one
primitive" answer in §3.

### 4.2 States replace content, never the frame

| State | Content slot renders | Frame · label · badge |
| --- | --- | --- |
| `default` | `children` | unchanged |
| `loading` | pulse skeleton (`animate-pulse bg-muted`) | unchanged |
| `locked` | locked treatment + `action` | unchanged |
| `failed` | failure treatment + `action` | unchanged |

The frame's box is identical in all four. This is the whole reason the aspect is fixed: a grid of
tiles must not reflow when one result resolves, fails, or begins loading.

F1 `result-card` adds a requirement this design honours: *"`locked` shows the shape of what would have
been made, then the CTA — never an empty box with a padlock."* The `action` slot exists so the CTA
lives inside the frame rather than displacing it.

### 4.3 Selection is a ring, never a border

Rendered with `ring-2 ring-ring ring-offset-2`. A ring is a box-shadow and contributes no layout box;
a border adds 2px per side and reflows the grid on every selection change.

This is the shared mechanism behind two separately-stated consumer requirements — E4's *"the grid
never reflows when expanded"* and H5's *"active item is ringed, not bordered, so the strip does not
shift when selection moves."*

### 4.4 `labelPlacement`

The one genuine divergence between real consumers:

- `overlay` — label sits on the thumbnail. E4: *"Labels overlay the thumbnail rather than sitting
  below it, so a dense grid stays a grid."* Default.
- `below` — label sits under the frame. C4 `recent-grid`: thumbnail · title · edited-ago.
- `none` — H5 frame strips, where the frame is the whole component.

### 4.5 Interaction and accessibility

- With `onSelect`, the tile renders as `<button type="button">` carrying `aria-pressed={selected}`.
- Without `onSelect`, it renders as a `<div>` and stays out of the tab order.

Decorative tiles are not focusable; selectable tiles are keyboard-operable without each consumer
reimplementing it. `onSelect` is omitted from the inherited div props to avoid colliding with the
DOM's own `onSelect` event.

Follows the existing primitive conventions: `data-slot="preview-tile"`, `data-state`, `cn()` from
`@/lib/utils`, semantic shadcn variables only — the token gate rejects raw hex, `oklch()` and
Tailwind palette classes.

## 5. Testing

One co-located `preview-tile.test.tsx`. The load-bearing assertions:

1. **Frame geometry is invariant across all four states** — the defining contract. If this regresses,
   every grid in the catalog reflows.
2. **Selection adds no layout box** — the tile's own box is unchanged between `selected` true/false.
3. `onSelect` fires on click and on Enter/Space.
4. Without `onSelect` the tile is not focusable and exposes no button role.
5. Each `labelPlacement` renders the label in the expected position, and `none` renders no label.
6. `loading` / `locked` / `failed` each replace `children` while label and badge persist.

## 6. Catalog corrections

Doc changes shipping alongside the component:

- `concept-model.md:45` — correct the A8 fan-out list to E4, H5, I1, F1, C4 (+F2 transitive), with
  the reason each of the other six was removed.
- `concept-model.md:54` — "eleven consumers across six unrelated families" restated to match.
- `decisions.md` — add **D11** (one primitive; the audit and its reasoning) and mark **Q5 RESOLVED**.
- `component-specs.md` A8 — record the real consumer list, `labelPlacement`, and the audio exclusion.
- `component-specs.md` F1 and C4 — declare "Built on: A8" so the dependency is explicit at both ends.
- Note against J3 and J4 that each needs its own component; neither can be built on A8.

## 7. Non-goals

- **Audio previews.** U3 `voice-picker` is a separate component; see gaps.md §4.
- **Text-excerpt tiles.** J4 `artifact-grid` is a text card.
- **Masonry.** J3 `explore-gallery` needs variable heights and cannot be built on a fixed frame.
- **Arbitrary numeric aspect ratios.** The four presets cover every observed case; an arbitrary ratio
  invites one-off tiles that break grid rhythm.
- **Group selection state.** Consumers own which tile is selected; the primitive renders `selected`.
