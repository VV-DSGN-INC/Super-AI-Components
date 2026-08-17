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
  accessibility: {
    keyboard: [
      "One tab stop, whatever the data: the period Select's trigger. The summary cards are text, the bar chart is out of the tab order (`accessibilityLayer={false}` under an `aria-hidden` wrapper), and no table cell is focusable — a hundred models adds no stops.",
      "On the trigger, Enter, Space, Down or Up opens the list; typing a letter jumps to a period, Home and End reach the ends, Enter or Space commits, and Escape closes without changing the period.",
      "Nothing in the breakdown is operable. Columns do not sort, rows do not select, and there is no arrow-key movement inside the table — it is a static table, not a grid.",
      "There is no `disabled` prop. The Select is the only control, and this component does not forward a disabled state to it, so freezing the dashboard means not rendering the selector at all.",
    ],
    screenReader: [
      "The trigger's name comes from `aria-label`, not from what you can see: \"Period: Last 7 days\". The visible label is a substring of it, so voice control still reaches it — but pass a `period` id that is not in `periods` and the name degrades to a bare \"Period: \".",
      "A summary card is three unlinked strings. `CardTitle` renders a `<div>`, not a heading, and nothing associates it with the figure or the delta, so \"Total spend\", \"1,240 credits\" and \"+12% vs previous period\" are read as siblings joined only by reading order.",
      "The bar chart contributes nothing at all — `aria-hidden` with the Recharts accessibility layer switched off, so it is out of both the accessibility tree and the tab order. Everything it draws is in the table beside it.",
      "The table is real: a visually hidden `<caption>`, four `<th scope=\"col\">`, and a `<th scope=\"row\">` per model, so a spend cell announces with the model that owns it. Spend is a `CostChip` whose coins glyph is `aria-hidden` and whose amount and unit read as one string.",
      "Delta icons are `aria-hidden`. The direction lives in the signed text and in `data-direction`, never in the colour — the `text-warning` tint on an increase is decoration on top of a sentence that already says it.",
      "Changing the period is announced as nothing beyond the Select's own new value. All three figures and every table row are replaced with no live region anywhere in this component, and switching to a period with no models swaps the table for a plain `<p>` just as silently. Put a live region on the area you drop it into if the change has to be heard.",
      "`title` renders as a fixed `<h3>` and is the component's only heading; pass a falsy `title` and there is none. \"Per-model breakdown\" and the three summary labels are `<div>`s, so this contributes exactly one heading, at one level you cannot choose, to your page outline.",
    ],
    focus: [
      "Opening the period list moves focus into the popup; closing it — by choosing, by Escape, or by clicking away — returns focus to the trigger. Nothing else moves focus: the cards and the table are rebuilt underneath a focus that never left.",
      "The trigger is the only control with a focus style, `focus-visible:ring-3` inherited from the vendored `SelectTrigger`. There is nothing else focusable to style.",
    ],
  },
  pitfalls: [
    "Passing the period id straight into the Select's value display. The vendored Select renders the raw `value` unless SelectValue is given explicit children — this component always passes the period's own `label`, and a call site building a custom trigger around the same data should do the same.",
    "Treating the bar chart as the only place model spend lives. It's `aria-hidden` on purpose — a screen reader user gets the same numbers from the table next to it, but only if that table stays in sync with whatever data feeds the chart.",
    "Building three separate views for 'period select', 'summary cards', and 'model breakdown'. They're anatomy of one dashboard, not alternate states — a period change has to reach all three at once, which is only guaranteed if they share one component's state.",
  ],
};
