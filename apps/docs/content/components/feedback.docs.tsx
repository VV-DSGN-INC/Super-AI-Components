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
    {
      slot: "feedback-thumbs",
      note: "Button-group housing both thumbs; carries the group's accessible name.",
    },
    {
      slot: "feedback-thumb-up",
      note: "One-click positive control. Icon-only — the name lives in aria-label.",
    },
    {
      slot: "feedback-thumb-down",
      note: "Opens the reason popover. Icon-only, same accessible-name treatment.",
    },
    { slot: "feedback-reason", note: "The reason popover's content, anchored to the thumbs-down control." },
    { slot: "feedback-reason-options", note: "Optional preset reason chips — never required to submit." },
    { slot: "feedback-reason-chip", note: "One preset reason; picking it only fills the free-text field." },
    {
      slot: "feedback-reason-input",
      note: "Free-text reason. Always usable on its own, with or without a chip.",
    },
    { slot: "feedback-reason-submit", note: "Sends the negative rating, with or without a reason attached." },
    {
      slot: "feedback-submitted",
      note: "Confirmation row. Announced via role=status, not just swapped in visually.",
    },
    { slot: "feedback-undo", note: "Always present once submitted — the only way to retract a rating." },
  ],
  usage:
    'Reach for it under any single AI response — a chat reply, a generated summary, a search answer — where a lightweight up/down read matters more than a detailed survey. Feed it `state` and `value` from wherever the rating actually lives; a thumbs-up should move straight to "submitted", a thumbs-down should move to "rating" so the reason ask can open. If the product already uses a 5-star scale for the same job, use that presentation instead of thumbs — the spec treats them as two skins on one component, not two components to maintain.',
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
  accessibility: {
    keyboard: [
      "Two tab stops at rest — thumbs up, then thumbs down — and both are real buttons, so Space and Enter work. In `submitted` both are `disabled` and leave the tab order, and the only stop left is Undo.",
      "The `rating` popover adds five: three reason chips by default, the textarea, then Send. Escape and an outside click both close it and fire `onRatingCancel`, so the ask is never a checkpoint the user has to answer.",
      "Nothing gates Send. The textarea can be empty and no chip need be picked — `onSubmit` fires either way, with `reason` simply absent from the payload.",
      'The popover is opened by `state`, not by the trigger\'s own click. A host that sets `state="rating"` from anywhere other than the thumbs-down handler opens a popup and pulls focus into it without the user having asked for it.',
      "There are no shortcuts and no arrow keys anywhere. The reason chips are plain buttons with no group navigation, so picking a preset is Tab, Tab, Space.",
    ],
    screenReader: [
      'Both thumbs are icon-only and named entirely by `aria-label` — "Helpful" and "Not helpful" by default. The glyphs are `aria-hidden`, so a caller who blanks `upLabel` or `downLabel` ships an unnamed button.',
      "They announce as toggle buttons: `aria-pressed` tracks `value`, and the pressed thumb also paints a background, so the state is carried twice and never by the fill alone.",
      'The pair sits in a `role="group"` named by `label` — "Was this helpful?" — which is where the question itself lives. Drop it and the two thumbs are two unexplained toggles.',
      'The reason popup is a dialog named "What went wrong?" through the popover\'s own title wiring, so opening it announces the ask rather than dropping the user into unlabelled fields.',
      "The reason chips announce as toggle buttons with `aria-pressed`, in no group and with no name of their own, so they arrive as three loose toggles between the dialog's title and its textarea.",
      "The textarea's accessible name is `reasonPlaceholder`, so its name and its placeholder are the same string by construction: changing the placeholder renames the field, and there is no separate label to write.",
      'The confirmation is a `role="status"` region and is the only announcement this component makes on its own. Note that the region is *inserted* rather than updated — the element mounts with its text already inside it — so assistive tech that only watches pre-existing live regions can miss it.',
      "A thumbs-up submits in one click and announces nothing until `state` reaches `submitted`. A host that records the rating without advancing the state leaves the press silent.",
    ],
    focus: [
      "Sending a negative rating is the worst case here. Send closes the popover, the host moves `state` to `submitted`, and the thumbs-down the popover would restore focus to is `disabled` by that same render — so focus falls to `<body>` and the next Tab restarts from the top of the page. Move focus to the confirmation row in your `onSubmit`.",
      "Undo has the same shape from the other side: pressing it returns the host to `idle`, the confirmation row unmounts with the button inside it, and focus is lost again. Send focus back to the thumbs group.",
      "Escape out of the reason popover is the one clean path — focus returns to the thumbs-down button, which is still enabled in `rating`.",
      "The thumbs, Send and Undo take the shadcn `Button` focus ring. The reason chips ship no `focus-visible` class of their own and fall back to the browser's default outline, which is a visibly different treatment from every other control in the popup.",
    ],
  },
  pitfalls: [
    'Firing `onSubmit` without ever moving `state` to "submitted" — the component is controlled, so a consumer that forgets this step leaves the UI stuck showing the reason popover (or nothing) even though the rating was recorded.',
    'Treating the reason popover as a form that has to be filled in before it can close. Escape and outside-click both call `onRatingCancel`; wiring that back to "idle" (not ignoring it) is what keeps the ask from feeling like a checkpoint.',
    "Reaching for a second component when a product wants a 5-star scale instead of thumbs — the spec treats them as two presentations of the same pattern, not two patterns.",
  ],
};
