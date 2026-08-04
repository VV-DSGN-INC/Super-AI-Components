import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenerationQueue, type GenerationQueueItem } from "./generation-queue";

describe("GenerationQueue", () => {
  it("renders the queued state", () => {
    const items: GenerationQueueItem[] = [{ id: "1", title: "Sunset over the bay", state: "queued" }];
    render(<GenerationQueue items={items} onCancelItem={() => {}} />);

    expect(screen.getByText("Sunset over the bay")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    // A bare icon is never enough — the row's cancel control needs its own
    // discernible accessible name, not a shared "Cancel" for every row.
    expect(screen.getByRole("button", { name: "Cancel Sunset over the bay" })).toBeInTheDocument();
  });

  it("renders the running state", () => {
    const items: GenerationQueueItem[] = [{ id: "1", title: "Neon alley", state: "running", progress: 42 }];
    render(<GenerationQueue items={items} onCancelItem={() => {}} />);

    // Progress must be readable, not just visible: a real progressbar role
    // with a numeric value and a formatted accessible value text ("42%"),
    // not a percentage conveyed by bar width alone.
    const bar = screen.getByRole("progressbar", { name: "Neon alley progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar.getAttribute("aria-valuetext")).toContain("42");
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Neon alley" })).toBeInTheDocument();
  });

  it("renders the done state", () => {
    const items: GenerationQueueItem[] = [{ id: "1", title: "Glass sculpture", state: "done" }];
    render(<GenerationQueue items={items} />);

    expect(screen.getByText("Glass sculpture")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    // No per-slot progressbar once a row has resolved — only a fully
    // resolved batch summary (if any) remains, never a per-item one.
    expect(screen.queryByRole("progressbar", { name: "Glass sculpture progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the failed state", () => {
    const items: GenerationQueueItem[] = [
      { id: "1", title: "Marble bust", state: "failed", errorMessage: "Generation timed out" },
    ];
    render(<GenerationQueue items={items} onRetryItem={() => {}} />);

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Generation timed out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Marble bust" })).toBeInTheDocument();
    // `done` and `failed` must differ by more than colour: distinct text
    // labels (and distinct icons) render for the two states.
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("renders the cancel state", () => {
    const items: GenerationQueueItem[] = [{ id: "1", title: "Paper crane", state: "cancel" }];
    render(<GenerationQueue items={items} onCancelItem={() => {}} onRetryItem={() => {}} />);

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    // Nothing left to cancel or retry on an already-cancelled slot.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<GenerationQueue className="test-class" />);
    expect(document.querySelector('[data-slot="generation-queue"]')!.className).toContain("test-class");
  });

  it("announces state transitions via role=status per row", () => {
    const items: GenerationQueueItem[] = [{ id: "1", title: "Copper vase", state: "running", progress: 10 }];
    const { rerender } = render(<GenerationQueue items={items} />);
    expect(screen.getByRole("status")).toHaveTextContent("Copper vase: Running, 10%");

    rerender(<GenerationQueue items={[{ id: "1", title: "Copper vase", state: "done" }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Copper vase: Done");
  });

  it("cancelling a batch only targets queued/running ids, never orphaning completed slots", () => {
    const onCancelAll = vi.fn();
    const items: GenerationQueueItem[] = [
      { id: "done-1", title: "Finished piece", state: "done" },
      { id: "queued-1", title: "Waiting piece", state: "queued" },
      { id: "running-1", title: "In-flight piece", state: "running", progress: 50 },
    ];
    render(<GenerationQueue items={items} onCancelAll={onCancelAll} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel all" }));

    expect(onCancelAll).toHaveBeenCalledWith(["queued-1", "running-1"]);
  });

  it("hides Cancel all once nothing is left to cancel", () => {
    const onCancelAll = vi.fn();
    const items: GenerationQueueItem[] = [{ id: "1", title: "Finished piece", state: "done" }];
    render(<GenerationQueue items={items} onCancelAll={onCancelAll} />);

    expect(screen.queryByRole("button", { name: "Cancel all" })).not.toBeInTheDocument();
  });

  it("derives batch progress from resolved slots when not supplied explicitly", () => {
    const items: GenerationQueueItem[] = [
      { id: "1", title: "One", state: "done" },
      { id: "2", title: "Two", state: "failed" },
      { id: "3", title: "Three", state: "queued" },
      { id: "4", title: "Four", state: "running", progress: 50 },
    ];
    render(<GenerationQueue items={items} heading="Generating 4 images" />);

    // Batch progress (2 of 4 resolved = 50%) and the running slot's own
    // per-slot progress (50%) happen to coincide here but are two distinct
    // progressbars, each independently readable.
    const batchBar = screen.getByRole("progressbar", { name: "Batch progress" });
    expect(batchBar).toHaveAttribute("aria-valuenow", "50");
  });
});
