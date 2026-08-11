"use client";

/**
 * Vendored from https://registry.ai-sdk.dev/suggestion.json (AI Elements), so
 * C2 `suggestion-chips` can compose a suggestion row instead of reimplementing
 * one — component-specs.md C2: "Composes rather than reimplements — the
 * cleanest example of the L1 boundary in the catalog."
 *
 * NO Base UI `asChild` → `render=` edits were needed in this file, unlike
 * conversation.tsx and message.tsx: Suggestion/Suggestions never reach for
 * Radix's `asChild` pattern, they just render `Button` and `ScrollArea`
 * directly. Content below is byte-for-byte upstream.
 *
 * ONE LOCAL ADDITION, not a content edit: this file imports
 * `@/components/ui/scroll-area`, one of the shadcn primitives this repo
 * vendors under `apps/docs/components/ui/` — except scroll-area was never
 * among the ones an earlier wave brought in (nothing in `apps/docs` needed it
 * before this component). It has been added there as a straight copy of
 * `apps/storybook/src/components/ui/scroll-area.tsx` (a Base UI
 * `@base-ui/react/scroll-area` wrapper; `@base-ui/react` is already an
 * `apps/docs` dependency), so this import resolves. That file is otherwise
 * unmodified shadcn output — see its own header-free contents for the diff
 * (there is none against the storybook copy).
 *
 * Consequence worth knowing, same shape as message.tsx's: a consumer running
 * `npx shadcn add .../suggestion-chips.json` gets AI Elements' unpatched
 * upstream `suggestion.tsx` (identical to this file) via its declared
 * `registryDependencies: ["button", "scroll-area"]` — but only if their own
 * project's shadcn registry actually has a `scroll-area` item to resolve
 * against. In a fresh shadcn/ui project it does; there is no registry
 * mechanism here that ships this repo's local `scroll-area.tsx` alongside it.
 */

import { Button } from "@/components/ui/button";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn("flex w-max flex-nowrap items-center gap-2", className)}>
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn("cursor-pointer rounded-full px-4", className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
