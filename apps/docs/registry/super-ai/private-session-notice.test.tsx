import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrivateSessionChip, PrivateSessionNotice } from "./private-session-notice";

const STATEMENT = "Prompts, files and outputs are not saved to memory and are not used to train models.";

const CONNECTORS = [
  { name: "Calendar", scope: "off" as const },
  { name: "Drive", scope: "reduced" as const, detail: "Read-only, no history" },
];

function root() {
  return document.querySelector('[data-slot="private-session-notice"]')!;
}

describe("PrivateSessionNotice", () => {
  it("renders the entering state: the statement sits visible above the input with no control", () => {
    render(<PrivateSessionNotice state="entering" statement={STATEMENT} />);
    expect(root().getAttribute("data-state")).toBe("entering");
    expect(screen.getByText(STATEMENT)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the active state: persistent chip, statement only on demand", () => {
    render(<PrivateSessionNotice state="active" statement={STATEMENT} />);
    expect(root().querySelector('[data-slot="private-session-chip"]')).not.toBeNull();
    expect(screen.queryByText(STATEMENT)).toBeNull();
    const toggle = screen.getByRole("button", { name: "What a private session keeps" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(STATEMENT)).toBeTruthy();
    expect(toggle.getAttribute("aria-controls")).toBe(
      root().querySelector('[data-slot="private-session-statement"]')!.id,
    );
    fireEvent.click(toggle);
    expect(screen.queryByText(STATEMENT)).toBeNull();
  });

  it("renders the connectors-reduced state: one A9 row per connector, scope as text", () => {
    render(<PrivateSessionNotice state="connectors-reduced" statement={STATEMENT} connectors={CONNECTORS} />);
    const rows = document.querySelectorAll('[data-slot="entity-row"]');
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText("Calendar")).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getByText("Off")).toBeTruthy();
    expect(within(rows[1] as HTMLElement).getByText("Reduced")).toBeTruthy();
    expect(within(rows[1] as HTMLElement).getByText("Read-only, no history")).toBeTruthy();
    expect(rows[1].getAttribute("data-scope")).toBe("reduced");
  });

  it("renders the exiting state: the retention outcome as text for each shape", () => {
    const { rerender } = render(
      <PrivateSessionNotice state="exiting" statement={STATEMENT} retention={{ kind: "deleted-now" }} />,
    );
    expect(screen.getByRole("status").textContent).toContain("This session is deleted now.");
    rerender(
      <PrivateSessionNotice
        state="exiting"
        statement={STATEMENT}
        retention={{ kind: "deleted-after", period: "30 days" }}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("deleted after 30 days");
    rerender(
      <PrivateSessionNotice state="exiting" statement={STATEMENT} retention={{ kind: "kept-locally" }} />,
    );
    expect(screen.getByRole("status").textContent).toContain("kept on this device only");
    rerender(
      <PrivateSessionNotice
        state="exiting"
        statement={STATEMENT}
        retention={{ kind: "kept-locally", detail: "Stays in this browser until you clear site data." }}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("until you clear site data");
  });

  it("renders the unavailable state: the reason, with no chip-on control and no statement claim", () => {
    const { rerender } = render(
      <PrivateSessionNotice state="unavailable" statement={STATEMENT} reason="plan" />,
    );
    expect(screen.getByText("Private sessions are not included in your plan.")).toBeTruthy();
    expect(screen.queryByText(STATEMENT)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<PrivateSessionNotice state="unavailable" statement={STATEMENT} reason="admin" />);
    expect(screen.getByText("Your administrator has turned off private sessions.")).toBeTruthy();
    rerender(
      <PrivateSessionNotice
        state="unavailable"
        statement={STATEMENT}
        reason="plan"
        reasonText="Upgrade to use private sessions."
        action={<a href="#plan">Plan settings</a>}
      />,
    );
    expect(screen.getByText("Upgrade to use private sessions.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Plan settings" })).toBeTruthy();
  });

  it("form=chip renders only the chip, with a label per state", () => {
    const { rerender } = render(<PrivateSessionNotice state="active" form="chip" statement={STATEMENT} />);
    expect(root()).toBeNull();
    expect(screen.getByText("Private session")).toBeTruthy();
    expect(screen.queryByText(STATEMENT)).toBeNull();
    rerender(
      <PrivateSessionNotice
        state="connectors-reduced"
        form="chip"
        statement={STATEMENT}
        connectors={CONNECTORS}
      />,
    );
    expect(screen.getByText("Private session, connectors reduced")).toBeTruthy();
  });

  it("never dismisses: no close control in any state", () => {
    render(<PrivateSessionNotice state="active" statement={STATEMENT} />);
    expect(screen.queryByRole("button", { name: /close|dismiss/i })).toBeNull();
  });

  it("passes className through", () => {
    render(<PrivateSessionNotice className="test-class" state="entering" statement={STATEMENT} />);
    expect(root().className).toContain("test-class");
  });
});

describe("PrivateSessionChip", () => {
  it("renders the named sub-component with its own slot and a text label per state", () => {
    const { rerender } = render(<PrivateSessionChip />);
    const chip = () => document.querySelector('[data-slot="private-session-chip"]')!;
    expect(chip().textContent).toBe("Private session");
    rerender(<PrivateSessionChip state="exiting" />);
    expect(chip().textContent).toBe("Ending private session");
    rerender(<PrivateSessionChip state="unavailable" />);
    expect(chip().textContent).toBe("Private session unavailable");
    expect(chip().getAttribute("data-state")).toBe("unavailable");
  });

  it("is inert text without onClick and a button with it", () => {
    const onClick = vi.fn();
    const { rerender } = render(<PrivateSessionChip />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<PrivateSessionChip onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Private session" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("passes className through and has no dismiss control", () => {
    render(<PrivateSessionChip className="test-class" />);
    expect(document.querySelector('[data-slot="private-session-chip"]')!.className).toContain("test-class");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
