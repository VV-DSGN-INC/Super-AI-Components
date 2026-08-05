import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApprovalCard } from "./approval-card";

const verbNames = () =>
  screen
    .getAllByRole("button")
    .map((b) => b.textContent?.trim())
    .filter((t): t is string => Boolean(t));

describe("ApprovalCard", () => {
  it("renders the pending state", () => {
    const { container } = render(
      <ApprovalCard
        title="Publish the Q3 summary"
        summary="Three paragraphs drafted from last quarter's metrics."
        onConfirm={() => {}}
        onSkip={() => {}}
      />,
    );
    expect(container.querySelector('[data-slot="approval-card"]')).toHaveAttribute(
      "data-state",
      "pending",
    );
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Awaiting your decision");
  });

  it("renders the submitting state", () => {
    render(
      <ApprovalCard
        title="Publish the Q3 summary"
        state="submitting"
        onConfirm={() => {}}
        onEdit={() => {}}
        onSkip={() => {}}
      />,
    );
    // Every verb is locked while the decision is in flight — not just the one
    // that was clicked, or a second click resolves it twice.
    for (const name of [/confirm/i, /edit/i, /skip/i]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
    expect(screen.getByRole("status")).toHaveTextContent("Submitting your decision");
  });

  it("renders the resolved state", () => {
    const { container } = render(
      <ApprovalCard title="Publish the Q3 summary" state="resolved" resolution="confirmed" />,
    );
    // Scoped to the visible slot: the sr-only status says the same words.
    expect(container.querySelector('[data-slot="approval-card-resolution"]')).toHaveTextContent(
      "Confirmed",
    );
    // The verbs are gone: a resolved decision is not re-decidable in place.
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument();
  });

  it("renders the verb-order state", () => {
    render(
      <ApprovalCard
        title="Publish the Q3 summary"
        onConfirm={() => {}}
        onEdit={() => {}}
        onRegenerate={() => {}}
        onSkip={() => {}}
      />,
    );
    expect(verbNames()).toEqual(["Confirm", "Edit", "Regenerate", "Skip"]);
  });

  it("passes className through", () => {
    render(<ApprovalCard title="X" className="test-class" />);
    expect(document.querySelector('[data-slot="approval-card"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("fixes verb order in the component, not by which callbacks are supplied", () => {
    // Handlers passed in deliberately reversed order.
    const { unmount } = render(
      <ApprovalCard
        title="X"
        onSkip={() => {}}
        onRegenerate={() => {}}
        onEdit={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(verbNames()).toEqual(["Confirm", "Edit", "Regenerate", "Skip"]);
    unmount();

    // A subset keeps its relative order rather than collapsing to call order.
    render(<ApprovalCard title="X" onSkip={() => {}} onConfirm={() => {}} />);
    expect(verbNames()).toEqual(["Confirm", "Skip"]);
  });

  it("renders only the verbs that have handlers", () => {
    render(<ApprovalCard title="X" onConfirm={() => {}} />);
    expect(verbNames()).toEqual(["Confirm"]);
    expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument();
  });

  it("keeps detail truncated until explicitly expanded", async () => {
    render(
      <ApprovalCard
        title="X"
        detail={<p>The full body of the draft, all six hundred words of it.</p>}
      />,
    );
    // Not merely clipped — absent, so a screen reader cannot read what a
    // sighted user has not been shown either.
    expect(screen.queryByText(/six hundred words/)).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /show detail/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(screen.getByText(/six hundred words/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide detail/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("lets a caller control expansion", async () => {
    const onExpandedChange = vi.fn();
    render(
      <ApprovalCard title="X" detail={<p>Body</p>} expanded={false} onExpandedChange={onExpandedChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /show detail/i }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // Controlled: the component did not expand itself.
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("routes each verb to its own handler", async () => {
    const onConfirm = vi.fn();
    const onEdit = vi.fn();
    const onRegenerate = vi.fn();
    const onSkip = vi.fn();
    render(
      <ApprovalCard
        title="X"
        onConfirm={onConfirm}
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        onSkip={onSkip}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("names the resolution in words, never by colour or icon alone", () => {
    for (const [resolution, text] of [
      ["confirmed", "Confirmed"],
      ["edited", "Sent back for editing"],
      ["regenerated", "Sent back to regenerate"],
      ["skipped", "Skipped"],
    ] as const) {
      const { unmount } = render(
        <ApprovalCard title="X" state="resolved" resolution={resolution} />,
      );
      expect(screen.getByRole("status")).toHaveTextContent(text);
      unmount();
    }
  });
});

describe("ApprovalCard undo window", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("exposes Undo for the window, then withdraws it", () => {
    render(
      <ApprovalCard
        title="X"
        state="resolved"
        resolution="confirmed"
        onUndo={() => {}}
        undoWindowMs={8000}
      />,
    );
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();

    // act() so the timer's state update is flushed before we assert on it.
    act(() => void vi.advanceTimersByTime(7999));
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByRole("button", { name: /undo/i })).not.toBeInTheDocument();
    // The decision itself is still stated once the window closes.
    expect(
      document.querySelector('[data-slot="approval-card-resolution"]'),
    ).toHaveTextContent("Confirmed");
  });

  it("gives a second decision its own full window", () => {
    const { rerender } = render(
      <ApprovalCard title="X" state="resolved" resolution="confirmed" onUndo={() => {}} />,
    );
    act(() => void vi.advanceTimersByTime(8000));
    expect(screen.queryByRole("button", { name: /undo/i })).not.toBeInTheDocument();

    // Undone, then resolved again a different way.
    rerender(<ApprovalCard title="X" state="pending" onUndo={() => {}} onConfirm={() => {}} />);
    rerender(<ApprovalCard title="X" state="resolved" resolution="skipped" onUndo={() => {}} />);
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });

  it("shows no Undo at all when no handler is supplied", () => {
    render(<ApprovalCard title="X" state="resolved" resolution="confirmed" />);
    expect(screen.queryByRole("button", { name: /undo/i })).not.toBeInTheDocument();
  });
});
