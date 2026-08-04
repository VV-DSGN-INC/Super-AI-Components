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
  pitfalls: [
    "Removing the first frame and letting the next reference silently be promoted into that role — remove is per-slot and must never re-derive a different item's role as a side effect (D2).",
    "Hand-rolling a scrolling row with overflow-x-auto instead of the Carousel base — that loses the visible next affordance and the keyboard-reachable region, and axe's scrollable-region-focusable rule has already caught this exact class of bug once in this repo.",
    "Forgetting `thumbnail.alt` is required, not optional — these are the only informational images in the strip, so a missing or decorative-sounding alt (\"reference\") leaves screen reader users unable to tell slots apart.",
  ],
};
