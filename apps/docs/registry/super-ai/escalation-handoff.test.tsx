import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EscalationHandoff, TRIGGER_COPY, type EscalationPacket } from "./escalation-handoff";

const PACKET: EscalationPacket = {
  summary: "Member asking whether an out-of-network scan is covered.",
  slots: [
    { label: "Member", value: "stated" },
    { label: "Plan", value: "retrieved" },
  ],
  attempted: ["Looked up plan document", "Checked prior authorizations"],
  request: "Confirm whether the exception applies.",
};

describe("EscalationHandoff", () => {
  it("says something different for each trigger", () => {
    // "I asked for a person" and "policy requires a person" are different facts.
    const copies = Object.values(TRIGGER_COPY);
    expect(new Set(copies).size).toBe(copies.length);
  });

  it("names the reason it is escalating", () => {
    render(<EscalationHandoff trigger="policy" packet={PACKET} />);
    expect(document.querySelector('[data-slot="escalation-handoff-reason"]')!.textContent).toBe(
      TRIGGER_COPY.policy,
    );
  });

  it("shows the packet before it is sent — it is the user's conversation being forwarded", () => {
    render(<EscalationHandoff trigger="user" packet={PACKET} onSend={() => {}} />);
    expect(screen.getByText(/out-of-network scan/)).toBeInTheDocument();
    expect(screen.getByText("Looked up plan document")).toBeInTheDocument();
    expect(screen.getByText("Confirm whether the exception applies.")).toBeInTheDocument();
  });

  it("lets the user edit what is shared before sending", async () => {
    const onEditPacket = vi.fn();
    render(
      <EscalationHandoff trigger="user" packet={PACKET} onSend={() => {}} onEditPacket={onEditPacket} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Edit what's shared" }));
    expect(onEditPacket).toHaveBeenCalled();
  });

  it("is honest when nobody is available and offers the async path instead of a fake queue", () => {
    render(
      <EscalationHandoff
        trigger="budget-exhausted"
        state="unavailable"
        packet={PACKET}
        availability="Support is back at 9am ET."
        onSend={() => {}}
        onLeaveMessage={() => {}}
      />,
    );
    expect(screen.getByText(/No one is available right now/)).toBeInTheDocument();
    expect(screen.getByText(/back at 9am ET/)).toBeInTheDocument();
    // Critically: no "send" affordance that would drop the user into a queue
    // that never drains.
    expect(screen.queryByRole("button", { name: "Send to a person" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave it for them" })).toBeInTheDocument();
  });

  it("admits an unknown wait rather than inventing one", () => {
    render(<EscalationHandoff trigger="user" state="queued" packet={PACKET} />);
    expect(screen.getByText(/don't have a wait time yet/)).toBeInTheDocument();
  });

  it("stops offering handoff actions once a person has picked it up", () => {
    render(<EscalationHandoff trigger="user" state="accepted" packet={PACKET} onSend={() => {}} />);
    expect(screen.getByText("Someone's with you")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send to a person" })).not.toBeInTheDocument();
  });
});
