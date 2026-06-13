"use client";

import { Check, CircleDashed, OctagonX } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GoalState, GoalStatus } from "./agent-types";

const STATE_CLASS: Record<GoalState, string> = {
  "on-track": "bg-primary/10 text-primary",
  "at-risk": "bg-muted text-foreground",
  stalled: "bg-destructive/10 text-destructive",
};

interface GoalCardProps extends React.ComponentProps<"div"> {
  status: GoalStatus;
  onStop?: () => void;
}

function GoalCard({ status, onStop, className, ...props }: GoalCardProps) {
  const met = status.criteria.filter((c) => c.met).length;
  return (
    <div
      data-slot="goal-card"
      data-state={status.state}
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{status.goal}</p>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATE_CLASS[status.state])}>
          {status.state}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{`${met}/${status.criteria.length} criteria met`}</span>
        {status.budgetUsd !== undefined && status.spentUsd !== undefined && (
          <span className="tabular-nums">{`$${status.spentUsd.toFixed(2)} / $${status.budgetUsd.toFixed(2)}`}</span>
        )}
      </div>
      {status.criteria.length > 0 ? (
        <ul role="list" className="flex flex-col gap-1">
          {status.criteria.map((c) => (
            <li key={c.id} data-met={c.met} className="flex items-center gap-2 text-sm">
              {c.met ? (
                <Check className="size-3.5 text-primary" aria-hidden />
              ) : (
                <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />
              )}
              <span className={cn(!c.met && "text-muted-foreground")}>{c.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No success criteria defined.</p>
      )}
      {onStop && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" aria-label="Stop agent" onClick={onStop}>
            <OctagonX className="size-3.5" aria-hidden />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}

export { GoalCard };
export type { GoalCardProps };
