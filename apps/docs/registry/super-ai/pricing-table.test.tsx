import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PricingTable, annualSaving, type PricingPlan } from "./pricing-table";

const PLANS: PricingPlan[] = [
  { name: "Free", monthly: 0, yearly: 0 },
  {
    name: "Pro",
    monthly: 20,
    yearly: 16,
    highlighted: true,
    featureGroups: [
      { title: "Generation", features: ["Unlimited images", "Priority queue"] },
      { title: "Collaboration", features: ["5 seats"] },
    ],
  },
];

describe("annualSaving", () => {
  it("reports the best whole-percent saving across paid plans", () => {
    expect(annualSaving(PLANS)).toBe(20);
  });

  it("returns null when no plan is cheaper annually — nothing to anchor against", () => {
    expect(annualSaving([{ name: "Flat", monthly: 20, yearly: 20 }])).toBeNull();
    expect(annualSaving([{ name: "Free", monthly: 0, yearly: 0 }])).toBeNull();
  });
});

describe("PricingTable", () => {
  it("swaps prices when the period changes — the toggle is the anchor", async () => {
    render(<PricingTable plans={PLANS} />);
    expect(screen.getByText("$20")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /yearly/i }));
    expect(screen.getByText("$16")).toBeInTheDocument();
    expect(screen.getByText(/billed yearly/)).toBeInTheDocument();
  });

  it("shows the saving badge on the annual option", () => {
    render(<PricingTable plans={PLANS} />);
    expect(screen.getByText("Save 20%")).toBeInTheDocument();
  });

  it("renders zero as Free rather than $0", () => {
    render(<PricingTable plans={PLANS} />);
    expect(screen.getByText("Free", { selector: "span" })).toBeInTheDocument();
  });

  it("respects a controlled period instead of its own state", async () => {
    const onPeriodChange = vi.fn();
    render(<PricingTable plans={PLANS} period="monthly" onPeriodChange={onPeriodChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /yearly/i }));
    expect(onPeriodChange).toHaveBeenCalledWith("yearly");
    // Still monthly: the parent owns the value.
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  it("groups features under product-area sub-headings, not one flat list", () => {
    render(<PricingTable plans={PLANS} />);
    expect(document.querySelectorAll('[data-slot="pricing-table-feature-group"]')).toHaveLength(2);
    expect(screen.getByText("Generation")).toBeInTheDocument();
    expect(screen.getByText("Collaboration")).toBeInTheDocument();
  });

  it("renders an add-on as a switch row, never as another plan card", async () => {
    const onToggle = vi.fn();
    render(
      <PricingTable
        plans={PLANS}
        addOns={[{ name: "Extra storage", monthly: 5, yearly: 4, enabled: false, onToggle }]}
      />,
    );

    // Two plans — the add-on did not become a third card.
    expect(document.querySelectorAll('[data-slot="pricing-table-plan"]')).toHaveLength(2);

    const toggle = screen.getByRole("switch", { name: "Extra storage" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("prices add-ons on the same period as the plans", async () => {
    render(<PricingTable plans={PLANS} addOns={[{ name: "Extra storage", monthly: 5, yearly: 4 }]} />);
    expect(screen.getByText("$5/mo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /yearly/i }));
    expect(screen.getByText("$4/mo")).toBeInTheDocument();
  });

  it("disables the CTA on the plan you are already on", async () => {
    const onSelectPlan = vi.fn();
    render(
      <PricingTable
        plans={[{ name: "Pro", monthly: 20, yearly: 16, current: true }]}
        onSelectPlan={onSelectPlan}
      />,
    );
    const cta = screen.getByRole("button", { name: "Current plan" });
    expect(cta).toBeDisabled();
    await userEvent.click(cta);
    expect(onSelectPlan).not.toHaveBeenCalled();
  });
});
