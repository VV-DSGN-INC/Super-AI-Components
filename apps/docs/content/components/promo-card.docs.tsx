import type { ComponentDocs } from "@/lib/component-docs";
import {
  PersistedDismissal,
  QuotaWarningWithNumber,
  SessionOnlyDismiss,
  StackedCards,
} from "./promo-card.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b5-promo-card.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Live examples that need interactivity
 * live in the ./promo-card.examples client sidecar and get referenced here
 * as zero-prop elements — see that file for why.
 */
export const PromoCardDocs: ComponentDocs = {
  whatItIs:
    "A small, self-contained card that surfaces one of four pitches — upgrade to a paid plan, invite teammates, install an available update, or watch a usage quota — in a sidebar or rail. It carries its own dismiss control and never blocks the surface underneath it.",
  whyItMatters:
    "Every other paywall or upsell moment in this catalog is provoked by something the user did — a locked action, a blocked export, a disabled tool. Promo Card is the one exception: it shows up on its own, with no triggering action behind it, which is exactly why it has to earn its keep by staying quiet and getting out of the way the moment someone dismisses it. Descript, Spline, Zapier, Claude, and Manus all give it a fixed sidebar slot rather than interrupting the canvas.",
  evidence: ["Descript", "Spline", "Zapier", "Claude", "Manus"],
  anatomy: [
    { slot: "promo-card", note: "Root container. Renders nothing at all once dismissed." },
    {
      slot: "promo-card-art",
      note: "Optional illustration or product shot — every flavour reads fine without it.",
    },
    { slot: "promo-card-title", note: "The one line that has to carry the whole pitch." },
    { slot: "promo-card-description", note: "Optional supporting copy under the title." },
    {
      slot: "promo-card-cta",
      note: "Primary action. Only rendered when a real onCtaClick destination is supplied.",
    },
    { slot: "promo-card-dismiss", note: "Always present — every flavour is dismissible, no exceptions." },
  ],
  usage:
    "Reach for it when you want to surface an opportunity — a plan upgrade, a team invite, an available update, a usage warning — without gating anything the user is actively trying to do. If the message needs to block a specific action (an export that requires a paid plan, a tool that requires more credits), that is a different pattern attached to that action; Promo Card is only for the ambient case, sitting in a sidebar where it can be read or dismissed at leisure.",
  dos: [
    {
      text: "Persist the dismissal wherever the rest of the user's preferences already live, and feed the result back in as `dismissed` on every render — the component only knows what you tell it.",
      example: <PersistedDismissal />,
    },
    {
      text: "Give the quota-warning flavour a title with the actual number or threshold in it, not a vague 'you're running low' — the urgency has to be legible without the colour.",
      example: <QuotaWarningWithNumber />,
    },
  ],
  donts: [
    {
      text: "Don't derive `dismissed` from something that resets — a session-only flag, a variable that defaults to false on reload. If the persisted value doesn't outlive the tab, the card comes back next visit and the dismiss button reads as decorative.",
      example: <SessionOnlyDismiss />,
    },
    {
      text: "Don't stack more than one Promo Card in the same rail at once. Competing CTAs read as spam, and each additional card makes the one above it easier to dismiss without reading.",
      example: <StackedCards />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop, or two: the dismiss ✕ is always rendered, and the CTA appears only when `onCtaClick` is supplied. The ✕ comes first in the DOM, so Tab reaches the dismiss before the pitch it is meant to dismiss.",
      "Both are native buttons — Space and Enter. Escape does not dismiss the card: this is an ambient card rather than a dialog, and no key is bound to closing it.",
      "There is no `disabled` anywhere in the API. A dismissed card is not disabled, it is unmounted (`dismissed` returns `null`), so the tab order shortens rather than keeping a dead stop in it.",
    ],
    screenReader: [
      'The `quota-warning` flavour, and only that flavour, puts `role="alert"` on the card root, which makes the whole card an assertive live region — title, description and CTA announced together. It carries `role="alert"`\'s usual limitation with it: a card already present when the page loads is generally not announced at all, so the urgency lands only when the card mounts into a page that is already there.',
      'Urgency survives past colour with an `sr-only` "Warning:" ahead of the title, kept outside the title node on purpose so a `getByText(title)` still matches exactly. The flavour icon is `aria-hidden` and the tint carries nothing, so those two — the prefix and the words of the title — are the whole non-visual signal.',
      'The dismiss button is named by `dismissLabel`, which defaults to the bare word "Dismiss". Two promo cards in one rail therefore give a screen-reader user two identically-named buttons and no way to tell which pitch each one closes; pass "Dismiss upgrade prompt" and so on if you cannot avoid the stack.',
      'The CTA is named by `ctaLabel`, defaulting to "Learn more" — the same collision in the same rail, and it says nothing about where it goes.',
      "The card has no role of its own outside `quota-warning`, no accessible name, and no heading — the title is a `<p>`. It is not reachable by heading or by landmark, so it is found in reading order or by tabbing to its buttons.",
    ],
    focus: [
      "Dismissing unmounts the card, including the ✕ that had focus, and nothing restores it: focus falls to `<body>` and the next Tab restarts from the top of the page. In a sidebar that is the difference between closing one card and losing your place on the whole page — move focus to the rail, or to whatever follows, inside `onDismiss`.",
      "The same happens whenever your persisted `dismissed` flips true from elsewhere, since the component's only response to it is to render nothing.",
      "Both buttons inherit the vendored `Button`'s `focus-visible` ring; this component adds no focus styling of its own.",
    ],
  },
  pitfalls: [
    "Four flavours, one component — resist forking upgrade/invite/update-available/quota-warning into four separate components. The copy and tone differ; the dismiss contract, layout, and accessibility handling should not, and a fork is how one of the four quietly stops being dismissible.",
    "The CTA is opt-in on purpose: it only renders when `onCtaClick` is supplied. Don't pass a `ctaLabel` without a real destination behind it — a button that goes nowhere is worse than no button.",
    "Quota-warning's urgency is carried by icon shape, copy, and an alert role together, not by colour alone — restyling it down to 'the red one' will pass a glance test and fail a screen reader.",
  ],
};