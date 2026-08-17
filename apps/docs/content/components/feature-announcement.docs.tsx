import type { ComponentDocs } from "@/lib/component-docs";
import {
  ChipForATweak,
  ColourOnlyNewDot,
  ModalForATweak,
  StageBadgeSetsExpectations,
} from "./feature-announcement.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l3-feature-announcement.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Every live example lives in the ./feature-announcement.examples
 * client sidecar and is referenced here as a zero-prop element, so a handler
 * like `onDismiss` never crosses the server/client boundary.
 */
export const FeatureAnnouncementDocs: ComponentDocs = {
  whatItIs:
    "The surface that tells a user something in the product changed. One component with four escalation levels — a modal, a popover anchored to the control the feature lives on, an inline card, and a dismissible chip — chosen with a single `level` prop. Content is identical across all four: the same headline, description, stage badge, and call to action.",
  whyItMatters:
    "Announcing a feature is one decision (what is the news?) and one judgement (how loud should it be?), and the second is where products go wrong. Airtable Omni and Spline Hana both interrupt for genuinely new capabilities; the Claude usage chip and Pixlr's What's New entry point sit quietly until you look at them. Making the four presentations one prop apart means downgrading a modal to a chip costs a word instead of a rewrite, so escalation gets argued about at review time rather than defended forever.",
  evidence: ["Airtable Omni", "Spline Hana", "Claude usage chip", "Pixlr What's New"],
  anatomy: [
    {
      slot: "feature-announcement",
      note: "Root. Carries `data-level` and `data-announcement-id`; it is the dialog popup, the popover popup, the card, or the chip depending on `level`.",
    },
    {
      slot: "feature-announcement-anchor",
      note: "`anchored` only — the trigger the popover points at. Pass the feature's own control as `anchor`.",
    },
    {
      slot: "feature-announcement-stage",
      note: "New / Beta / Preview / version badge. Always a word, never a bare coloured dot.",
    },
    {
      slot: "feature-announcement-title",
      note: "The headline, and the source of the dismiss control's name.",
    },
    { slot: "feature-announcement-description", note: "One or two sentences of what actually changed." },
    {
      slot: "feature-announcement-media",
      note: "Screenshot or loop. Rendered by modal, anchored and inline-card; the chip drops it.",
    },
    { slot: "feature-announcement-cta", note: "Lands the user in the feature, not on a marketing page." },
    {
      slot: "feature-announcement-dismiss",
      note: "The icon-only close. Named after the announcement, not labelled 'Close'.",
    },
  ],
  usage:
    "Pick the level from the size of the news, not the size of the launch you wish you were having. Reach for `modal` when the product genuinely works differently and the user needs to know before their next action; `anchored` when a new control appeared and the announcement should point at it; `inline-card` when it is worth reading in the flow of a surface but nothing should block; `dismissible-chip` for a tweak, a rename, or a raised limit. Give every announcement a stable `id` and wire `onDismiss(id)` to whatever your app already persists — the component never stores anything, so a dismissed announcement stays dismissed only if you feed the answer back in as `dismissed`. When one announcement has more to say than a card can hold, that is the signal to reach for `whats-new` instead of escalating this to a modal.",
  dos: [
    {
      text: "Match escalation to the news — a raised export limit is a chip, not a modal.",
      example: <ChipForATweak />,
    },
    {
      text: "Carry a stage badge whenever the feature is not finished, so expectations are set before the click.",
      example: <StageBadgeSetsExpectations />,
    },
  ],
  donts: [
    {
      text: "Don't interrupt for a minor tweak. A modal for news a chip could carry teaches users to close announcements unread.",
      example: <ModalForATweak />,
    },
    {
      text: "Don't reduce the stage to a coloured dot — the word is what makes Beta mean something to a colourblind or screen-reader user.",
      example: <ColourOnlyNewDot />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab stops are per level, and the loud levels have fewer than they look. `modal` is the dismiss button plus the CTA — `showCloseButton` is off, so the ✕ this component renders is the only close control inside the dialog. `anchored` is one stop for the trigger, then the same two inside the popup.",
      "`inline-card` and `dismissible-chip` are two stops each, CTA then dismiss in DOM order, and neither is modal. Escape does nothing on those levels because there is nothing to close.",
      "For `modal` and `anchored`, Escape and an outside click both close *and* dismiss: they route through the same handler as the ✕ and fire `onDismiss(id)`. All three exits are the same exit, because an announcement that came back after Escape would read as a bug.",
      "The `anchored` level's trigger is whatever you pass as `anchor`. Pass something unfocusable — a `div`, a `span` — and the popup has no keyboard opener at all; pass the feature's real button instead.",
    ],
    screenReader: [
      'The dismiss control is named "Dismiss announcement: <title>", built from `title`, which is typed as `string` rather than `ReactNode`. That is what makes the name reliable here: it cannot silently collapse the way a name assembled from an arbitrary child would, so several announcements on one screen stay distinguishable.',
      '`modal` announces as a dialog named by its `DialogTitle`. `anchored` renders a popup that is also `role="dialog"`, named by an explicit `aria-labelledby` pointing at the visible title — without that line it would be a dialog with no name, which axe fails outright.',
      "`inline-card` and `dismissible-chip` carry no role at all. They are a card and a `div`, announced in reading order, with nothing marking where the announcement starts or ends.",
      'The stage is a `Badge` carrying its own word — "New", "Beta", "Preview", or your version string — so it is always announced as text. Only the tint depends on the recognised stage names; an unrecognised value still renders the word.',
      "The ✕ glyph is `aria-hidden`. The media node is yours: an `<img>` passed as `media` needs real `alt`, and a decorative loop needs `aria-hidden` at the call site.",
      "Nothing announces an announcement arriving. The two quiet levels are ordinary content with no live region, so an `inline-card` that appears mid-session is silent until the user reaches it. Dismissal is silent too — the component returns `null` and says nothing about what went away.",
    ],
    focus: [
      "Dismissing unmounts the component outright: `dismissed` short-circuits before anything renders, so the button that had focus disappears and focus falls to `<body>`. On the two quiet levels there is nothing left to restore it — move focus to the surrounding surface in your `onDismiss`.",
      "`modal` is rendered without a `DialogTrigger`, so on close the dialog has no trigger to return focus to. The restore target is whatever was focused beforehand, which for an announcement that is open on mount may be nothing at all.",
      "`anchored` returns focus to its trigger cleanly — unless you feed `dismissed` straight back, which unmounts the trigger along with the popup and drops focus to `<body>` anyway.",
      "Every control here is a shadcn `Button` and carries the house `focus-visible` ring. A custom `anchor` brings its own.",
    ],
  },
  pitfalls: [
    "Expecting the component to remember the dismissal. It deliberately writes nothing — no localStorage, no cookie, no request. Dismissing emits `onDismiss(id)` and nothing else; if you don't persist that id and pass `dismissed` back in, the announcement returns on the next page load, which is the single most-disliked behaviour on this surface.",
    "Minting a new `id` for the same news — a copy edit, a re-launch, a rebuild that regenerates ids. Every user who already dismissed it sees it again. Treat the id as the identity of the news, and change it only when the news changes.",
    "Letting the dismiss control fall back to a generic 'Close'. The default accessible name is 'Dismiss announcement: <title>', which is what makes several announcements on one screen distinguishable to a screen-reader user. Override `dismissLabel` only with something equally specific.",
    "Assuming Escape or a click on the backdrop is 'not really' a dismissal. For the modal and anchored levels, closing is dismissing: both fire `onDismiss(id)`, because an announcement that comes back after you pressed Escape reads as a bug.",
    "Passing `media` to the chip level and wondering where it went. The chip is a line of text by definition; if the news needs a picture, it needs a louder level.",
  ],
};
