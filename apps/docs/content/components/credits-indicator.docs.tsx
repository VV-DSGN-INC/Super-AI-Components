import type { ComponentDocs } from "@/lib/component-docs";
import {
  BalanceIsAWayIntoThePlan,
  NoThresholdUntilZero,
  RingCarriesTheProportion,
  TopUpMovesTheNumberEarly,
} from "./credits-indicator.examples";

/**
 * Seeded from docs/design-system/component-specs.md#m2-credits-indicator.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Every do and don't below is a rule about
 * wiring, and wiring means a handler — which cannot cross the server/client
 * boundary from this file. The examples therefore live in the
 * ./credits-indicator.examples client sidecar and arrive here as zero-prop
 * elements.
 */
export const CreditsIndicatorDocs: ComponentDocs = {
  whatItIs:
    "A small, always-on pill showing how much of the plan's allowance is left. It renders either a bare counter or a progress ring against the plan total, moves through three states as the balance falls — normal, low, then empty — and can carry a Top up control beside the number. The alarm states repaint the whole pill rather than tinting the text, so the change is legible at 12px.",
  whyItMatters:
    'Quota pricing needs one place that is always true. Freepik, Tripo, Simplified and Descript all park a running balance in the chrome, because in a metered product "can I afford to run this again" comes up between every action, and a number you have to go and find is a number nobody checks. It is also the app-level ring of a three-part cost contract: this component is what\'s left, `cost-chip` is what the next action costs, `run-button` is the price at the moment of commitment. Three surfaces over one number — and if any two of them disagree, people stop trusting all three.',
  evidence: ["Freepik", "Tripo", "Simplified", "Descript"],
  anatomy: [
    {
      slot: "credits-indicator",
      note: 'The pill itself. Carries data-state="normal" | "low" | "empty", which is what paints the surface — style against that attribute rather than recomputing the threshold yourself.',
    },
    {
      slot: "credits-indicator-trigger",
      note: "The balance as a button through to plan management. Present only when you pass onManage; without it the balance is plain text and nothing is focusable.",
    },
    {
      slot: "credits-indicator-balance",
      note: 'The number and its unit. Pinned dir="ltr" and tabular-nums so digits keep their order in RTL and don\'t jitter as the balance ticks down.',
    },
    {
      slot: "credits-indicator-top-up",
      note: "The Top up control, present only with onTopUp. A sibling of the trigger, never nested inside it.",
    },
  ],
  usage:
    'Put it in the topbar or account area, where it survives navigation and stays visible for the whole session. Pass `balance`, and pass `total` too whenever the plan has an allowance — with a total it can draw the ring and derive the low threshold on its own, and `form="ring"` needs the denominator to have anything to draw. Wire `onManage` so the number is a route into billing, and add `onTopUp` where buying more is a first-class action rather than something buried three clicks into a plan page. For the price of one specific action, reach for `cost-chip` instead: this component answers what\'s left, not what this will cost.',
  dos: [
    {
      text: "Give it a `total` whenever the plan has one, and let the ring carry the proportion — the fraction left is the thing people actually read, and it survives a glance in a way four digits do not.",
      example: <RingCarriesTheProportion />,
    },
    {
      text: "Wire `onManage` so the balance is a way into the plan. A balance you cannot click sends people hunting through settings at exactly the moment they had decided to pay you.",
      example: <BalanceIsAWayIntoThePlan />,
    },
  ],
  donts: [
    {
      text: "Don't wait for zero to change the pill. `low` exists because the useful moment is before the run fails — by the time the state is `empty` the decision has already been made for the user.",
      example: <NoThresholdUntilZero />,
    },
    {
      text: "Don't let the Top up click move the number. `onTopUp` is a request, not a settlement; re-render with a new `balance` only once the purchase actually clears, or you will show credits nobody has bought yet.",
      example: <TopUpMovesTheNumberEarly />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab stops are counted from the props, not from the pill: none with neither handler, one with `onManage`, two with `onManage` plus `onTopUp`. Without `onManage` the balance is plain text inside a `<span>` and there is nothing to Tab to at all.",
      "Both controls are real buttons, so Space and Enter activate them. There are no other keys — no Escape, no arrow travel between the balance and Top up.",
      "Top up is a sibling of the balance button, never nested inside it, so the two are independently reachable. Wrapping the whole pill in your own link or button nests a button in a button and costs you both.",
      "There is no `disabled` prop and nothing disables itself. At a balance of zero the Top up button and the manage button are both still live — which is correct, since zero is exactly when buying more matters.",
    ],
    screenReader: [
      'The manage button\'s `aria-label` is "1,240 credits — manage plan", which overrides the visible number inside it. The number is formatted with `toLocaleString` before it reaches the name, so it is announced grouped rather than as a run of digits.',
      'The ring is `aria-hidden` and has no `role="progressbar"`, `aria-valuenow` or `aria-valuemax`. The proportion — the whole reason to pass `total` — is a purely visual channel: a screen reader hears the raw balance and never the fraction.',
      'The three states reach assistive tech through nothing at all. `low` and `empty` are carried by `data-state` and by a repainted surface, and the words "low" and "empty" never appear in the DOM — so the alarm the component exists to raise is silent for anyone not looking at it. Say it in your own copy, or announce it beside the pill.',
      "Nothing is a live region. The balance ticking down between runs, and the pill crossing from normal into low, both rewrite the text with no announcement.",
      '`dir="ltr"` and `tabular-nums` are pinned on the balance, so digits keep their order inside an RTL layout and do not jitter as the number changes.',
      "Without `onManage` the balance is not focusable and carries no role, so it is only ever met by reading the surrounding chrome — in a topbar, that is a long way from where anyone is working.",
    ],
    focus: [
      "Both buttons carry an explicit `focus-visible` ring, and the ring token stays the same across all three surfaces — including the solid destructive fill of the `empty` state.",
      "Nothing here moves focus on its own, but the props can move it out from under the user: dropping `onTopUp` after a purchase clears, or `onManage` while a plan loads, unmounts a focused button and drops focus to `<body>`. Keep both handlers stable for the lifetime of the pill.",
    ],
  },
  pitfalls: [
    '`form="ring"` silently falls back to the counter when `total` is missing. There is no warning and no error — you get a different component than you asked for, which is easy to miss in a topbar you stopped looking at.',
    "The low threshold is derived as 10% of `total`, so a pill with no `total` and no explicit `lowAt` can never read `low` — it goes straight from `normal` to `empty` at zero. If there is no plan allowance to derive from, set `lowAt` yourself.",
    "The alarm states paint the surface, not the text, because `text-destructive` and `text-warning` cannot reach 4.5:1 on a near-white fill at this size. If you override `className` with your own background you will strand the foreground the component chose — rebind the token instead of restyling the slot.",
    "Top up is rendered as a sibling of the balance button, never inside it, because a button inside a button is invalid and the browser swallows the inner click. Wrapping the whole pill in your own link or button reintroduces exactly that bug and costs you both controls.",
    "The pill never truncates. It is an inline-flex that grows to fit, so a long `unit` widens it and pushes whatever shares its row — in a topbar trailing slot, the caller owns the decision about what gives.",
  ],
};
