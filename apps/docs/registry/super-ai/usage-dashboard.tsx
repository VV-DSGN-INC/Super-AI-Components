"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import * as React from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Usage Dashboard — Aggregate cost / token / latency
 *
 * Spec: docs/design-system/component-specs.md#n6-usage-dashboard
 * States: period-select · summary-cards · model-breakdown
 *
 * Base: Chart (components/ui/chart, a Recharts wrapper) and Card. This is one
 * composed view, not three mutually-exclusive variants — the three declared
 * "states" are anatomy of a single dashboard (a selector, a summary row, and
 * a breakdown), the same reading a reviewer endorsed for N2 `trust-dialog`'s
 * four "states". The stories spotlight each part rather than switching
 * between alternatives; see this file's header in trust-dialog.tsx for the
 * precedent.
 *
 * Three rules from the spec are load-bearing and pinned by tests:
 *
 * 1. **The period select drives every panel at once.** `currentPeriodId`
 *    is the single piece of state both the summary cards and the model
 *    breakdown derive from — there is no separate "apply" step, so switching
 *    the period is one interaction that moves both panels together. This is
 *    the component's whole reason to exist as one component rather than two.
 * 2. **A delta sits beside every summary figure**, in the same flex row, not
 *    below it or in a tooltip — "a number without a direction is not
 *    actionable". The delta is always rendered as visible text (a signed
 *    percentage plus a comparison phrase) with a directional icon, never
 *    colour alone.
 * 3. **The per-model breakdown is the actionable view and carries the
 *    weight the spec implies**: it renders as a full-size `Card` (the
 *    summary cards use the compact `size="sm"`), and every number in it is
 *    real `<table>` text — a `<th scope="row">` per model, spend/tokens/
 *    latency as sibling `<td>`s in the same `<tr>`. The chart beside the
 *    table is decorative supplementary detail, not the only source of the
 *    numbers: it is `aria-hidden`, uses a single fill colour (there is
 *    nothing to key a legend to — the model name is already the row's own
 *    label, both on the chart's category axis and in the table), and the
 *    same figures it shows already exist as text in the table next to it.
 *    Axe cannot fail on decorative content it never inspects, and a screen
 *    reader user loses nothing the chart offered a sighted user.
 */

interface UsageDashboardPeriod {
  id: string;
  label: string;
}

interface UsageDashboardSummary {
  /** Aggregate spend for the period, in `spendUnit`. */
  spend: number;
  /** Aggregate input + output tokens for the period. */
  tokens: number;
  /** Average latency for the period, in milliseconds. */
  latencyMs: number;
  /** Percent change vs. the prior period. Omit to render the figure with no delta. */
  spendDeltaPct?: number;
  tokensDeltaPct?: number;
  latencyDeltaPct?: number;
}

interface UsageDashboardModelUsage {
  id: string;
  name: string;
  spend: number;
  tokens: number;
  latencyMs: number;
}

interface UsageDashboardPeriodData {
  summary: UsageDashboardSummary;
  /** Per-model rows — the actionable view. Empty renders an explicit empty state. */
  models: UsageDashboardModelUsage[];
}

interface UsageDashboardProps extends Omit<React.ComponentProps<"div">, "onSelect" | "title"> {
  periods: UsageDashboardPeriod[];
  /** Keyed by `UsageDashboardPeriod.id`. A period with no entry renders zeroed panels. */
  data: Record<string, UsageDashboardPeriodData>;
  /** Optionally controlled — omit both `period` and `onPeriodChange` for an uncontrolled selector. */
  period?: string;
  defaultPeriod?: string;
  onPeriodChange?: (id: string) => void;
  /** Unit label for spend figures. Matches A2 `cost-chip`'s own default. */
  spendUnit?: string;
  periodSelectLabel?: string;
  title?: React.ReactNode;
}

const EMPTY_SUMMARY: UsageDashboardSummary = { spend: 0, tokens: 0, latencyMs: 0 };

const SUMMARY_METRICS = [
  { key: "spend", label: "Total spend" },
  { key: "tokens", label: "Total tokens" },
  { key: "latencyMs", label: "Avg latency" },
] as const;

type SummaryMetricKey = (typeof SUMMARY_METRICS)[number]["key"];

const DELTA_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;

/** `380ms`, `2.4s` — matches the millisecond-vs-second cutoff other timing surfaces in this registry use. */
function formatLatencyMs(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  if (safe < 1000) return `${Math.round(safe)}ms`;
  return `${(safe / 1000).toFixed(safe < 10000 ? 2 : 1)}s`;
}

function formatSummaryValue(
  key: SummaryMetricKey,
  summary: UsageDashboardSummary,
  spendUnit: string,
): string {
  if (key === "spend") return `${summary.spend.toLocaleString()} ${spendUnit}`;
  if (key === "tokens") return summary.tokens.toLocaleString();
  return formatLatencyMs(summary.latencyMs);
}

function deltaFor(key: SummaryMetricKey, summary: UsageDashboardSummary): number | undefined {
  if (key === "spend") return summary.spendDeltaPct;
  if (key === "tokens") return summary.tokensDeltaPct;
  return summary.latencyDeltaPct;
}

function formatDeltaPct(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "±0%";
}

/**
 * A delta with no direction isn't actionable, so this always renders as
 * visible text — a signed percentage and a comparison phrase — paired with a
 * directional icon. The icon is decorative; the text alone carries the
 * meaning, so nothing here relies on colour to be understood.
 */
function UsageDashboardDelta({
  pct,
  comparisonLabel = "vs previous period",
}: {
  pct?: number;
  comparisonLabel?: string;
}) {
  if (pct === undefined) return null;
  const direction = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  const Icon = DELTA_ICON[direction];

  return (
    <span
      data-slot="usage-dashboard-delta"
      data-direction={direction}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        direction === "up" ? "text-warning" : "text-foreground",
      )}
    >
      <Icon aria-hidden className="size-3" />
      {`${formatDeltaPct(pct)} ${comparisonLabel}`}
    </span>
  );
}

