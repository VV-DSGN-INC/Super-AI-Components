import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CostProvider } from "./cost";
import { PaywallMessage, type PaywallReason } from "./paywall-message";

const PROMPT = "A slow dolly across a rain-lit Tokyo alley at night, neon reflections";

const base = {
  state: "locked-model" as PaywallReason,
  prompt: PROMPT,
  model: "Veo 3.1",
  before: "I can put this together, but the model it needs is not on your plan.",
} as const;

const card = () => screen.getByRole("group");

describe("PaywallMessage", () => {
  it("renders the locked-model state", () => {
    render(<PaywallMessage {...base} state="locked-model" requirement="Pro" />);
    expect(screen.getByRole("group", { name: /model is not on your plan/i })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="paywall-message"]')).toHaveAttribute(
      "data-state",
      "locked-model",
    );
    // The requirement is text, not a colour.
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("renders the quota-exhausted state", () => {
    render(<PaywallMessage {...base} state="quota-exhausted" />);
    expect(screen.getByRole("group", { name: /out of credits/i })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="paywall-message"]')).toHaveAttribute(
      "data-state",
      "quota-exhausted",
    );
  });

  it("renders the feature-locked state", () => {
    render(<PaywallMessage {...base} state="feature-locked" />);
    expect(screen.getByRole("group", { name: /feature is not on your plan/i })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="paywall-message"]')).toHaveAttribute(
      "data-state",
      "feature-locked",
    );
  });

  it("passes className through", () => {
    render(<PaywallMessage {...base} className="test-class" />);
    expect(document.querySelector('[data-slot="paywall-message"]')!.className).toContain(
      "test-class",
    );
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "the card carries the prompt and model it WOULD have used,
  // so upgrading resumes the exact work."
  // ---------------------------------------------------------------------------

  it("carries the prompt and model verbatim in every state", () => {
    for (const state of ["locked-model", "quota-exhausted", "feature-locked"] as const) {
      const { unmount } = render(<PaywallMessage {...base} state={state} />);
      expect(within(card()).getByText(PROMPT)).toBeInTheDocument();
      expect(within(card()).getByText(/Veo 3\.1/)).toBeInTheDocument();
      unmount();
    }
  });

  it("hands the upgrade CTA the resume payload, not a bare click", async () => {
    const onUpgrade = vi.fn();
    render(<PaywallMessage {...base} onUpgrade={onUpgrade} />);
    await userEvent.click(screen.getByRole("button", { name: /upgrade/i }));
    // Upgrading resumes the exact work: the caller gets back everything it
    // needs to re-run without the user retyping anything.
    expect(onUpgrade).toHaveBeenCalledWith({ prompt: PROMPT, model: "Veo 3.1" });
  });

  it("keeps the prompt at full strength — the preview is what gets greyed", () => {
    render(<PaywallMessage {...base} preview="Frame 1 of 120 — wet asphalt, neon sign" />);
    const promptEl = document.querySelector('[data-slot="paywall-message-prompt"]')!;
    const previewEl = document.querySelector('[data-slot="paywall-message-preview-body"]')!;
    expect(promptEl.className).toContain("text-foreground");
    expect(promptEl.className).not.toContain("text-foreground/");
    // Dimmed, because it does not exist yet.
    expect(previewEl.className).toContain("text-foreground/70");
    // And never text-muted-foreground on a muted surface — the 4.34:1 pairing.
    expect(previewEl.className).not.toContain("text-muted-foreground");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "greyed preview text shows what was going to be produced."
  // ---------------------------------------------------------------------------

  it("labels the preview rather than relying on the greying alone", () => {
    render(<PaywallMessage {...base} preview="Frame 1 of 120 — wet asphalt, neon sign" />);
    expect(screen.getByText("Would have produced")).toBeInTheDocument();
    expect(screen.getByText(/wet asphalt/)).toBeInTheDocument();
  });

  it("omits the preview block entirely when there is nothing to show", () => {
    render(<PaywallMessage {...base} />);
    expect(document.querySelector('[data-slot="paywall-message-preview"]')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "the agent explains in prose before and after; a bare upgrade
  // card reads as an ad."
  // ---------------------------------------------------------------------------

  it("renders the agent's prose around the card, in reading order", () => {
    render(<PaywallMessage {...base} after="In the meantime I can draft the shot list." />);
    const root = document.querySelector('[data-slot="paywall-message"]')!;
    const slots = Array.from(root.children).map((el) => el.getAttribute("data-slot"));
    expect(slots).toEqual([
      "paywall-message-before",
      "paywall-message-card",
      "paywall-message-after",
    ]);
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: the cost contract. `insufficient`/`shortfall` are DERIVED.
  // ---------------------------------------------------------------------------

  it("derives the shortfall from the cost contract rather than taking it as a prop", () => {
    render(
      <CostProvider balance={120}>
        <PaywallMessage {...base} state="quota-exhausted" cost={{ amount: 900 }} />
      </CostProvider>,
    );
    expect(screen.getByText("Need 900 credits, you have 120")).toBeInTheDocument();
  });

  it("does not invent a shortfall when no balance is known, even in quota-exhausted", () => {
    // Declaring the gate is not the same as knowing the numbers. Without a
    // balance nothing is comparable, so the card shows the price and stops.
    render(<PaywallMessage {...base} state="quota-exhausted" cost={{ amount: 900 }} />);
    expect(screen.getByText("900 credits")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="paywall-message-shortfall"]')).toBeNull();
  });

  it("shows no shortfall when the balance covers the blocked run", () => {
    render(
      <CostProvider balance={5000}>
        <PaywallMessage {...base} state="locked-model" cost={{ amount: 900 }} />
      </CostProvider>,
    );
    expect(document.querySelector('[data-slot="paywall-message-shortfall"]')).toBeNull();
  });

  it("formats cost only through the shared formatter, rate form included", () => {
    render(<PaywallMessage {...base} cost={{ amount: 900, per: "min" }} />);
    expect(screen.getByText("900 credits/min")).toBeInTheDocument();
  });

  it("never prints a stale amount while the estimate is being recomputed", () => {
    render(<PaywallMessage {...base} cost={{ amount: 900, status: "estimating" }} />);
    expect(screen.getByText("Estimating…")).toBeInTheDocument();
    expect(screen.queryByText(/900/)).not.toBeInTheDocument();
  });

  it("falls back to the cost in context when none is passed as a prop", () => {
    render(
      <CostProvider cost={{ amount: 42, unit: "credits" }}>
        <PaywallMessage {...base} />
      </CostProvider>,
    );
    expect(screen.getByText("42 credits")).toBeInTheDocument();
  });

  it("renders no cost row at all when neither prop nor context supplies one", () => {
    render(<PaywallMessage {...base} />);
    expect(document.querySelector('[data-slot="paywall-message-cost"]')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  it("offers top-up only when the cost contract supplies one, and routes it there", async () => {
    const onTopUp = vi.fn();
    const { unmount } = render(<PaywallMessage {...base} onUpgrade={() => {}} />);
    expect(screen.queryByRole("button", { name: "Top up" })).not.toBeInTheDocument();
    unmount();

    render(
      <CostProvider balance={0} onTopUp={onTopUp}>
        <PaywallMessage {...base} state="quota-exhausted" onUpgrade={() => {}} />
      </CostProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Top up" }));
    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("does not offer top-up when money is not what is missing", () => {
    // A locked feature with credits to spare: more credits buy nothing here,
    // so the contract's onTopUp is deliberately not surfaced.
    render(
      <CostProvider balance={5000} onTopUp={() => {}}>
        <PaywallMessage {...base} state="feature-locked" cost={{ amount: 900 }} onUpgrade={() => {}} />
      </CostProvider>,
    );
    expect(screen.queryByRole("button", { name: "Top up" })).not.toBeInTheDocument();
  });

  it("offers top-up when the contract derives a shortfall, whichever gate fired", () => {
    render(
      <CostProvider balance={120} onTopUp={() => {}}>
        <PaywallMessage {...base} state="locked-model" cost={{ amount: 900 }} onUpgrade={() => {}} />
      </CostProvider>,
    );
    expect(screen.getByRole("button", { name: "Top up" })).toBeInTheDocument();
  });

  it("renders no action row when no handler is available", () => {
    render(<PaywallMessage {...base} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // A11y
  // ---------------------------------------------------------------------------

  it("never conveys which gate fired by colour alone", () => {
    for (const [state, text] of [
      ["locked-model", "This model is not on your plan"],
      ["quota-exhausted", "You are out of credits"],
      ["feature-locked", "This feature is not on your plan"],
    ] as const) {
      const { unmount } = render(<PaywallMessage {...base} state={state} />);
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    }
  });

  it("names the card region from its own title", () => {
    render(<PaywallMessage {...base} title="Sora 2 needs a Studio plan" />);
    expect(screen.getByRole("group", { name: "Sora 2 needs a Studio plan" })).toBeInTheDocument();
  });
});
