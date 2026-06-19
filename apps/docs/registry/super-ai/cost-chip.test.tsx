import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CostChip } from "./cost-chip";

describe("CostChip", () => {
  it("renders amount with default unit and exposes the data-slot contract", () => {
    render(<CostChip amount={17} data-testid="chip" />);
    expect(screen.getByText(/17\s*credits/)).toBeInTheDocument();
    expect(screen.getByTestId("chip")).toHaveAttribute("data-slot", "cost-chip");
  });
  it("supports a custom unit (metered pricing)", () => {
    render(<CostChip amount={900} unit="credits/min" />);
    expect(screen.getByText(/900\s*credits\/min/)).toBeInTheDocument();
  });
  it("accepts a pre-formatted string amount", () => {
    render(<CostChip amount="$0.004" unit="per call" data-testid="chip3" />);
    expect(screen.getByText(/\$0\.004\s*per call/)).toBeInTheDocument();
    expect(screen.getByTestId("chip3")).toHaveAttribute("data-slot", "cost-chip");
  });
});
