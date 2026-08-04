"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Feedback — Thumbs + reason popover
 *
 * Spec: docs/design-system/component-specs.md#n1-feedback
 * States: idle · rating · submitted
 */

type FeedbackState = "idle" | "rating" | "submitted";
type FeedbackValue = "up" | "down";

interface FeedbackSubmitPayload {
  value: FeedbackValue;
  reason?: string;
}

interface FeedbackProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  /**
   * Declared state from the spec. Defaults to "idle". Controlled, following
   * the promo-card/recommendation-card convention: this component only
   * renders the state it's given — the consumer decides when to move into
   * "rating" (after a thumbs-down) and "submitted" (after Send, or right
   * after a one-click thumbs-up).
   */
  state?: FeedbackState;
  /** Which thumb is currently selected. */
  value?: FeedbackValue;
  /** Accessible name for the thumbs group. */
  label?: string;
  upLabel?: string;
  downLabel?: string;
  /**
   * Free-text reason typed into the "rating" popover. Controlled when
   * supplied; otherwise falls back to internal state seeded from
   * `defaultReason` — the same optional-controlled split RecommendationCard
   * uses for `open`/`defaultOpen`.
   */
  reason?: string;
  defaultReason?: string;
  onReasonChange?: (reason: string) => void;
  reasonPlaceholder?: string;
  reasonTitle?: string;
  /**
   * Preset reason chips. Every chip is optional — picking one only fills the
   * free-text field, it never blocks or replaces submission.
   */
  reasonOptions?: string[];
  submitLabel?: string;
  submittedLabel?: string;
  /**
   * Always rendered in "submitted" — feedback that cannot be retracted is
   * feedback people won't give.
   */
  undoLabel?: string;
  /** Fired the moment a thumb is pressed, before any submission. */
  onRate?: (value: FeedbackValue) => void;
  /**
   * Fired when feedback is actually sent: immediately for "up" (positive
   * feedback is one click), or from the reason popover's Send button for
   * "down" (negative asks why, but the reason is optional).
   */
  onSubmit?: (payload: FeedbackSubmitPayload) => void;
  /** Fired when the reason popover is dismissed (Escape / outside click) without sending. */
  onRatingCancel?: () => void;
  /** Retracts a submitted rating back to "idle". */
  onUndo?: () => void;
}

const DEFAULT_REASON_OPTIONS = ["Inaccurate", "Unhelpful", "Unclear"];

function Feedback({
  state = "idle",
  value,
  label = "Was this helpful?",
  upLabel = "Helpful",
  downLabel = "Not helpful",
  reason: reasonProp,
  defaultReason = "",
  onReasonChange,
  reasonPlaceholder = "Tell us more (optional)",
  reasonTitle = "What went wrong?",
  reasonOptions = DEFAULT_REASON_OPTIONS,
  submitLabel = "Send feedback",
  submittedLabel = "Thanks for the feedback!",
  undoLabel = "Undo",
  onRate,
  onSubmit,
  onRatingCancel,
  onUndo,
  className,
  ...props
}: FeedbackProps) {
  const [internalReason, setInternalReason] = React.useState(defaultReason);
  const reasonControlled = reasonProp !== undefined;
  const reason = reasonControlled ? reasonProp : internalReason;

  const setReason = React.useCallback(
    (next: string) => {
      if (!reasonControlled) setInternalReason(next);
      onReasonChange?.(next);
    },
    [reasonControlled, onReasonChange],
  );

  const locked = state === "submitted";

  const handleUp = () => {
    if (locked) return;
    onRate?.("up");
    // Positive feedback is one click — it never routes through the reason ask.
    onSubmit?.({ value: "up" });
  };

  const handleDown = () => {
    if (locked) return;
    onRate?.("down");
  };

  const handleSend = () => {
    onSubmit?.({ value: "down", reason: reason.trim() ? reason : undefined });
  };

  const thumbClassName = (pressed: boolean) =>
    cn(
      buttonVariants({ variant: "ghost", size: "icon-sm" }),
      // aria-pressed carries the state programmatically; this is a second,
      // non-colour cue (background) layered on top, not a substitute for it.
      "aria-pressed:bg-muted aria-pressed:text-foreground",
      pressed && "fill-current",
    );

  return (
    <div
      data-slot="feedback"
      data-state={state}
      className={cn("flex flex-col items-start gap-2", className)}
      {...props}
    >
      <Popover
        open={state === "rating"}
        onOpenChange={(open) => {
          if (!open) onRatingCancel?.();
        }}
      >
        <ButtonGroup data-slot="feedback-thumbs" aria-label={label}>
          <button
            type="button"
            aria-label={upLabel}
            aria-pressed={value === "up"}
            data-slot="feedback-thumb-up"
            data-state={value === "up" ? "on" : "off"}
            disabled={locked}
            onClick={handleUp}
            className={thumbClassName(value === "up")}
          >
            <ThumbsUp aria-hidden className={cn("size-3.5", value === "up" && "fill-current")} />
          </button>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={downLabel}
                aria-pressed={value === "down"}
                data-slot="feedback-thumb-down"
                data-state={value === "down" ? "on" : "off"}
                disabled={locked}
                onClick={handleDown}
                className={thumbClassName(value === "down")}
              />
            }
          >
            <ThumbsDown aria-hidden className={cn("size-3.5", value === "down" && "fill-current")} />
          </PopoverTrigger>
        </ButtonGroup>

        <PopoverContent data-slot="feedback-reason" align="start" className="w-72">
          <PopoverHeader>
            <PopoverTitle>{reasonTitle}</PopoverTitle>
          </PopoverHeader>

          {reasonOptions.length > 0 ? (
            <div data-slot="feedback-reason-options" className="flex flex-wrap gap-1.5">
              {reasonOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={reason === option}
                  data-slot="feedback-reason-chip"
                  onClick={() => setReason(option)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    reason === option
                      ? "border-transparent bg-secondary text-secondary-foreground"
                      : "border-border bg-background hover:bg-muted hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={reasonPlaceholder}
            aria-label={reasonPlaceholder}
            data-slot="feedback-reason-input"
          />

          <button
            type="button"
            data-slot="feedback-reason-submit"
            onClick={handleSend}
            className={cn(buttonVariants({ size: "sm" }), "self-end")}
          >
            {submitLabel}
          </button>
        </PopoverContent>
      </Popover>

      {state === "submitted" ? (
        // The transition into "submitted" is announced, not silently
        // swapped in — role="status" + aria-live picks it up even though
        // the text is also visible.
        <div
          data-slot="feedback-submitted"
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm"
        >
          <span>{submittedLabel}</span>
          <button
            type="button"
            data-slot="feedback-undo"
            onClick={() => onUndo?.()}
            className={cn(buttonVariants({ variant: "link", size: "sm" }))}
          >
            {undoLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export { Feedback };
export type { FeedbackProps, FeedbackState, FeedbackSubmitPayload, FeedbackValue };
