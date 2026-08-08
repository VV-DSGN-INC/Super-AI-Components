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

    // Cache hit/miss must sit beside cost — same stat row, not a separate
    // surface a reader has to go hunting for.
    const costLabel = within(panel).getByText("Cost");
    const costRow = costLabel.closest("dd")?.parentElement ?? costLabel.parentElement!;
    const costValue = within(costRow as HTMLElement).getByText(/0\.42/);
    const cacheValue = within(costRow as HTMLElement).getByText("Cache hit");
    expect(costValue.compareDocumentPosition(cacheValue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("passes className through", () => {
    render(<RunInspector input={INPUT} className="test-class" />);
    expect(document.querySelector('[data-slot="run-inspector"]')!.className).toContain("test-class");
  });
});
