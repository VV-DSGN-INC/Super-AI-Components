import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Feedback } from "./feedback";

describe("Feedback", () => {
  it("renders the idle state — two icon-only thumbs, both discernible and unpressed", async () => {
    const onRate = vi.fn();
    const onSubmit = vi.fn();
    render(<Feedback onRate={onRate} onSubmit={onSubmit} />);

    const up = screen.getByRole("button", { name: "Helpful" });
    const down = screen.getByRole("button", { name: "Not helpful" });
    expect(up).toHaveAttribute("aria-pressed", "false");
    expect(down).toHaveAttribute("aria-pressed", "false");
    // The reason ask isn't mounted until a thumbs-down moves the consumer into "rating".
    expect(screen.queryByText("What went wrong?")).not.toBeInTheDocument();

    // Positive feedback is one click: it fires both the raw rate event and submit immediately.
    await userEvent.click(up);
    expect(onRate).toHaveBeenCalledWith("up");
    expect(onSubmit).toHaveBeenCalledWith({ value: "up" });
  });

  it("renders the rating state — reason popover open, chips and free text both optional", async () => {
    const onRate = vi.fn();
    const onSubmit = vi.fn();
    render(<Feedback state="rating" value="down" onRate={onRate} onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: "Not helpful" })).toHaveAttribute("aria-pressed", "true");
    const dialog = await screen.findByText("What went wrong?");
    expect(dialog).toBeInTheDocument();

    // Free text never blocks submission — Send fires with no reason typed and no chip picked.
    await userEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(onSubmit).toHaveBeenCalledWith({ value: "down", reason: undefined });

    // Picking a chip fills the reason and is reflected as pressed.
    await userEvent.click(screen.getByRole("button", { name: "Unhelpful" }));
    await userEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(onSubmit).toHaveBeenLastCalledWith({ value: "down", reason: "Unhelpful" });
  });

  it("renders the submitted state — announced, thumbs locked, and retractable via undo", async () => {
    const onUndo = vi.fn();
    render(<Feedback state="submitted" value="up" onUndo={onUndo} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Thanks for the feedback!");
    expect(screen.getByRole("button", { name: "Helpful" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Not helpful" })).toBeDisabled();

    // Feedback that can't be retracted is feedback people won't give.
    const undo = screen.getByRole("button", { name: "Undo" });
    await userEvent.click(undo);
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("passes className through", () => {
    render(<Feedback className="test-class" />);
    expect(document.querySelector('[data-slot="feedback"]')!.className).toContain("test-class");
  });
});
