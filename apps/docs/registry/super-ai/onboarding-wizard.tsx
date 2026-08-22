"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/**
 * Onboarding Wizard — Multi-step first-run survey / setup
 *
 * Spec: docs/design-system/component-specs.md#l6-onboarding-wizard
 * States: choice-cards · dot-progress · skippable · split-panel
 *
 * Deliberately built on the same step machinery as E8 `generation-wizard`
 * (`steps[]` + controlled/uncontrolled `step` + `onStepChange`, with Back /
 * Skip / primary in a footer row), because a second, differently-shaped
 * multi-step contract in one registry is how two components that look alike
 * start behaving differently. Three departures from E8, all forced by the
 * spec and all called out at their site below:
 *
 *  1. Skip survives onto the last step. E8's last step *commits* (it spends
 *     credits), so Skip has no meaning there. An onboarding question is never
 *     a commit — the spec says every step is skippable, so skipping the last
 *     one finishes setup with that answer left unset.
 *  2. Progress is a dot rail rather than a titled stepper, because onboarding
 *     step titles ("What do you do?") do not compress into stepper labels and
 *     the useful fact is how many are left, not what they are called.
 *  3. The wizard owns the answers (`answers` / `defaultAnswers` /
 *     `onAnswerChange`), where E8 leaves each step's fields entirely to the
 *     caller. Onboarding answers exist to be *applied*, so they have to leave
 *     the component in one shape.
 */

interface OnboardingWizardChoice {
  /** Stable value stored as this step's answer. */
  value: string;
  label: React.ReactNode;
  /** What picking this actually gets you. A choice card with no description is a radio with padding. */
  description?: React.ReactNode;
  /** Decorative only — it is never the accessible name. */
  icon?: React.ReactNode;
}

interface OnboardingWizardStep {
  /** Stable id — the key this step's answer is stored under, and the value passed to step callbacks. */
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /**
   * Choice cards. Rendered as a real radio group, so arrow keys, `aria-checked`
   * and form semantics come from the platform rather than from click handlers.
   */
  choices?: OnboardingWizardChoice[];
  /** Anything that isn't a single-select question — a text field, a checklist, a summary. */
  content?: React.ReactNode;
  /**
   * What this answer changes downstream: the segment defaults it sets, the
   * template it picks, the sample content it loads. If you cannot fill this
   * in, the step is a survey question that changes nothing, and the right fix
   * is to delete the step rather than to leave this blank.
   */
  effect?: React.ReactNode;
  /**
   * The marketing / illustration pane. Its presence is the whole of the
   * split-panel variant — same steps, same dots, same skip, one extra pane.
   */
  panel?: React.ReactNode;
  /** Which side the pane sits on visually. The question always comes first in DOM and reading order. */
  panelSide?: "start" | "end";
}

interface OnboardingWizardProps extends Omit<React.ComponentProps<"div">, "title" | "onChange"> {
  steps: OnboardingWizardStep[];
  /** Id of the active step. Controlled; omit to let the wizard own its own position. */
  step?: string;
  defaultStep?: string;
  /** Fires whenever the active step changes, however it changed — Back, Skip, or the primary action. */
  onStepChange?: (id: string) => void;
  /** Answers by step id. Controlled; omit to let the wizard own them. */
  answers?: Record<string, string>;
  defaultAnswers?: Record<string, string>;
  /** Fires with the step id and the chosen value. This is the hook the product applies the answer from. */
  onAnswerChange?: (stepId: string, value: string) => void;
  backLabel?: string;
  /** Present on every step, last one included — every step is skippable. */
  skipLabel?: string;
  nextLabel?: string;
  /** Primary label on the last step, where advancing means finishing rather than continuing. */
  finishLabel?: string;
  /** Lead-in for the per-step `effect` line. */
  effectLabel?: string;
  /** Accessible name of the whole flow, used on the progress bar. */
  label?: string;
  onBack?: () => void;
  /** Fires with the id of the step being skipped. On the last step it fires alongside `onFinish`. */
  onSkip?: (id: string) => void;
  /** Fires with the id of the step being left via the primary action (non-final steps only). */
  onNext?: (id: string) => void;
  /** Fires when the flow ends — via the primary action on the last step, or by skipping it. */
  onFinish?: () => void;
}

