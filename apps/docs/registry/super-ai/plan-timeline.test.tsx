import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlanStep } from "./agent-types";
import { PlanTimeline } from "./plan-timeline";

const steps: PlanStep[] = [
  { id: "s1", title: "Identify foundational concepts", status: "done", durationMs: 8000, costUsd: 0.01 },
  {
    id: "s2",
    title: "Research cryptographic algorithms",
    status: "running",
    substeps: [{ id: "s2a", title: "Search arXiv", status: "running" }],
  },
  { id: "s3", title: "Synthesize findings into report", status: "pending" },
];

describe("PlanTimeline", () => {
  it("renders a list of steps with status exposed via data-status", () => {
    render(<PlanTimeline steps={steps} aria-label="Research plan" />);
    const list = screen.getByRole("list", { name: "Research plan" });
    expect(list).toBeInTheDocument();
    expect(screen.getByText("Identify foundational concepts").closest("li")).toHaveAttribute(
      "data-status",
      "done",
    );
    expect(screen.getByText("Research cryptographic algorithms").closest("li")).toHaveAttribute(
      "data-status",
      "running",
    );
  });

  it("toggles substeps with aria-expanded and fires onStepSelect", async () => {
    const onStepSelect = vi.fn();
    render(<PlanTimeline steps={steps} onStepSelect={onStepSelect} />);
    expect(screen.queryByText("Search arXiv")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Toggle substeps for Research cryptographic algorithms" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Search arXiv")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Identify foundational concepts" }));
    expect(onStepSelect).toHaveBeenCalledWith("s1");
  });

  it("shows duration and cost when provided", () => {
    render(<PlanTimeline steps={steps} />);
    expect(screen.getByText("8.0s")).toBeInTheDocument();
    expect(screen.getByText("$0.010")).toBeInTheDocument();
  });

  it("renders substep detail and deep nesting without dropping content", async () => {
    const deep: PlanStep[] = [
      {
        id: "d1",
        title: "Level 0",
        status: "running",
        substeps: [
          {
            id: "d2",
            title: "Level 1",
            status: "running",
            detail: "level-1 detail",
            substeps: [{ id: "d3", title: "Level 2", status: "pending" }],
          },
        ],
      },
    ];
    render(<PlanTimeline steps={deep} />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle substeps for Level 0" }));
    expect(screen.getByText("level-1 detail")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Toggle substeps for Level 1" }));
    expect(screen.getByText("Level 2")).toBeInTheDocument();
  });
});
