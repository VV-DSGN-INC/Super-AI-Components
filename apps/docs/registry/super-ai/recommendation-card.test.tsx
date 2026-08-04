import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecommendationCard } from "./recommendation-card";

const STEPS = ["Connect your account", "Pick a template", "Review and publish"];

function renderCard(props: Partial<React.ComponentProps<typeof RecommendationCard>> = {}) {
  const handlers = {
    onDismiss: vi.fn(),
    onTry: vi.fn(),
    onSaveForLater: vi.fn(),
  };
  render(
    <RecommendationCard
      title="Automate your weekly report"
      description="Zapier can build this for you."
      apps={["Sheets", "Slack"]}
      steps={STEPS}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("RecommendationCard", () => {
  it("renders the collapsed state", () => {
    renderCard();
    expect(screen.getByText("Automate your weekly report")).toBeInTheDocument();
    expect(screen.getByText("Zapier can build this for you.")).toBeInTheDocument();
    // The modal isn't mounted until the trigger opens it — the row stays a one-liner.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Try it" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the expanded state — modal with numbered steps, real disclosure semantics", async () => {
    renderCard();
    const trigger = screen.getByRole("button", { name: "Try it" });
    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = await screen.findByRole("dialog", { name: "Automate your weekly report" });
    const steps = within(dialog).getAllByRole("listitem");
    expect(steps).toHaveLength(STEPS.length);
    expect(within(dialog).getByText(STEPS[0])).toBeInTheDocument();
  });

  it("committing from the modal fires onTry and closes it", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Try it" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Get started" }));
    expect(h.onTry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dismissible state — dismiss control fires onDismiss, dismissed hides the card", async () => {
    const h = renderCard();
    const dismiss = screen.getByRole("button", { name: "Dismiss" });
    await userEvent.click(dismiss);
    expect(h.onDismiss).toHaveBeenCalledOnce();

    const { container } = render(<RecommendationCard title="X" steps={STEPS} dismissed onDismiss={vi.fn()} />);
    expect(container.querySelector('[data-slot="recommendation-card"]')).toBeNull();
  });

  it("renders the save-for-later state — a real middle option next to Try it and Dismiss", async () => {
    const h = renderCard();
    expect(screen.getByRole("button", { name: "Try it" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save for later" });
    await userEvent.click(save);
    expect(h.onSaveForLater).toHaveBeenCalledOnce();
  });

  it("reflects the controlled saved state as disabled with a distinct label", () => {
    renderCard({ saved: true });
    const saved = screen.getByRole("button", { name: "Saved" });
    expect(saved).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save for later" })).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    renderCard({ className: "test-class" });
    expect(document.querySelector('[data-slot="recommendation-card"]')!.className).toContain("test-class");
  });
});
