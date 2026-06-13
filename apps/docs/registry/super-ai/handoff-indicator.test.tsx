import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { HandoffEvent } from "./agent-types";
import { HandoffIndicator, HandoffStack } from "./handoff-indicator";

const handoff: HandoffEvent = {
  id: "h1",
  from: "Researcher",
  to: "Writer",
  reason: "Sources gathered; draft needed",
  payloadSummary: "12 sources, threat matrix",
  at: "14:02",
};

describe("HandoffIndicator", () => {
  it("renders from → to and expands to reason/payload", async () => {
    render(<HandoffIndicator handoff={handoff} />);
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Toggle handoff detail from Researcher to Writer" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByText("Sources gathered; draft needed")).toBeInTheDocument();
    expect(screen.getByText("12 sources, threat matrix")).toBeInTheDocument();
  });

  it("HandoffStack renders a list of handoffs", () => {
    render(
      <HandoffStack
        handoffs={[handoff, { id: "h2", from: "Writer", to: "Critic", reason: "Draft ready for review" }]}
      />,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Critic")).toBeInTheDocument();
  });
});
