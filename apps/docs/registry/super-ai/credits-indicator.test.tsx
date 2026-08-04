import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreditsIndicator, creditsState } from "./credits-indicator";

const root = () => document.querySelector('[data-slot="credits-indicator"]')!;

describe("creditsState", () => {
  it("keeps low and empty distinct — the useful moment is before zero", () => {
    expect(creditsState(500, 100)).toBe("normal");
    expect(creditsState(80, 100)).toBe("low");
    expect(creditsState(0, 100)).toBe("empty");
  });

  it("cannot read low without a threshold, but still reads empty", () => {
    expect(creditsState(5, undefined)).toBe("normal");
    expect(creditsState(0, undefined)).toBe("empty");
  });

  it("treats a negative balance as empty, not as a smaller number", () => {
    expect(creditsState(-20, 100)).toBe("empty");
  });
});

describe("CreditsIndicator", () => {
  it("derives the low threshold from the plan total when none is given", () => {
    // 10% of 1000 = 100, so 90 is low without the consumer computing anything.
    render(<CreditsIndicator balance={90} total={1000} />);
    expect(root().getAttribute("data-state")).toBe("low");
  });

  it("lets an explicit lowAt override the derived threshold", () => {
    render(<CreditsIndicator balance={90} total={1000} lowAt={50} />);
    expect(root().getAttribute("data-state")).toBe("normal");
  });

  it("is clickable through to plan management", async () => {
    const onManage = vi.fn();
    render(<CreditsIndicator balance={414} onManage={onManage} />);
    await userEvent.click(screen.getByRole("button", { name: /manage plan/i }));
    expect(onManage).toHaveBeenCalledOnce();
  });

  it("renders a plain readout when there is nowhere to click through to", () => {
    render(<CreditsIndicator balance={414} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("414 credits")).toBeInTheDocument();
  });

  it("keeps top-up a sibling of the trigger, never nested inside it", async () => {
    // A button inside a button is invalid and the browser swallows the inner click.
    const onManage = vi.fn();
    const onTopUp = vi.fn();
    render(<CreditsIndicator balance={12} total={1000} onManage={onManage} onTopUp={onTopUp} />);

    const trigger = document.querySelector('[data-slot="credits-indicator-trigger"]')!;
    const topUp = screen.getByRole("button", { name: "Top up" });
    expect(trigger.contains(topUp)).toBe(false);

    await userEvent.click(topUp);
    expect(onTopUp).toHaveBeenCalledOnce();
    expect(onManage).not.toHaveBeenCalled();
  });

  it("draws the ring only when there is a denominator to draw it against", () => {
    const { unmount } = render(<CreditsIndicator form="ring" balance={500} total={1000} />);
    expect(document.querySelector("svg")).toBeInTheDocument();
    unmount();

    render(<CreditsIndicator form="ring" balance={500} />);
    expect(document.querySelector("svg")).not.toBeInTheDocument();
  });
});
