import type { ComponentDocs } from "@/lib/component-docs";
import {
  ConfirmSaysOk,
  CorrectionEditsInPlace,
  MissingRequiredBlocksConfirm,
  SilentlyDropsUnfilledSlot,
} from "./slot-summary.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d7-slot-summary.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. The live examples need `onCorrect`/`onConfirm` handlers, so
 * they live in the ./slot-summary.examples client sidecar and are referenced
 * here as zero-prop elements.
 */
export const SlotSummaryDocs: ComponentDocs = {
  whatItIs:
    "The read-back an agent shows just before it acts: one row per parameter it resolved, each row carrying how it got there. Values the user actually said are left unmarked; anything the model inferred, defaulted or looked up wears a badge saying so. Rows the system could not fill stay on screen as a visible ask rather than quietly disappearing, and each row carries its own correction control.",
  whyItMatters:
    "It is the difference between a user auditing an agent and a user rubber-stamping it. If an inferred value renders identically to one the user supplied, they scan the list, recognise their own words, and approve four things the model guessed at — which is the failure mode this surface exists to prevent. Google Assistant scales exactly this read-back to how reversible the action is, Rasa gives correction and slot validation first-class flows rather than treating a fix as a restart, and ServiceNow Horizon puts the same resolved-parameter card in front of its AI actions.",
  evidence: ["Google Assistant", "Rasa", "ServiceNow Horizon"],
  anatomy: [
    { slot: "slot-summary", note: "Root container holding the row list and, when handlers are supplied, the action footer." },
    {
      slot: "slot-summary-slot",
      note: "One resolved parameter. Carries `data-source` (stated / inferred / defaulted / retrieved) and, when it has no value, `data-missing` — both are addressable in tests without reaching for text.",
    },
    {
      slot: "slot-summary-blocked",
      note: "The outstanding-count line beside the footer. Renders only while a required slot is still empty, and disappears the moment the frame is complete.",
    },
  ],
  usage:
    "Reach for it in the beat between an agent understanding a request and acting on it, whenever the action has a side effect worth being sure about — sending, scheduling, cancelling, spending. Pass one `Slot` per parameter with a `source` saying how it was filled; mark the ones the action cannot proceed without as `required`, and leave their `value` undefined rather than dropping them from the array. Supply `onCorrect` to give every row an in-place fix, and `onConfirm` with a `confirmLabel` that names the consequence. For a reversible action, skip this surface entirely — a read-back before something the user can simply undo is friction charging for nothing.",
  dos: [
    {
      text: "Handle onCorrect by editing the one slot it names and leaving the rest of the frame alone — a correction is a repair, not a restart.",
      example: <CorrectionEditsInPlace />,
    },
    {
      text: "Keep a required slot you could not fill in the array with no value, so it renders as an ask and holds the confirm action closed until it is answered.",
      example: <MissingRequiredBlocksConfirm />,
    },
  ],
  donts: [
    {
      text: "Do not filter unresolved slots out of the array — a summary that shows only what it managed to fill reads as complete, and lets the agent act on a partial frame.",
      example: <SilentlyDropsUnfilledSlot />,
    },
    {
      text: "Do not leave confirmLabel at its default when the action has a real consequence — name what happens, so the last click is a decision rather than a reflex.",
      example: <ConfirmSaysOk />,
    },
  ],
  accessibility: {
    keyboard: [
      "Passing `onCorrect` puts a correction button on *every* row, not on the rows that need one — an eight-slot summary is eight tab stops before you reach the footer. There is no per-slot opt-out, so the only way to shorten the run is to hand in fewer slots.",
      "The correction, confirm and cancel controls are real buttons, so Space and Enter activate them. Nothing else is bound: no arrow-key movement between rows, no Escape on Cancel, no Enter-to-confirm from a row.",
      "While any required slot is empty the confirm button carries the native `disabled` attribute, so it is skipped by Tab entirely. A keyboard user goes from the last row straight to Cancel and is given no reason why.",
      "Rows are `<li>` elements and are not focusable. A value, its source badge and its low-confidence flag are read-only text, reachable only by reading the row — there is no keyboard path that lands on a slot.",
    ],
    screenReader: [
      "The rows are a plain `<ul>`, so the summary announces as a list with a count. Within a row the label, the value and the badges are three separate runs of text with no programmatic association — a row reads as \"Send at, 9:00am, Inferred\" because of source order, not because anything marks the label as the name of that value.",
      'The correction button is named by `aria-label={`Change ${slot.label}`}` — or `Add ${slot.label}` when the slot is empty. `label` is typed `React.ReactNode`, so an element there ships a button announced as "Change [object Object]"; only a plain string survives.',
      'The source badges are ordinary text, so "Inferred", "Default" and "From records" are announced in the row. A `stated` slot has no badge, which means an unmarked row and a user-supplied row are indistinguishable to assistive tech — that absence is the design, and it is why every other source has to keep its badge.',
      'The low-confidence flag announces as "Check this"; its warning triangle is `aria-hidden`. It is suppressed on a slot with no value, so a row that is both empty and doubtful announces only "Still needed".',
      'The blocked count — "2 still needed" — is plain text with no live region, and it is not wired to the confirm button by `aria-describedby`. Filling the last required slot silently enables the action and emptying one silently disables it; neither transition is announced.',
    ],
    focus: [
      "Nothing here moves focus. A correction re-renders the row in place, so the button that was clicked is still there and still focused — which is the point, and which also means the responsibility for taking the user somewhere useful sits in your `onCorrect`.",
      "Filling the last required slot changes the tab order rather than focus: the confirm button appears in it, between wherever the user is and wherever they were heading. Expect the run to get one stop longer mid-interaction.",
      "Every control is the vendored `Button`, which ships `focus-visible:ring-3`. This surface has a visible focus indicator without anything at the call site.",
    ],
  },
  pitfalls: [
    'Slot `label` is typed as `React.ReactNode`, but the per-row correction button builds its accessible name by interpolating it into a string — `Change ${slot.label}`. Pass a plain string. An element such as `label={<span>Send at</span>}` type-checks and renders correctly, and then ships a button announced as "Change [object Object]".',
    "The confirm button's disabled state is derived, never passed: it is computed from the slots that are `required` with no `value`. There is no prop that unblocks it, which is deliberate — the only way to enable the action is to fill the slot, and the only way to break that rule is to stop marking the slot required.",
    'The low-confidence flag is suppressed on a slot with no value — the badge is guarded on the row having something to doubt. A slot that is both empty and low-confidence renders only as "Still needed", so do not rely on `confidence` to draw attention to an absence.',
    'A `source` of "stated" renders no badge at all. That is the intended reading, not a missing case: marking every row is the same as marking none, so the quiet rows are the ones the user supplied and the badged rows are the ones that need checking.',
  ],
};
