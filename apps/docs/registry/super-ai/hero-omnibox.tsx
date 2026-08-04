"use client";

import { ArrowUp, Paperclip, Square } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Hero Omnibox — The centred "What can I help you with?" prompt
 *
 * Spec: docs/design-system/component-specs.md#c1-hero-omnibox
 * States: idle · focused · generating · locked
 */

type HeroOmniboxState = "idle" | "focused" | "generating" | "locked";

interface HeroOmniboxOption {
  value: string;
  label: string;
}

interface HeroOmniboxProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  /** Declared state from the spec. Defaults to "idle". */
  state?: HeroOmniboxState;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the composer. Rendered as a visually-hidden <label>. */
  label?: string;
  /** 2–5 mode options (D4 mode-tabs), rendered inside the field. Omit to hide. */
  modes?: HeroOmniboxOption[];
  mode?: string;
  onModeChange?: (mode: string) => void;
  /** Model options. Omit to hide the model select. */
  models?: HeroOmniboxOption[];
  model?: string;
  onModelChange?: (model: string) => void;
  /** Cost at the point of spend (M2). Omit to hide. */
  cost?: number | string;
  onAttach?: () => void;
  attachLabel?: string;
  onSubmit?: (value: string) => void;
  submitLabel?: string;
  onStop?: () => void;
  stopLabel?: string;
  generatingLabel?: string;
  lockedTitle?: string;
  lockedDescription?: string;
  lockedCtaLabel?: string;
  onUnlock?: () => void;
}

const INTERACTIVE_SELECTOR = "button, a, [role='tab'], [data-slot='select-trigger'], input, textarea";

function HeroOmnibox({
  state = "idle",
  value,
  onValueChange,
  placeholder = "What can I help you with?",
  label = "What can I help you with?",
  modes,
  mode,
  onModeChange,
  models,
  model,
  onModelChange,
  cost,
  onAttach,
  attachLabel = "Attach file",
  onSubmit,
  submitLabel = "Send message",
  onStop,
  stopLabel = "Stop generating",
  generatingLabel = "Generating a response…",
  lockedTitle = "You've hit your plan's limit",
  lockedDescription = "Upgrade to keep generating.",
  lockedCtaLabel = "Upgrade",
  onUnlock,
  className,
  ...props
}: HeroOmniboxProps) {
  const inputId = React.useId();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [internalValue, setInternalValue] = React.useState("");
  const currentValue = value ?? internalValue;
  const isGenerating = state === "generating";
  const isLocked = state === "locked";

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(event.target.value);
    onValueChange?.(event.target.value);
  };

  const handleSubmit = () => {
    if (isGenerating || isLocked || currentValue.trim() === "") return;
    onSubmit?.(currentValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // The whole card is the control: a click anywhere that isn't already an
  // interactive descendant focuses the composer, same as clicking the field
  // directly would.
  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked || isGenerating) return;
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    textareaRef.current?.focus();
  };

  return (
    <div
      data-slot="hero-omnibox"
      data-state={state}
      aria-busy={isGenerating || undefined}
      onClick={handleCardClick}
      className={cn(
        "flex w-full max-w-2xl flex-col gap-2 rounded-2xl border bg-card p-2 text-card-foreground ring-1 ring-foreground/10 transition-colors",
        !isLocked && !isGenerating && "cursor-text",
        state === "focused" && "border-ring ring-3 ring-ring/50",
        className,
      )}
      {...props}
    >
      {modes && modes.length > 0 ? (
        <div data-slot="hero-omnibox-modes">
          <Tabs value={mode} onValueChange={(next) => onModeChange?.(String(next))}>
            <TabsList aria-label="Mode">
              {modes.map((item) => (
                <TabsTrigger key={item.value} value={item.value} disabled={isGenerating || isLocked}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      {isLocked ? (
        <div
          data-slot="hero-omnibox-paywall"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3"
        >
          <div data-slot="hero-omnibox-paywall-copy">
            <p className="text-sm font-medium">{lockedTitle}</p>
            <p className="text-muted-foreground text-xs">{lockedDescription}</p>
          </div>
          <Button data-slot="hero-omnibox-unlock" onClick={onUnlock}>
            {lockedCtaLabel}
          </Button>
        </div>
      ) : (
        <div data-slot="hero-omnibox-field" className="flex flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Textarea
            ref={textareaRef}
            id={inputId}
            data-slot="hero-omnibox-textarea"
            aria-label={label}
            placeholder={placeholder}
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            autoFocus={state === "focused"}
            className="min-h-20 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
          />

          <div data-slot="hero-omnibox-toolbar" className="flex items-center justify-between gap-2">
            <div data-slot="hero-omnibox-actions" className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={attachLabel}
                data-slot="hero-omnibox-attach"
                onClick={onAttach}
                disabled={isGenerating}
              >
                <Paperclip aria-hidden />
              </Button>

              {models && models.length > 0 ? (
                <div data-slot="hero-omnibox-model">
                  <Select value={model} onValueChange={(next) => onModelChange?.(String(next))}>
                    <SelectTrigger size="sm" aria-label="Model" disabled={isGenerating}>
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {cost !== undefined ? (
                <div data-slot="hero-omnibox-cost">
                  {/* CostChip's own default (bg-muted + text-muted-foreground)
                      is 4.34:1 at this size — under the 4.5:1 text needs, and
                      already tracked as a pre-existing, contractExempt
                      violation on CostChip itself. Overriding to text-foreground
                      here (same fix as workspace-switcher's avatar initials)
                      keeps the muted pill background — the visual hierarchy —
                      while clearing 4.5:1 with a wide margin (~18:1) against
                      the same bg-muted fill. */}
                  <CostChip amount={cost} className="text-foreground" />
                </div>
              ) : null}
            </div>

            {isGenerating ? (
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                aria-label={stopLabel}
                data-slot="hero-omnibox-stop"
                onClick={onStop}
              >
                <Square aria-hidden className="fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon-sm"
                aria-label={submitLabel}
                data-slot="hero-omnibox-submit"
                onClick={handleSubmit}
                disabled={currentValue.trim() === ""}
              >
                <ArrowUp aria-hidden />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Generating is announced, not just shown by a spinner. */}
      <span data-slot="hero-omnibox-status" role="status" aria-live="polite" className="sr-only">
        {isGenerating ? generatingLabel : ""}
      </span>
    </div>
  );
}

export { HeroOmnibox };
export type { HeroOmniboxOption, HeroOmniboxProps, HeroOmniboxState };
