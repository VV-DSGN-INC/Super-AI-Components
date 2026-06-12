// Shared data contracts for the Agent Kit. UI components render these;
// the host application owns the agent loop that produces them.

export type PlanStepStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped"
  | "needs-approval";

export interface PlanStep {
  id: string;
  title: string;
  status: PlanStepStatus;
  detail?: string;
  substeps?: PlanStep[];
  durationMs?: number;
  costUsd?: number;
}

export interface RouteDecision {
  id: string;
  input: string;
  chosen: { route: string; confidence: number; rationale?: string };
  alternatives: { route: string; confidence: number }[];
}

export interface HandoffEvent {
  id: string;
  from: string;
  to: string;
  reason: string;
  payloadSummary?: string;
  at?: string;
}

export type GuardrailKind = "refusal" | "degraded" | "sandbox" | "filter";

export interface GuardrailEvent {
  id: string;
  kind: GuardrailKind;
  policy: string;
  blocked?: string;
  preview?: string;
}

export type GoalState = "on-track" | "at-risk" | "stalled";

export interface GoalStatus {
  goal: string;
  state: GoalState;
  criteria: { id: string; label: string; met: boolean }[];
  elapsedMs?: number;
  budgetUsd?: number;
  spentUsd?: number;
}

export type ConnectorHealth = "connected" | "auth-needed" | "error";

export interface ConnectorState {
  id: string;
  name: string;
  health: ConnectorHealth;
  toolCount?: number;
  latencyMs?: number;
}

const TERMINAL: ReadonlySet<PlanStepStatus> = new Set(["done", "failed", "skipped"]);

export function isTerminalStatus(status: PlanStepStatus): boolean {
  return TERMINAL.has(status);
}
