"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { cn } from "@/lib/utils";

/**
 * Generation Wizard — Multi-step generate dialog
 *
 * Spec: docs/design-system/component-specs.md#e8-generation-wizard
 * States: stepper · preview-pane · skip-back-primary
 */

interface GenerationWizardStep {
  /** Stable id — also used as the `value` that drives step-change callbacks. */
  id: string;
  /** Step heading, shown in the stepper and above the step's fields. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** This step's own fields — the "form in stages" half of the wizard. */
  content: React.ReactNode;
  /**
   * What changes as a result of this step's choices — a cost, a model
   * summary, a live thumbnail. This is what makes it a wizard rather than a
   * form in stages: the cost of a wrong choice is visible before Next.
   */
  preview: React.ReactNode;
}

interface GenerationWizardProps extends Omit<React.ComponentProps<"div">, "title"> {
  steps: GenerationWizardStep[];
  /** Id of the active step. Controlled; omit to let the wizard own its own position. */
  step?: string;
  defaultStep?: string;
  /** Fires whenever the active step changes, however it changed — stepper click, Back, Skip, or the primary action. */
  onStepChange?: (id: string) => void;
  backLabel?: string;
  /** Every step is skippable and says so — this label appears on every step but the last. */
  skipLabel?: string;
  nextLabel?: string;
  /** Primary label on the last step, where advancing means committing instead of continuing. */
  finishLabel?: string;
  previewLabel?: string;
  /** Fires when Back is pressed, before the step actually changes. */
  onBack?: () => void;
  /** Fires with the id of the step being skipped, before the step actually changes. */
  onSkip?: (id: string) => void;
  /** Fires with the id of the step being left via the primary action (non-final steps only). */
  onNext?: (id: string) => void;
  /** Fires when the primary action is pressed on the last step. */
  onFinish?: () => void;
}

function GenerationWizard({
  steps,
  step: stepProp,
  defaultStep,
  onStepChange,
  backLabel = "Back",
  skipLabel = "Skip",
  nextLabel = "Next",
  finishLabel = "Generate",
  previewLabel = "Preview",
  onBack,
  onSkip,
  onNext,
  onFinish,
  className,
  ...props
}: GenerationWizardProps) {
  const ids = React.useMemo(() => steps.map((s) => s.id), [steps]);
  const [internalStep, setInternalStep] = React.useState(defaultStep ?? ids[0]);
  const controlled = stepProp !== undefined;
  const currentId = controlled ? stepProp : internalStep;
  const currentIndex = Math.max(0, ids.indexOf(currentId ?? ids[0]));
  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  const headingRef = React.useRef<HTMLSpanElement>(null);
  const skipInitialFocus = React.useRef(true);

  React.useEffect(() => {
    // Moving between steps should move focus sensibly rather than stranding
    // it on a nav button that just changed meaning under the user's finger —
    // land it on the new step's heading. Skipped on mount so the wizard
    // doesn't steal focus the instant it renders.
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [currentId]);

  const goTo = (id: string) => {
    if (!controlled) setInternalStep(id);
    onStepChange?.(id);
  };

  const handleBack = () => {
    if (isFirst) return;
    onBack?.();
    goTo(ids[currentIndex - 1]);
  };

  const handleSkip = () => {
    onSkip?.(currentStep.id);
    if (!isLast) goTo(ids[currentIndex + 1]);
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

  return (
    <div
      data-slot="generation-wizard"
      className={cn("flex w-full max-w-3xl flex-col gap-6", className)}
      {...props}
    >
      <ol
        data-slot="generation-wizard-stepper"
        aria-label={`Step ${currentIndex + 1} of ${steps.length}`}
        className="flex items-center"
      >
        {steps.map((s, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;

          // Completed vs upcoming must not differ by colour alone: completed
          // steps swap the number for a check glyph, current is a filled
          // (not just tinted) circle with `aria-current`, upcoming stays an
          // outline. Three distinct shapes, not three shades of the same one.
          const marker = completed ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <span aria-hidden>{index + 1}</span>
          );

          const markerClassName = cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            completed && "bg-primary text-primary-foreground",
            current && "border-primary text-primary border-2",
            !completed && !current && "border-border text-foreground border",
          );

          return (
            <li key={s.id} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
              {completed ? (
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  data-slot="generation-wizard-step"
                  data-state="completed"
                  className="focus-visible:ring-ring flex items-center gap-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className={markerClassName}>{marker}</span>
                  <span className="sr-only">Completed: </span>
                  {/* `sr-only sm:not-sr-only` collapses the label on narrow viewports without
                      dropping it from the accessible name the way `hidden` would. */}
                  <span className="text-foreground sr-only sm:not-sr-only sm:inline">{s.title}</span>
                </button>
              ) : (
                <span
                  data-slot="generation-wizard-step"
                  data-state={current ? "current" : "upcoming"}
                  aria-current={current ? "step" : undefined}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <span className={markerClassName}>{marker}</span>
                  <span
                    className={cn(
                      "sr-only sm:not-sr-only sm:inline",
                      current ? "text-foreground" : "text-foreground/60",
                    )}
                  >
                    {s.title}
                  </span>
                </span>
              )}
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  data-slot="generation-wizard-step-connector"
                  className={cn("mx-2 h-px flex-1", completed ? "bg-primary" : "bg-border")}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div data-slot="generation-wizard-content" className="flex min-w-0 flex-col gap-4">
          <SectionHeader
            title={
              <span ref={headingRef} tabIndex={-1} className="outline-none">
                {currentStep.title}
              </span>
            }
            action={
              <span className="text-foreground/60 text-xs font-normal">
                Step {currentIndex + 1} of {steps.length}
              </span>
            }
          />
          {currentStep.description ? (
            <p className="text-foreground/60 text-sm">{currentStep.description}</p>
          ) : null}
          {currentStep.content}
        </div>

        <div
          data-slot="generation-wizard-preview"
          className="bg-muted flex flex-col gap-2 rounded-lg p-4"
        >
          <p className="text-foreground text-xs font-medium tracking-wide uppercase">{previewLabel}</p>
          <div data-slot="generation-wizard-preview-content" className="flex flex-1 flex-col justify-center">
            {currentStep.preview}
          </div>
        </div>
      </div>

      <div data-slot="generation-wizard-nav" className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirst}
          data-slot="generation-wizard-back"
        >
          {backLabel}
        </Button>
        <ButtonGroup data-slot="generation-wizard-nav-forward">
          {!isLast ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              data-slot="generation-wizard-skip"
            >
              {skipLabel}
            </Button>
          ) : null}
          <Button type="button" variant="default" onClick={handlePrimary} data-slot="generation-wizard-primary">
            {isLast ? finishLabel : nextLabel}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}

export { GenerationWizard };
export type { GenerationWizardProps, GenerationWizardStep };
