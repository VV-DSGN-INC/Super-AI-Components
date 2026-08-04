import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromoCard } from "./promo-card";

describe("PromoCard", () => {
  it.each([
    ["upgrade", "Upgrade to Pro"],
    ["invite", "Invite your team"],
    ["update-available", "Update available"],
    ["quota-warning", "You're near your limit"],
  ] as const)("renders the %s flavour", (flavour, title) => {
    render(<PromoCard flavour={flavour} title={title} onDismiss={vi.fn()} />);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders without art — the art slot is optional in every flavour", () => {
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" onDismiss={vi.fn()} />);
    expect(document.querySelector('[data-slot="promo-card-art"]')).toBeNull();
  });

  it("is always dismissible", async () => {
    const onDismiss = vi.fn();
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders nothing in the dismissed state", () => {
    render(<PromoCard flavour="upgrade" title="Upgrade to Pro" dismissed onDismiss={vi.fn()} />);
    // Dismissal that does not persist reads as a bug — the consumer owns the
    // persistence, the component owns honouring it.
    expect(screen.queryByText("Upgrade to Pro")).toBeNull();
  });

  it("passes className through", () => {
    render(<PromoCard flavour="upgrade" title="T" onDismiss={vi.fn()} className="test-class" />);
    expect(document.querySelector('[data-slot="promo-card"]')!.className).toContain("test-class");
  });
});
