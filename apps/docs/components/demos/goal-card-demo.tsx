"use client";

import type { GoalStatus } from "@/registry/super-ai/agent-types";
import { GoalCard } from "@/registry/super-ai/goal-card";

const status: GoalStatus = {
  goal: "Analyze the impact of quantum computing on cybersecurity",
  state: "on-track",
  criteria: [
    { id: "c1", label: "≥ 5 primary sources gathered", met: true },
    { id: "c2", label: "Threat matrix completed", met: true },
    { id: "c3", label: "Critic approves final draft", met: false },
  ],
  budgetUsd: 2,
  spentUsd: 0.85,
};

export default function GoalCardDemo() {
  return <GoalCard status={status} onStop={() => {}} className="w-full max-w-sm" />;
}
