"use client";

import { UsageDashboard, type UsageDashboardPeriodData } from "@/registry/super-ai/usage-dashboard";

const PERIODS = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const DATA: Record<string, UsageDashboardPeriodData> = {
  "24h": {
    summary: {
      spend: 18.4,
      tokens: 62000,
      latencyMs: 780,
      spendDeltaPct: 9,
      tokensDeltaPct: 3,
      latencyDeltaPct: -6,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 11.2, tokens: 34000, latencyMs: 920 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 5.1, tokens: 21000, latencyMs: 560 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 2.1, tokens: 7000, latencyMs: 640 },
    ],
  },
  "7d": {
    summary: {
      spend: 128.7,
      tokens: 412000,
      latencyMs: 830,
      spendDeltaPct: 12,
      tokensDeltaPct: -4,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 78.4, tokens: 236000, latencyMs: 960 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 34.9, tokens: 141000, latencyMs: 580 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 15.4, tokens: 35000, latencyMs: 610 },
    ],
  },
  "30d": {
    summary: {
      spend: 512.3,
      tokens: 1680000,
      latencyMs: 905,
      spendDeltaPct: -6,
      tokensDeltaPct: 18,
      latencyDeltaPct: 5,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 301.5, tokens: 940000, latencyMs: 980 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 148.2, tokens: 560000, latencyMs: 600 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 62.6, tokens: 180000, latencyMs: 615 },
    ],
  },
};

export default function UsageDashboardDemo() {
  return (
    <UsageDashboard
      periods={PERIODS}
      data={DATA}
      defaultPeriod="7d"
      spendUnit="USD"
      className="w-full max-w-2xl"
    />
  );
}
