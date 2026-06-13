"use client";

import { ArrowRight, Users } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { HandoffEvent } from "./agent-types";

interface HandoffIndicatorProps extends React.ComponentProps<"div"> {
  handoff: HandoffEvent;
}

function HandoffIndicator({ handoff, className, ...props }: HandoffIndicatorProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div data-slot="handoff-indicator" className={cn("flex flex-col gap-1", className)} {...props}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`Toggle handoff detail from ${handoff.from} to ${handoff.to}`}
        className="flex w-fit items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent"
        onClick={() => setExpanded((v) => !v)}
      >
        <Users className="size-3 text-muted-foreground" aria-hidden />
        <span className="font-medium">{handoff.from}</span>
        <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
        <span className="font-medium">{handoff.to}</span>
        {handoff.at && <span className="tabular-nums text-muted-foreground">{handoff.at}</span>}
      </button>
      {expanded && (
        <div data-slot="handoff-detail" className="rounded-md border bg-card p-2 text-xs">
          <p>{handoff.reason}</p>
          {handoff.payloadSummary && <p className="mt-1 text-muted-foreground">{handoff.payloadSummary}</p>}
        </div>
      )}
    </div>
  );
}

interface HandoffStackProps extends React.ComponentProps<"ul"> {
  handoffs: HandoffEvent[];
}

function HandoffStack({ handoffs, className, ...props }: HandoffStackProps) {
  if (handoffs.length === 0) {
    return (
      <ul data-slot="handoff-stack" role="list" className={cn("flex flex-col gap-1.5", className)} {...props}>
        <li className="text-sm text-muted-foreground">No handoffs yet.</li>
      </ul>
    );
  }

  return (
    <ul data-slot="handoff-stack" role="list" className={cn("flex flex-col gap-1.5", className)} {...props}>
      {handoffs.map((h) => (
        <li key={h.id}>
          <HandoffIndicator handoff={h} />
        </li>
      ))}
    </ul>
  );
}

export { HandoffIndicator, HandoffStack };
export type { HandoffIndicatorProps, HandoffStackProps };
