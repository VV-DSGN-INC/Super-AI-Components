import type { ComponentDocs } from "@/lib/component-docs";
import {
  ImproveFirst,
  ReturnsAReviewableDiff,
  SilentReplacement,
  ToneAsFiveButtons,
} from "./selection-toolbar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k4-selection-toolbar.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. Live examples live in the
 * ./selection-toolbar.examples client sidecar and arrive here as zero-prop
 * elements, so no event handler is ever serialized across the boundary.
 */
export const SelectionToolbarDocs: ComponentDocs = {
  whatItIs:
    "The floating bar that appears over selected prose and offers AI writing verbs: Improve first and filled, then Shorten, Expand, a Tone submenu, and a free-text Custom prompt. It is the context toolbar with a writing vocabulary — same eight-action ceiling, same pinned first entry, same above/below placement — and it emits a request rather than performing an edit.",
  whyItMatters:
    "This is the most copied AI interaction in writing tools: Notion AI, Spellbook, Google Docs and Canva Docs all put the same bar over the same selection, and users arrive already knowing what the sparkle means. What separates a trustworthy one from an alarming one is what happens next. The bar asks; the rewrite comes back as a diff the reader can reject. A toolbar that quietly replaced the paragraph would be indistinguishable from a bug, so this one has no write path at all — no value in, no text out, only an intent.",
  evidence: ["Notion AI", "Spellbook", "Google Docs", "Canva Docs"],
  anatomy: [
    { slot: "selection-toolbar", note: "Root. Carries data-pending, data-surface and aria-busy." },
    {
      slot: "context-toolbar",
      note: "The bar itself, from I3 — role=toolbar, roving focus, overflow, placement.",
    },
    {
      slot: "context-toolbar-ai",
      note: "Improve. I3's AI slot: index 0, filled, never eligible for overflow.",
    },
    {
      slot: "context-toolbar-action",
      note: "The plain verbs — Shorten, Expand, and any actions you add.",
    },
    { slot: "selection-toolbar-tone", note: "The Tone verb; one button, not one per tone." },
    { slot: "selection-toolbar-tone-menu", note: "The tone submenu that opens behind it." },
    { slot: "selection-toolbar-tone-item", note: "One tone; carries data-tone with its id." },
    { slot: "selection-toolbar-custom", note: "The Custom prompt verb." },
    {
      slot: "selection-toolbar-prompt",
      note: "The free-text popover — a dialog named by its title, not a navigation.",
    },
    { slot: "selection-toolbar-prompt-input", note: "The instruction textarea. Cmd/Ctrl+Enter submits." },
    { slot: "selection-toolbar-prompt-submit", note: "Submit; disabled while the instruction is empty." },
    {
      slot: "selection-toolbar-status",
      note: "Live region that announces the in-flight verb and says the result will be reviewable.",
    },
  ],
  usage:
    "Reach for it wherever a user can select prose and ask a model to change it — a document editor, a comment box, a long-form field. Give it the selected text and a handler, and treat the handler as the start of a request: run the model, then render the result as a K3 `diff-review` beside the original. Set `pending` while that request is in flight so the bar stays put and says what it is doing. Tone lives in a submenu here because the bar has room for one button; in a generation panel the same list belongs in an E4 `preset-grid`, where a visual grid earns the space it takes.",
  dos: [
    {
      text: "Keep Improve first and filled and leave every other verb as plain text — the hierarchy is what makes the bar readable at a glance.",
      example: <ImproveFirst />,
    },
    {
      text: "Return the rewrite as a reviewable change with a rationale, and show the bar as pending until it lands.",
      example: <ReturnsAReviewableDiff />,
    },
  ],
  donts: [
    {
      text: "Don't swap the paragraph in place. A silent rewrite leaves nothing to compare against and no way to reject it.",
      example: <SilentReplacement />,
    },
    {
      text: "Don't spread tone across the bar. Five tone buttons are one decision wearing five buttons, and they spend the action budget a product needs for its own verbs.",
      example: <ToneAsFiveButtons />,
    },
  ],
  pitfalls: [
    "Expecting the bar to position itself. Like the context toolbar underneath it, this component expresses `placement` but never measures the viewport — the editor knows where the selection is, so the editor decides above or below and must keep the bar off the text it belongs to.",
    "Forgetting that Tone and Custom prompt occupy two of the eight slots. Extra `actions` overflow into the menu sooner than you would expect, which is deliberate: the ceiling counts buttons the user can see, not rows you passed in. Pass `tones={[]}` if your product has no tone list and you want the slot back.",
    "Treating `pending` as a lock on your own request queue. It dims and refuses the bar's verbs, but the host still owns cancellation — if the user selects different text mid-request, drop the stale response rather than applying it to the new selection.",
    "Reading the custom prompt as navigation to a bigger surface. It is a popover with a textarea, submitted in place; sending the user to a side panel to type one sentence loses the selection that made the sentence make sense.",
  ],
};
