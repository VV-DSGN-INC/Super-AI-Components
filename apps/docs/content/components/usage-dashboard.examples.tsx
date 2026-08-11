"use client";

import { UsageDashboard, type UsageDashboardPeriodData } from "@/registry/super-ai/usage-dashboard";

/**
 * Live examples for usage-dashboard.docs.tsx.
 *
 * Kept separate from the docs module for the same reason as
 * workspace-switcher.examples.tsx: component-docs.tsx (a Server Component)
 * reads the docs module's fields directly, so that module has to stay plain
 * server-evaluable data. Every example lives here and crosses into the docs
 * module as a zero-prop element.
 */

const COUPLING_PERIODS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const COUPLING_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: {
      spend: 68.4,
      tokens: 184000,
      latencyMs: 720,
      spendDeltaPct: 9,
      tokensDeltaPct: -3,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 44.1, tokens: 128000, latencyMs: 610 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 24.3, tokens: 56000, latencyMs: 840 },
    ],
  },
  "30d": {
    summary: {
      spend: 260.9,
      tokens: 742000,
      latencyMs: 790,
      spendDeltaPct: -4,
      tokensDeltaPct: 15,
      latencyDeltaPct: 3,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 168.2, tokens: 512000, latencyMs: 620 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 92.7, tokens: 230000, latencyMs: 870 },
    ],
  },
};

/** Switching the period here moves the summary cards AND the model breakdown together — one control, one interaction. */
export function PeriodDrivesEveryPanel() {
  return (
    <UsageDashboard
      periods={COUPLING_PERIODS}
      data={COUPLING_DATA}
      defaultPeriod="7d"
      className="w-full max-w-xl"
    />
  );
}

const DELTA_PERIODS = [{ id: "7d", label: "Last 7 days" }];

const DELTA_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    // All three delta directions at once — increase, decrease, no change.
    summary: {
      spend: 96.4,
      tokens: 258000,
      latencyMs: 910,
      spendDeltaPct: 24,
      tokensDeltaPct: -9,
      latencyDeltaPct: 0,
    },
    models: [{ id: "gpt-4o", name: "gpt-4o", spend: 96.4, tokens: 258000, latencyMs: 910 }],
  },
};

/** Every summary figure carries a signed percentage and a directional icon, stated as text — never colour alone. */
export function DeltaStatedAsText() {
  return (
    <UsageDashboard
      periods={DELTA_PERIODS}
      data={DELTA_DATA}
      defaultPeriod="7d"
      className="w-full max-w-xl"
    />
  );
}

/** A total with nothing underneath it — the anti-pattern: it says there's a problem, never what to do about it. */
export function BareTotalNoBreakdown() {
  return (
    <div className="w-64 rounded-xl border bg-card p-4 text-card-foreground">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total spend</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">512.30 USD</p>
      <p className="text-muted-foreground mt-3 text-xs">
        (nothing else on the card — which model? which call?)
      </p>
    </div>
  );
}

/** Colour is the only thing separating these bars — nothing says which model is which without matching a swatch to a legend. */
export function ColorOnlyModelLegend() {
  const bars = [
    { color: "var(--chart-1)", width: "88%" },
    { color: "var(--chart-2)", width: "54%" },
    { color: "var(--chart-3)", width: "31%" },
  ];

  return (
    <div className="w-64 rounded-xl border bg-card p-4 text-card-foreground">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Spend by model</p>
      <div className="flex flex-col gap-1.5">
        {bars.map((bar, i) => (
          <div key={i} className="bg-muted h-2.5 rounded-full">
            <div className="h-2.5 rounded-full" style={{ width: bar.width, backgroundColor: bar.color }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
          gpt-4o
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
          gpt-4o-mini
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-3)" }} />
          haiku
        </span>
      </div>
    </div>
  );
}
