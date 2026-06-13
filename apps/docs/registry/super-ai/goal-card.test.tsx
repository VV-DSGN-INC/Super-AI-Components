import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GoalStatus } from "./agent-types";
import { GoalCard } from "./goal-card";

const goal: GoalStatus = {
  goal: "Produce a cited report on quantum threats",
  state: "at-risk",
  criteria: [
    { id: "c1", label: "≥ 5 primary sources", met: true },
    { id: "c2", label: "Critic approves draft", met: false },
  ],
  budgetUsd: 2,
  spentUsd: 1.4,
};

describe("GoalCard", () => {
  it("renders goal, state badge, and criteria progress", () => {
    render(<GoalCard status={goal} />);
    expect(screen.getByText("Produce a cited report on quantum threats")).toBeInTheDocument();
    expect(screen.getByText("at-risk")).toBeInTheDocument();
    expect(screen.getByText("1/2 criteria met")).toBeInTheDocument();
    const root = screen.getByText("at-risk").closest("[data-slot='goal-card']");
    expect(root).toHaveAttribute("data-state", "at-risk");
  });

  it("marks met criteria and fires onStop", async () => {
    const onStop = vi.fn();
    render(<GoalCard status={goal} onStop={onStop} />);
    expect(screen.getByText("≥ 5 primary sources").closest("li")).toHaveAttribute("data-met", "true");
    expect(screen.getByText("Critic approves draft").closest("li")).toHaveAttribute("data-met", "false");
    await userEvent.click(screen.getByRole("button", { name: "Stop agent" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("shows budget spend when provided", () => {
    render(<GoalCard status={goal} />);
    expect(screen.getByText("$1.40 / $2.00")).toBeInTheDocument();
  });

  it("renders a placeholder when no criteria are defined", () => {
    render(<GoalCard status={{ goal: "Ship it", state: "on-track", criteria: [] }} />);
    expect(screen.getByText("No success criteria defined.")).toBeInTheDocument();
    expect(screen.getByText("0/0 criteria met")).toBeInTheDocument();
  });
});
