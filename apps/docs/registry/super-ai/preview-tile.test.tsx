import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PreviewTile } from "./preview-tile";

const frameClassName = () => document.querySelector('[data-slot="preview-tile-frame"]')!.className;

describe("PreviewTile", () => {
  it("keeps identical frame classes across every state", () => {
    const states = ["default", "loading", "locked", "failed"] as const;
    const frames = states.map((state) => {
      const { unmount } = render(
        <PreviewTile state={state}>
          <div data-testid="content" />
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

  it("is a button carrying aria-pressed when selectable", async () => {
    const onSelect = vi.fn();
    render(<PreviewTile label="Tile" onSelect={onSelect} selected />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("fires onSelect on Enter and Space", async () => {
    const onSelect = vi.fn();
    render(<PreviewTile onSelect={onSelect} />);
    screen.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("is not focusable and exposes no button when not selectable", () => {
    render(<PreviewTile label="Static" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("loading and failed replace children; locked keeps them", () => {
    const child = <span>CHILD</span>;

    const loading = render(<PreviewTile state="loading">{child}</PreviewTile>);
    expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
    loading.unmount();

    const failed = render(<PreviewTile state="failed">{child}</PreviewTile>);
    expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
    failed.unmount();

    render(<PreviewTile state="locked">{child}</PreviewTile>);
    expect(screen.getByText("CHILD")).toBeInTheDocument();
  });

  it("renders the action slot in locked and failed, and keeps label and badge in every state", () => {
    const locked = render(
      <PreviewTile
        state="locked"
        label="Tile"
        badge={<span>PRO</span>}
        action={<button>Upgrade</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
    expect(screen.getByText("Tile")).toBeInTheDocument();
    expect(screen.getByText("PRO")).toBeInTheDocument();
    locked.unmount();

    render(<PreviewTile state="failed" action={<button>Retry</button>} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
