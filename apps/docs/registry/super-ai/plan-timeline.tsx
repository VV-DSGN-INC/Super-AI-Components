"use client";

import {
  Check,
  ChevronRight,
  CircleDashed,
  Loader2,
  MinusCircle,
  ShieldQuestion,
  X,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { PlanStep, PlanStepStatus } from "./agent-types";

const STATUS_ICON: Record<PlanStepStatus, React.ReactNode> = {
  pending: <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />,
  running: <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />,
  done: <Check className="size-3.5 text-primary" aria-hidden />,
  failed: <X className="size-3.5 text-destructive" aria-hidden />,
  skipped: <MinusCircle className="size-3.5 text-muted-foreground" aria-hidden />,
  "needs-approval": <ShieldQuestion className="size-3.5 text-foreground" aria-hidden />,
};

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(3)}`;
}

interface PlanTimelineProps extends Omit<React.ComponentProps<"ol">, "onSelect"> {
  steps: PlanStep[];
  onStepSelect?: (id: string) => void;
}

function PlanTimeline({ steps, onStepSelect, className, ...props }: PlanTimelineProps) {
  if (steps.length === 0) {
    return (
      <ol data-slot="plan-timeline" role="list" className={cn("flex flex-col gap-0.5", className)} {...props}>
        <li className="px-2 py-1.5 text-sm text-muted-foreground">No plan steps yet.</li>
      </ol>
    );
  }

  return (
    <ol data-slot="plan-timeline" role="list" className={cn("flex flex-col gap-0.5", className)} {...props}>
      {steps.map((step) => (
        <PlanTimelineStep key={step.id} step={step} onStepSelect={onStepSelect} />
      ))}
    </ol>
  );
}

function PlanTimelineStep({
  step,
  onStepSelect,
  depth = 0,
}: {
  step: PlanStep;
  onStepSelect?: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const hasSubsteps = (step.substeps?.length ?? 0) > 0;

  return (
    <li data-slot="plan-timeline-step" data-status={step.status} className="flex flex-col">
      <div
        className="group/step flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        style={depth > 0 ? { marginInlineStart: depth * 24 } : undefined}
      >
        {STATUS_ICON[step.status]}
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
          onClick={() => onStepSelect?.(step.id)}
        >
          {step.title}
        </button>
        {step.durationMs !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(step.durationMs)}</span>
        )}
        {step.costUsd !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">{formatCost(step.costUsd)}</span>
        )}
        {hasSubsteps && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`Toggle substeps for ${step.title}`}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} aria-hidden />
          </button>
        )}
      </div>
      {step.detail && (
        <p className="text-xs text-muted-foreground" style={{ marginInlineStart: depth * 24 + 32 }}>
          {step.detail}
        </p>
      )}
      {hasSubsteps && expanded && (
        <ol role="list" className="flex flex-col gap-0.5">
          {step.substeps!.map((sub) => (
            <PlanTimelineStep key={sub.id} step={sub} onStepSelect={onStepSelect} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
}

export { PlanTimeline };
export type { PlanTimelineProps };
