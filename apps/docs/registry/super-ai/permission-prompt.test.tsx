import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PermissionPrompt } from "./permission-prompt";

const ARGS = [
  { key: "to", value: "finance@acme.com" },
  { key: "subject", value: "Q3 invoice — agent-tools export" },
];

describe("PermissionPrompt", () => {
  it("renders the allow-once state — approves this call without persisting", async () => {
    const onAllowOnce = vi.fn();
    const onAlwaysAllow = vi.fn();
    const onDeny = vi.fn();
    const onEditFirst = vi.fn();
    render(
      <PermissionPrompt
        open
        action="Restart the dev server"
        reason="The config file changed and the running process is stale."
        onAllowOnce={onAllowOnce}
        onAlwaysAllow={onAlwaysAllow}
        onDeny={onDeny}
        onEditFirst={onEditFirst}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Allow once" }));

    expect(onAllowOnce).toHaveBeenCalledTimes(1);
    // Isolated: approving once never fans out into a standing grant or a deny.
    expect(onAlwaysAllow).not.toHaveBeenCalled();
    expect(onDeny).not.toHaveBeenCalled();
    expect(onEditFirst).not.toHaveBeenCalled();
  });

  it("renders the always-allow state — emits the grant, builds no grant UI here", async () => {
    const onAlwaysAllow = vi.fn();
    render(
      <PermissionPrompt
        open
        action="Read ~/.ssh/config"
        onAllowOnce={() => {}}
        onAlwaysAllow={onAlwaysAllow}
        onDeny={() => {}}
        onEditFirst={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Always allow" }));

    expect(onAlwaysAllow).toHaveBeenCalledTimes(1);
    // The grant's review-and-revoke surface belongs to N9 autonomy-selector.
    // This component only emits the choice — it must never render a grant
    // list, a revoke control, or any other trace of standing permissions.
    expect(screen.queryByText(/revoke/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the deny state — safe to press, closes without rerouting", async () => {
    const onDeny = vi.fn();
    const onAllowOnce = vi.fn();
    render(
      <PermissionPrompt
        defaultOpen
        action="Send email to finance@acme.com"
        onAllowOnce={onAllowOnce}
        onAlwaysAllow={() => {}}
        onDeny={onDeny}
        onEditFirst={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Deny" }));

    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onAllowOnce).not.toHaveBeenCalled();
    // Deny is the dialog's own close path — nothing silently reroutes the
    // agent around the refusal, the surface simply ends.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the edit-first state — hands the call back with edited arguments, not a fresh one", async () => {
    const onEditFirst = vi.fn();
    const onAllowOnce = vi.fn();
    render(
      <PermissionPrompt
        open
        action="Send email"
        args={ARGS}
        onAllowOnce={onAllowOnce}
        onAlwaysAllow={() => {}}
        onDeny={() => {}}
        onEditFirst={onEditFirst}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit first" }));

    // This is an editing surface now, not a second decision layered on top
    // of the first — the four verbs step aside rather than stacking.
    expect(screen.queryByRole("button", { name: "Allow once" })).not.toBeInTheDocument();

    const subjectField = screen.getByLabelText("subject");
    await userEvent.clear(subjectField);
    await userEvent.type(subjectField, "Q3 invoice — final");
    await userEvent.click(screen.getByRole("button", { name: "Approve edited" }));

    expect(onEditFirst).toHaveBeenCalledWith({
      to: "finance@acme.com",
      subject: "Q3 invoice — final",
    });
    expect(onAllowOnce).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions
  // ---------------------------------------------------------------------------

  it("gives edit-first the same visual weight as allow — not a subordinate control", () => {
    render(
      <PermissionPrompt
        open
        action="Delete branch main"
        onAllowOnce={() => {}}
        onAlwaysAllow={() => {}}
        onDeny={() => {}}
        onEditFirst={() => {}}
      />,
    );
    const allowOnce = screen.getByRole("button", { name: "Allow once" });
    const editFirst = screen.getByRole("button", { name: "Edit first" });

    // Same rendered weight: identical variant/size classes, not a ghost or
    // link style tucked in beside two solid buttons. This must be able to
    // fail — an unequal variant/size on either button changes this string.
    expect(editFirst.className).toBe(allowOnce.className);

    // Directly reachable, not tucked into a menu or collapsed control, and a
    // sibling of Allow once in the same actions group rather than nested
    // deeper (e.g. inside a popup/menu content wrapper).
    expect(editFirst.tagName).toBe("BUTTON");
    expect(editFirst.closest('[role="menu"]')).toBeNull();
    expect(editFirst.parentElement).toBe(allowOnce.parentElement);
  });

  it("truncates arguments behind an explicit expand", async () => {
    render(<PermissionPrompt open action="Write to ~/.bashrc" args={ARGS} />);

    // Absent, not merely clipped — a screen reader cannot read what a
    // sighted user has not been shown either.
    expect(screen.queryByText(/finance@acme\.com/)).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /show.*arguments/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(screen.getByText(/finance@acme\.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide arguments/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("passes className through", () => {
    render(<PermissionPrompt open action="X" className="test-class" />);
    expect(document.querySelector('[data-slot="permission-prompt"]')!.className).toContain("test-class");
  });
});
