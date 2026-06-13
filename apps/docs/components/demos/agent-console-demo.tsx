// apps/docs/components/demos/agent-console-demo.tsx
"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type {
  GoalStatus,
  GuardrailEvent,
  HandoffEvent,
  PlanStep,
  RouteDecision,
} from "@/registry/super-ai/agent-types";
import { AgentConsole } from "@/registry/super-ai/agent-console";

interface Frame {
  label: string;
  goalState: GoalStatus["state"];
  criteriaMet: number;
  stepStatuses: PlanStep["status"][];
  decisions: number;
  handoffs: number;
  refusal?: GuardrailEvent;
  awaitingApproval?: boolean;
  spentUsd: number;
}

const PLAN: Omit<PlanStep, "status">[] = [
  { id: "s1", title: "Identify foundational concepts of quantum computing" },
  { id: "s2", title: "Research common cryptographic algorithms" },
  { id: "s3", title: "Find expert analysis on quantum threats" },
  { id: "s4", title: "Synthesize findings into a structured report" },
];

const DECISIONS: RouteDecision[] = [
  { id: "d1", input: "Gather sources", chosen: { route: "web-search", confidence: 0.92, rationale: "Fresh sources required" }, alternatives: [{ route: "internal-kb", confidence: 0.31 }] },
  { id: "d2", input: "Draft the report", chosen: { route: "writer-agent", confidence: 0.88 }, alternatives: [{ route: "direct-llm", confidence: 0.55 }] },
];

const HANDOFFS: HandoffEvent[] = [
  { id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved; gather sources", at: "13:58" },
  { id: "h2", from: "Researcher", to: "Writer", reason: "Sources gathered; draft needed", payloadSummary: "12 sources", at: "14:02" },
  { id: "h3", from: "Writer", to: "Critic", reason: "Draft ready for review", at: "14:05" },
];

const REFUSAL: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Email preliminary findings to the public security list",
};

// Frame-by-frame replay of Gulli's research-assistant capstone:
// Planner proposes → human approves plan → Researcher → (refusal interrupt) → Writer → Critic → done.
const FRAMES: Frame[] = [
  { label: "Planner proposes a plan — awaiting approval", goalState: "on-track", criteriaMet: 0, stepStatuses: ["pending", "pending", "pending", "pending"], decisions: 0, handoffs: 0, awaitingApproval: true, spentUsd: 0.02 },
  { label: "Plan approved; Researcher gathers sources via web-search", goalState: "on-track", criteriaMet: 0, stepStatuses: ["done", "running", "pending", "pending"], decisions: 1, handoffs: 1, spentUsd: 0.18 },
  { label: "Guardrail blocks external email", goalState: "at-risk", criteriaMet: 0, stepStatuses: ["done", "running", "needs-approval", "pending"], decisions: 1, handoffs: 1, refusal: REFUSAL, spentUsd: 0.21 },
  { label: "Writer drafts the report", goalState: "on-track", criteriaMet: 1, stepStatuses: ["done", "done", "done", "running"], decisions: 2, handoffs: 2, spentUsd: 0.49 },
  { label: "Critic approves; run complete", goalState: "on-track", criteriaMet: 2, stepStatuses: ["done", "done", "done", "done"], decisions: 2, handoffs: 3, spentUsd: 0.61 },
];

export default function AgentConsoleDemo() {
  const [frame, setFrame] = React.useState(0);
  const f = FRAMES[frame];

  const goal: GoalStatus = {
    goal: "Analyze the impact of quantum computing on cybersecurity",
    state: f.goalState,
    criteria: [
      { id: "c1", label: "≥ 5 primary sources gathered", met: f.criteriaMet >= 1 },
      { id: "c2", label: "Critic approves final draft", met: f.criteriaMet >= 2 },
    ],
  };
  const steps: PlanStep[] = PLAN.map((p, i) => ({ ...p, status: f.stepStatuses[i] }));
  const advance = () => setFrame((v) => Math.min(v + 1, FRAMES.length - 1));

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{`${frame + 1}/${FRAMES.length} — ${f.label}`}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={frame === 0} onClick={() => setFrame(0)}>
            Reset
          </Button>
          <Button type="button" size="sm" disabled={frame === FRAMES.length - 1} onClick={advance}>
            Next event
          </Button>
        </div>
      </div>
      <AgentConsole
        goal={goal}
        steps={f.awaitingApproval ? [] : steps}
        decisions={DECISIONS.slice(0, f.decisions)}
        handoffs={HANDOFFS.slice(0, f.handoffs)}
        refusal={f.refusal}
        approval={f.awaitingApproval ? { steps, title: "Planner proposes this plan" } : undefined}
        spentUsd={f.spentUsd}
        onStop={() => {}}
        onEscalate={advance}
        onApprovePlan={advance}
        onRejectPlan={() => setFrame(0)}
      />
    </div>
  );
}
