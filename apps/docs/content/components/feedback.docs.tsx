import type { ComponentDocs } from "@/lib/component-docs";
import { NoWayBack, OneClickPositive, OptionalReasonChips, ReasonGatedPraise } from "./feedback.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n1-feedback.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "feedback.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./feedback.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<Feedback onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const FeedbackDocs: ComponentDocs = {
  whatItIs:
    "A thumbs-up / thumbs-down control for rating a single response, with an optional reason popover behind the negative thumb. It's controlled: it renders whichever of idle, rating, or submitted it's given, and the consumer wires the transitions and owns wherever the rating actually gets persisted.",
  whyItMatters:
    "Asymmetric friction is the whole point of the pattern: Claude's thumbs and Manus's star rating both let a positive reaction land in one click, while a negative one only asks for a reason after the fact — never before. Playground and Freepik reuse the same shape for lighter, tool-embedded feedback. Gate praise behind the same popover a complaint gets, and the positive signal all but disappears, because most people who'd have clicked one thumb won't click through a form for it.",
  evidence: ["Manus", "Claude", "Playground", "Freepik"],
  anatomy: [
    { slot: "feedback", note: "Root wrapper around the thumbs and, once submitted, the confirmation row." },
    { slot: "feedback-thumbs", note: "Button-group housing both thumbs; carries the group's accessible name." },
    { slot: "feedback-thumb-up", note: "One-click positive control. Icon-only — the name lives in aria-label." },
    { slot: "feedback-thumb-down", note: "Opens the reason popover. Icon-only, same accessible-name treatment." },
    { slot: "feedback-reason", note: "The reason popover's content, anchored to the thumbs-down control." },
    { slot: "feedback-reason-options", note: "Optional preset reason chips — never required to submit." },
    { slot: "feedback-reason-chip", note: "One preset reason; picking it only fills the free-text field." },
    { slot: "feedback-reason-input", note: "Free-text reason. Always usable on its own, with or without a chip." },
    { slot: "feedback-reason-submit", note: "Sends the negative rating, with or without a reason attached." },
    { slot: "feedback-submitted", note: "Confirmation row. Announced via role=status, not just swapped in visually." },
    { slot: "feedback-undo", note: "Always present once submitted — the only way to retract a rating." },
  ],
  usage:
    "Reach for it under any single AI response — a chat reply, a generated summary, a search answer — where a lightweight up/down read matters more than a detailed survey. Feed it `state` and `value` from wherever the rating actually lives; a thumbs-up should move straight to \"submitted\", a thumbs-down should move to \"rating\" so the reason ask can open. If the product already uses a 5-star scale for the same job, use that presentation instead of thumbs — the spec treats them as two skins on one component, not two components to maintain.",
  dos: [
    {
      text: "Let a thumbs-up submit in one click — don't route it through the same reason popover a thumbs-down gets.",
      example: <OneClickPositive />,
    },
    {
      text: "Keep every reason chip optional and let the free-text field submit on its own — Send has to work with nothing filled in.",
      example: <OptionalReasonChips />,
    },
  ],
  donts: [
    {
      text: "Don't ask for a reason on praise. Gating the positive thumb behind the same popover the negative one gets suppresses the signal you were trying to collect.",
      example: <ReasonGatedPraise />,
    },
    {
      text: "Don't ship a submitted confirmation with no way back — feedback that can't be retracted is feedback people stop giving.",
      example: <NoWayBack />,
    },
  ],
  pitfalls: [
    "Firing `onSubmit` without ever moving `state` to \"submitted\" — the component is controlled, so a consumer that forgets this step leaves the UI stuck showing the reason popover (or nothing) even though the rating was recorded.",
    "Treating the reason popover as a form that has to be filled in before it can close. Escape and outside-click both call `onRatingCancel`; wiring that back to \"idle\" (not ignoring it) is what keeps the ask from feeling like a checkpoint.",
    "Reaching for a second component when a product wants a 5-star scale instead of thumbs — the spec treats them as two presentations of the same pattern, not two patterns.",
  ],
};