function OnboardingWizard({
  steps,
  step: stepProp,
  defaultStep,
  onStepChange,
  answers: answersProp,
  defaultAnswers,
  onAnswerChange,
  backLabel = "Back",
  skipLabel = "Skip",
  nextLabel = "Next",
  finishLabel = "Finish setup",
  effectLabel = "Changes",
  label = "Setup progress",
  onBack,
  onSkip,
  onNext,
  onFinish,
  className,
  ...props
}: OnboardingWizardProps) {
  const ids = React.useMemo(() => steps.map((s) => s.id), [steps]);
  const [internalStep, setInternalStep] = React.useState(defaultStep ?? ids[0]);
  const stepControlled = stepProp !== undefined;
  const currentId = stepControlled ? stepProp : internalStep;
  const currentIndex = Math.max(0, ids.indexOf(currentId ?? ids[0]));
  const currentStep = steps[currentIndex];

  const [internalAnswers, setInternalAnswers] = React.useState<Record<string, string>>(
    defaultAnswers ?? {},
  );
  const answersControlled = answersProp !== undefined;
  const answers = answersControlled ? answersProp : internalAnswers;

  const total = steps.length;
  const position = currentIndex + 1;
  // "How many remain" is the number the spec cares about, and it is the one a
  // dot rail cannot express on its own once there are more than a handful.
  const remaining = total - position;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  const reactId = React.useId();
  const headingId = `${reactId}-heading`;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const skipInitialFocus = React.useRef(true);

  React.useEffect(() => {
    // Same rule as E8: on a step change, land focus on the new question rather
    // than leaving it on a nav button whose meaning just changed. Skipped on
    // mount so the wizard never steals focus the instant it renders.
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [currentId]);

  const goTo = (id: string) => {
    if (!stepControlled) setInternalStep(id);
    onStepChange?.(id);
  };

  const handleAnswer = (stepId: string, value: string) => {
    if (!answersControlled) setInternalAnswers((prev) => ({ ...prev, [stepId]: value }));
    onAnswerChange?.(stepId, value);
  };

  const handleBack = () => {
    if (isFirst) return;
    onBack?.();
    goTo(ids[currentIndex - 1]);
  };

  const handleSkip = () => {
    onSkip?.(currentStep.id);
    // Skipping the last step ends the flow. The alternative — hiding Skip on
    // the last step, as a commit-shaped wizard does — would make the final
    // question the one question you are forced to answer.
    if (isLast) onFinish?.();
    else goTo(ids[currentIndex + 1]);
  };

  const handlePrimary = () => {
    if (isLast) {
      onFinish?.();
      return;
    }
    onNext?.(currentStep.id);
    goTo(ids[currentIndex + 1]);
  };

  if (!currentStep) return null;

  const panel = currentStep.panel ? (
    <div
      data-slot="onboarding-wizard-panel"
      data-side={currentStep.panelSide ?? "end"}
      // Rendered after the question in the DOM whichever side it sits on, so
      // reading order is always question-then-pitch. `order` moves it visually.
      className={cn(
        "bg-muted flex flex-col justify-center gap-2 rounded-lg p-4",
        currentStep.panelSide === "start" && "md:order-first",
      )}
    >
      {currentStep.panel}
    </div>
  ) : null;

  return (
    <Card
      data-slot="onboarding-wizard"
      className={cn("w-full max-w-3xl", className)}
      {...props}
    >
      <CardHeader className="gap-3">
        {/*
          A real progressbar, not a row of coloured dots. The dots are the
          visual; `aria-valuenow`/`aria-valuetext` and the visible "Step N of
          M" label are what actually carry the position, because a dot rail
          that differs only by fill is invisible to a screen reader and to
          anyone who cannot separate the two fills by colour.

          The vendored Progress appends its own bar track after `children`;
          this flow's progress *is* the dot rail, so the track is suppressed
          rather than stacked underneath a second representation of the same
          number.
        */}
        <Progress
          data-slot="onboarding-wizard-progress"
          value={position}
          min={0}
          max={total}
          getAriaValueText={() =>
            `Step ${position} of ${total}, ${remaining} ${remaining === 1 ? "step" : "steps"} remaining`
          }
          className="flex-nowrap items-center gap-3 [&>[data-slot=progress-track]]:hidden"
        >
          <ProgressLabel
            data-slot="onboarding-wizard-progress-label"
            className="text-foreground text-xs font-medium"
          >
            {`${label}: step ${position} of ${total}`}
          </ProgressLabel>
          <span
            data-slot="onboarding-wizard-dots"
            aria-hidden
            className="flex flex-1 items-center gap-1.5"
          >
            {steps.map((s, index) => (
              <span
                key={s.id}
                data-slot="onboarding-wizard-dot"
                data-state={index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming"}
                className={cn(
                  "h-1.5 rounded-full transition-[background-color,width]",
                  // Current is a longer bar, not merely a different colour —
                  // the one distinction that survives a greyscale screenshot.
                  index === currentIndex ? "bg-primary w-6" : "w-1.5",
                  index < currentIndex && "bg-primary",
                  index > currentIndex && "bg-border",
                )}
              />
            ))}
          </span>
          <span data-slot="onboarding-wizard-remaining" className="text-foreground text-xs">
            {remaining === 0 ? "Last step" : `${remaining} to go`}
          </span>
        </Progress>

        <CardTitle>
          <h3 id={headingId} ref={headingRef} tabIndex={-1} className="outline-none">
            {currentStep.title}
          </h3>
        </CardTitle>
        {currentStep.description ? <CardDescription>{currentStep.description}</CardDescription> : null}
      </CardHeader>

      <CardContent className={cn("grid gap-6", panel && "md:grid-cols-2")}>
        <div data-slot="onboarding-wizard-content" className="flex min-w-0 flex-col gap-4">
          {currentStep.choices?.length ? (
            <RadioGroup
              data-slot="onboarding-wizard-choices"
              aria-labelledby={headingId}
              value={answers[currentStep.id] ?? null}
              onValueChange={(value) => handleAnswer(currentStep.id, String(value))}
              className="grid gap-2 sm:grid-cols-2"
            >
              {currentStep.choices.map((choice) => {
                const selected = answers[currentStep.id] === choice.value;
                return (
                  <label
                    key={choice.value}
                    data-slot="onboarding-wizard-choice"
                    data-choice-id={choice.value}
                    data-state={selected ? "selected" : "unselected"}
                    // Selection is carried by the radio's own `aria-checked`
                    // and by the ring, never by a fill colour alone.
                    className={cn(
                      "border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left",
                      selected && "border-ring ring-ring ring-1",
                    )}
                  >
                    <RadioGroupItem value={choice.value} className="mt-0.5" />
                    {choice.icon ? (
                      <span aria-hidden className="text-foreground mt-0.5 shrink-0">
                        {choice.icon}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-foreground text-sm font-medium">{choice.label}</span>
                      {choice.description ? (
                        <span className="text-foreground/70 text-xs">{choice.description}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          ) : null}

          {currentStep.content}

          {currentStep.effect ? (
            // The consequence of answering, on screen at the moment of
            // answering. It is the only thing separating this from a survey.
            <p data-slot="onboarding-wizard-effect" className="text-foreground/70 text-xs">
              <span className="text-foreground font-medium">{effectLabel}: </span>
              {currentStep.effect}
            </p>
          ) : null}
        </div>

        {panel}
      </CardContent>

      <CardFooter data-slot="onboarding-wizard-nav" className="justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirst}
          data-slot="onboarding-wizard-back"
        >
          {backLabel}
        </Button>
        <ButtonGroup data-slot="onboarding-wizard-nav-forward">
          {/* Skip is on every step, including the last. */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            data-slot="onboarding-wizard-skip"
          >
            {skipLabel}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handlePrimary}
            data-slot="onboarding-wizard-primary"
          >
            {isLast ? finishLabel : nextLabel}
          </Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}

export { OnboardingWizard };
export type { OnboardingWizardChoice, OnboardingWizardProps, OnboardingWizardStep };
