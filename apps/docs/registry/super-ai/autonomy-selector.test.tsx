import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AutonomySelector } from "./autonomy-selector";

describe("AutonomySelector", () => {
  it("states the blast radius of every level, not just its name", () => {
    render(<AutonomySelector />);
    expect(screen.getByText("Nothing runs without you.")).toBeInTheDocument();
    expect(screen.getByText(/Reads run alone/)).toBeInTheDocument();
    expect(screen.getByText(/not on the deny list runs unattended/)).toBeInTheDocument();
  });

  it("lets a locked run be tightened but not loosened", async () => {
    const onLevelChange = vi.fn();
    render(<AutonomySelector defaultLevel="auto-reads" locked onLevelChange={onLevelChange} />);

    // Raising is blocked mid-run. The radio-group base renders a span with
    // aria-disabled rather than a native disabled control, so assert the
    // behaviour — a click must not raise the level — not just the attribute.
    const raise = screen.getByRole("radio", { name: /Full auto/ });
    expect(raise).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(raise);
    expect(onLevelChange).not.toHaveBeenCalled();

    // ...but lowering must always work. A safety control you cannot tighten
    // during an incident is not a safety control.
    await userEvent.click(screen.getByRole("radio", { name: /Ask every time/ }));
    expect(onLevelChange).toHaveBeenCalledWith("ask");
  });

  it("lists standing grants with a revoke for each", async () => {
    const onRevoke = vi.fn();
    render(
      <AutonomySelector
        grants={[{ id: "g1", tool: "Send email", scope: "@acme.com", granted: "2 days ago" }]}
        onRevoke={onRevoke}
      />,
    );
    expect(screen.getByText("Send email")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(onRevoke).toHaveBeenCalledWith("g1");
  });

  it("says so when nothing has been granted, rather than showing an empty list", () => {
    render(<AutonomySelector />);
    expect(screen.getByText(/No standing permissions/)).toBeInTheDocument();
  });

  it("renders denials without a revoke — deny wins and takes no exceptions", () => {
    render(
      <AutonomySelector
        grants={[{ id: "g1", tool: "Send email" }]}
        onRevoke={() => {}}
        denials={[{ id: "d1", tool: "Delete records", reason: "Never automated" }]}
      />,
    );
    expect(screen.getByText("Delete records")).toBeInTheDocument();
    // Exactly one revoke on screen: the grant's. The denial has none.
    expect(screen.getAllByRole("button", { name: "Revoke" })).toHaveLength(1);
  });

  it("respects a controlled level and reports changes without self-updating", async () => {
    const onLevelChange = vi.fn();
    render(<AutonomySelector level="ask" onLevelChange={onLevelChange} />);
    await userEvent.click(screen.getByRole("radio", { name: /Full auto/ }));
    expect(onLevelChange).toHaveBeenCalledWith("full");
    expect(screen.getByRole("radio", { name: /Ask every time/ })).toBeChecked();
  });
});
