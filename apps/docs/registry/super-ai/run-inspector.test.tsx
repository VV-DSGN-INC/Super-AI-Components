import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RunInspector } from "./run-inspector";

const INPUT = { prompt: "Summarize the doc", maxTokens: 256 };
const OUTPUT = { text: "Here is the summary." };

describe("RunInspector", () => {
  it("renders the input-tab state with the raw input pretty-printed", () => {
    render(<RunInspector input={INPUT} defaultTab="input" />);

    const panel = document.querySelector<HTMLElement>('[data-run-inspector-panel-id="input"]')!;
    expect(panel.querySelector("pre")!.textContent).toBe(JSON.stringify(INPUT, null, 2));
  });

  it("renders the output-tab state with the raw output pretty-printed", () => {
    render(<RunInspector input={INPUT} output={OUTPUT} defaultTab="output" />);

    const panel = document.querySelector<HTMLElement>('[data-run-inspector-panel-id="output"]')!;
    expect(panel.querySelector("pre")!.textContent).toBe(JSON.stringify(OUTPUT, null, 2));
  });

  it("renders the metadata-tab state with cache hit/miss beside cost", () => {
    render(
      <RunInspector
        input={INPUT}
        defaultTab="metadata"
        metadata={{
          model: "gpt-4o-mini",
          latencyMs: 820,
          tokensIn: 128,
          tokensOut: 64,
          cost: 0.42,
          costUnit: "credits",
          cacheHit: true,
        }}
      />,
    );

    const panel = document.querySelector<HTMLElement>('[data-run-inspector-panel-id="metadata"]')!;
    expect(within(panel).getByText("gpt-4o-mini")).toBeInTheDocument();

    // Cache hit/miss must sit beside cost — inside the same stat-readout
    // `dd` as the cost value, not merely somewhere later in the panel. In
    // stat-readout.tsx, `dt` and `dd` are siblings under `dl`, so the `dd`
    // that actually holds the cost value is the label's next sibling, not
    // an ancestor reachable via `.closest()`.
    const costLabel = within(panel).getByText("Cost");
    const costRow = costLabel.nextElementSibling as HTMLElement;
    expect(costRow.tagName).toBe("DD");
    expect(within(costRow).getByText(/0\.42/)).toBeInTheDocument();
    expect(within(costRow).getByText("Cache hit")).toBeInTheDocument();
  });

  it("renders the error-tab state with the error stated in visible text, never colour alone", () => {
    render(<RunInspector input={INPUT} defaultTab="error" error="Provider timed out after 30s" />);

    const panel = document.querySelector<HTMLElement>('[data-run-inspector-panel-id="error"]')!;
    expect(within(panel).getByText(/Provider timed out after 30s/)).toBeInTheDocument();
  });

  it("exposes a copy affordance on the input and output panes that carries the raw JSON", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<RunInspector input={INPUT} output={OUTPUT} defaultTab="input" />);

    await userEvent.click(screen.getByRole("button", { name: /copy input/i }));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(INPUT, null, 2));

    await userEvent.click(screen.getByRole("tab", { name: /output/i }));
    await userEvent.click(screen.getByRole("button", { name: /copy output/i }));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(OUTPUT, null, 2));
  });

  it("reports what was retried and whether it worked on the error tab", () => {
    render(
      <RunInspector
        input={INPUT}
        defaultTab="error"
        error="Provider timed out after 30s"
        retriedAttempt={{ id: "call-0", name: "Call LLM", status: "error" }}
        retriedBy={{ id: "call-2", name: "Call LLM (retry)", status: "ok" }}
      />,
    );

    const panel = document.querySelector<HTMLElement>('[data-run-inspector-panel-id="error"]')!;
    // What was retried, and did that attempt fail...
    expect(within(panel).getByText(/Retried attempt:/).parentElement?.textContent).toBe(
      "Retried attempt: Call LLM — Failed",
    );
    // ...and whether the retry that followed it worked.
    expect(within(panel).getByText(/Retried by:/).parentElement?.textContent).toBe(
      "Retried by: Call LLM (retry) — Succeeded",
    );
  });

  it("names the error state on the tab trigger itself, not only inside the panel", () => {
    render(<RunInspector input={INPUT} error="Provider timed out after 30s" />);

    // First contact is the tab strip, before a reader ever opens the error
    // panel — the presence dot there must not be the only signal.
    expect(screen.getByRole("tab", { name: /error/i })).toHaveAccessibleName("Error, this run failed");
  });

  it("names the error tab trigger with just its label when nothing errored", () => {
    render(<RunInspector input={INPUT} />);

    expect(screen.getByRole("tab", { name: "Error" })).toHaveAccessibleName("Error");
  });

  it("passes className through", () => {
    render(<RunInspector input={INPUT} className="test-class" />);
    expect(document.querySelector('[data-slot="run-inspector"]')!.className).toContain("test-class");
  });
});
