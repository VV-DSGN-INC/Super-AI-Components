import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskQueue, type QueuedTask } from "./task-queue";

const tasks: QueuedTask[] = [
  { id: "t1", title: "Hotfix prod incident report", priority: "P0", status: "running" },
  { id: "t2", title: "Summarize standup notes", priority: "P2", status: "queued", rankDelta: -1 },
  { id: "t3", title: "Draft release notes", priority: "P1", status: "queued", rankDelta: 1, preempted: true },
];

describe("TaskQueue", () => {
  it("renders an empty state when the queue is empty", () => {
    render(<TaskQueue tasks={[]} />);
    expect(screen.getByText("Queue is empty.")).toBeInTheDocument();
  });

  it("renders tasks in order with priority badges", () => {
    render(<TaskQueue tasks={tasks} aria-label="Agent queue" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("P0");
    expect(items[0]).toHaveAttribute("data-status", "running");
  });

  it("marks preempted tasks and rank changes", () => {
    render(<TaskQueue tasks={tasks} />);
    const preempted = screen.getByText("Draft release notes").closest("li");
    expect(preempted).toHaveAttribute("data-preempted", "true");
    expect(screen.getByLabelText("Moved down 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Moved up 1")).toBeInTheDocument();
  });
});
