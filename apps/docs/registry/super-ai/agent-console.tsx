// apps/docs/registry/super-ai/agent-console.tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { GoalStatus, GuardrailEvent, HandoffEvent, PlanStep, RouteDecision } from "./agent-types";
import { DecisionTrace } from "./decision-trace";
import { GoalCard } from "./goal-card";
import { HandoffStack } from "./handoff-indicator";
import { PlanApproval } from "./plan-approval";
import { PlanTimeline } from "./plan-timeline";
import { RefusalCard } from "./refusal-card";

interface AgentConsoleProps extends React.ComponentProps<"div"> {
  goal: GoalStatus;
  steps: PlanStep[];
  decisions: RouteDecision[];
  handoffs: HandoffEvent[];
  refusal?: GuardrailEvent;
  /** When set, the console shows a pre-execution plan-approval interrupt. */
  approval?: { steps: PlanStep[]; title?: string };
  spentUsd?: number;
  onStop?: () => void;
  onStepSelect?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onRequestOverride?: (id: string) => void;
  onApprovePlan?: (steps: PlanStep[]) => void;
  onRejectPlan?: (reason: string) => void;
}

function AgentConsole({
  goal,
  steps,
  decisions,
  handoffs,
  refusal,
  approval,
  spentUsd,
  onStop,
  onStepSelect,
  onEscalate,
  onRequestOverride,
  onApprovePlan,
  onRejectPlan,
  className,
  ...props
}: AgentConsoleProps) {
  return (
    <div
      data-slot="agent-console"
      className={cn("grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]", className)}
      {...props}
    >
      <div className="flex flex-col gap-4">
        <GoalCard status={goal} onStop={onStop} />
        {handoffs.length > 0 && (
          <section aria-label="Agent handoffs" className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase text-muted-foreground">Handoffs</h4>
            <HandoffStack handoffs={handoffs} />
          </section>
        )}
        {spentUsd !== undefined && (
          <div data-slot="agent-console-usage" className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground">Run cost</span>
            <span className="tabular-nums">{`$${spentUsd.toFixed(2)}`}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {refusal && <RefusalCard event={refusal} onEscalate={onEscalate} onRequestOverride={onRequestOverride} />}
        {approval && onApprovePlan && onRejectPlan && (
          <PlanApproval
            steps={approval.steps}
            title={approval.title}
            onApprove={onApprovePlan}
            onReject={onRejectPlan}
          />
        )}
        <section aria-label="Plan" className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Plan</h4>
          <PlanTimeline steps={steps} onStepSelect={onStepSelect} aria-label="Agent plan" />
        </section>
        {decisions.length > 0 && (
          <section aria-label="Routing decisions" className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase text-muted-foreground">Decisions</h4>
            <DecisionTrace decisions={decisions} />
          </section>
        )}
      </div>
    </div>
  );
}

export { AgentConsole };
export type { AgentConsoleProps };
