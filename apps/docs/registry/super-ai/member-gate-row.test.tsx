import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemberGateRow } from "./member-gate-row";

describe("MemberGateRow", () => {
  it("renders the locked state: visible with a tier badge, switch off, not a modal", () => {
    const onRequestUpgrade = vi.fn();
    const onCheckedChange = vi.fn();
    render(
      <MemberGateRow
        state="locked"
        label="4K export"
        tier="Pro"
        checked={false}
        onCheckedChange={onCheckedChange}
        onRequestUpgrade={onRequestUpgrade}
      />,
    );

    const row = document.querySelector('[data-slot="member-gate-row"]')!;
    expect(row).toHaveAttribute("data-state", "locked");

    // Locked features stay visible with a tier badge — never hidden.
    expect(screen.getByText("4K export")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();

    const gateSwitch = screen.getByRole("switch");
    expect(gateSwitch).toHaveAttribute("aria-checked", "false");
    // Locked must not be conveyed by the badge/icon alone — it needs a
    // programmatic, textual accessible description too.
    expect(gateSwitch).toHaveAccessibleDescription(/locked/i);

    // Activating a locked switch reports the attempt upward and never
    // flips itself on directly, and never opens a dialog.
    fireEvent.click(gateSwitch);
    expect(onRequestUpgrade).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(gateSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the unlocked state: a plain, functioning switch with no gate badge", () => {
    const onCheckedChange = vi.fn();
    render(<MemberGateRow state="unlocked" label="4K export" checked={true} onCheckedChange={onCheckedChange} />);

    const row = document.querySelector('[data-slot="member-gate-row"]')!;
    expect(row).toHaveAttribute("data-state", "unlocked");
    expect(document.querySelector('[data-slot="member-gate-row-tier-badge"]')).not.toBeInTheDocument();

    const gateSwitch = screen.getByRole("switch");
    expect(gateSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(gateSwitch);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("renders the trial-available state as distinct from locked and unlocked", () => {
    const onCheckedChange = vi.fn();
    render(
      <MemberGateRow
        state="trial-available"
        label="4K export"
        trialLabel="Free trial ×1"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const row = document.querySelector('[data-slot="member-gate-row"]')!;
    expect(row).toHaveAttribute("data-state", "trial-available");
    expect(screen.getByText("Free trial ×1")).toBeInTheDocument();
    // No lock badge and no lock description in this state — it's a real,
    // usable toggle, not a gate.
    expect(document.querySelector('[data-slot="member-gate-row-tier-badge"]')).not.toBeInTheDocument();

    const gateSwitch = screen.getByRole("switch");
    expect(gateSwitch).not.toHaveAccessibleDescription(/locked/i);

    fireEvent.click(gateSwitch);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders the inline-upsell state in place, not as a dialog", () => {
    const onUpgrade = vi.fn();
    const onDismissUpsell = vi.fn();
    render(
      <MemberGateRow
        state="inline-upsell"
        label="4K export"
        tier="Pro"
        upsellDescription="Unlock 4K export and more with Pro."
        onUpgrade={onUpgrade}
        onDismissUpsell={onDismissUpsell}
      />,
    );

    const row = document.querySelector('[data-slot="member-gate-row"]')!;
    expect(row).toHaveAttribute("data-state", "inline-upsell");
    // The row itself is still shown, gated exactly like `locked` — the
    // upsell is additive content below it, never a replacement or a modal.
    expect(screen.getByText("4K export")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const upsell = document.querySelector('[data-slot="member-gate-row-upsell"]')!;
    expect(upsell).toBeInTheDocument();
    expect(screen.getByText("Unlock 4K export and more with Pro.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /upgrade to pro/i }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /not now/i }));
    expect(onDismissUpsell).toHaveBeenCalledTimes(1);
  });

  it("passes className through", () => {
    render(<MemberGateRow state="unlocked" label="4K export" className="test-class" />);
    expect(document.querySelector('[data-slot="member-gate-row"]')!.className).toContain("test-class");
  });
});
