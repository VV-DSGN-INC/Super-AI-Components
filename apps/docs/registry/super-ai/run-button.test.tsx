import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RunButton } from "./run-button";

describe("RunButton", () => {
  it("renders the idle state with the cost surfaced beside the trigger", () => {
    render(<RunButton cost={5} />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "idle");
    expect(root).not.toHaveAttribute("aria-busy");

    const trigger = screen.getByRole("button", { name: "Generate" });
    expect(trigger).not.toBeDisabled();
    expect(screen.getByText(/5\s*credits/)).toBeInTheDocument();
  });

  it("calls onRun when the idle trigger is clicked", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<RunButton onRun={onRun} />);
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("renders the estimating state — busy, announced, and blocked from running blind", () => {
    render(<RunButton state="estimating" />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "estimating");
    expect(root).toHaveAttribute("aria-busy", "true");

    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Estimating cost…");
  });

  it("renders the running state with progress drawn inside the trigger and Cancel exposed", () => {
    render(<RunButton state="running" progress={40} />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "running");
    expect(root).toHaveAttribute("aria-busy", "true");

    // Progress is drawn right behind the trigger — one visual control, not a
    // separate bar mounted elsewhere on the page.
    const frame = document.querySelector('[data-slot="run-button-trigger-frame"]')!;
    const trigger = screen.getByRole("button", { name: "Generating…" });
    expect(trigger).toBeDisabled();
    expect(frame).toContainElement(trigger);
    expect(frame.querySelector('[data-slot="run-button-progress"]')).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");

    // A generation you can't stop burns credits and trust — Cancel must be reachable.
    const cancel = screen.getByRole("button", { name: /cancel/i });
    expect(cancel).toBeInTheDocument();
    expect(cancel).not.toBeDisabled();

    // The busy transition is announced, not just repainted.
    expect(screen.getByRole("status")).toHaveTextContent("Generating…");
  });

  it("Cancel calls onCancel while running", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<RunButton state="running" onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders the done state and re-triggers onRun", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<RunButton state="done" onRun={onRun} />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "done");

    const trigger = screen.getByRole("button", { name: "Run again" });
    expect(trigger).not.toBeDisabled();
    await user.click(trigger);
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("renders the failed state with the reason as visible text, not colour alone", () => {
    render(<RunButton state="failed" errorMessage="The model timed out." />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "failed");

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("The model timed out.");
  });

  it("renders the insufficient-credits state with the shortfall spelled out beside the CTA", () => {
    const onBuyCredits = vi.fn();
    render(<RunButton state="insufficient-credits" cost={6} balance={2} onBuyCredits={onBuyCredits} />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "insufficient-credits");

    // No plain "Generate" trigger while credits are short — the action slot
    // swaps to the resolving CTA instead of disabling the old one in place.
    expect(screen.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
    expect(screen.getByText(/need 6 credits, you have 2/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add credits" })).toBeInTheDocument();
  });

  it("insufficient-credits CTA calls onBuyCredits", async () => {
    const user = userEvent.setup();
    const onBuyCredits = vi.fn();
    render(<RunButton state="insufficient-credits" onBuyCredits={onBuyCredits} />);
    await user.click(screen.getByRole("button", { name: "Add credits" }));
    expect(onBuyCredits).toHaveBeenCalledOnce();
  });

  it("renders the locked state — the CTA replaces the trigger in place, same answer as hero-omnibox", () => {
    render(<RunButton state="locked" lockedReason="Generation is a Pro feature." />);

    const root = document.querySelector('[data-slot="run-button"]')!;
    expect(root).toHaveAttribute("data-state", "locked");

    // No plain "Generate" trigger anywhere — it's swapped out, not disabled underneath a banner.
    expect(screen.queryByRole("button", { name: "Generate" })).not.toBeInTheDocument();
    const cta = screen.getByRole("button", { name: "Upgrade to run" });
    expect(root).toContainElement(cta);
    expect(screen.getByText("Generation is a Pro feature.")).toBeInTheDocument();
  });

  it("locked CTA calls onUnlock", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();
    render(<RunButton state="locked" onUnlock={onUnlock} />);
    await user.click(screen.getByRole("button", { name: "Upgrade to run" }));
    expect(onUnlock).toHaveBeenCalledOnce();
  });

  it("passes className through", () => {
    render(<RunButton className="test-class" />);
    expect(document.querySelector('[data-slot="run-button"]')!.className).toContain("test-class");
  });
});
