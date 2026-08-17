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
  accessibility: {
    keyboard: [
      "Do the arithmetic before shipping a long strip. A `select` frame is one stop; an `in-out` frame is two, the In and Out toggles; `onReorder` adds two more to every frame; the add tile is one; previous and next are two. Twelve frames with in/out marks and reorder is fifty tab stops.",
      "Left and Right scroll the strip. The Carousel base handles them on a capture-phase listener at the root and calls `preventDefault`, so they never move the selection or focus — and any control you nest inside the strip loses its own horizontal arrow keys to them.",
      "There is no roving tabindex, so Tab is the only way through the frames, and nothing marks off-screen items inert: Tab walks into frames that are scrolled out of view.",
      "The reorder controls are hidden with `opacity-0` rather than `display:none` precisely so they stay tabbable, and `group-focus-within` reveals them when Tab arrives. They are `disabled` at each end of the strip.",
      "Selecting a frame is Space or Enter on the frame button. There is no Delete, no Backspace and no Escape — and in the `in-out` variant the frame is not a control at all, so there is nothing to activate but the two toggles beneath it.",
    ],
    screenReader: [
      'The strip is a `role="region"` with `aria-roledescription="carousel"`, named from `kind` — "Frames", "Pages" or "Artboards". Each cell is a `role="group"` announced as a slide.',
      'A frame\'s accessible name is its `label` and nothing else, which is why the prop is required: the thumbnail is decorative, and a frame identified only by its picture announces as an empty button. The active frame carries `aria-current`, not `aria-pressed` — "the frame you are on", not a toggle.',
      'Anything else inside the frame joins that name. A `badge` you pass, and the "Couldn\'t load" text a `failed` tile renders, both sit inside the button, so a failed frame announces as "Couldn\'t load 00:12".',
      'A `loading` frame announces nothing beyond its label. The pulsing skeleton is presentational and the state reaches the DOM only as `data-state`, so "still rendering" is a purely visual distinction.',
      'The In and Out toggles carry `aria-pressed` and name themselves after the frame — "In point at 00:12" — with the visible "In" `aria-hidden` so the two never concatenate. That is what stops frame 3\'s pair being indistinguishable from frame 4\'s in a list of controls.',
      "Setting an in point past the out point silently clears the far mark. There is no live region anywhere in the strip, so a mark the component removed on your behalf is announced as nothing.",
    ],
    focus: [
      'Reorder is the trap. Pressing "Move left" repeatedly walks an item toward the front, and the moment it lands at index 0 that same button becomes `disabled` — focus is dropped and falls to `<body>` mid-reorder. Move focus to the item\'s other move control, or to the frame, inside your `onReorder`.',
      "Selecting a frame does not move focus, and previous/next only scroll — so the focused frame and the visible frames can disagree.",
      "The frame button and the add tile ship their own `focus-visible` ring. In, Out, the move controls and previous/next inherit the shared Button styles.",
    ],
  },
  pitfalls: [
    "Adding padding, a border or a size change to the active tile alongside the ring. The ring is a box-shadow and costs no layout; anything else you attach to the active state reintroduces exactly the reflow the ring was chosen to avoid.",
    "Reimplementing the thumbnail instead of composing preview-tile. The tile is what guarantees a fixed aspect and stable geometry across loading and failed items — a hand-rolled div re-derives all of it, usually without the failed state.",
    "Putting a control inside the tile's action slot while the tile is also clickable. That slot renders inside preview-tile's frame, so a button there sits inside a button and fails axe's nested-interactive rule; this component wraps an inert tile in its own single button instead.",
    "Hiding the reorder controls with display:none until hover. They must stay in the tab order — reveal them with opacity plus focus-within, or keyboard users can never reorder anything.",
    "Assuming the in/out marks can be set in any order. An in point after the out point is not a range, so setting one past the other clears the far end rather than keeping a pair that downstream conditioning cannot use.",
  ],
};