function UsageDashboardSummaryCard({
  metricKey,
  label,
  summary,
  spendUnit,
}: {
  metricKey: SummaryMetricKey;
  label: string;
  summary: UsageDashboardSummary;
  spendUnit: string;
}) {
  return (
    <Card size="sm" data-slot="usage-dashboard-summary-card" data-metric={metricKey} className="min-w-0">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Rule 2: the delta sits beside the figure, in the same row. */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span data-slot="usage-dashboard-summary-value" className="text-2xl font-semibold tabular-nums">
            {formatSummaryValue(metricKey, summary, spendUnit)}
          </span>
          <UsageDashboardDelta pct={deltaFor(metricKey, summary)} />
        </div>
      </CardContent>
    </Card>
  );
}

const MODEL_CHART_CONFIG: ChartConfig = {
  spend: { label: "Spend", color: "var(--chart-1)" },
};

function UsageDashboardPeriodSelect({
  periods,
  value,
  onChange,
  label,
}: {
  periods: UsageDashboardPeriod[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const current = periods.find((p) => p.id === value);

  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger
        data-slot="usage-dashboard-period-trigger"
        aria-label={`${label}: ${current?.label ?? ""}`}
        className="w-auto min-w-36"
      >
        {/* Trap: SelectValue renders the raw `value` (the period id) unless
            given explicit children — see model-picker.tsx and
            trust-dialog.tsx for the same fix. */}
        <SelectValue placeholder={label}>{current?.label ?? label}</SelectValue>
      </SelectTrigger>
      <SelectContent data-slot="usage-dashboard-period-content">
        {periods.map((p) => (
          <SelectItem key={p.id} value={p.id} data-slot="usage-dashboard-period-item">
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UsageDashboardModelBreakdown({
  models,
  spendUnit,
}: {
  models: UsageDashboardModelUsage[];
  spendUnit: string;
}) {
  const chartData = models.map((m) => ({ name: m.name, spend: m.spend }));

  return (
    // Rule 3: full-size Card (summary cards are `size="sm"`) — this panel
    // carries more visual weight than the summary row on purpose.
    <Card data-slot="usage-dashboard-model-breakdown">
      <CardHeader>
        <CardTitle>Per-model breakdown</CardTitle>
        <CardDescription>Where the spend in this period went, model by model.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {models.length === 0 ? (
          <p className="text-muted-foreground text-sm">No usage recorded for this period yet.</p>
        ) : (
          <>
            {/* Decorative only — see rule 3 above. The table below carries
                every number this chart shows, in real text. */}
            <div data-slot="usage-dashboard-model-chart" aria-hidden="true">
              <ChartContainer config={MODEL_CHART_CONFIG} className="aspect-auto h-48 w-full">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={104}
                    tick={{ fontSize: 11 }}
                  />
                  <XAxis type="number" hide />
                  <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="overflow-x-auto">
              <table data-slot="usage-dashboard-model-table" className="w-full text-sm">
                <caption className="sr-only">
                  Spend, tokens, and latency by model for the selected period
                </caption>
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      Model
                    </th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      Spend
                    </th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      Tokens
                    </th>
                    <th scope="col" className="py-1.5 font-medium">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr
                      key={m.id}
                      data-slot="usage-dashboard-model-row"
                      data-model-id={m.id}
                      className="border-b last:border-b-0"
                    >
                      <th scope="row" className="text-foreground py-1.5 pr-3 text-left font-medium">
                        {m.name}
                      </th>
                      <td className="py-1.5 pr-3">
                        <CostChip amount={m.spend.toLocaleString()} unit={spendUnit} />
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{m.tokens.toLocaleString()}</td>
                      <td className="py-1.5 tabular-nums">{formatLatencyMs(m.latencyMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UsageDashboard({
  periods,
  data,
  period: periodProp,
  defaultPeriod,
  onPeriodChange,
  spendUnit = "credits",
  periodSelectLabel = "Period",
  title = "Usage",
  className,
  ...props
}: UsageDashboardProps) {
  const [uncontrolledPeriod, setUncontrolledPeriod] = React.useState<string>(
    defaultPeriod ?? periods[0]?.id ?? "",
  );
  // Rule 1: this single id is the only thing the summary cards and the model
  // breakdown derive from — one state update moves both.
  const currentPeriodId = periodProp ?? uncontrolledPeriod;
  const currentData = data[currentPeriodId];
  const summary = currentData?.summary ?? EMPTY_SUMMARY;
  const models = currentData?.models ?? [];

  const handlePeriodChange = (id: string) => {
    if (periodProp === undefined) setUncontrolledPeriod(id);
    onPeriodChange?.(id);
  };

  return (
    <div data-slot="usage-dashboard" className={cn("flex flex-col gap-4", className)} {...props}>
      <div data-slot="usage-dashboard-header" className="flex flex-wrap items-center justify-between gap-3">
        {title ? (
          <h3 data-slot="usage-dashboard-title" className="text-foreground text-sm font-medium">
            {title}
          </h3>
        ) : (
          <span />
        )}
        <UsageDashboardPeriodSelect
          periods={periods}
          value={currentPeriodId}
          onChange={handlePeriodChange}
          label={periodSelectLabel}
        />
      </div>

      <div data-slot="usage-dashboard-summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUMMARY_METRICS.map((metric) => (
          <UsageDashboardSummaryCard
            key={metric.key}
            metricKey={metric.key}
            label={metric.label}
            summary={summary}
            spendUnit={spendUnit}
          />
        ))}
      </div>

      <UsageDashboardModelBreakdown models={models} spendUnit={spendUnit} />
    </div>
  );
}

export { UsageDashboard, formatLatencyMs };
export type {
  UsageDashboardModelUsage,
  UsageDashboardPeriod,
  UsageDashboardPeriodData,
  UsageDashboardProps,
  UsageDashboardSummary,
};
