import type { ComponentDocs } from "@/lib/component-docs";
import {
  BareTotalNoBreakdown,
  ColorOnlyModelLegend,
  DeltaStatedAsText,
  PeriodDrivesEveryPanel,
} from "./usage-dashboard.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n6-usage-dashboard.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "usage-dashboard.examples" client module and are referenced here as
 * zero-prop elements.
 */
export const UsageDashboardDocs: ComponentDocs = {
  whatItIs:
    "The team-facing view of what an AI product costs to run: a period selector, a row of summary figures (spend, tokens, average latency) each paired with a change from the prior period, and a per-model breakdown that says where the spend actually went. It's the counterpart to M2 credits-indicator — same underlying data, aimed at whoever owns the bill instead of the one user watching a balance.",
  whyItMatters:
    "Provider consoles converge on this exact shape because a raw total is diagnosis without treatment: it tells a team spend went up, but not which model, endpoint, or feature to look at. Breaking the same numbers out by model is what turns a dashboard into something actionable instead of a bill you just look at.",
  evidence: ["Provider consoles"],
  anatomy: [
    { slot: "usage-dashboard", note: "Root wrapper around the whole view." },
    { slot: "usage-dashboard-header", note: "Title plus the period selector." },
    { slot: "usage-dashboard-title", note: "The dashboard's own heading, inside the header row." },
    {
      slot: "usage-dashboard-period-trigger",
      note: "The period Select's trigger — always shows the period's label, never its id.",
    },
    {
      slot: "usage-dashboard-period-content",
      note: "The open Select's popup listing every period.",
    },
    { slot: "usage-dashboard-period-item", note: "One selectable period row inside the popup." },
    { slot: "usage-dashboard-summary", note: "The row of summary cards: spend, tokens, latency." },
    { slot: "usage-dashboard-summary-card", note: "One summary figure and its delta, keyed by data-metric." },
    { slot: "usage-dashboard-summary-value", note: "The headline number inside a summary card." },
    {
      slot: "usage-dashboard-delta",
      note: "Signed percentage vs. the prior period, stated as text with a directional icon.",
    },
    {
      slot: "usage-dashboard-model-breakdown",
      note: "The per-model panel — a full-size Card, heavier than the summary row.",
    },
    {
      slot: "usage-dashboard-model-chart",
      note: "Decorative bar chart, aria-hidden — every number it shows also exists in the table beside it.",
    },
    {
      slot: "usage-dashboard-model-table",
      note: "The accessible source of truth: one row per model, spend/tokens/latency as real text.",
    },
    { slot: "usage-dashboard-model-row", note: "One model's table row, keyed by data-model-id." },
  ],
  usage:
    "Reach for it wherever a team (not an individual end user) needs to see what an AI feature is costing to run. Pass `periods` and a `data` map keyed by each period's id; switching the period is a single interaction that moves the summary row and the model breakdown together, because they're reading the same underlying period record. Include `spendDeltaPct`/`tokensDeltaPct`/`latencyDeltaPct` on the summary whenever you have a prior period to compare against — a figure with no delta reads as a number that hasn't been checked yet, not as a considered omission.",
  dos: [
    {
      text: "Let the period selector move every panel at once — the summary cards and the model breakdown read the same period record, so there's no separate 'apply' step.",
      example: <PeriodDrivesEveryPanel />,
    },
    {
      text: "State every delta as text — a signed percentage and a comparison phrase, plus a directional icon — never colour alone.",
      example: <DeltaStatedAsText />,
    },
  ],
  donts: [
    {
      text: "Don't ship the total without the per-model breakdown — a total says there's a problem, the breakdown says what to do about it.",
      example: <BareTotalNoBreakdown />,
    },
    {
      text: "Don't key which model is which to a colour legend alone — name every model in real text next to its own numbers, the way the table does.",
      example: <ColorOnlyModelLegend />,
    },
  ],
  pitfalls: [
    "Passing the period id straight into the Select's value display. The vendored Select renders the raw `value` unless SelectValue is given explicit children — this component always passes the period's own `label`, and a call site building a custom trigger around the same data should do the same.",
    "Treating the bar chart as the only place model spend lives. It's `aria-hidden` on purpose — a screen reader user gets the same numbers from the table next to it, but only if that table stays in sync with whatever data feeds the chart.",
    "Building three separate views for 'period select', 'summary cards', and 'model breakdown'. They're anatomy of one dashboard, not alternate states — a period change has to reach all three at once, which is only guaranteed if they share one component's state.",
  ],
};
