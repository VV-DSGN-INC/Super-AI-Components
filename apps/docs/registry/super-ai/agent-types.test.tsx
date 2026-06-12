import { describe, expect, it } from "vitest";

import { isTerminalStatus, type PlanStep } from "./agent-types";

describe("agent-types", () => {
  it("isTerminalStatus is true only for done/failed/skipped", () => {
    expect(isTerminalStatus("done")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
    expect(isTerminalStatus("skipped")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("running")).toBe(false);
    expect(isTerminalStatus("needs-approval")).toBe(false);
  });

  it("PlanStep supports nested substeps", () => {
    const step: PlanStep = {
      id: "s1",
      title: "Research",
      status: "running",
      substeps: [{ id: "s1a", title: "Search arXiv", status: "done" }],
    };
    expect(step.substeps?.[0].status).toBe("done");
  });
});
