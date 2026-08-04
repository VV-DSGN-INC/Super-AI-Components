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
  pitfalls: [
    "Four flavours, one component — resist forking upgrade/invite/update-available/quota-warning into four separate components. The copy and tone differ; the dismiss contract, layout, and accessibility handling should not, and a fork is how one of the four quietly stops being dismissible.",
    "The CTA is opt-in on purpose: it only renders when `onCtaClick` is supplied. Don't pass a `ctaLabel` without a real destination behind it — a button that goes nowhere is worse than no button.",
    "Quota-warning's urgency is carried by icon shape, copy, and an alert role together, not by colour alone — restyling it down to 'the red one' will pass a glance test and fail a screen reader.",
  ],
};