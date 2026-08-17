import type { ComponentDocs } from "@/lib/component-docs";
import {
  ColorOnlyRoleBadge,
  EmptySlotCollapsedAway,
  EmptySlotStaysVisible,
  RemovableReferences,
  TypedRoleLabels,
} from "./reference-strip.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d2-reference-strip.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity
 * live in the ./reference-strip.examples client sidecar and get referenced
 * here as zero-prop elements — see that file for why.
 */
export const ReferenceStripDocs: ComponentDocs = {
  whatItIs:
    "A horizontal strip of typed attachment slots that sits above a prompt — reference images, first/last frame, a video reference, or a character. Each slot is a preview-tile with an added role label, remove control and reorder controls; a slot with no image attached stays visible as an empty, still-attachable placeholder instead of disappearing.",
  whyItMatters:
    "Freepik, Runway, ElevenLabs and CapCut all place typed references above the prompt rather than treating them as generic file attachments, because the role a reference plays changes what the model actually does with it — a first frame conditions the start of a video, a character reference conditions identity across every generated frame. Collapsing empty slots would hide which typed inputs a mode even accepts; keeping them visible is what makes the full set of possible inputs discoverable before the user has attached anything.",
  evidence: ["Freepik", "Runway", "ElevenLabs", "CapCut"],
  anatomy: [
    { slot: "reference-strip", note: "Root — empty-state panel, or the scrollable region (Carousel) once there's at least one item." },
    { slot: "reference-strip-empty", note: "Whole-strip empty state: copy plus an Add CTA, not a bare string (F4)." },
    { slot: "reference-strip-item", note: "One slide wrapper; fixed width so slots don't reflow as the strip scrolls." },
    { slot: "reference-strip-slot", note: "The per-item content: a preview-tile (A8) plus the role label / reorder row." },
    { slot: "reference-strip-role", note: "The role's own visible text label — never colour- or icon-only." },
    { slot: "reference-strip-remove", note: "Per-slot remove control, in the preview-tile's badge corner." },
    { slot: "reference-strip-move", note: "Per-slot reorder controls; disabled at each end of the strip." },
    { slot: "reference-strip-previous", note: "Visible \"scroll left\" affordance; also keeps the strip keyboard-reachable." },
    { slot: "reference-strip-next", note: "Visible \"scroll right\" affordance." },
  ],
  usage:
    "Reach for it whenever a composer or node accepts more than one typed image input — plain references, or a mix of first frame / last frame / video ref / character. Pass a flat `items` array; give every item a `role` to turn on role labels for the whole strip, or leave `role` off entirely for a plain multi-reference set. Omit `thumbnail` on any item to render that slot as an empty, attachable placeholder rather than leaving it out of the array — that's how a mode advertises a typed slot ('last frame') it accepts but the user hasn't filled yet.",
  dos: [
    {
      text: "Give every typed slot a real text role label, shown below the tile, not just an icon or a colour dot.",
      example: <TypedRoleLabels />,
    },
    {
      text: "Keep an unfilled typed slot in the strip as an empty, addable placeholder instead of leaving it out of the data.",
      example: <EmptySlotStaysVisible />,
    },
    {
      text: "Wire onRemove per item so a reference is a single, undoable action — never a destructive click on the thumbnail itself.",
      example: <RemovableReferences />,
    },
  ],
  donts: [
    {
      text: "Don't signal a slot's role with colour or an icon alone — a role determines model behaviour and must survive for colourblind and screen-reader users.",
      example: <ColorOnlyRoleBadge />,
    },
    {
      text: "Don't drop a slot from the array once its image is removed — an empty first/last frame slot that disappears makes the set of accepted inputs undiscoverable.",
      example: <EmptySlotCollapsedAway />,
    },
  ],
  accessibility: {
    keyboard: [
      "The whole-strip empty state is at most one tab stop — the Add reference button — and is not a carousel at all: no region, no arrow keys, no previous/next.",
      "With at least one item the strip becomes a Carousel: two stops for Previous and Next, plus up to three per slot (remove, move left, move right). Six filled, reorderable slots is twenty stops.",
      "Arrow Left and Right scroll the strip. The handler sits on the root in the capture phase and calls `preventDefault`, so it fires from anywhere inside — every focusable descendant here is a button, so nothing conflicts today, but a text field or slider nested in a slot would lose its arrow keys to the strip.",
      "Move buttons are `disabled` at each end and Previous/Next are disabled when there is nothing to scroll to, so those stops disappear rather than sitting there inert. The first slot is one move stop, not two.",
      "An empty slot is focusable only when `onAdd` is passed. Without it `preview-tile` renders a `<div>`, so the placeholder advertises a typed input that can be filled by neither keyboard nor mouse.",
      "A filled slot's tile is never interactive — no `onSelect` is passed to it — so the image cannot be opened or previewed. Remove and reorder are everything a slot does.",
    ],
    screenReader: [
      "`Carousel` gives the strip `role=\"region\"` and `aria-roledescription=\"carousel\"` but no accessible name, so it announces as an unnamed carousel. Each slide is a `role=\"group\"` with `aria-roledescription=\"slide\"` and no name either.",
      "Remove and reorder names are built from `typeof roleLabel === \"string\"`, falling back to the bare word \"reference\". Two cases hit that fallback: an item with neither `role` nor `label` — the plain multi-reference strip — and a `label` passed as an element rather than a string. In both, every remove button announces \"Remove reference\" and every reorder button \"Move reference left\".",
      "Where roles are set the names are good: \"Remove First frame\", \"Move Character right\", and the visible role sits below the tile as real text rather than a colour or an icon.",
      "`thumbnail.alt` is the image's accessible name and the only thing separating two filled slots that share a role. That is why it is required rather than optional.",
      "`state=\"failed\"` replaces the image with the words \"Couldn't load\" inside the frame — words, not colour — but it is not a live region, so a slot that fails after upload announces nothing. `state=\"loading\"` announces nothing either: the skeleton is a plain `<div>` with no busy state on it.",
      "An empty slot announces as a toggle button that is not pressed, named \"Add\" or by its role label. `preview-tile` puts `aria-pressed` on any interactive frame, and attaching a reference is not a toggle.",
      "Nothing announces a reorder. After Move right the DOM order changes silently, and the user has to re-read the strip to find where the item went.",
    ],
    focus: [
      "Reordering to either end disables the button that was just pressed — the last Move right on the last slot, the first Move left on the first — and a focused element that becomes disabled is blurred, so focus drops to `<body>`. Move focus to the sibling move button inside your `onMove`.",
      "Removing a slot unmounts its remove button, and removing the last one replaces the whole Carousel with the empty panel. Focus falls to `<body>` in both cases.",
      "Previous and Next scroll the strip without moving focus, so the focused slot and the visible slots can disagree — a Tab through the strip will reach slots that are scrolled off screen.",
      "Every button here is the shared `Button` and carries its focus ring; an empty slot's tile uses `preview-tile`'s own `focus-visible:ring-2` instead.",
    ],
  },
  pitfalls: [
    "Removing the first frame and letting the next reference silently be promoted into that role — remove is per-slot and must never re-derive a different item's role as a side effect (D2).",
    "Hand-rolling a scrolling row with overflow-x-auto instead of the Carousel base — that loses the visible next affordance and the keyboard-reachable region, and axe's scrollable-region-focusable rule has already caught this exact class of bug once in this repo.",
    "Forgetting `thumbnail.alt` is required, not optional — these are the only informational images in the strip, so a missing or decorative-sounding alt (\"reference\") leaves screen reader users unable to tell slots apart.",
  ],
};
