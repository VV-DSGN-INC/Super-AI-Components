// apps/docs/registry/super-ai/agent-console.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GoalStatus, GuardrailEvent, HandoffEvent, PlanStep, RouteDecision } from "./agent-types";
import { AgentConsole } from "./agent-console";

const goal: GoalStatus = {
  goal: "Analyze quantum computing impact on cybersecurity",
  state: "on-track",
  criteria: [{ id: "c1", label: "Report drafted", met: false }],
};
const steps: PlanStep[] = [{ id: "s1", title: "Identify concepts", status: "running" }];
const decisions: RouteDecision[] = [
  { id: "d1", input: "Gather sources", chosen: { route: "web-search", confidence: 0.9 }, alternatives: [] },
];
const handoffs: HandoffEvent[] = [{ id: "h1", from: "Planner", to: "Researcher", reason: "Plan approved" }];
const refusal: GuardrailEvent = { id: "g1", kind: "refusal", policy: "external-communication", blocked: "Email list" };

describe("AgentConsole", () => {
  it("composes goal, plan, decisions, handoffs and cost", () => {
    render(
      <AgentConsole goal={goal} steps={steps} decisions={decisions} handoffs={handoffs} spentUsd={0.42} />,
    );
    expect(screen.getByText("Analyze quantum computing impact on cybersecurity")).toBeInTheDocument();
    expect(screen.getByText("Identify concepts")).toBeInTheDocument();
    expect(screen.getByText("web-search")).toBeInTheDocument();
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("$0.42")).toBeInTheDocument();
  });

  it("renders a refusal interrupt and fires onEscalate", async () => {
    const onEscalate = vi.fn();
    render(
      <AgentConsole goal={goal} steps={steps} decisions={[]} handoffs={[]} refusal={refusal} onEscalate={onEscalate} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Escalate to a human" }));
    expect(onEscalate).toHaveBeenCalledWith("g1");
  });

  it("renders a plan-approval interrupt and fires onApprovePlan", async () => {
    const onApprovePlan = vi.fn();
    render(
      <AgentConsole
        goal={goal}
        steps={[]}
        decisions={[]}
        handoffs={[]}
        approval={{ steps: [{ id: "p1", title: "Search the web", status: "pending" }] }}
        onApprovePlan={onApprovePlan}
        onRejectPlan={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprovePlan).toHaveBeenCalledWith([expect.objectContaining({ id: "p1" })]);
  });
});
