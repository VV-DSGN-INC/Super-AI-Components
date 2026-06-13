"use client";

import { ChevronRight, Split } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { RouteDecision } from "./agent-types";

function pct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

interface DecisionTraceProps extends React.ComponentProps<"div"> {
  decisions: RouteDecision[];
}

function DecisionTrace({ decisions, className, ...props }: DecisionTraceProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (decisions.length === 0) {
    return (
      <div
        data-slot="decision-trace"
        className={cn("rounded-lg border bg-card p-4 text-sm text-muted-foreground", className)}
        {...props}
      >
        No routing decisions yet.
      </div>
    );
  }

  return (
    <div data-slot="decision-trace" className={cn("flex flex-col gap-1", className)} {...props}>
      <div className="flex flex-wrap items-center gap-1">
        {decisions.map((d, i) => (
          <React.Fragment key={d.id}>
            {i > 0 && <ChevronRight className="size-3 text-muted-foreground" aria-hidden />}
            <button
              type="button"
              aria-expanded={openId === d.id}
              aria-label={`Toggle decision detail for ${d.chosen.route}`}
              data-slot="decision-trace-node"
              className={cn(
                "flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs hover:bg-accent",
                openId === d.id && "bg-accent",
              )}
              onClick={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
            >
              <Split className="size-3 text-muted-foreground" aria-hidden />
              {d.chosen.route}
              <span className="tabular-nums text-muted-foreground">{pct(d.chosen.confidence)}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
      {decisions
        .filter((d) => d.id === openId)
        .map((d) => (
          <div key={d.id} data-slot="decision-trace-detail" className="rounded-md border bg-card p-3 text-sm">
            <p className="text-xs text-muted-foreground">Input</p>
            <p className="mb-2">{d.input}</p>
            {d.chosen.rationale && (
              <>
                <p className="text-xs text-muted-foreground">Rationale</p>
                <p className="mb-2">{d.chosen.rationale}</p>
              </>
            )}
            <p className="text-xs text-muted-foreground">Rejected alternatives</p>
            <ul role="list" className="mt-1 flex flex-col gap-1">
              {d.alternatives.map((a, i) => (
                <li key={`${a.route}-${i}`} className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{a.route}</span>
                  <span className="tabular-nums">{pct(a.confidence)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export { DecisionTrace };
export type { DecisionTraceProps };
