"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { AlertCircle, Check, Coins, Lock, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Run Button — Trigger + cost + progress in one control
 *
 * Spec: docs/design-system/component-specs.md#e5-run-button
 * States: idle · estimating · running · done · failed · insufficient-credits · locked
 */

type RunButtonState = "idle" | "estimating" | "running" | "done" | "failed" | "insufficient-credits" | "locked";

interface RunButtonProps extends Omit<React.ComponentProps<"div">, "onError"> {
  /**
   * Declared state from the spec. Defaults to "idle". Controlled, following
   * the promo-card/feedback convention: this component only renders the
   * state it's given — the consumer decides when an estimate lands, a run
   * starts or finishes, or a plan/credits gate applies.
   */
  state?: RunButtonState;
  /**
   * Cost of the action. Feeds CostChip (A2) directly and is reused verbatim
   * in the insufficient-credits shortfall message — the spec is explicit
   * that this number and E1 / D1's must come from one source, never be
   * recomputed locally.
   */
  cost?: number | string;
  unit?: string;
  /** Credits currently available. Only needed for insufficient-credits, to phrase the shortfall. */
  balance?: number;
  /** 0–100. Omit for an indeterminate fill while running. */
  progress?: number;
  label?: string;
  estimatingLabel?: string;
  runningLabel?: string;
  /** Shown on the button once a run completes; re-triggers `onRun`. */
  doneLabel?: string;
  /** Shown on the button after a failed run; re-triggers `onRun`. */
  failedLabel?: string;
  /** Why the run failed. Rendered as visible text — never colour alone. */
  errorMessage?: string;
  cancelLabel?: string;
  /** Pre-formatted override for the shortfall line. Defaults to "Need {cost}, you have {balance}". */
  insufficientMessage?: string;
  buyCreditsLabel?: string;
  lockedLabel?: string;
  /** Why the action is locked — a plan gate, distinct from a credits shortfall. */
  lockedReason?: string;
  onRun?: () => void;
  onCancel?: () => void;
  onBuyCredits?: () => void;
  onUnlock?: () => void;
}

function RunButton({
  state = "idle",
  cost,
  unit = "credits",
  balance,
  progress,
  label = "Generate",
  estimatingLabel = "Estimating cost…",
  runningLabel = "Generating…",
  doneLabel = "Run again",
  failedLabel = "Try again",
  errorMessage,
  cancelLabel = "Cancel",
  insufficientMessage,
  buyCreditsLabel = "Add credits",
  lockedLabel = "Upgrade to run",
  lockedReason,
  onRun,
  onCancel,
  onBuyCredits,
  onUnlock,
  className,
  ...props
}: RunButtonProps) {
  const isEstimating = state === "estimating";
  const isRunning = state === "running";
  const isBusy = isEstimating || isRunning;
  const errorId = React.useId();

  const shortfallMessage =
    insufficientMessage ??
    (cost !== undefined && balance !== undefined ? `Need ${cost} ${unit}, you have ${balance}` : `Not enough ${unit}`);

  const showCostChip = cost !== undefined && (state === "idle" || state === "done" || state === "failed");

  return (
    <div
      data-slot="run-button"
      data-state={state}
      aria-busy={isBusy || undefined}
      className={cn("inline-flex flex-col items-start gap-1.5", className)}
      {...props}
    >
      {state === "insufficient-credits" ? (
        <div data-slot="run-button-insufficient" className="inline-flex flex-wrap items-center gap-2">
          <Button type="button" data-slot="run-button-buy-credits" onClick={onBuyCredits}>
            <Coins aria-hidden />
            {buyCreditsLabel}
          </Button>
          <span data-slot="run-button-insufficient-message" className="text-muted-foreground text-sm">
            {shortfallMessage}
          </span>
        </div>
      ) : state === "locked" ? (
        <div data-slot="run-button-locked" className="inline-flex flex-col items-start gap-1">
          <Button type="button" data-slot="run-button-unlock" onClick={onUnlock}>
            <Lock aria-hidden />
            {lockedLabel}
          </Button>
          {lockedReason ? (
            <span data-slot="run-button-locked-reason" className="text-muted-foreground text-xs">
              {lockedReason}
            </span>
          ) : null}
        </div>
      ) : (
        <div data-slot="run-button-controls" className="inline-flex items-center gap-2">
          {showCostChip ? (
            <div data-slot="run-button-cost">
              {/* CostChip's own bg-muted + text-muted-foreground pairing is
                  4.34:1 — under the 4.5:1 minimum. Overriding to
                  text-foreground (same fix hero-omnibox and skill-menu apply)
                  keeps the muted pill while clearing contrast (~18:1). */}
              <CostChip amount={cost} unit={unit} className="text-foreground" />
            </div>
          ) : null}

          {isEstimating ? (
            <span data-slot="run-button-estimating" className="text-muted-foreground text-sm">
              {estimatingLabel}
            </span>
          ) : null}

          <ButtonGroup data-slot="run-button-group">
            {/*
              The progress fill lives beside the trigger, not inside its DOM
              — <button> only permits phrasing content, and Progress's parts
              render <div>s. This frame draws the fill behind a
              transparent-background button instead, so it still reads as
              "one control" (spec: progress drawn inside the button, never a
              separate bar) without nesting a div inside a button.
            */}
            <div data-slot="run-button-trigger-frame" className={cn("relative rounded-lg", isRunning && "bg-muted overflow-hidden")}>
              {isRunning ? (
                <ProgressPrimitive.Root
                  value={progress ?? null}
                  data-slot="run-button-progress"
                  aria-label={runningLabel}
                  className="absolute inset-0"
                >
                  <ProgressTrack data-slot="run-button-progress-track" className="h-full w-full rounded-[inherit] bg-transparent">
                    <ProgressIndicator data-slot="run-button-progress-indicator" className="bg-primary/30 h-full transition-all" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>
              ) : null}

              <Button
                type="button"
                data-slot="run-button-trigger"
                variant={isRunning ? "ghost" : "default"}
                disabled={isBusy}
                aria-describedby={state === "failed" && errorMessage ? errorId : undefined}
                onClick={onRun}
                className={cn("relative z-10", isRunning && "disabled:text-foreground disabled:opacity-100")}
              >
                <span data-slot="run-button-label" className="inline-flex items-center gap-1.5">
                  {state === "done" ? <Check aria-hidden /> : null}
                  {state === "failed" ? <AlertCircle aria-hidden /> : null}
                  {state === "done" ? doneLabel : state === "failed" ? failedLabel : isRunning ? runningLabel : label}
                </span>
              </Button>
            </div>

            {isRunning ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-slot="run-button-cancel"
                aria-label={cancelLabel}
                onClick={onCancel}
              >
                <X aria-hidden />
              </Button>
            ) : null}
          </ButtonGroup>
        </div>
      )}

      {state === "failed" && errorMessage ? (
        <span id={errorId} data-slot="run-button-error" role="alert" className="text-destructive text-sm">
          {errorMessage}
        </span>
      ) : null}

      {/* Busy transitions are announced, not just repainted — a relabelled
          button alone isn't reliably picked up by assistive tech on its own. */}
      <span data-slot="run-button-status" role="status" aria-live="polite" className="sr-only">
        {isRunning ? runningLabel : isEstimating ? estimatingLabel : ""}
      </span>
    </div>
  );
}

export { RunButton };
export type { RunButtonProps, RunButtonState };
