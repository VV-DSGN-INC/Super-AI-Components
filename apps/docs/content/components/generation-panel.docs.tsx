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
  accessibility: {
    keyboard: [
      "Each stage's heading is one tab stop and toggles with Space or Enter. A collapsed stage costs exactly that one stop, because the rest of its content is unmounted rather than hidden.",
      'The upload stage is two tab stops, not one. The `<input type="file">` is `sr-only`, which clips it but leaves it focusable, and it precedes the visible trigger in the DOM — so Tab lands first on an invisible control that shares the trigger\'s name, then on the button. Space on either opens the picker.',
      "Drag and drop has no keyboard path, which is what the trigger button exists for. The drop target itself is a plain `<div>` with no key handlers.",
      "Add one more stop per uploaded file, for its remove button. The prompt field is a plain textarea — Enter inserts a newline, nothing submits, and the only route to Generate is tabbing to whatever you put in the `generate` slot.",
    ],
    screenReader: [
      'Each stage\'s `<h3>` sits inside its trigger button, and a button\'s children are presentational — so the heading role is dropped from the accessibility tree and heading navigation never reaches "Source", "Directions", "Presets" or "Settings". The stage names survive as the buttons\' names and as each stage\'s group label, but not as headings.',
      "The trigger carries `aria-expanded` from the Collapsible base. Closing a stage unmounts its content rather than hiding it, so a collapsed stage's fields are absent from the tree entirely, not merely skipped by Tab.",
      'The dropzone gives the file input and the visible button the same accessible name, so "Upload source file" is announced twice in a row while tabbing through the stage. The description text is the button\'s visible content and joins its name.',
      'A file with no `preview` renders its name twice — once inside the tile, once as the tile\'s label below it — so it announces as "photo.jpg photo.jpg". A file with a preview names its image with the filename instead.',
      "The prompt field carries both an `sr-only` `<label>` and an `aria-label` holding the same text. `aria-label` wins, so the label is redundant rather than harmful; `directionsLabel` drives both.",
      "Nothing here is live. Adding a file, removing one, and the cost changing in the footer are all silent — the panel has no status region, and the cost chip is inert text.",
    ],
    focus: [
      "Removing a file unmounts the remove button that had focus, and nothing restores it — focus falls to `<body>`. Move it to the next tile, or back to the upload trigger, inside your `onFileRemove`.",
      "Collapsing a stage from its own trigger is safe: focus stays on the trigger. But the content is genuinely unmounted, so anything that closes a stage while focus is inside it drops that focus to `<body>`.",
      "The section triggers and the dropzone trigger ship their own `focus-visible` rings. The `sr-only` file input cannot have one — it is clipped — so the first of the upload stage's two tab stops shows no focus indicator anywhere on screen.",
      "The footer sits outside the scrolling body, so Generate can never be scrolled away from; the stages above it scroll independently of it.",
    ],
  },
  pitfalls: [
    "Passing `files` without `onFilesAdd`. The upload stage only renders when `onFilesAdd` is provided — that's the intentional signal that a tool wants file intake at all, so a files-only tool silently gets no dropzone section.",
    "Assuming the dropzone's drag target is the only way in. It's additive: a real, keyboard-focusable button opens the native file picker, so a screen-reader or keyboard-only user is never limited to the drag surface.",
    "Passing `children` to GenerationPanel expecting it to render. This is a pure arrangement component — its five stages are typed props, not a children slot, and any children passed in are ignored.",
  ],
};
