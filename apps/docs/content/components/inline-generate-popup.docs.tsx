import type { ComponentDocs } from "@/lib/component-docs";
import {
  CancellableRun,
  CommitsInsideThePopover,
  ContextInsteadOfInstructions,
  FlippedAboveTheCaret,
  InstructionTemplatePlaceholder,
} from "./inline-generate-popup.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k2-inline-generate-popup.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * so on directly. Anything interactive lives in the
 * ./inline-generate-popup.examples client sidecar and is referenced below as a
 * zero-prop element.
 */
export const InlineGeneratePopupDocs: ComponentDocs = {
  whatItIs:
    "The small prompt surface that opens where the cursor is when someone asks for writing they have not written yet. It shows what it inherited from the document around it, takes a short prompt, announces the run, and lets you stop it. What it never does is show you the result: the moment text exists it leaves through a callback and becomes a document block.",
  whyItMatters:
    "Notion AI, Simplified, Canva docs and Spellbook all put the same surface in the same place, and the reason it works is the split it enforces. Generating is transient — a popover is exactly the right weight for a request you might abandon. Committing is permanent — it has to survive save, reload and export, which a popover cannot promise. Products that blur the two end up with drafts that vanish when you click away, or a popover that has quietly grown an editor inside it. Anchoring at the caret is the other half: it is what makes the insertion point unambiguous, so nobody has to guess where the paragraph will land.",
  evidence: ["Notion AI", "Simplified", "Canva docs", "Spellbook"],
  anatomy: [
    {
      slot: "inline-generate-popup",
      note: "The popup itself, a role=dialog named by its title. Carries data-state and data-placement.",
    },
    {
      slot: "inline-generate-popup-trigger",
      note: "Fallback control for hosts with no caret rect. Not rendered when `anchor` is supplied.",
    },
    { slot: "inline-generate-popup-title", note: "Visible heading, and the dialog's accessible name." },
    {
      slot: "inline-generate-popup-context",
      note: "What the popup inherited — usually the heading above. Also the dialog's description.",
    },
    { slot: "inline-generate-popup-prompt", note: "The prompt field. Enter sends, Shift+Enter breaks the line." },
    {
      slot: "inline-generate-popup-status",
      note: "Live region, present in every state. Carries the generating and cancelled sentences.",
    },
    {
      slot: "inline-generate-popup-actions",
      note: "Generate, Try again, or Cancel — one button, whichever the state calls for.",
    },
    { slot: "inline-generate-popup-cancel", note: "The Cancel control. Only in the generating state." },
    { slot: "inline-generate-popup-submit", note: "Generate, relabelled Try again after a cancel." },
  ],
  usage:
    "Reach for it when someone is in a document and wants text where the cursor is — an empty line under a heading, a blank cell in a brief, the gap between two paragraphs. Measure the caret in your editor and hand the rect over as `anchor` (an element, a ref, or a virtual element), then set `placement` to the side you flipped to. Pass the structure it sits under as `context`. Drive `state` from your own request: `generating` while the model runs, `cancelled` when the user stops it. When the text arrives, pass it as `result` — the popup hands it to `onCommit` and closes, and you render it as a K1 ai-doc-block. If you find yourself wanting to show the draft inside the popover, that is the signal you wanted K1 all along.",
  dos: [
    {
      text: "Let the surrounding structure do the explaining — pass the heading as `context` and keep the prompt to a phrase.",
      example: <ContextInsteadOfInstructions />,
    },
    {
      text: "Announce the run and keep it interruptible: the generating state carries a live region and a real Cancel button.",
      example: <CancellableRun />,
    },
    {
      text: "Set `placement` from wherever your host decided to draw the popup, so it never covers the line it is writing into.",
      example: <FlippedAboveTheCaret />,
    },
  ],
  donts: [
    {
      text: "Don't render the draft in the popover with its own accept and discard verbs — that is a K1 ai-doc-block, and it belongs in the document where it can survive a reload.",
      example: <CommitsInsideThePopover />,
    },
    {
      text: "Don't ask for an instruction the document already gives you. A placeholder listing topic, tone, audience and length is the component wasting its own context.",
      example: <InstructionTemplatePlaceholder />,
    },
  ],
  accessibility: {
    keyboard: [
      "Two tab stops inside the popup: the prompt field, then whichever single button the state calls for — Generate, Try again, or Cancel. It is one stop while the prompt is empty, because Generate is `disabled` until there is something to send.",
      "Enter sends and Shift+Enter breaks the line. The handler checks `event.nativeEvent.isComposing`, so the Enter that commits an IME composition does not fire a request, and a second Enter mid-run is ignored as well.",
      "Escape closes the popup. It does not cancel the run — cancelling is the Cancel button — so closing while `generating` leaves your request in flight, which the component cannot reach into.",
      "While generating, the prompt field is `readOnly` rather than `disabled`. It keeps its tab stop, stays readable and stays in the accessibility tree; only editing is blocked. That is the difference between this and the prompt surfaces in the registry that grey themselves out mid-run.",
      "There is no keyboard route to the result, because there is no result here. Commit happens through `onCommit` and the popup closes — whatever you render next has to take the focus.",
    ],
    screenReader: [
      "The popup is `role=\"dialog\"` named by `title`, which is why `title` is not optional: an unnamed dialog is an outright axe `aria-dialog-name` failure. Replacing it with an icon or an empty string breaks the gate, not merely the announcement.",
      "`context`, when supplied, becomes the dialog's accessible description, so the popup announces as \"Generate here\" plus \"Under Q3 revenue drivers\" rather than making the person hunt for what they are writing under. Omit `context` and the dialog has a name and no description at all.",
      "The prompt field is named by `aria-label` (`promptLabel`, default \"Prompt\"). There is no visible label — the placeholder is not one, and it is deliberately four words rather than an instruction template.",
      "`inline-generate-popup-status` is a `role=\"status\" aria-live=\"polite\"` paragraph mounted in every state with a `min-h-4` and an empty string in it. That is what makes the first announcement fire: a live region that appears at the same moment as its content is usually missed.",
      "Cancelled is announced in words — `cancelledLabel`, \"Cancelled. Nothing was inserted.\" — and the primary button relabels itself to `retryLabel`. Neither the dashed treatment nor the icon carries the meaning; both glyphs are `aria-hidden`.",
      "`data-state` and `data-placement` announce as nothing. They exist for tests and for your own styling; the state a screen-reader user hears is the live region's sentence.",
    ],
    focus: [
      "Opening the popup moves focus into it. With a `trigger`, closing returns focus to that trigger. With an `anchor` there is no trigger at all — so when the popup closes, whether on commit, on Escape or on an outside click, focus falls to `<body>` and the next Tab restarts from the top of the page. Take focus in your `onCommit` and put it on the block you just inserted, which is the insertion point the user was aiming at anyway.",
      "`defaultOpen` is `true`, so a popup rendered with an `anchor` takes focus the moment it mounts. That is right for a surface opened by a click on an empty line and wrong if you mount it speculatively — control `open` if the popup can exist before anyone asked for it.",
      "The buttons use the standard Button ring and the field the standard Textarea ring, so nothing here depends on a focus style you have to supply.",
    ],
  },
  pitfalls: [
    "Expecting the popup to find the caret. It measures nothing — a registry component owns no editor and cannot read a selection range. You compute the caret rect (a virtual element with getBoundingClientRect is the usual trick) and pass it as `anchor`; you decide whether there is room below and pass `placement`. Both decisions land on the DOM as `data-placement` so they are visible in a snapshot.",
    "Waiting for the popup to render the result. There is no state that draws generated text, on purpose. `result` goes in, `onCommit` fires once with it, the popup closes — if nothing appears in your document, the missing piece is your `onCommit` handler, not the component.",
    "Sending a late result after a cancel. Cancelled means nothing was committed, so a `result` arriving while `state=\"cancelled\"` is discarded rather than quietly inserted. Abort your own request too — the component cannot reach into your fetch.",
    "Treating the cancelled state as a colour. It says so in words in the live region, and the primary button relabels itself to Try again, because a faded border is invisible in greyscale and silent to a screen reader.",
    "Dropping the title. Base UI renders the popup as role=dialog, and a dialog without an accessible name fails axe (aria-dialog-name) outright. The title supplies it, so replacing it with an icon or an empty string breaks the gate.",
    "Reaching for an import of K1 ai-doc-block. The handoff is the `onCommit` callback so the dependency runs one way, and so this popup stays usable in hosts whose document nodes are their own.",
    "Assuming the vendored PopoverContent would have done. It forwards side, align and the offsets but not `anchor`, which is the one prop caret anchoring needs — this component composes Base UI's Portal, Positioner and Popup directly for that reason and keeps the wrapper for Root, Trigger, Title and Description.",
  ],
};
