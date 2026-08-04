"use client";

import { Ban, Paperclip, Square, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Media Prompt Bar — The media-gen omnibox
 *
 * Spec: docs/design-system/component-specs.md#d1-media-prompt-bar
 * Presentations: floating · docked · node-embedded
 * State: locked · negative-prompt
 */

type MediaPromptBarPresentation = "floating" | "docked" | "node-embedded";

interface MediaPromptBarProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  /** One of D1's three presentations. Floating collapses the settings strip; node-embedded drops the negative prompt. Defaults to "docked". */
  presentation?: MediaPromptBarPresentation;
  /** Gate at the point of creation: swaps the input row for a paywall CTA in place, same convention as C1 hero-omnibox. */
  locked?: boolean;
  /** Expands the secondary "what to avoid" field below the prompt. Ignored (forced closed) when presentation is "node-embedded". */
  negativePrompt?: boolean;
  onNegativePromptChange?: (open: boolean) => void;

  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the prompt textarea. Rendered as a visually-hidden <label>. */
  label?: string;

  negativeValue?: string;
  onNegativeValueChange?: (value: string) => void;
  negativePlaceholder?: string;
  negativeLabel?: string;
  negativePromptToggleLabel?: string;
  negativePromptCollapseLabel?: string;

  /** D2 reference-strip, rendered above the field. Taken as a slot — composed by the caller, not imported here. */
  referenceStrip?: React.ReactNode;
  /** D3 context-chips, rendered inline above the textarea. Taken as a slot — composed by the caller, not imported here. */
  contextChips?: React.ReactNode;
  /** A7 gen-settings-bar. Automatically collapsed when presentation is "floating". */
  settings?: React.ReactNode;
  /** Cost at the point of spend (M2). Re-estimate this upstream as `settings` changes — one source, shared with E1/E5. */
  cost?: number | string;

  onAttach?: () => void;
  attachLabel?: string;
  generating?: boolean;
  generatingLabel?: string;
  onSubmit?: (value: string) => void;
  submitLabel?: string;
  onStop?: () => void;
  stopLabel?: string;

  lockedTitle?: string;
  lockedDescription?: string;
  lockedCtaLabel?: string;
  onUnlock?: () => void;
}

