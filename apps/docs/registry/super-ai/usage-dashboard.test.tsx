import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { UsageDashboard, type UsageDashboardPeriodData } from "./usage-dashboard";

const PERIODS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const DATA: Record<string, UsageDashboardPeriodData> = {
  "7d": {
    summary: {
      spend: 128,
      tokens: 42000,
      latencyMs: 820,
      spendDeltaPct: 12,
      tokensDeltaPct: -4,
      latencyDeltaPct: 0,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 80, tokens: 30000, latencyMs: 640 },
      { id: "claude-haiku", name: "claude-haiku", spend: 48, tokens: 12000, latencyMs: 1100 },
    ],
  },
  "30d": {
    summary: {
      spend: 512,
      tokens: 168000,
      latencyMs: 900,
      spendDeltaPct: -6,
      tokensDeltaPct: 18,
      latencyDeltaPct: 5,
    },
    models: [
      { id: "gpt-4o-mini", name: "gpt-4o-mini", spend: 300, tokens: 120000, latencyMs: 700 },
      { id: "claude-haiku", name: "claude-haiku", spend: 212, tokens: 48000, latencyMs: 1050 },
    ],
  },
};

describe("UsageDashboard", () => {
  it("renders the period-select state with the period's label, not its raw id", async () => {
    const user = userEvent.setup();
    render(<UsageDashboard periods={PERIODS} data={DATA} defaultPeriod="7d" />);

    const trigger = screen.getByRole("combobox", { name: /period/i });
    // The vendored Select wrapper renders the raw `value` unless SelectValue is
    // given explicit children — assert the human label shows, not the id "7d".
    expect(within(trigger).getByText("Last 7 days")).toBeInTheDocument();
    expect(within(trigger).queryByText("7d")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Last 30 days" })).toBeInTheDocument();
  });

  it("renders the summary-cards state with a delta beside every figure", () => {
    render(<UsageDashboard periods={PERIODS} data={DATA} defaultPeriod="7d" />);

    const spendCard = document.querySelector<HTMLElement>(
      '[data-slot="usage-dashboard-summary-card"][data-metric="spend"]',
    )!;
    expect(within(spendCard).getByText(/128/)).toBeInTheDocument();
    // Delta is stated in visible text — sign, percentage and comparison phrase —
    // never colour alone, and it must live inside the same card as the figure.
    expect(within(spendCard).getByText(/\+12% vs previous period/)).toBeInTheDocument();

    const tokensCard = document.querySelector<HTMLElement>(
      '[data-slot="usage-dashboard-summary-card"][data-metric="tokens"]',
    )!;
    expect(within(tokensCard).getByText(/42,000/)).toBeInTheDocument();
    expect(within(tokensCard).getByText(/-4% vs previous period/)).toBeInTheDocument();

    const latencyCard = document.querySelector<HTMLElement>(
      '[data-slot="usage-dashboard-summary-card"][data-metric="latencyMs"]',
    )!;
    expect(within(latencyCard).getByText(/820ms/)).toBeInTheDocument();
    expect(within(latencyCard).getByText(/±0% vs previous period/)).toBeInTheDocument();
  });

  it("renders the model-breakdown state with every model's numbers available as text, not only chart geometry", () => {
    render(<UsageDashboard periods={PERIODS} data={DATA} defaultPeriod="7d" />);

    // The decorative chart must exist AND be excluded from the a11y tree —
    // unconditionally, so this fails (not skips) if the chart wrapper is ever
    // renamed or removed while the chart itself still renders.
    const chart = document.querySelector('[data-slot="usage-dashboard-model-chart"]');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("aria-hidden", "true");

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // header row + one row per model
    expect(rows).toHaveLength(3);

    // Structural pin: spend/tokens/latency must be in the SAME row as the
    // model name — not merely present somewhere in the table — so a future
    // refactor that misaligns columns actually fails this test.
    const gptRow = within(table).getByRole("rowheader", { name: "gpt-4o-mini" }).closest("tr")!;
    expect(within(gptRow).getByText(/30,000/)).toBeInTheDocument();
    expect(within(gptRow).getByText(/640ms/)).toBeInTheDocument();

    const haikuRow = within(table).getByRole("rowheader", { name: "claude-haiku" }).closest("tr")!;
    expect(within(haikuRow).getByText(/12,000/)).toBeInTheDocument();
    expect(within(haikuRow).queryByText(/30,000/)).not.toBeInTheDocument();
  });

  it("updates both the summary figures and the model breakdown in the same interaction when the period changes", async () => {
    const user = userEvent.setup();
    render(<UsageDashboard periods={PERIODS} data={DATA} defaultPeriod="7d" />);

    // Sanity: the 7d numbers are showing before the switch.
    expect(screen.getByText(/30,000/)).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: /period/i }));
    await user.click(await screen.findByRole("option", { name: "Last 30 days" }));

    const spendCard = document.querySelector<HTMLElement>(
      '[data-slot="usage-dashboard-summary-card"][data-metric="spend"]',
    )!;
    // Summary figure moved to the 30d value...
    expect(within(spendCard).getByText(/512/)).toBeInTheDocument();

    // ...and the per-model breakdown moved with it, in the same interaction.
    const table = screen.getByRole("table");
    expect(within(table).getByText(/120,000/)).toBeInTheDocument();
    expect(within(table).queryByText(/30,000/)).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<UsageDashboard periods={PERIODS} data={DATA} defaultPeriod="7d" className="test-class" />);
    expect(document.querySelector('[data-slot="usage-dashboard"]')!.className).toContain("test-class");
  });
});
