import type { ComponentDocs } from "@/lib/component-docs";
import {
  AddOnAsAThirdPlan,
  AddOnStaysARow,
  AnnualPricedLevel,
  AnnualUnderMonthly,
  FeaturesAsOneFlatList,
  FeaturesGroupedByArea,
} from "./pricing-table.examples";

/**
 * Seeded from docs/design-system/component-specs.md#m4-pricing-table.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The live examples hold state and pass `onToggle`, so
 * they live in the ./pricing-table.examples client sidecar and are referenced
 * here as zero-prop elements.
 */
export const PricingTableDocs: ComponentDocs = {
  whatItIs:
    "The plan comparison surface: a monthly/yearly toggle above a row of plan cards, with optional add-on rows underneath. Each card carries a price, a call to action, and feature lists grouped by product area rather than one long column of ticks. The annual saving is computed from the plans you pass, not typed in — the component reads the best monthly-to-yearly ratio across your paid tiers and renders that percentage on the toggle.",
  whyItMatters:
    "Upgrade surfaces in AI products are comparison problems before they are payment problems: the tiers differ by credits, model access and seats all at once, and a flat tick list makes those incomparable. Spline's upgrade modal, Tripo, Lovable and Descript all solve it the same way — group the features by area so the reader can scan one area across tiers. The billing toggle is doing similar work: annual sits under monthly so the cheaper number is the one being compared against, which is why the saving is derived rather than decorative.",
  evidence: ["Spline", "Tripo", "Lovable", "Descript"],
  anatomy: [
    { slot: "pricing-table", note: "Root column holding the period toggle, the plan grid and any add-ons." },
    {
      slot: "pricing-table-period",
      note: "The billing-period control, a radiogroup of monthly/yearly options.",
    },
    {
      slot: "pricing-table-period-option",
      note: "One period option. The selected one is marked by a raised pill, not by text colour.",
    },
    {
      slot: "pricing-table-save-badge",
      note: "The derived annual saving, rendered on the yearly option — absent when no paid plan is cheaper yearly.",
    },
    { slot: "pricing-table-plan", note: "One plan card. Carries data-highlighted and data-current." },
    { slot: "pricing-table-current", note: "The pin marking the plan the account is already on." },
    { slot: "pricing-table-price", note: "The per-month price, with a billed-yearly qualifier under the yearly period." },
    { slot: "pricing-table-cta", note: "The plan's action button; disabled on the current plan." },
    {
      slot: "pricing-table-feature-group",
      note: "One product area inside a card, with its sub-heading and tick list.",
    },
    { slot: "pricing-table-addons", note: "The add-on container, a bordered list rather than a card grid." },
    { slot: "pricing-table-addon", note: "One add-on row: name, price, and a switch." },
    { slot: "pricing-table-addon-switch", note: "The add-on's on/off control, always fully controlled by you." },
  ],
  usage:
    "Reach for it on a dedicated pricing or upgrade page where someone is choosing between tiers deliberately. Pass `plans` with both a `monthly` and a `yearly` per-month figure — the yearly one is the annualised rate, and the saving badge is computed from the gap. Leave `period` off to let the component manage the toggle itself; pass `period` with `onPeriodChange` when the choice needs to persist or be shared with a checkout step. Mark the account's existing tier with `current` so its button reads as a state rather than an offer, and put anything metered or optional in `addOns` instead of inventing a fourth plan. When the user is not choosing but has been stopped mid-task, use `paywall-message` instead — it holds the blocked work open, which this component cannot.",
  dos: [
    {
      text: "Price annual below monthly so the toggle has something to anchor, and let the saving badge derive itself.",
      example: <AnnualUnderMonthly />,
    },
    {
      text: "Group each plan's features by product area so a reader can compare one area across tiers.",
      example: <FeaturesGroupedByArea />,
    },
    {
      text: "Keep metered extras in addOns, where the switch says they are optional and additive.",
      example: <AddOnStaysARow />,
    },
  ],
  donts: [
    {
      text: "Do not ship a yearly price level with monthly and expect the toggle to explain itself — the badge disappears and the control becomes two words that change nothing visible.",
      example: <AnnualPricedLevel />,
    },
    {
      text: "Do not promote an add-on into the plan grid; as a card it reads as a tier you choose instead of an extra you add to one.",
      example: <AddOnAsAThirdPlan />,
    },
    {
      text: "Do not collapse the groups into a single Included list — twenty flat ticks is the wall of text the grouping exists to prevent.",
      example: <FeaturesAsOneFlatList />,
    },
  ],
  accessibility: {
    keyboard: [
      'The period control is `role="radiogroup"` but is not wired like one. Both options are ordinary tab stops, there is no roving tabindex, and the arrow keys do nothing — a keyboard user reaches `yearly` with Tab, not with Right. Home and End do nothing either.',
      "One tab stop per plan card, its CTA — except on the plan marked `current`, whose button is `disabled` and therefore skipped outright. A keyboard user tabbing the grid passes over the plan they are already on without stopping on it.",
      'Each add-on row adds one stop: the switch, a native `<button role="switch">`, so Space and Enter toggle it. It holds no internal state, so a switch with no `onToggle` takes focus, accepts the keypress and changes nothing while still announcing as operable.',
      "Nothing else is bound. Feature lists are static text and there is no shortcut between cards, so comparing two tiers from the keyboard means tabbing past every CTA in between.",
    ],
    screenReader: [
      'The period group is named "Billing period" and each option reports `aria-checked`. The saving badge sits inside the yearly button, so that option\'s accessible name is "yearly Save 20%" — the badge is part of the control\'s name rather than an annotation beside it.',
      "Switching period rewrites every price on the page and announces none of it. There is no live region anywhere in this component, so a screen-reader user who toggles to yearly hears the radio state change and then has to walk back through the cards to learn what the numbers became.",
      'Each plan\'s name is an `<h3>`, so the cards are reachable by heading. The feature-group titles are not — "Generation", "Collaboration" and the rest are styled `<p>` elements — so the sub-structure that makes the tiers comparable is invisible to a heading rotor, which is the one navigation a comparison surface most needs.',
      'The tick glyph on every feature is `aria-hidden`, so a feature reads as its own text with no "included" prefix. That is fine in a table where every listed feature is included, and stops being fine the moment you render a feature a plan does not have.',
      '`current` is announced twice and well: a visible "Current" pin beside the plan name, and the CTA\'s own disabled state under the label "Current plan". `highlighted` is announced not at all — it is a `ring-primary` and a `data-highlighted` attribute with no text and no ARIA behind it, so "Most popular" has to be words you put in `description` or `cta`.',
      'The add-on switch is named by `aria-label={addOn.name}` alone, so it announces as "Priority rendering, switch, off". The price sitting beside it is separate text and never joins the name, so the switch never says what turning it on costs.',
    ],
    focus: [
      "Nothing in the component moves focus. Switching period rewrites the prices in place and every control keeps its identity, so a focused CTA stays focused across the toggle.",
      "The one way focus is lost here is caller-driven: marking a plan `current` disables its CTA, and a button disabled while focused is blurred by the browser, dropping focus to `<body>`. If you flip `current` in response to a purchase, put focus somewhere deliberate in the same beat.",
      "Every control draws its own `focus-visible:ring-2` — the period options, the plan CTAs and the add-on switches — so focus is visible without any global style.",
    ],
  },
  pitfalls: [
    "The add-on switch is fully controlled and has no internal state: it renders `enabled` and calls `onToggle` with the value you should move to. Pass an add-on without `onToggle` and its switch is inert — it will animate nothing and report nothing, while still reading to a screen reader as an operable switch.",
    "`monthly` and `yearly` are both per-month numbers. `yearly` is the annualised monthly rate, not the annual total, and the card appends the billed-yearly qualifier itself. Passing an annual total renders a price twelve times too large and computes a nonsense saving.",
    "The saving badge is derived from the plans, so it silently disappears when no paid plan has `yearly` below `monthly`. There is no prop to force it, and a free-only table never shows one.",
    "The period control is a radiogroup of buttons and each option is its own tab stop; it does not implement the roving-tabindex-plus-arrow-keys pattern the ARIA radiogroup role usually implies. Keyboard users reach the second option with Tab, not with an arrow key.",
    "`plans` drives the grid, which is capped at three columns from the large breakpoint. Passing more than three tiers wraps them onto a second row rather than compressing them, which usually is not the comparison you wanted.",
  ],
};