function MediaPromptBar({
  presentation = "docked",
  locked = false,
  negativePrompt,
  onNegativePromptChange,
  value,
  onValueChange,
  placeholder = "Describe what you want to generate…",
  label = "Prompt",
  negativeValue,
  onNegativeValueChange,
  negativePlaceholder = "What to avoid…",
  negativeLabel = "Negative prompt",
  negativePromptToggleLabel = "Add negative prompt",
  negativePromptCollapseLabel = "Remove negative prompt",
  referenceStrip,
  contextChips,
  settings,
  cost,
  onAttach,
  attachLabel = "Attach reference",
  generating = false,
  generatingLabel = "Generating…",
  onSubmit,
  submitLabel = "Generate",
  onStop,
  stopLabel = "Stop generating",
  lockedTitle = "You've hit your plan's limit",
  lockedDescription = "Upgrade to keep generating.",
  lockedCtaLabel = "Upgrade",
  onUnlock,
  className,
  ...props
}: MediaPromptBarProps) {
  const inputId = React.useId();
  const negativeInputId = React.useId();

  const [internalValue, setInternalValue] = React.useState("");
  const currentValue = value ?? internalValue;

  const [internalNegativeValue, setInternalNegativeValue] = React.useState("");
  const currentNegativeValue = negativeValue ?? internalNegativeValue;

  const [internalNegativeOpen, setInternalNegativeOpen] = React.useState(false);

  const isNodeEmbedded = presentation === "node-embedded";
  const isFloating = presentation === "floating";

  // node-embedded drops the negative prompt entirely — no toggle, no row,
  // regardless of what the caller passes in.
  const canHaveNegativePrompt = !isNodeEmbedded;
  const isNegativePromptOpen = canHaveNegativePrompt && (negativePrompt ?? internalNegativeOpen);

  // floating collapses the settings strip (A7) even if one was passed in.
  const showSettings = Boolean(settings) && !isFloating && !locked;

  const handleValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(event.target.value);
    onValueChange?.(event.target.value);
  };

  const handleNegativeValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalNegativeValue(event.target.value);
    onNegativeValueChange?.(event.target.value);
  };

  const handleNegativeToggle = (open: boolean) => {
    setInternalNegativeOpen(open);
    onNegativePromptChange?.(open);
  };

  const handleSubmit = () => {
    if (generating || locked || currentValue.trim() === "") return;
    onSubmit?.(currentValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      data-slot="media-prompt-bar"
      data-presentation={presentation}
      data-locked={locked || undefined}
      data-negative-prompt={isNegativePromptOpen || undefined}
      aria-busy={generating || undefined}
      className={cn(
        "flex w-full flex-col gap-2 text-card-foreground transition-colors",
        isFloating && "max-w-2xl rounded-2xl border bg-card p-2 shadow-lg ring-1 ring-foreground/10",
        presentation === "docked" && "rounded-t-2xl border border-b-0 bg-card p-3",
        isNodeEmbedded && "max-w-sm rounded-lg border bg-card p-2 text-sm",
        className,
      )}
      {...props}
    >
      {referenceStrip ? <div data-slot="media-prompt-bar-reference">{referenceStrip}</div> : null}

      {locked ? (
        <div
          data-slot="media-prompt-bar-paywall"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3"
        >
          <div data-slot="media-prompt-bar-paywall-copy">
            <p className="text-sm font-medium">{lockedTitle}</p>
            <p className="text-muted-foreground text-xs">{lockedDescription}</p>
          </div>
          <Button data-slot="media-prompt-bar-unlock" onClick={onUnlock}>
            {lockedCtaLabel}
          </Button>
        </div>
      ) : (
        <div data-slot="media-prompt-bar-field" className="flex flex-col gap-2">
          {contextChips ? (
            <div data-slot="media-prompt-bar-chips" className="flex flex-wrap items-center gap-1 px-1">
              {contextChips}
            </div>
          ) : null}

          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Textarea
            id={inputId}
            data-slot="media-prompt-bar-textarea"
            aria-label={label}
            placeholder={placeholder}
            value={currentValue}
            onChange={handleValueChange}
            onKeyDown={handleKeyDown}
            disabled={generating}
            className="min-h-16 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
          />

          {isNegativePromptOpen ? (
            <div
              data-slot="media-prompt-bar-negative"
              className="flex flex-col gap-1 rounded-md border border-dashed p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={negativeInputId} className="text-foreground text-xs font-medium">
                  {negativeLabel}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={negativePromptCollapseLabel}
                  data-slot="media-prompt-bar-negative-collapse"
                  onClick={() => handleNegativeToggle(false)}
                  disabled={generating}
                >
                  <X aria-hidden />
                </Button>
              </div>
              <Textarea
                id={negativeInputId}
                data-slot="media-prompt-bar-negative-textarea"
                aria-label={negativeLabel}
                placeholder={negativePlaceholder}
                value={currentNegativeValue}
                onChange={handleNegativeValueChange}
                disabled={generating}
                className="min-h-12 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : null}

          <div data-slot="media-prompt-bar-toolbar" className="flex flex-wrap items-center justify-between gap-2">
            <div data-slot="media-prompt-bar-actions" className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={attachLabel}
                data-slot="media-prompt-bar-attach"
                onClick={onAttach}
                disabled={generating}
              >
                <Paperclip aria-hidden />
              </Button>

              {canHaveNegativePrompt && !isNegativePromptOpen ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-slot="media-prompt-bar-negative-toggle"
                  onClick={() => handleNegativeToggle(true)}
                  disabled={generating}
                >
                  <Ban aria-hidden className="size-3.5" />
                  {negativePromptToggleLabel}
                </Button>
              ) : null}

              {showSettings ? <div data-slot="media-prompt-bar-settings">{settings}</div> : null}

              {cost !== undefined ? (
                <div data-slot="media-prompt-bar-cost">
                  {/* CostChip's own default (bg-muted + text-muted-foreground) is
                      4.34:1 at this size — under the 4.5:1 text minimum. Overriding
                      to text-foreground (same fix as hero-omnibox and
                      workspace-switcher) keeps the muted pill background while
                      clearing 4.5:1 with a wide margin against the same bg-muted fill. */}
                  <CostChip amount={cost} className="text-foreground" />
                </div>
              ) : null}
            </div>

            {generating ? (
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                aria-label={stopLabel}
                data-slot="media-prompt-bar-stop"
                onClick={onStop}
              >
                <Square aria-hidden className="fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                data-slot="media-prompt-bar-submit"
                onClick={handleSubmit}
                disabled={currentValue.trim() === ""}
              >
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Generating is announced, not just shown by a spinner. */}
      <span data-slot="media-prompt-bar-status" role="status" aria-live="polite" className="sr-only">
        {generating ? generatingLabel : ""}
      </span>
    </div>
  );
}

export { MediaPromptBar };
export type { MediaPromptBarPresentation, MediaPromptBarProps };
