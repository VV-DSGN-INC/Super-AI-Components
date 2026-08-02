import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResetAffordance } from "./reset-affordance";

describe("ResetAffordance", () => {
  it("renders all three states in the same slot", () => {
    // Three states share one slot so the control never changes position.
    const states = ["modified", "default", "keyframed"] as const;
    for (const state of states) {
      const { unmount } = render(<ResetAffordance state={state} onReset={() => {}} />);
      expect(document.querySelector('[data-slot="reset-affordance"]')).toHaveAttribute(
        "data-state",
        state,
      );
      unmount();
    }
  });

  it("degrades to a modified-dot when collapsed", () => {
    render(<ResetAffordance state="modified" collapsed />);
    expect(document.querySelector('[data-slot="reset-affordance-dot"]')).toBeInTheDocument();
    // A hidden section still signals changes, but offers nothing to click.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("fires onReset on click and on Enter/Space", async () => {
    const onReset = vi.fn();
    render(<ResetAffordance state="modified" onReset={onReset} />);
    const button = screen.getByRole("button");
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onReset).toHaveBeenCalledTimes(3);
  });

  it("distinguishes group scope from row scope", () => {
    const row = render(<ResetAffordance state="modified" scope="row" onReset={() => {}} />);
    const a = screen.getByRole("button").className;
    row.unmount();

    render(<ResetAffordance state="modified" scope="group" onReset={() => {}} />);
    expect(screen.getByRole("button").className).not.toBe(a);
  });

  it("defaults its accessible name to Reset and lets label override it", () => {
    const def = render(<ResetAffordance state="modified" onReset={() => {}} />);
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    def.unmount();

    render(<ResetAffordance state="modified" label="Reset opacity" onReset={() => {}} />);
    expect(screen.getByRole("button", { name: "Reset opacity" })).toBeInTheDocument();
  });

  it("is disabled at default state — there is nothing to reset", () => {
    render(<ResetAffordance state="default" onReset={() => {}} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
