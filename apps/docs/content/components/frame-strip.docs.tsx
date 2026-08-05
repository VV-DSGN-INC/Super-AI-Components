import type { ComponentDocs } from "@/lib/component-docs";
import {
  BorderedActiveItem,
  InOutMarks,
  LabelledFrames,
  OneStripThreeKinds,
  ReorderableStrip,
  UnlabelledFrames,
} from "./frame-strip.examples";

/**
 * Seeded from docs/design-system/component-specs.md#h5-frame-strip.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Every live example lives in the
 * ./frame-strip.examples client sidecar and is referenced here as a zero-prop
 * element, so no handler ever has to cross the server/client boundary.
 */
export const FrameStripDocs: ComponentDocs = {
  whatItIs:
    "A horizontal strip of frames, pages or artboards, built on preview-tile. One item is active at a time; items can be reordered and new ones added inline. An in/out variant swaps that single selection for two marks — a first and a last frame — which is how a clip range or an image-to-video conditioning pair gets picked.",
  whyItMatters:
    "Descript and CapCut put a frame strip under the player, Canva puts a page strip under the canvas, and Simplified puts an artboard strip beside it — three different products, one interaction. Freepik's frame conditioning uses the same strip to pick the first and last frame of a generated clip. Shipping three separate strips would mean three selection models and three keyboard stories for what users experience as the same control, so this is one component whose `kind` changes only what the tile contains. The active item is drawn with a ring rather than a border for a specific reason: a border is layout, so a bordered strip nudges every neighbouring tile by a few pixels each time the selection moves, and a strip that twitches as you arrow through it is unusable at frame-picking speed.",
  evidence: ["Descript", "CapCut", "Canva", "Simplified", "Freepik"],
  anatomy: [
    { slot: "frame-strip", note: "Root — the scrollable region (Carousel), labelled for the content kind." },
    { slot: "frame-strip-item", note: "One cell. Its height is the same whether or not the item is active." },
    { slot: "frame-strip-frame", note: "The tile: a preview-tile, wrapped in a button in the select variant and inert in the in/out variant." },
    { slot: "preview-tile", note: "A8, composed rather than reimplemented — it owns the aspect, the label overlay, the badge corner and the selection ring." },
    { slot: "frame-strip-mark", note: "In/out variant only: the \"In\" or \"Out\" badge in the tile's badge corner." },
    { slot: "frame-strip-in", note: "Toggle that marks this item as the in point. Its accessible name names the frame." },
    { slot: "frame-strip-out", note: "Toggle that marks this item as the out point." },
    { slot: "frame-strip-move", note: "Reorder controls; revealed on hover or focus, disabled at each end of the strip." },
    { slot: "frame-strip-add", note: "Trailing add tile, in the same cell geometry as a frame." },
    { slot: "frame-strip-previous", note: "Visible scroll-left affordance; also what keeps the strip keyboard-reachable." },
    { slot: "frame-strip-next", note: "Visible scroll-right affordance." },
  ],
  usage:
    "Reach for it whenever a timeline, deck or canvas needs a row of navigable thumbnails. Set `kind` to video, slides or artboards — it changes the tile aspect and the wording of the add tile, nothing else. Pass `items` with a `label` on every entry (a timecode, a page number, an artboard name): the label is the tile's accessible name, and the thumbnail is decorative. Add `onReorder` to turn on the move controls and `onAdd` to append the add tile. Switch to `variant=\"in-out\"` when the question is a range rather than a position — that variant marks two items, feeds them to reference-strip as first and last frame, and keeps the in point ahead of the out point for you.",
  dos: [
    {
      text: "Use one strip for frames, pages and artboards, changing only `kind` — selection, reorder and add should behave identically across all three.",
      example: <OneStripThreeKinds />,
    },
    {
      text: "Give every item a real text label; leave the thumbnail decorative with an empty alt so the label is the tile's accessible name.",
      example: <LabelledFrames />,
    },
    {
      text: "In the in/out variant, mark both ends in words — the In and Out badges say which is which without relying on the ring or a colour.",
      example: <InOutMarks />,
    },
    {
      text: "Wire `onReorder` rather than hand-rolling drag-only reordering; the move controls appear on hover and stay in the tab order for keyboard users.",
      example: <ReorderableStrip />,
    },
  ],
  donts: [
    {
      text: "Don't draw the active item with a border — a border is layout, and the strip shifts under the cursor every time the selection moves.",
      example: <BorderedActiveItem />,
    },
    {
      text: "Don't ship frames identified only by their picture; without a label there is nothing to announce and nothing to tell two similar frames apart.",
      example: <UnlabelledFrames />,
    },
  ],
  pitfalls: [
    "Adding padding, a border or a size change to the active tile alongside the ring. The ring is a box-shadow and costs no layout; anything else you attach to the active state reintroduces exactly the reflow the ring was chosen to avoid.",
    "Reimplementing the thumbnail instead of composing preview-tile. The tile is what guarantees a fixed aspect and stable geometry across loading and failed items — a hand-rolled div re-derives all of it, usually without the failed state.",
    "Putting a control inside the tile's action slot while the tile is also clickable. That slot renders inside preview-tile's frame, so a button there sits inside a button and fails axe's nested-interactive rule; this component wraps an inert tile in its own single button instead.",
    "Hiding the reorder controls with display:none until hover. They must stay in the tab order — reveal them with opacity plus focus-within, or keyboard users can never reorder anything.",
    "Assuming the in/out marks can be set in any order. An in point after the out point is not a range, so setting one past the other clears the far end rather than keeping a pair that downstream conditioning cannot use.",
  ],
};
