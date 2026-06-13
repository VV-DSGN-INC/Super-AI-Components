import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { RouteDecision } from "./agent-types";
import { DecisionTrace } from "./decision-trace";

const decisions: RouteDecision[] = [
  {
    id: "d1",
    input: "Find expert analysis on quantum threats",
    chosen: { route: "web-search", confidence: 0.92, rationale: "Fresh sources required" },
    alternatives: [{ route: "internal-kb", confidence: 0.31 }],
  },
  {
    id: "d2",
    input: "Summarize findings",
    chosen: { route: "writer-agent", confidence: 0.88 },
    alternatives: [{ route: "direct-llm", confidence: 0.55 }],
  },
];

describe("DecisionTrace", () => {
  it("renders chosen routes as a breadcrumb", () => {
    render(<DecisionTrace decisions={decisions} />);
    expect(screen.getByText("web-search")).toBeInTheDocument();
    expect(screen.getByText("writer-agent")).toBeInTheDocument();
  });

  it("expands a decision to show rationale and alternatives with confidence", async () => {
    render(<DecisionTrace decisions={decisions} />);
    const toggle = screen.getByRole("button", { name: "Toggle decision detail for web-search" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Fresh sources required")).toBeInTheDocument();
    expect(screen.getByText("internal-kb")).toBeInTheDocument();
    expect(screen.getByText("31%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
  });
});
