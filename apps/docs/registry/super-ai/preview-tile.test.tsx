import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewTile } from "./preview-tile";

const frameClassName = () => document.querySelector('[data-slot="preview-tile-frame"]')!.className;

describe("PreviewTile", () => {
  it("keeps identical frame classes across every state", () => {
    const states = ["default", "loading", "locked", "failed"] as const;
    const frames = states.map((state) => {
      const { unmount } = render(
        <PreviewTile state={state}>
          <img alt="" src="data:," />
        </PreviewTile>,
      );
      const className = frameClassName();
      unmount();
      return className;
    });
    expect(new Set(frames).size).toBe(1);
  });

  it("applies a ring when selected and never a border", () => {
    const { rerender } = render(<PreviewTile selected={false} />);
    expect(frameClassName()).not.toMatch(/\bring-2\b/);
    rerender(<PreviewTile selected />);
    expect(frameClassName()).toMatch(/\bring-2\b/);
    expect(frameClassName()).not.toMatch(/\bborder-2\b/);
  });

  it("places the label per labelPlacement", () => {
    const frame = () => document.querySelector('[data-slot="preview-tile-frame"]')!;

    const overlay = render(<PreviewTile label="Neon noir" labelPlacement="overlay" />);
    expect(frame().textContent).toContain("Neon noir");
    overlay.unmount();

    const below = render(<PreviewTile label="Neon noir" labelPlacement="below" />);
    expect(frame().textContent).not.toContain("Neon noir");
    expect(screen.getByText("Neon noir")).toBeInTheDocument();
    below.unmount();

    render(<PreviewTile label="Neon noir" labelPlacement="none" />);
    expect(screen.queryByText("Neon noir")).not.toBeInTheDocument();
  });

  it("renders the badge inside the frame", () => {
    render(<PreviewTile badge={<span>17 credits</span>} />);
    const frame = document.querySelector('[data-slot="preview-tile-frame"]')!;
    expect(frame.textContent).toContain("17 credits");
  });
});
