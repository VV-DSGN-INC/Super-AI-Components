import type { ComponentDocs } from "@/lib/component-docs";
import {
  BlockInFlow,
  OverlayOverTheDocument,
  VerbsDisabledWhileStreaming,
  VerbsReordered,
} from "./ai-doc-block.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k1-ai-doc-block.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./ai-doc-block.examples
 * client sidecar and are referenced here as zero-prop elements, so no handler
 * ever has to serialise across the server/client boundary.
 */
export const AiDocBlockDocs: ComponentDocs = {
  whatItIs:
    "A passage of generated prose that sits inside a document as a real node — a paragraph, a heading, a list — wearing a thin frame, an attribution line and the four approval verbs until someone decides what to do with it. It streams in place, opens for editing in place, and can be re-prompted in place; what it never does is float over the page.",
  whyItMatters:
    "This is the shape Notion AI, Manus reports, Spellbook drafting and Claude artifacts all converged on, and the reason is the same in each: generated text has to survive save, reload and export as ordinary content. A block that is really an overlay looks identical in a screenshot and disappears the moment the document is serialised. Keeping the passage in the document also keeps the approval contract honest — F7 `approval-card`'s four verbs applied to prose, so the muscle memory built on approvals elsewhere in the product transfers to the middle of a paragraph.",
  evidence: ["Notion AI", "Manus", "Spellbook", "Claude artifacts"],
  anatomy: [
    { slot: "ai-doc-block", note: "The document node itself. Same element in every state — it never unmounts and never moves." },
    { slot: "ai-doc-block-header", note: "Attribution row: the generated-by label, plus the streaming indicator when text is arriving." },
    { slot: "ai-doc-block-label", note: "Says in words that the passage was generated. Not a colour, not a border." },
    { slot: "ai-doc-block-streaming", note: "Spinner and the word \"Streaming\", shown only while text is arriving." },
    { slot: "ai-doc-block-content", note: "The prose. Your markup, unwrapped — this is the part a document model saves and exports." },
    { slot: "ai-doc-block-editor", note: "The textarea that replaces the prose in the editable state." },
    { slot: "ai-doc-block-verbs", note: "Keep · Edit · Regenerate · Discard, in that order, always." },
    { slot: "ai-doc-block-reprompt", note: "The re-prompt affordance: a labelled instruction field with its own Regenerate and Cancel." },
    { slot: "ai-doc-block-prompt", note: "The instruction field inside that affordance." },
    { slot: "ai-doc-block-status", note: "Persistent live region that announces each state change." },
  ],
  usage:
    "Reach for it whenever a model writes into a document the user already owns — a summary dropped under a heading, a clause drafted into a contract, a section expanded in a report. Pass the prose as children in ordinary markup and keep it in your document model; the component only supplies the frame, the attribution and the verbs. Drive `state` from your host: `streaming` while tokens arrive, `approval-verbs` once they stop, `editable` when Edit is pressed, `re-promptable` when Regenerate is. Every verb is optional and shows up only when you supply its handler, but the order is not yours to choose. For a generation that has not landed anywhere yet, use K2 `inline-generate-popup` — the popover generates, this block commits.",
  dos: [
    {
      text: "Keep the passage in the flow of the document, with real paragraphs above and below it, so it saves and exports like any other content.",
      example: <BlockInFlow />,
    },
    {
      text: "Leave the verbs on screen but disabled while text is streaming — present and un-clickable, so the footer does not shrink and regrow when generation lands.",
      example: <VerbsDisabledWhileStreaming />,
    },
  ],
  donts: [
    {
      text: "Don't render the block as a floating layer over the paragraph it replaces. It looks the same and serialises to nothing.",
      example: <OverlayOverTheDocument />,
    },
    {
      text: "Don't rebuild the verb row by hand to reorder it. Keep · Edit · Regenerate · Discard is the contract, and the component fixes it whatever order you pass the handlers in.",
      example: <VerbsReordered />,
    },
    {
      text: "Don't tint Discard with a translucent destructive background and destructive text — that pairing measures under 4.5:1. The component ships it solid instead.",
    },
  ],
  accessibility: {
    keyboard: [
      "The verb row is one tab stop per supplied handler — nought to four. Nothing here is a roving-tabindex group: `ButtonGroup` is a plain `role=\"group\"`, so four verbs is four Tab presses and the arrows do nothing.",
      "In the `streaming` state every verb carries `disabled`, so the block has no tab stops of its own at all. A keyboard user tabs from the paragraph above straight to the one below.",
      "In `editable` the block is the edit textarea plus whichever verbs you supplied. Tab moves out of the textarea rather than indenting, and no key commits or cancels — Escape is unhandled, so leaving the state is a mouse trip to a verb.",
      "In `re-promptable` the verbs are replaced by the instruction field, a Regenerate button, and a Cancel button only if you passed `onRePromptCancel`. Enter inside the textarea inserts a newline; there is no submit shortcut, and with no `onRePromptCancel` there is no keyboard way out of the state at all.",
      "Space and Enter activate every button; all of them are real `<button type=\"button\">`, so none of them submit a surrounding form by accident.",
    ],
    screenReader: [
      "There is one persistent `role=\"status\"` line, present in the DOM in every state, whose text changes with `state` — \"Generating this block…\", \"This block is open for editing.\", and so on. That is what makes a state change audible rather than merely visible.",
      "The block itself is a plain `div`. It is not a region, the attribution line is not a heading, and nothing marks where the generated passage starts or ends: in browse mode the label reads as one more run of text before the prose. With several blocks in a document there is no landmark or heading to move between them.",
      "The attribution comes from `label` as real text, and the sparkle beside it is `aria-hidden`. Streaming is announced the same way — the spinner is hidden and the word \"Streaming\" carries it — plus `aria-busy` on the content slot.",
      "The edit field is named by `editLabel`, which defaults to the generic \"Edit generated text\". Two open editors in one document announce identically; pass a per-block name.",
      "The instruction field has a real `<label>`, so its name survives typing — the placeholder is an example, not the name.",
      "The verbs are named by their visible words only; their icons are `aria-hidden`. Those names are the same on every block, so \"Discard, button\" says nothing about which passage it discards.",
    ],
    focus: [
      "Pressing Regenerate unmounts the entire verb row, including the button that had focus, and nothing moves focus into the instruction field that replaces it. Focus falls to `<body>` and the next Tab restarts from the top of the page — move it into the prompt field yourself in `onRegenerate`.",
      "Cancel has the mirror problem: the re-prompt block unmounts, the verbs come back, and focus is again on `<body>`.",
      "Going into `editable` is safe by comparison. The verbs stay mounted, so the Edit button keeps focus — but focus does not move into the textarea either, so the field you just opened has to be tabbed to.",
      "Every control inherits the shared button's `focus-visible` ring; the block adds no focus styling of its own.",
    ],
  },
  pitfalls: [
    "Unmounting the block to re-prompt it — remounting a fresh block under a new key reflows the document under the user's cursor while they are typing an instruction into it. Change `state` and swap `children`; the same DOM node stays between the same two paragraphs.",
    "Wrapping the children in your own layout div before passing them in. The content slot deliberately renders them unwrapped so your document model gets back exactly the markup it gave; an extra wrapper ends up in the export.",
    "Hiding the verbs while streaming instead of disabling them. It reads as a smaller component that suddenly grows, and it hides the fact that a decision is coming.",
    "Treating the frame as the only signal that a passage is generated. The attribution line is text for a reason — a border colour does not survive a high-contrast theme, a greyscale print, or an export to plain HTML.",
    "Leaving `value` undefined in the editable state. The edit field is controlled; pair `value` with `onValueChange` and keep it in step with the prose you pass as children.",
  ],
};
