"use client";

import * as React from "react";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Suggestion Chips — Task starter chips
 *
 * Spec: docs/design-system/component-specs.md#c2-suggestion-chips
 * States: plain · with-icon · with-thumbnail · overflow-link
 *
 * Composes AI Elements' `Suggestions`/`Suggestion`
 * (@/components/ai-elements/suggestion, vendored from registry.ai-sdk.dev)
 * rather than reimplementing a chip row — the spec calls this "the cleanest
 * example of the L1 boundary in the catalog." `SuggestionChips` is a thin,
 * unmodified wrapper around `Suggestions`; `SuggestionChip` adds the leading
 * icon/thumbnail slot AI Elements doesn't have, on top of the vendored
 * `Suggestion` button; `SuggestionChipsOverflow` is this catalog's own
 * addition for the spec's other load-bearing sentence — overflow resolves to
 * a real link, never a chip that gets clipped mid-render by the horizontal
 * scroll strip.
 *
 * Chips are prompts, not filters: `SuggestionChip`'s `onSelect` exists to
 * fill the composer, never to submit or navigate. `Suggestion` already sets
 * `type="button"` for this reason — see suggestion.tsx.
 */

export type SuggestionChipsProps = React.ComponentProps<"div">;

function SuggestionChips({ className, children, ...props }: SuggestionChipsProps) {
  return (
    <div data-slot="suggestion-chips" className={cn("w-full", className)} {...props}>
      <Suggestions>{children}</Suggestions>
    </div>
  );
}

export interface SuggestionChipProps
  extends Omit<React.ComponentProps<typeof Suggestion>, "children" | "onClick" | "onSelect"> {
  /**
   * Fired with the suggestion text when the chip is clicked. This fills the
   * composer — never wire it to submit a form or navigate. `Suggestion`
   * underneath is a `type="button"` element specifically so a chip inside a
   * form can never trigger it.
   */
  onSelect?: (suggestion: string) => void;
  /** Leading icon. Decorative — the chip's accessible name always comes from `suggestion`. */
  icon?: React.ReactNode;
  /** Leading thumbnail (e.g. a template preview). Wins over `icon` when both are given. */
  thumbnail?: React.ReactNode;
}

function SuggestionChip({
  suggestion,
  onSelect,
  icon,
  thumbnail,
  className,
  ...props
}: SuggestionChipProps) {
  const leading = thumbnail ?? icon;

  return (
    <Suggestion
      suggestion={suggestion}
      onClick={onSelect}
      className={cn(leading && "gap-1.5", className)}
      {...props}
    >
      {leading ? (
        <span
          aria-hidden
          data-slot={thumbnail ? "suggestion-chip-thumbnail" : "suggestion-chip-icon"}
          className={
            thumbnail
              ? "size-5 shrink-0 overflow-hidden rounded-sm [&>img]:size-full [&>img]:object-cover"
              : "flex shrink-0 items-center [&>svg]:size-3.5"
          }
        >
          {leading}
        </span>
      ) : null}
      {suggestion}
    </Suggestion>
  );
}

export interface SuggestionChipsOverflowProps extends Omit<React.ComponentProps<"a">, "href"> {
  /**
   * Where the rest of the suggestions live. Required — "overflow resolves to
   * a link" only holds if the link actually goes somewhere; there is no
   * button variant of this component.
   */
  href: string;
  /** Suggestions hidden behind this link. Drives the default label ("N more") when `children` is omitted. */
  count?: number;
}

/**
 * The overflow resolution the spec calls for: "a half-visible chip reads as
 * a layout bug." A row that runs out of room does not truncate its last
 * `SuggestionChip` mid-render — it stops short and appends this real `<a>`
 * instead, styled to match but semantically a link, not a prompt.
 *
 * The class list is derived from `buttonVariants({ variant: "outline", size:
 * "sm" })` — the exact variant/size `Suggestion` renders with — plus the same
 * `rounded-full px-4` override `Suggestion` itself applies (see
 * suggestion.tsx). That is deliberate, not decorative: deriving from the
 * shared variant means this link inherits every `dark:` override
 * (`dark:border-input`, `dark:bg-input/30`, `dark:hover:bg-input/50`) and the
 * design system's real focus ring (`focus-visible:ring-3 ring-ring/50` plus
 * `focus-visible:border-ring`) automatically, so it never drifts from what a
 * real chip renders as the design system evolves. Point `href` at wherever
 * the rest of the suggestions live.
 */
function SuggestionChipsOverflow({ count, children, className, ...props }: SuggestionChipsOverflowProps) {
  return (
    <a
      data-slot="suggestion-chips-overflow"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "cursor-pointer rounded-full px-4 underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    >
      {children ?? (count ? `${count} more` : "See more")}
    </a>
  );
}

export { SuggestionChip, SuggestionChips, SuggestionChipsOverflow };
