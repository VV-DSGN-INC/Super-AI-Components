import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { GuardrailEvent } from "./agent-types";
import { RefusalCard } from "./refusal-card";

const event: GuardrailEvent = {
  id: "g1",
  kind: "refusal",
  policy: "external-communication",
  blocked: "Send report to mailing list",
  preview: "Subject: Quantum threat report…",
};

describe("RefusalCard", () => {
  it("renders blocked action, policy, and alert role", () => {
    render(<RefusalCard event={event} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Send report to mailing list")).toBeInTheDocument();
    expect(screen.getByText("external-communication")).toBeInTheDocument();
  });

  it("reveals the redacted preview on demand", async () => {
    render(<RefusalCard event={event} />);
    expect(screen.queryByText("Subject: Quantum threat report…")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show blocked content" }));
    expect(screen.getByText("Subject: Quantum threat report…")).toBeInTheDocument();
  });

  it("fires onEscalate and onRequestOverride", async () => {
    const onEscalate = vi.fn();
    const onRequestOverride = vi.fn();
    render(<RefusalCard event={event} onEscalate={onEscalate} onRequestOverride={onRequestOverride} />);
    await userEvent.click(screen.getByRole("button", { name: "Escalate to a human" }));
    expect(onEscalate).toHaveBeenCalledWith("g1");
    await userEvent.click(screen.getByRole("button", { name: "Request override" }));
    expect(onRequestOverride).toHaveBeenCalledWith("g1");
  });

  it("renders without optional fields or callbacks", () => {
    render(<RefusalCard event={{ id: "g2", kind: "refusal", policy: "tool-safety" }} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("tool-safety")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
