import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuotaMeter, quotaState } from "./quota-meter";

const row = () => document.querySelector('[data-slot="quota-meter-row"]')!;
const bar = () => document.querySelector('[data-slot="quota-meter-bar"]') as HTMLElement;

describe("quotaState", () => {
  it("separates near-limit from normal — the useful moment is before zero", () => {
    expect(quotaState(50, 100, 0.8)).toBe("normal");
    expect(quotaState(80, 100, 0.8)).toBe("near-limit");
  });

  it("treats reaching the limit as over-limit, not near-limit", () => {
    expect(quotaState(100, 100, 0.8)).toBe("over-limit");
    expect(quotaState(140, 100, 0.8)).toBe("over-limit");
  });

  it("does not divide by a zero limit", () => {
    expect(quotaState(0, 0, 0.8)).toBe("over-limit");
  });
});

describe("QuotaMeter", () => {
  it("renders one row per resource, never an aggregate", () => {
    // An aggregate bar hides the single resource you are about to exhaust.
    render(
      <QuotaMeter
        resources={[
          { label: "Messages", used: 10, limit: 100 },
          { label: "Image generations", used: 95, limit: 100 },
        ]}
      />,
    );
    expect(document.querySelectorAll('[data-slot="quota-meter-row"]')).toHaveLength(2);
  });

  it("clamps the bar at 100% while still reporting the real overage", () => {
    render(<QuotaMeter resources={[{ label: "Messages", used: 140, limit: 100 }]} />);
    expect(bar().style.width).toBe("100%");
    expect(screen.getByText("140 / 100")).toBeInTheDocument();
    expect(row().getAttribute("data-state")).toBe("over-limit");
  });

  it("exposes the true value to assistive tech, not the clamped percentage", () => {
    render(<QuotaMeter resources={[{ label: "Messages", used: 140, limit: 100 }]} />);
    const track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "140");
    expect(track).toHaveAttribute("aria-valuemax", "100");
  });

  it("honours a custom near-limit threshold", () => {
    render(<QuotaMeter nearLimitAt={0.5} resources={[{ label: "Runs", used: 60, limit: 100 }]} />);
    expect(row().getAttribute("data-state")).toBe("near-limit");
  });

  it("shows the reset countdown, because it changes the decision more than the number", () => {
    render(
      <QuotaMeter resources={[{ label: "Messages", used: 10, limit: 100, resetsIn: "Resets in 3 days" }]} />,
    );
    expect(screen.getByText("Resets in 3 days")).toBeInTheDocument();
  });

  it("drops the reset line in the compact sidebar form but keeps the row", () => {
    render(
      <QuotaMeter
        compact
        resources={[{ label: "Messages", used: 10, limit: 100, resetsIn: "Resets in 3 days" }]}
      />,
    );
    expect(screen.queryByText("Resets in 3 days")).not.toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });
});
