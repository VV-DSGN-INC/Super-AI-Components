import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenerationWizard, type GenerationWizardStep } from "./generation-wizard";

const STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    content: <p>Model fields</p>,
    preview: <p>Model preview</p>,
  },
  {
    id: "style",
    title: "Set style",
    content: <p>Style fields</p>,
    preview: <p>Style preview</p>,
  },
  {
    id: "review",
    title: "Review",
    content: <p>Review fields</p>,
    preview: <p>Review preview</p>,
  },
];

describe("GenerationWizard", () => {
  it("renders the stepper state", () => {
    render(<GenerationWizard steps={STEPS} />);

    // Total and position are exposed programmatically, not only visually —
    // an accessible name on the stepper list itself, not just styled text.
    const stepper = screen.getByRole("list", { name: "Step 1 of 3" });

    // The current step is marked aria-current="step"; upcoming steps are not
    // clickable (no button role) — a wizard, not a free-jump tab set.
    expect(within(stepper).getByText("Choose model").closest("[data-slot='generation-wizard-step']")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(stepper).queryByRole("button", { name: /set style/i })).not.toBeInTheDocument();
    expect(within(stepper).queryByRole("button", { name: /review/i })).not.toBeInTheDocument();

    // Advancing marks the left-behind step completed and keeps it clickable —
    // forward-only wizards force cancel-and-restart, which this avoids.
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const completedStep = within(screen.getByRole("list", { name: "Step 2 of 3" })).getByRole("button", {
      name: /completed.*choose model/i,
    });
    expect(completedStep).toBeInTheDocument();

    // Clicking a completed step jumps straight back to it.
    fireEvent.click(completedStep);
    expect(screen.getByRole("list", { name: "Step 1 of 3" })).toBeInTheDocument();
  });

  it("renders the preview-pane state", () => {
    render(<GenerationWizard steps={STEPS} />);

    const preview = document.querySelector('[data-slot="generation-wizard-preview"]')!;
    expect(preview).toHaveTextContent("Model preview");
    expect(preview).not.toHaveTextContent("Style preview");

    // The preview pane updates per step, so the cost of a wrong choice is
    // visible before the next one — this is the load-bearing behaviour that
    // makes it a wizard rather than a form in stages.
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(preview).toHaveTextContent("Style preview");
    expect(preview).not.toHaveTextContent("Model preview");
  });

  it("renders the skip-back-primary state", () => {
    const onBack = vi.fn();
    const onSkip = vi.fn();
    const onNext = vi.fn();
    const onFinish = vi.fn();

    render(
      <GenerationWizard steps={STEPS} onBack={onBack} onSkip={onSkip} onNext={onNext} onFinish={onFinish} />,
    );

    // Skip and Back are secondary, the primary advances — pinned at the
    // data-slot level (structure), not by asserting class strings.
    const back = screen.getByRole("button", { name: "Back" });
    const skip = screen.getByRole("button", { name: "Skip" });
    const next = screen.getByRole("button", { name: "Next" });
    expect(back).toHaveAttribute("data-slot", "generation-wizard-back");
    expect(skip).toHaveAttribute("data-slot", "generation-wizard-skip");
    expect(next).toHaveAttribute("data-slot", "generation-wizard-primary");

    // Back is disabled on the first step — there is nowhere to go back to.
    expect(back).toBeDisabled();

    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledWith("model");
    expect(screen.getByRole("button", { name: "Back" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledWith("style");

    // Every step is skippable and says so, until the last one: the last step
    // has no Skip, and its primary action reads as a commit, not a "Next".
    expect(screen.getByRole("list", { name: "Step 3 of 3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    const finish = screen.getByRole("button", { name: "Generate" });
    expect(finish).toHaveAttribute("data-slot", "generation-wizard-primary");

    fireEvent.click(finish);
    expect(onFinish).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("passes className through", () => {
    render(<GenerationWizard steps={STEPS} className="test-class" />);
    expect(document.querySelector('[data-slot="generation-wizard"]')!.className).toContain("test-class");
  });
});
