"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PlanStep } from "./agent-types";

interface PlanApprovalProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  steps: PlanStep[];
  onApprove: (steps: PlanStep[]) => void;
  onReject: (reason: string) => void;
  title?: string;
}

function PlanApproval({
  steps: initialSteps,
  onApprove,
  onReject,
  title = "Review proposed plan",
  className,
  ...props
}: PlanApprovalProps) {
  // One-shot snapshot of the proposed plan: edits live here, not in the host.
  // Remount with a new `key` (e.g. key={planId}) to present a different proposal.
  const [steps, setSteps] = React.useState(initialSteps);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  function move(index: number, delta: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div
      data-slot="plan-approval"
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <ol role="list" className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <li
            key={step.id}
            data-slot="plan-approval-step"
            className="group/row flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
          >
            <span className="text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate text-sm">{step.title}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${step.title} up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${step.title} down`}
              disabled={i === steps.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${step.title}`}
              onClick={() => setSteps((prev) => prev.filter((s) => s.id !== step.id))}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </li>
        ))}
      </ol>
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <textarea
            aria-label="Rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this plan rejected?"
            className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reason.trim().length === 0}
              onClick={() => onReject(reason.trim())}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" aria-label="Reject plan" onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button type="button" aria-label="Approve plan" disabled={steps.length === 0} onClick={() => onApprove(steps)}>
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

export { PlanApproval };
export type { PlanApprovalProps };
