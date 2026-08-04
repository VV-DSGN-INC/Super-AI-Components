import type { ComponentDocs } from "@/lib/component-docs";
import {
  ComposedFromShippedSlots,
  CostAndGenerateTogether,
  CostSeparatedFromGenerate,
  StagesReordered,
} from "./generation-panel.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e1-generation-panel.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * ./generation-panel.examples client module and get referenced here as
 * zero-prop elements — see that file for why.
 */
export const GenerationPanelDocs: ComponentDocs = {
  whatItIs:
    "The left configuration column of a generation tool: upload, directions, presets, settings, then cost and Generate, stacked in that fixed order. Upload and directions are built in, with real drag-and-drop-or-click file intake and a prompt field. Presets, settings and the Generate action are plain ReactNode slots, so the panel arranges them without owning or reimplementing their behavior.",
  whyItMatters:
    "Freepik, Tripo, Playground, getimg and Simplified all converge on this exact vertical order even though their individual controls differ — that consistency is what lets a user's hands find Generate without looking. Collapsing that order into one component means every new tool gets it for free instead of re-deriving it, and it puts the cost of a generation in the same row as the button that spends it, rather than a memorized number from somewhere else on the page.",
  evidence: ["Freepik apps", "Tripo", "Playground", "getimg", "Simplified"],
  anatomy: [
    { slot: "generation-panel", note: "Root — a Card with a scrolling body and a pinned footer." },
    {
      slot: "generation-panel-section",
      note: "One collapsible stage; carries data-stage=dropzone|directions|presets|settings.",
    },
    {
      slot: "generation-panel-section-trigger",
      note: "The stage's heading button — a real <h3> plus a chevron, not colour alone.",
    },
    {
      slot: "generation-panel-dropzone",
      note: "The upload stage's drop target, wrapping a visible trigger button and an sr-only file input.",
    },
    {
      slot: "generation-panel-dropzone-files",
      note: "Uploaded files, rendered as a preview-tile grid with per-file remove.",
    },
    { slot: "generation-panel-directions-textarea", note: "The prompt/instructions field." },
    { slot: "generation-panel-presets", note: "Slot for E4 preset-grid." },
    { slot: "generation-panel-settings", note: "Slot for E2 model-picker and/or E3 parameter-panel." },
    { slot: "generation-panel-generate", note: "The pinned footer — cost and the Generate slot, always together." },
  ],
  usage:
    "Reach for it as the whole left column of a generation tool, not as a layout you re-lay-out per tool. Wire `onFilesAdd` (which is what turns the upload stage on at all — omit it for text-only tools) and `directions`/`onDirectionsChange` for the two stages this component owns outright, then pass `presets`, `settings` and `generate` as the real E4/E2/E3/E5 components once they exist in your app — pass `cost` alongside `generate` and never route it through a different slot. Each stage collapses independently via `defaultOpenSections`, but that only changes the initial state; the cost-and-generate row lives outside the scrolling body on purpose, so it can't accidentally end up requiring a scroll to reach.",
  dos: [
    {
      text: "Keep `cost` and `generate` on the same call — they always render in one row, which is what makes the price impossible to miss at the point of spend.",
      example: <CostAndGenerateTogether />,
    },
    {
      text: "Compose `settings` (and `presets`) from the catalog's own shipped or in-flight components — gen-settings-bar here, model-picker/parameter-panel/preset-grid once they land — instead of hand-rolling controls inside the slot.",
      example: <ComposedFromShippedSlots />,
    },
  ],
  donts: [
    {
      text: "Don't put the cost chip in one section and the Generate button in another — nothing in this component's API can do that, so if you see it, it's been rebuilt outside GenerationPanel.",
      example: <CostSeparatedFromGenerate />,
    },
    {
      text: "Don't reorder the stages (e.g. settings before presets, or directions before upload) — the vertical order is the whole point; it's fixed inside the component, not a prop.",
      example: <StagesReordered />,
    },
  ],
  pitfalls: [
    "Passing `files` without `onFilesAdd`. The upload stage only renders when `onFilesAdd` is provided — that's the intentional signal that a tool wants file intake at all, so a files-only tool silently gets no dropzone section.",
    "Assuming the dropzone's drag target is the only way in. It's additive: a real, keyboard-focusable button opens the native file picker, so a screen-reader or keyboard-only user is never limited to the drag surface.",
    "Passing `children` to GenerationPanel expecting it to render. This is a pure arrangement component — its five stages are typed props, not a children slot, and any children passed in are ignored.",
  ],
};
