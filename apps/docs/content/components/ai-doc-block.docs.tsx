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
  pitfalls: [
    "Unmounting the block to re-prompt it — remounting a fresh block under a new key reflows the document under the user's cursor while they are typing an instruction into it. Change `state` and swap `children`; the same DOM node stays between the same two paragraphs.",
    "Wrapping the children in your own layout div before passing them in. The content slot deliberately renders them unwrapped so your document model gets back exactly the markup it gave; an extra wrapper ends up in the export.",
    "Hiding the verbs while streaming instead of disabling them. It reads as a smaller component that suddenly grows, and it hides the fact that a decision is coming.",
    "Treating the frame as the only signal that a passage is generated. The attribution line is text for a reason — a border colour does not survive a high-contrast theme, a greyscale print, or an export to plain HTML.",
    "Leaving `value` undefined in the editable state. The edit field is controlled; pair `value` with `onValueChange` and keep it in step with the prose you pass as children.",
  ],
};
