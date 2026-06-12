import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlanStep } from "./agent-types";
import { PlanApproval } from "./plan-approval";

const steps: PlanStep[] = [
  { id: "s1", title: "Search the web", status: "pending" },
  { id: "s2", title: "Email the report to the team", status: "pending" },
  { id: "s3", title: "Archive sources", status: "pending" },
];

describe("PlanApproval", () => {
  it("approves with the current (edited) step list", async () => {
    const onApprove = vi.fn();
    render(<PlanApproval steps={steps} onApprove={onApprove} onReject={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Email the report to the team" }));
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprove).toHaveBeenCalledWith([
      expect.objectContaining({ id: "s1" }),
      expect.objectContaining({ id: "s3" }),
    ]);
  });

  it("reorders a step downward", async () => {
    const onApprove = vi.fn();
    render(<PlanApproval steps={steps} onApprove={onApprove} onReject={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Move Search the web down" }));
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprove.mock.calls[0][0].map((s: PlanStep) => s.id)).toEqual(["s2", "s1", "s3"]);
  });

  it("requires a reason to reject, then fires onReject with it", async () => {
    const onReject = vi.fn();
    render(<PlanApproval steps={steps} onApprove={vi.fn()} onReject={onReject} />);
    await userEvent.click(screen.getByRole("button", { name: "Reject plan" }));
    const reason = screen.getByRole("textbox", { name: "Rejection reason" });
    const confirm = screen.getByRole("button", { name: "Confirm rejection" });
    expect(confirm).toBeDisabled();
    await userEvent.type(reason, "Do not email externally");
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onReject).toHaveBeenCalledWith("Do not email externally");
  });
});
