import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SlotSummary, type Slot } from "./slot-summary";

const SLOTS: Slot[] = [
  { id: "who", label: "Member", value: "A. Okonkwo", source: "stated" },
  { id: "plan", label: "Plan", value: "PPO Gold", source: "retrieved" },
  { id: "date", label: "Service date", value: "14 March", source: "inferred", confidence: "low" },
  { id: "region", label: "Region", value: "Northeast", source: "defaulted" },
];

describe("SlotSummary", () => {
  it("marks values the user did not supply, and leaves stated ones unmarked", () => {
    // An inferred value that looks identical to a stated one means the user is
    // auditing nothing.
    render(<SlotSummary slots={SLOTS} />);
    expect(screen.getByText("Inferred")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("From records")).toBeInTheDocument();
    expect(screen.queryByText("Stated")).not.toBeInTheDocument();
  });

  it("flags a low-confidence slot without showing a number", () => {
    render(<SlotSummary slots={SLOTS} />);
    expect(screen.getByText("Check this")).toBeInTheDocument();
    expect(screen.queryByText(/%|0\.\d/)).not.toBeInTheDocument();
  });

  it("corrects in place, per slot, without restarting anything", async () => {
    const onCorrect = vi.fn();
    render(<SlotSummary slots={SLOTS} onCorrect={onCorrect} />);
    await userEvent.click(screen.getByRole("button", { name: "Change Service date" }));
    expect(onCorrect).toHaveBeenCalledWith("date");
  });

  it("renders a missing required slot as a visible ask, not an absent row", () => {
    render(
      <SlotSummary
        slots={[{ id: "auth", label: "Authorization", source: "stated", required: true }]}
        onCorrect={() => {}}
      />,
    );
    expect(screen.getByText("Still needed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Authorization" })).toBeInTheDocument();
  });

  it("will not let you act on a partial frame", async () => {
    const onConfirm = vi.fn();
    render(
      <SlotSummary
        slots={[...SLOTS, { id: "auth", label: "Authorization", source: "stated", required: true }]}
        confirmLabel="Submit this claim"
        onConfirm={onConfirm}
      />,
    );
    const confirm = screen.getByRole("button", { name: "Submit this claim" });
    expect(confirm).toBeDisabled();
    expect(screen.getByText("1 still needed")).toBeInTheDocument();
    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("lets the confirm action state its consequence rather than saying OK", async () => {
    const onConfirm = vi.fn();
    render(<SlotSummary slots={SLOTS} confirmLabel="Cancel these 3 orders" onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel these 3 orders" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
