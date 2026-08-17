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
  accessibility: {
    keyboard: [
      'The whole bar is **one** tab stop, however many verbs are in it. It is a `role="toolbar"` with a roving tabindex, so Tab enters and leaves; Left and Right move between buttons inside, and they wrap at both ends.',
      "Order along the bar is fixed: Improve, then Shorten and Expand and any `actions` you added, then Tone, then Custom prompt, then the overflow trigger. Tone and Custom prompt sit before overflow because they are children of the bar rather than rows in `actions`.",
      "Space and Enter activate a verb. Tone opens a menu — Up and Down move through tones, typeahead jumps, Escape closes and returns focus to the Tone button. Custom prompt opens a popover; Escape closes that too.",
      "In the prompt popover, Cmd/Ctrl+Enter submits and plain Enter inserts a newline. The Submit button is natively `disabled` while the instruction is empty, so it is not focusable at all until you have typed something.",
      '`pending` does **not** remove the verbs from keyboard travel. Base UI\'s toolbar buttons stay focusable when disabled and report `aria-disabled="true"` rather than the native attribute, so an in-flight bar can still be arrowed through and its buttons still take focus — they simply refuse to fire.',
    ],
    screenReader: [
      'The bar announces as a toolbar named "AI writing tools" by default, overridable through `label`. That name matters more than it looks: a canvas can hold several toolbars and the name is the only thing that tells them apart.',
      'Improve, Shorten and Expand draw their labels, and every icon — including the in-flight spinner, which replaces the icon inside the same `aria-hidden` wrapper — is hidden from assistive tech. So a button\'s name does not change while its request is running: "Shorten" stays "Shorten", now `aria-disabled`.',
      '`selection-toolbar-status` is an always-mounted `role="status"` region and is the only thing that reports work starting. It announces the verb and the contract in one breath — "Shortening the selection. The result will arrive as a change you can review" — which is deliberate: without the second sentence a user is left expecting their paragraph to change underneath them.',
      "If your host never sets `pending`, that region stays empty and choosing a verb is announced as nothing at all. The bar has no other feedback path.",
      'The custom-prompt popover is a dialog named by its title, with the quoted selection as its description — so entering it announces "Custom instruction" and then the snippet being rewritten. The textarea takes its name from `promptPlaceholder` via `aria-label`, which is why the placeholder and the name are the same string rather than the placeholder standing in for a label.',
      "The tone submenu is a menu of `menuitem`s named by their tone labels. Nothing marks the current tone as chosen — this is a menu that fires an intent, not a set of radios, so no tone is ever reported as selected.",
    ],
    focus: [
      "Closing either popup returns focus to the button that opened it — the Tone button after picking a tone, the Custom prompt button after submitting. That is Base UI's doing and it is correct.",
      "The bar does not take focus when it appears over a selection. A keyboard user has to Tab to it, and where it lands in the tab order is wherever your editor renders it.",
      "Nothing here moves focus to the result. When the rewrite comes back as a `diff-review`, moving focus to it is the host's job.",
      "`pending` arriving while a verb has focus does not steal it, because the buttons are `aria-disabled` rather than natively disabled. This is the one place in the family where a busy state does not drop focus to `<body>`.",
      "Every button is a vendored `Button` and ships a `focus-visible` ring.",
    ],
  },
  pitfalls: [
    "Expecting the bar to position itself. Like the context toolbar underneath it, this component expresses `placement` but never measures the viewport — the editor knows where the selection is, so the editor decides above or below and must keep the bar off the text it belongs to.",
    "Forgetting that Tone and Custom prompt occupy two of the eight slots. Extra `actions` overflow into the menu sooner than you would expect, which is deliberate: the ceiling counts buttons the user can see, not rows you passed in. Pass `tones={[]}` if your product has no tone list and you want the slot back.",
    "Treating `pending` as a lock on your own request queue. It dims and refuses the bar's verbs, but the host still owns cancellation — if the user selects different text mid-request, drop the stale response rather than applying it to the new selection.",
    "Reading the custom prompt as navigation to a bigger surface. It is a popover with a textarea, submitted in place; sending the user to a side panel to type one sentence loses the selection that made the sentence make sense.",
  ],
};
