import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingWizard, type OnboardingWizardStep } from "./onboarding-wizard";

const STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you do?",
    description: "So we can pick your starting templates.",
    choices: [
      { value: "marketer", label: "Marketing", description: "Ads, social, campaigns" },
      { value: "editor", label: "Video editing", description: "Cuts, captions, exports" },
    ],
    effect: "Loads the matching template set on your first project.",
  },
  {
    id: "team",
    title: "Who is this for?",
    choices: [
      { value: "solo", label: "Just me" },
      { value: "team", label: "A team" },
    ],
    effect: "Turns sharing defaults on or off.",
  },
  {
    id: "tour",
    title: "Two minutes with the editor",
    content: <p>Tour body</p>,
    panel: <p>Marketing pane</p>,
  },
];

describe("OnboardingWizard", () => {
  it("renders the choice-cards state", () => {
    const onAnswerChange = vi.fn();
    render(<OnboardingWizard steps={STEPS} onAnswerChange={onAnswerChange} />);

    // Choice cards are real controls with radio semantics, not divs with an
    // onClick — so they arrive with a group, arrow-key navigation and
    // aria-checked from the platform rather than from hand-rolled handlers.
    const group = screen.getByRole("radiogroup", { name: "What do you do?" });
    const marketing = within(group).getByRole("radio", { name: /Marketing/ });
    const editing = within(group).getByRole("radio", { name: /Video editing/ });
    expect(marketing).toHaveAttribute("aria-checked", "false");

    fireEvent.click(marketing);
    expect(onAnswerChange).toHaveBeenCalledWith("role", "marketer");
    expect(screen.getByRole("radio", { name: /Marketing/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Video editing/ })).toHaveAttribute("aria-checked", "false");

    // Selection is not carried by colour alone: the card also exposes a
    // programmatic state alongside the radio's own aria-checked.
    expect(marketing.closest("[data-slot='onboarding-wizard-choice']")).toHaveAttribute(
      "data-state",
      "selected",
    );
    expect(editing.closest("[data-slot='onboarding-wizard-choice']")).toHaveAttribute(
      "data-state",
      "unselected",
    );

    // Every question states what answering it changes. A survey that changes
    // nothing is a tax, so the effect line is part of the step, not decoration.
    expect(document.querySelector("[data-slot='onboarding-wizard-effect']")).toHaveTextContent(
      "Loads the matching template set on your first project.",
    );
  });

  it("renders the dot-progress state", () => {
    render(<OnboardingWizard steps={STEPS} />);

    // A real progressbar, not a colour-only dot rail. Position and total are
    // in the accessible name and in aria-valuenow/valuemax, and how many
    // remain is in aria-valuetext AND in visible text.
    const progress = screen.getByRole("progressbar", { name: "Setup progress: step 1 of 3" });
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "3");
    expect(progress).toHaveAttribute("aria-valuetext", "Step 1 of 3, 2 steps remaining");
    expect(screen.getByText("2 to go")).toBeInTheDocument();

    // One dot per step, and the dots themselves are decorative — they must
    // never be the only carrier of the position.
    const dots = document.querySelector("[data-slot='onboarding-wizard-dots']")!;
    expect(dots).toHaveAttribute("aria-hidden");
    expect(dots.querySelectorAll("[data-slot='onboarding-wizard-dot']")).toHaveLength(3);
    expect(
      Array.from(dots.querySelectorAll("[data-slot='onboarding-wizard-dot']")).map((d) =>
        d.getAttribute("data-state"),
      ),
    ).toEqual(["current", "upcoming", "upcoming"]);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("progressbar", { name: "Setup progress: step 2 of 3" })).toHaveAttribute(
      "aria-valuetext",
      "Step 2 of 3, 1 step remaining",
    );
    expect(screen.getByText("1 to go")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Last step")).toBeInTheDocument();
  });

  it("renders the skippable state", () => {
    const onSkip = vi.fn();
    const onFinish = vi.fn();
    const onBack = vi.fn();
    render(<OnboardingWizard steps={STEPS} onSkip={onSkip} onFinish={onFinish} onBack={onBack} />);

    const back = screen.getByRole("button", { name: "Back" });
    expect(back).toHaveAttribute("data-slot", "onboarding-wizard-back");
    // Nowhere to go back to from the first step.
    expect(back).toBeDisabled();

    // Every step is skippable — including the last one, which is where a
    // commit-shaped wizard would drop Skip and quietly make the final
    // question mandatory.
    expect(screen.getByRole("button", { name: "Skip" })).toHaveAttribute(
      "data-slot",
      "onboarding-wizard-skip",
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledWith("role");
    expect(screen.getByRole("progressbar", { name: "Setup progress: step 2 of 3" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledWith("team");
    expect(screen.getByRole("progressbar", { name: "Setup progress: step 3 of 3" })).toBeInTheDocument();

    // Skip is still there on the last step, and skipping it ends the flow
    // rather than stranding the user on a question they did not want.
    const lastSkip = screen.getByRole("button", { name: "Skip" });
    expect(lastSkip).toBeInTheDocument();
    fireEvent.click(lastSkip);
    expect(onSkip).toHaveBeenCalledWith("tour");
    expect(onFinish).toHaveBeenCalledTimes(1);

    // The primary reads as a finish on the last step, not another "Next".
    const primary = screen.getByRole("button", { name: "Finish setup" });
    expect(primary).toHaveAttribute("data-slot", "onboarding-wizard-primary");
    fireEvent.click(primary);
    expect(onFinish).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the split-panel state", () => {
    render(<OnboardingWizard steps={STEPS} defaultStep="tour" />);

    // The marketing pane is a prop on a step, not a separate component: the
    // same dots, the same Skip and the same primary drive it.
    const panel = document.querySelector("[data-slot='onboarding-wizard-panel']")!;
    expect(panel).toHaveTextContent("Marketing pane");
    expect(screen.getByRole("progressbar", { name: "Setup progress: step 3 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish setup" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-slot='onboarding-wizard-dot']")).toHaveLength(3);

    // The question always precedes the pane in DOM order, whichever side the
    // pane is drawn on — `panelSide` moves it visually and nothing else.
    const content = document.querySelector("[data-slot='onboarding-wizard-content']")!;
    expect(content.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Stepping back off the panel step drops the pane — one component, two
    // step shapes, no second machine.
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector("[data-slot='onboarding-wizard-panel']")).toBeNull();
    expect(screen.getByRole("radiogroup", { name: "Who is this for?" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<OnboardingWizard steps={STEPS} className="test-class" />);
    expect(document.querySelector('[data-slot="onboarding-wizard"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions — the spec's own sentences, pinned.
  // Added by the integrator: the build shipped only the four state tests plus
  // className, leaving every rule below unasserted.
  // ---------------------------------------------------------------------------

  it("keeps every step skippable, including the last", () => {
    // "Every step is skippable" — E8 generation-wizard drops Skip on its final
    // step because that step commits and spends credits. An onboarding
    // question never does, so the affordance must survive to the end.
    for (const step of ["role", "team", "tour"]) {
      const { unmount } = render(<OnboardingWizard steps={STEPS} step={step} onSkip={() => {}} />);
      expect(screen.getByRole("button", { name: /skip/i })).toBeEnabled();
      unmount();
    }
  });

  it("fires both onSkip and onFinish when the last step is skipped", () => {
    // Skipping the final step still ends the flow — otherwise a skipper is
    // stranded on the last question with no way out.
    const onSkip = vi.fn();
    const onFinish = vi.fn();
    render(
      <OnboardingWizard steps={STEPS} step="tour" onSkip={onSkip} onFinish={onFinish} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledWith("tour");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("says how many steps remain, in text and not by dot count alone", () => {
    // "The dot progress shows how many remain." Dots are aria-hidden
    // decoration, so the number has to reach a screen reader some other way.
    render(<OnboardingWizard steps={STEPS} step="team" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
    expect(bar.getAttribute("aria-valuetext") ?? "").toMatch(/2 of 3/);
  });

  it("drives the split-panel variant from the same step machinery", () => {
    // "The split-panel variant is the same component with a marketing pane
    // instead of a question" — so the panel step must carry the identical
    // progress, Skip and navigation chrome a question step does.
    const { container: question } = render(
      <OnboardingWizard steps={STEPS} step="role" onSkip={() => {}} />,
    );
    const { container: panel } = render(
      <OnboardingWizard steps={STEPS} step="tour" onSkip={() => {}} />,
    );

    // Every piece of flow chrome is present in both; only the step's own body
    // differs (choices + effect on a question, a pane on the split step).
    for (const slot of [
      "onboarding-wizard-progress",
      "onboarding-wizard-dots",
      "onboarding-wizard-remaining",
      "onboarding-wizard-skip",
      "onboarding-wizard-nav",
      "onboarding-wizard-primary",
    ]) {
      expect(question.querySelector(`[data-slot="${slot}"]`), `question step lacks ${slot}`).toBeInTheDocument();
      expect(panel.querySelector(`[data-slot="${slot}"]`), `panel step lacks ${slot}`).toBeInTheDocument();
    }
    expect(panel.querySelector('[data-slot="onboarding-wizard-panel"]')).toBeInTheDocument();
    expect(question.querySelector('[data-slot="onboarding-wizard-panel"]')).toBeNull();
  });

  it("reports the answer rather than storing it, so the host can act on it", () => {
    // The spec's sharpest line — "answers must change the product" — is only
    // possible if the answer actually leaves the component.
    const onAnswerChange = vi.fn();
    render(<OnboardingWizard steps={STEPS} step="role" onAnswerChange={onAnswerChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Video editing/ }));
    expect(onAnswerChange).toHaveBeenCalledWith("role", "editor");
  });
});
