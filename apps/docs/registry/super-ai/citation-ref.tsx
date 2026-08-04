"use client";

import * as React from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type CitationState = "resolved" | "loading" | "unresolved";

interface CitationRefProps extends Omit<React.ComponentProps<"button">, "onSelect"> {
  /** The marker text — usually an index. */
  label: React.ReactNode;
  /** Document/source title. */
  source?: React.ReactNode;
  /** The actual quoted chunk. A citation that only names a document is not verifiable. */
  quote?: React.ReactNode;
  state?: CitationState;
  /** Scrolls K5 source-panel to this chunk. Two ends of one mechanism. */
  onJumpToSource?: () => void;
}

function CitationRef({
  label,
  source,
  quote,
  state = "resolved",
  onJumpToSource,
  className,
  ...props
}: CitationRefProps) {
  const marker = (
    <button
      type="button"
      data-slot="citation-ref"
      data-state={state}
      // `unresolved` is a visible state. Silently dropping a citation is how a
      // document stops being verifiable — so a broken one still renders, and
      // still says it is broken.
      aria-label={
        state === "unresolved"
          ? `Citation ${typeof label === "string" ? label : ""} — source unavailable`
          : undefined
      }
      onClick={state === "resolved" ? onJumpToSource : undefined}
      className={cn(
        "bg-muted text-muted-foreground ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 align-super text-[0.625rem] font-medium",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        state === "resolved" && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
        state === "loading" && "animate-pulse motion-reduce:animate-none",
        state === "unresolved" && "text-destructive border-destructive/40 border border-dashed",
        className,
      )}
      {...props}
    >
      {label}
    </button>
  );

  if (state !== "resolved") return marker;

  return (
    <HoverCard>
      <HoverCardTrigger render={marker} />
      <HoverCardContent className="flex max-w-sm flex-col gap-1.5">
        {source ? (
          <span data-slot="citation-ref-source" className="text-xs font-medium">
            {source}
          </span>
        ) : null}
        {/* The quoted chunk, not just the document name — the whole reason the
            hovercard exists is to let someone check the claim without leaving
            the answer. */}
        {quote ? (
          <blockquote
            data-slot="citation-ref-quote"
            className="border-border text-muted-foreground border-l-2 pl-2 text-xs"
          >
            {quote}
          </blockquote>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

export { CitationRef };
export type { CitationRefProps, CitationState };
