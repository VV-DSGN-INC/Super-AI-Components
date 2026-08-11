import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GenerationShell } from "./generation-shell";

const REGIONS = ["config-panel", "cost-generate", "topbar", "result-canvas"];

const PRESETS = [
  { id: "cinematic", label: "Cinematic" },
  { id: "anime", label: "Anime" },
];

const MODELS = [
  { id: "veo", name: "Veo 3.1", group: "Text → video", runtime: "cloud" as const },
  { id: "wan", name: "Wan 2.2", group: "Text → video", runtime: "local" as const, hardware: "16 GB VRAM" },
];

const RESULTS = [
  { id: "r1", state: "done" as const, label: "A lighthouse at dusk" },
  { id: "r2", state: "done" as const, label: "A lighthouse at noon" },
];

const EXAMPLE_PAIR = {
  before: { content: <div data-testid="before" />, label: "Your photo" },
  after: { content: <div data-testid="after" />, label: "Restyled" },
};

describe("GenerationShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<GenerationShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<GenerationShell className="test-class" />);
    expect(document.querySelector('[data-slot="generation-shell"]')!.className).toContain("test-class");
  });

  // "Config left, result right, Generate pinned to the bottom of the panel so
  // it never requires scrolling." The pinning is structural: cost + Generate
  // is a region *inside* the config panel, and specifically inside E1's own
  // footer slot — the one part of E1 that lives outside its scrolling body.
  // Move it into a collapsible section and this test is what breaks.
  it("pins cost + Generate to the bottom of the config panel, outside its scroll", () => {
    const { container } = render(<GenerationShell cost={55} />);
    const panel = container.querySelector('[data-region="config-panel"]')!;
    const row = container.querySelector('[data-region="cost-generate"]')!;

    expect(panel.contains(row)).toBe(true);
    // E1's pinned footer, not its scrolling CardContent.
    expect(row.closest('[data-slot="generation-panel-generate"]')).not.toBeNull();
    // And not inside any collapsible stage, which is what scrolls.
    expect(row.closest('[data-slot="generation-panel-section"]')).toBeNull();
  });

  // "Cost and Generate are one row." A2 and E5 are siblings in the region, and
  // there is exactly one price on screen — E5 renders an A2 of its own when it
  // is handed a `cost`, so the shell withholds it deliberately.
  it("puts one A2 chip and one E5 button in the cost row, never two prices", () => {
    const { container } = render(<GenerationShell cost={55} costUnit="credits" />);
    const row = container.querySelector('[data-region="cost-generate"]') as HTMLElement;

    expect(row.querySelectorAll('[data-slot="cost-chip"]')).toHaveLength(1);
    expect(row.querySelector('[data-slot="run-button"]')).not.toBeNull();
    expect(within(row).getByText("55 credits")).toBeVisible();
    expect(document.querySelectorAll('[data-slot="cost-chip"]')).toHaveLength(1);
  });

  // "The cost number here and in E1 / D1 come from one source. Two different
  // prices is the failure mode." The shortfall line is built from the shell's
  // own `cost`/`balance`, so a price can never disagree with itself.
  it("phrases E5's shortfall from the same cost and balance the chip uses", () => {
    render(<GenerationShell cost={55} balance={12} run={{ state: "insufficient-credits" }} />);
    expect(screen.getByText("Need 55 credits, you have 12")).toBeVisible();
  });

  it("runs through E5's own control", async () => {
    const onRun = vi.fn();
    render(<GenerationShell cost={55} run={{ onRun }} />);
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  // "The empty right pane carries an L1 example pair (before → after). It
  // teaches the tool faster than any description."
  it("teaches the tool with an L1 example pair while the canvas is empty", () => {
    const { container } = render(<GenerationShell examplePair={EXAMPLE_PAIR} />);
    const canvas = container.querySelector('[data-region="result-canvas"]')!;

    expect(canvas.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(canvas.querySelector('[data-slot="empty-state-example-pair"]')).not.toBeNull();
    // The direction survives without the arrow, which is decoration.
    expect(screen.getByRole("figure", { name: "Your photo" })).toBeVisible();
    expect(screen.getByRole("figure", { name: "Restyled" })).toBeVisible();
  });

  // F2 stays mounted when there is nothing in it — "Empty is an in-grid tile,
  // not a page takeover" is F2's rule, and the shell honours it by handing L1
  // to F2's own `empty` slot rather than swapping the grid out for a panel.
  it("keeps F2 mounted and hands it the empty state, rather than replacing it", () => {
    const { container } = render(<GenerationShell />);
    const canvas = container.querySelector('[data-region="result-canvas"]')!;
    const grid = canvas.querySelector('[data-slot="generation-grid"]')!;
    expect(grid).not.toBeNull();
    expect(grid.querySelector('[data-slot="generation-grid-empty"] [data-slot="empty-state"]')).not.toBeNull();
  });

  it("renders results as F1 cards inside F2, and drops the empty state", () => {
    const { container } = render(<GenerationShell results={RESULTS} />);
    const canvas = container.querySelector('[data-region="result-canvas"]') as HTMLElement;

    expect(canvas.querySelectorAll('[data-slot="result-card"]')).toHaveLength(2);
    expect(canvas.querySelector('[data-slot="empty-state"]')).toBeNull();
    expect(within(canvas).getByText("A lighthouse at dusk")).toBeVisible();
  });

  it("groups results through F2's own date sections", () => {
    const { container } = render(
      <GenerationShell resultGroups={[{ id: "today", label: "Today", items: RESULTS }]} />,
    );
    const canvas = container.querySelector('[data-region="result-canvas"]') as HTMLElement;
    expect(canvas.querySelector('[data-slot="date-section"]')).not.toBeNull();
    expect(within(canvas).getByText("Today")).toBeVisible();
  });

  it("composes E4 preset tiles rather than rendering its own", async () => {
    const onPresetChange = vi.fn();
    render(<GenerationShell presets={PRESETS} presetValue="cinematic" onPresetChange={onPresetChange} />);

    const tiles = document.querySelectorAll('[data-slot="preset-grid-tile"]');
    expect(tiles).toHaveLength(2);
    // E4's own radio semantics, not a styled div the shell invented.
    expect(screen.getByRole("radio", { name: /Cinematic/ })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("radio", { name: /Anime/ }));
    expect(onPresetChange).toHaveBeenCalledWith("anime");
  });

  it("composes E2 and E3 into E1's settings stage", () => {
    const { container } = render(
      <GenerationShell
        models={MODELS}
        modelId="veo"
        parameters={<div data-testid="parameter-rows" />}
        onResetParameters={() => {}}
      />,
    );
    const settings = container.querySelector('[data-slot="generation-panel-settings"]')!;
    expect(settings.querySelector('[data-slot="model-picker"]')).not.toBeNull();
    expect(settings.querySelector('[data-slot="parameter-panel"]')).not.toBeNull();
    expect(within(settings as HTMLElement).getByTestId("parameter-rows")).toBeInTheDocument();
  });

  it("selects a model through E2's own trigger", async () => {
    const onModelChange = vi.fn();
    render(
      <GenerationShell
        models={MODELS}
        modelId="veo"
        onModelChange={onModelChange}
        modelPickerPresentation="expanded-cards"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Wan 2.2/ }));
    expect(onModelChange).toHaveBeenCalledWith("wan");
  });

  // M2 is the app-level ring of the cost contract and the spec says it is
  // always visible. This shell has no sidebar, so the topbar is where it lives.
  it("keeps M2 visible in the topbar", () => {
    const { container } = render(<GenerationShell balance={414} creditsTotal={1000} costUnit="credits" />);
    const topbar = container.querySelector('[data-region="topbar"]') as HTMLElement;
    expect(topbar.querySelector('[data-slot="credits-indicator"]')).not.toBeNull();
    expect(within(topbar).getByText("414 credits")).toBeVisible();
  });

  it("keeps a caller's topbar actions alongside the credits indicator", () => {
    const { container } = render(
      <GenerationShell balance={414} topbar={{ actions: <button type="button">Share</button> }} />,
    );
    const topbar = container.querySelector('[data-region="topbar"]') as HTMLElement;
    expect(within(topbar).getByRole("button", { name: "Share" })).toBeVisible();
    expect(topbar.querySelector('[data-slot="credits-indicator"]')).not.toBeNull();
  });

  it("titles the topbar with the tool", () => {
    const { container } = render(<GenerationShell title="Upscale" />);
    const topbar = container.querySelector('[data-region="topbar"]') as HTMLElement;
    expect(within(topbar).getByText("Upscale")).toBeVisible();
  });

  // The canvas is the scroll container, so it needs a tab stop and a name of
  // its own (axe scrollable-region-focusable) — on day one it holds no
  // controls at all, which is exactly the case that rule exists for.
  it("gives the scrolling result canvas a name and a tab stop", () => {
    const { container } = render(<GenerationShell />);
    const canvas = container.querySelector('[data-region="result-canvas"]')!;
    expect(canvas).toHaveAttribute("tabindex", "0");
    expect(canvas).toHaveAccessibleName("Results");
  });

  it("forwards select mode to F1 through F2's own item context", async () => {
    const onSelectionChange = vi.fn();
    render(
      <GenerationShell
        results={RESULTS}
        selectMode
        selectedResultIds={[]}
        onSelectionChange={onSelectionChange}
        bulkActions={<button type="button">Delete</button>}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    await userEvent.click(checkboxes[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(["r1"]);
  });
});
