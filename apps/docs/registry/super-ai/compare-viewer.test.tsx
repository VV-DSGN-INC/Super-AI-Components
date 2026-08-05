import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompareViewer, type ComparePane } from "./compare-viewer";

const PANES: ComparePane[] = [
  { id: "a", label: "Original", content: <div data-testid="pane-a">A</div> },
  { id: "b", label: "Upscaled 4x", content: <div data-testid="pane-b">B</div> },
];

const numbers = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-slot="compare-viewer-pane-number"]')].map((n) =>
    n.textContent?.trim(),
  );

const labels = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-slot="compare-viewer-pane-label"]')].map((n) =>
    n.textContent?.trim(),
  );

describe("CompareViewer", () => {
  it("renders the side state", () => {
    const { container } = render(<CompareViewer panes={PANES} mode="side" />);
    expect(container.querySelector('[data-slot="compare-viewer"]')).toHaveAttribute(
      "data-mode",
      "side",
    );
    // Side view is the only mode with room for both captions.
    expect(labels(container)).toEqual(["Original", "Upscaled 4x"]);
    expect(numbers(container)).toEqual(["1", "2"]);
  });

  it("renders the single state", () => {
    const { container } = render(<CompareViewer panes={PANES} mode="single" activePaneId="b" />);
    expect(screen.getByTestId("pane-b")).toBeInTheDocument();
    expect(screen.queryByTestId("pane-a")).not.toBeInTheDocument();
    // The visible pane is still identified — by its number, which is 2.
    expect(numbers(container)).toEqual(["2"]);
  });

  it("renders the wipe state", () => {
    const { container } = render(<CompareViewer panes={PANES} mode="wipe" wipePosition={40} />);
    // Both panes stay mounted; the second is clipped over the first.
    expect(screen.getByTestId("pane-a")).toBeInTheDocument();
    expect(screen.getByTestId("pane-b")).toBeInTheDocument();
    const clipped = screen.getByTestId("pane-b").parentElement!;
    expect(clipped.style.clipPath).toBe("inset(0 0 0 40%)");

    // Queried as an element, not by role: Base UI keeps the thumb
    // `visibility: hidden` until it has measured the track, which never
    // happens under jsdom, so getByRole("slider") correctly finds nothing.
    // The accessible name is the point of the assertion, and axe re-checks it
    // for real in the story gate.
    const handle = container.querySelector(
      '[data-slot="compare-viewer-wipe"] input[type="range"]',
    )!;
    expect(handle).toHaveAttribute("aria-label", "Wipe position");
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    expect(handle).toHaveAttribute("aria-valuetext", "40 percent");
  });

  it("passes className through", () => {
    render(<CompareViewer panes={PANES} className="test-class" />);
    expect(document.querySelector('[data-slot="compare-viewer"]')!.className).toContain(
      "test-class",
    );
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("persists pane numbers in single and wipe, where labels do not", () => {
    const { container: side } = render(<CompareViewer panes={PANES} mode="side" />);
    expect(labels(side)).toHaveLength(2);
    expect(numbers(side)).toEqual(["1", "2"]);

    const { container: single } = render(
      <CompareViewer panes={PANES} mode="single" activePaneId="a" />,
    );
    expect(labels(single)).toHaveLength(0);
    expect(numbers(single)).toEqual(["1"]);

    const { container: wipe } = render(<CompareViewer panes={PANES} mode="wipe" />);
    expect(labels(wipe)).toHaveLength(0);
    expect(numbers(wipe)).toEqual(["1", "2"]);
  });

  it("preserves the wipe position across a mode change", () => {
    const { container, rerender } = render(
      <CompareViewer panes={PANES} mode="wipe" wipePosition={72} />,
    );
    expect(screen.getByTestId("pane-b").parentElement!.style.clipPath).toBe("inset(0 0 0 72%)");

    // Out to side view and back — the position is a prop, so nothing internal
    // resets it and the comparison you had set up survives the round trip.
    rerender(<CompareViewer panes={PANES} mode="side" wipePosition={72} />);
    expect(container.querySelector('[data-slot="compare-viewer"]')).toHaveAttribute(
      "data-mode",
      "side",
    );

    rerender(<CompareViewer panes={PANES} mode="wipe" wipePosition={72} />);
    expect(screen.getByTestId("pane-b").parentElement!.style.clipPath).toBe("inset(0 0 0 72%)");
  });

  it("defaults the wipe to the midpoint rather than to an edge", () => {
    render(<CompareViewer panes={PANES} mode="wipe" />);
    expect(screen.getByTestId("pane-b").parentElement!.style.clipPath).toBe("inset(0 0 0 50%)");
  });

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  it("reports a mode change", async () => {
    const onModeChange = vi.fn();
    render(<CompareViewer panes={PANES} mode="side" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Wipe" }));
    expect(onModeChange).toHaveBeenCalledWith("wipe");
  });

  it("names every pane switcher by its label, not by its number alone", async () => {
    const onActivePaneChange = vi.fn();
    render(
      <CompareViewer
        panes={PANES}
        mode="single"
        activePaneId="a"
        onActivePaneChange={onActivePaneChange}
      />,
    );
    const group = screen.getByRole("group", { name: "Visible pane" });
    expect(within(group).getByRole("button", { name: "Show pane 1: Original" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(within(group).getByRole("button", { name: "Show pane 2: Upscaled 4x" }));
    expect(onActivePaneChange).toHaveBeenCalledWith("b");
  });

  it("hides the pane switcher when there is no handler to receive it", () => {
    render(<CompareViewer panes={PANES} mode="single" activePaneId="a" />);
    expect(screen.queryByRole("group", { name: "Visible pane" })).not.toBeInTheDocument();
  });

  it("falls back to the first pane when activePaneId matches nothing", () => {
    const { container } = render(
      <CompareViewer panes={PANES} mode="single" activePaneId="does-not-exist" />,
    );
    expect(screen.getByTestId("pane-a")).toBeInTheDocument();
    expect(numbers(container)).toEqual(["1"]);
  });

  it("exposes syncKey as an attribute rather than pretending to own zoom", () => {
    const { container } = render(<CompareViewer panes={PANES} syncKey="upscale-run-4" />);
    expect(container.querySelector('[data-slot="compare-viewer"]')).toHaveAttribute(
      "data-sync-key",
      "upscale-run-4",
    );
  });
});
