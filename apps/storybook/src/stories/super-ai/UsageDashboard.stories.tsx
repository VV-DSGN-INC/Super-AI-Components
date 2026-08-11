import type { Meta, StoryObj } from "@storybook/react-vite";

import { UsageDashboard, type UsageDashboardPeriodData } from "@/registry/super-ai/usage-dashboard";
import { UsageDashboardDocs } from "@/content/components/usage-dashboard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof UsageDashboard> = {
  title: "Super AI/Usage Dashboard",
  component: UsageDashboard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(UsageDashboardDocs) } },
};

export default meta;
type Story = StoryObj<typeof UsageDashboard>;

// UsageDashboard is one composed view, not three mutually-exclusive variants
// — see the file-header comment in usage-dashboard.tsx. Each story below
// renders the same full dashboard (selector, summary cards, and model
// breakdown together) with data chosen to spotlight the part it's named for,
// the same "anatomy, not variants" shape used for N2 trust-dialog's stories.

const FEW_PERIODS = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
];

const PERIOD_SELECT_DATA: Record<string, UsageDashboardPeriodData> = {
  "24h": {
    summary: {
      spend: 4.2,
      tokens: 9800,
      latencyMs: 640,
      spendDeltaPct: 2,
      tokensDeltaPct: 1,
      latencyDeltaPct: -3,
    },
    models: [{ id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 4.2, tokens: 9800, latencyMs: 640 }],
  },
  "7d": {
    summary: {
      spend: 28.7,
      tokens: 64000,
      latencyMs: 700,
      spendDeltaPct: 11,
      tokensDeltaPct: 6,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 18.4, tokens: 41000, latencyMs: 620 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 10.3, tokens: 23000, latencyMs: 800 },
    ],
  },
  "30d": {
    summary: {
      spend: 128.7,
      tokens: 412000,
      latencyMs: 830,
      spendDeltaPct: 12,
      tokensDeltaPct: -4,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 82.5, tokens: 288000, latencyMs: 620 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 46.2, tokens: 124000, latencyMs: 810 },
    ],
  },
  "90d": {
    summary: {
      spend: 402.9,
      tokens: 1180000,
      latencyMs: 890,
      spendDeltaPct: -8,
      tokensDeltaPct: 22,
      latencyDeltaPct: 4,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 260.1, tokens: 820000, latencyMs: 640 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 142.8, tokens: 360000, latencyMs: 860 },
    ],
  },
};

/** Multiple periods, and the trigger shows the human label — never the raw period id. */
export const PeriodSelect: Story = {
  args: { periods: FEW_PERIODS, data: PERIOD_SELECT_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};

const TWO_PERIODS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const SUMMARY_CARDS_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    // Deliberately mixed directions — spend up (worth a second look), tokens
    // down, latency unchanged — so all three delta shapes show at once.
    summary: {
      spend: 96.4,
      tokens: 258000,
      latencyMs: 910,
      spendDeltaPct: 24,
      tokensDeltaPct: -9,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 68.1, tokens: 176000, latencyMs: 980 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 28.3, tokens: 82000, latencyMs: 600 },
    ],
  },
  "30d": {
    summary: {
      spend: 380.2,
      tokens: 990000,
      latencyMs: 870,
      spendDeltaPct: -5,
      tokensDeltaPct: 14,
      latencyDeltaPct: -2,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 260.4, tokens: 690000, latencyMs: 940 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 119.8, tokens: 300000, latencyMs: 590 },
    ],
  },
};

/** A delta beside every summary figure: increase, decrease, and no-change, each stated as visible text. */
export const SummaryCards: Story = {
  args: { periods: TWO_PERIODS, data: SUMMARY_CARDS_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};

const MODEL_BREAKDOWN_DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: {
      spend: 214.6,
      tokens: 720000,
      latencyMs: 840,
      spendDeltaPct: 7,
      tokensDeltaPct: 12,
      latencyDeltaPct: -3,
    },
    // Five models with a wide spend spread — the actionable view: which
    // model is actually driving the total, not just that the total moved.
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 118.2, tokens: 312000, latencyMs: 960 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 52.4, tokens: 218000, latencyMs: 590 },
      { id: "claude-3-5-sonnet", name: "claude-3-5-sonnet", spend: 31.8, tokens: 96000, latencyMs: 1120 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 9.6, tokens: 68000, latencyMs: 620 },
      { id: "llama-3-70b", name: "llama-3.1-70b", spend: 2.6, tokens: 26000, latencyMs: 480 },
    ],
  },
  "30d": {
    summary: {
      spend: 890.5,
      tokens: 2860000,
      latencyMs: 860,
      spendDeltaPct: 3,
      tokensDeltaPct: 9,
      latencyDeltaPct: 1,
    },
    models: [
      { id: "gpt-4o", name: "gpt-4o", spend: 486.2, tokens: 1240000, latencyMs: 970 },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 214.7, tokens: 860000, latencyMs: 600 },
      { id: "claude-3-5-sonnet", name: "claude-3-5-sonnet", spend: 138.4, tokens: 420000, latencyMs: 1140 },
      { id: "claude-haiku", name: "claude-3-5-haiku", spend: 40.1, tokens: 260000, latencyMs: 630 },
      { id: "llama-3-70b", name: "llama-3.1-70b", spend: 11.1, tokens: 80000, latencyMs: 500 },
    ],
  },
};

/** Five models with an uneven spend spread — the breakdown says which model to act on, not just that the total moved. */
export const ModelBreakdown: Story = {
  args: { periods: TWO_PERIODS, data: MODEL_BREAKDOWN_DATA, defaultPeriod: "7d", className: "w-[640px]" },
};
