import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HeroOmnibox } from "./hero-omnibox";

describe("HeroOmnibox", () => {
  it("renders the idle state — the whole card is the control", async () => {
    const user = userEvent.setup();
    render(<HeroOmnibox />);

    const root = document.querySelector('[data-slot="hero-omnibox"]')!;
    expect(root).toHaveAttribute("data-state", "idle");

    const textarea = screen.getByRole("textbox", { name: /what can i help you with/i });
    expect(textarea).not.toHaveFocus();

    // Clicking anywhere on the card (not on a nested control) focuses the
    // composer — the card itself is the control, not just the textarea.
    await user.click(root);
    expect(textarea).toHaveFocus();
  });

  it("renders the focused state", () => {
    render(<HeroOmnibox state="focused" />);
    const root = document.querySelector('[data-slot="hero-omnibox"]')!;
    expect(root).toHaveAttribute("data-state", "focused");
    expect(screen.getByRole("textbox", { name: /what can i help you with/i })).toHaveFocus();
  });

  it("renders the generating state — distinguishable programmatically, not just by spinner", () => {
    render(<HeroOmnibox state="generating" generatingLabel="Generating a response…" />);

    const root = document.querySelector('[data-slot="hero-omnibox"]')!;
    expect(root).toHaveAttribute("data-state", "generating");
    expect(root).toHaveAttribute("aria-busy", "true");

    // Announced via a live region, not only shown visually.
    expect(screen.getByRole("status")).toHaveTextContent("Generating a response…");

    // The textarea is disabled and submit is replaced by a distinct stop control.
    expect(screen.getByRole("textbox", { name: /what can i help you with/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /send message/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop generating/i })).toBeInTheDocument();
  });

  it("renders the locked state — the paywall CTA replaces the textarea in place, not a separate banner", () => {
    const onUnlock = vi.fn();
    render(
      <HeroOmnibox
        state="locked"
        lockedTitle="You've hit your plan's limit"
        lockedCtaLabel="Upgrade"
        onUnlock={onUnlock}
      />,
    );

    const root = document.querySelector('[data-slot="hero-omnibox"]')!;
    expect(root).toHaveAttribute("data-state", "locked");

    // No textarea anywhere — it's swapped out, not disabled and not hidden behind it.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    // The CTA lives inside the same root as the rest of the composer, i.e. in
    // place of the field — not a sibling banner mounted elsewhere.
    const cta = screen.getByRole("button", { name: "Upgrade" });
    expect(root).toContainElement(cta);
    expect(root.querySelector('[data-slot="hero-omnibox-paywall"]')).toContainElement(cta);
  });

  it("locked CTA calls onUnlock", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();
    render(<HeroOmnibox state="locked" onUnlock={onUnlock} />);
    await user.click(screen.getByRole("button", { name: /upgrade/i }));
    expect(onUnlock).toHaveBeenCalledOnce();
  });

  it("composes attach, model select, and submit inside the field, with cost at the point of spend", () => {
    render(
      <HeroOmnibox
        models={[
          { value: "veo", label: "Veo 3.1" },
          { value: "sora", label: "Sora 2" },
        ]}
        model="veo"
        cost={5}
      />,
    );

    expect(screen.getByRole("button", { name: /attach file/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /model/i })).toBeInTheDocument();
    expect(screen.getByText(/5\s*credits/)).toBeInTheDocument();
  });

  it("submits the current value from the submit button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<HeroOmnibox onSubmit={onSubmit} />);

    const textarea = screen.getByRole("textbox", { name: /what can i help you with/i });
    await user.type(textarea, "Make a video of a fox");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(onSubmit).toHaveBeenCalledWith("Make a video of a fox");
  });

  it("passes className through", () => {
    render(<HeroOmnibox className="test-class" />);
    expect(document.querySelector('[data-slot="hero-omnibox"]')!.className).toContain("test-class");
  });
});
