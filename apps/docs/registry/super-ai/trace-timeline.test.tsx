import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TraceTimeline, traceTimelineLayout, type TraceSpan } from "./trace-timeline";

const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="trace-timeline-row"]'));
const bar = (id: string) =>
  document.querySelector<HTMLElement>(`[data-slot="trace-timeline-row-bar"][data-span-id="${id}"]`)!;

describe("TraceTimeline", () => {
  it("renders the collapsed state", () => {
    const spans: TraceSpan[] = [
      { id: "plan", name: "Plan the task", status: "ok", startMs: 0, durationMs: 400 },
      { id: "search", name: "Search the web", status: "ok", startMs: 400, durationMs: 900 },
    ];
    render(<TraceTimeline spans={spans} />);

    const trigger = screen.getByRole("button", { name: /Plan the task/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // No row is open, so no detail panel content exists anywhere yet.
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
  });

  it("renders the expanded state", async () => {
    const user = userEvent.setup();
    const spans: TraceSpan[] = [
      { id: "plan", name: "Plan the task", status: "ok", startMs: 0, durationMs: 400 },
      { id: "search", name: "Search the web", status: "ok", startMs: 400, durationMs: 900 },
    ];
    render(<TraceTimeline spans={spans} defaultExpandedId="plan" />);

    const planTrigger = screen.getByRole("button", { name: /Plan the task/ });
    expect(planTrigger).toHaveAttribute("aria-expanded", "true");
    expect(within(rows()[0]).getByText("Duration")).toBeInTheDocument();

    // Rows expand "in place", one at a time: opening a different row closes
    // the one that was open, rather than stacking two open detail panes.
    await user.click(screen.getByRole("button", { name: /Search the web/ }));
    expect(screen.getByRole("button", { name: /Plan the task/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Search the web/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the errored state", () => {
    const spans: TraceSpan[] = [
      {
        id: "call-1",
        name: "Call LLM",
        status: "error",
        startMs: 0,
        durationMs: 380,
        error: "Provider timed out after 30s",
      },
    ];
    render(<TraceTimeline spans={spans} />);

    // The failure is stated in visible text, not just a red bar.
    expect(screen.getByText("Failed: Provider timed out after 30s")).toBeInTheDocument();
    expect(rows()[0]).toHaveAttribute("data-status", "error");
  });

  it("renders the retry-siblings state", () => {
    const spans: TraceSpan[] = [
      { id: "call-1", name: "Call LLM", status: "error", startMs: 0, durationMs: 380, error: "Timed out" },
      { id: "call-2", name: "Call LLM", status: "ok", retryOf: "call-1", startMs: 380, durationMs: 640 },
    ];
    render(<TraceTimeline spans={spans} />);

    expect(screen.getByText("Attempt 1")).toBeInTheDocument();
    expect(screen.getByText("Attempt 2")).toBeInTheDocument();
    expect(screen.getAllByText("Call LLM")).toHaveLength(2);
  });

  it("keeps a retry as a sibling row rather than replacing the failed attempt", () => {
    const spans: TraceSpan[] = [
      { id: "call-1", name: "Call LLM", status: "error", startMs: 0, durationMs: 380, error: "Timed out" },
      { id: "call-2", name: "Call LLM", status: "ok", retryOf: "call-1", startMs: 380, durationMs: 640 },
    ];
    render(<TraceTimeline spans={spans} />);

    const list = rows();
    expect(list).toHaveLength(2);
    expect(list[0]).toHaveAttribute("data-status", "error");
    expect(list[1]).toHaveAttribute("data-status", "ok");
    // The failed attempt's own row survives, error text and all — it was
    // never overwritten by the retry that came after it.
    expect(within(list[0]).getByText(/Timed out/)).toBeInTheDocument();
  });

  it("hands renderDetail the retry outcome for a failed attempt's row — the N5 forward pointer", () => {
    const spans: TraceSpan[] = [
      { id: "call-1", name: "Call LLM", status: "error", startMs: 0, durationMs: 380, error: "Timed out" },
      { id: "call-2", name: "Call LLM", status: "ok", retryOf: "call-1", startMs: 380, durationMs: 640 },
    ];
    const renderDetail = vi.fn(() => <div>detail</div>);

    // Expanding the span that WAS retried is told who retried it and how
    // that went — without this, a host would have to scan `spans` for
    // `retryOf` itself, the exact convention this contract exists to avoid.
    render(<TraceTimeline spans={spans} defaultExpandedId="call-1" renderDetail={renderDetail} />);
    expect(renderDetail).toHaveBeenCalledWith(expect.objectContaining({ id: "call-1" }), {
      id: "call-2",
      name: "Call LLM",
      status: "ok",
    });

    // Expanding a span nothing retried gets `undefined`, not a placeholder.
    renderDetail.mockClear();
    render(<TraceTimeline spans={spans} defaultExpandedId="call-2" renderDetail={renderDetail} />);
    expect(renderDetail).toHaveBeenCalledWith(expect.objectContaining({ id: "call-2" }), undefined);
  });

  it("shows the retry outcome in the built-in detail summary when no renderDetail is given", () => {
    const spans: TraceSpan[] = [
      { id: "call-1", name: "Call LLM", status: "error", startMs: 0, durationMs: 380, error: "Timed out" },
      { id: "call-2", name: "Call LLM", status: "ok", retryOf: "call-1", startMs: 380, durationMs: 640 },
    ];
    render(<TraceTimeline spans={spans} defaultExpandedId="call-1" />);

    expect(screen.getByText("Call LLM — Succeeded")).toBeInTheDocument();
  });

  it("positions concurrent spans so their bars overlap rather than stack", () => {
    const spans: TraceSpan[] = [
      { id: "search", name: "Search the web", status: "ok", startMs: 0, durationMs: 100 },
      { id: "read-file", name: "Read repo file", status: "ok", startMs: 50, durationMs: 100 },
      { id: "write", name: "Write result", status: "ok", startMs: 500, durationMs: 50 },
    ];
    render(<TraceTimeline spans={spans} />);

    const range = (el: HTMLElement) => {
      const left = Number.parseFloat(el.style.left);
      const width = Number.parseFloat(el.style.width);
      return [left, left + width] as const;
    };
    const [searchStart, searchEnd] = range(bar("search"));
    const [readStart, readEnd] = range(bar("read-file"));
    const [writeStart] = range(bar("write"));

    // search [0, 100) and read-file [50, 150) genuinely overlap in wall-clock
    // time, so their bars must overlap on the shared axis too — not sit
    // end-to-end the way a plain ordered list would render them.
    expect(searchStart).toBeLessThan(readEnd);
    expect(readStart).toBeLessThan(searchEnd);

    // write starts well after both finish, so it must not overlap either.
    expect(writeStart).toBeGreaterThanOrEqual(searchEnd);
    expect(writeStart).toBeGreaterThanOrEqual(readEnd);
  });

  it("positions bars from exact start time and duration, not list order", () => {
    // Direct pin on the pure layout function — no DOM involved.
    const layout = traceTimelineLayout([
      { id: "a", startMs: 0, durationMs: 100 },
      { id: "b", startMs: 50, durationMs: 100 },
    ]);
    // Total span is 150ms (b ends latest, at 150).
    expect(layout[0]).toEqual({ id: "a", leftPct: 0, widthPct: expect.closeTo(66.67, 1) });
    expect(layout[1].leftPct).toBeCloseTo(33.33, 1);
  });

  it("passes className through", () => {
    render(<TraceTimeline className="test-class" />);
    expect(document.querySelector('[data-slot="trace-timeline"]')!.className).toContain("test-class");
  });
});
