import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeStatusBadge, STATUS_LABEL, statusRingClass } from "@/registry/super-ai/node-status";
import { FLOW_STATUSES } from "@/registry/super-ai/flow-types";

describe("NodeStatusBadge", () => {
  it("renders every contract status with a label and a data-status attribute", () => {
    for (const status of FLOW_STATUSES) {
      const { unmount } = render(<NodeStatusBadge status={status} />);
      const badge = screen.getByText(STATUS_LABEL[status]).closest("[data-slot=node-status]");
      expect(badge).toHaveAttribute("data-status", status);
      unmount();
    }
  });
  it("announces status politely", () => {
    render(<NodeStatusBadge status="streaming" />);
    const badge = screen.getByText("Running");
    expect(badge.closest("[data-slot=node-status]")).toHaveAttribute("aria-live", "polite");
  });
  it("streaming renders a motion-safe spinner, every other status a dot", () => {
    const { rerender } = render(<NodeStatusBadge status="streaming" />);
    expect(document.querySelector("[data-slot=node-status-spinner]")).toHaveClass("motion-safe:animate-spin");
    rerender(<NodeStatusBadge status="done" />);
    expect(document.querySelector("[data-slot=node-status-spinner]")).toBeNull();
    expect(document.querySelector("[data-slot=node-status-dot]")).toBeInTheDocument();
  });
  it("maps statuses to ring classes; idle and done get none", () => {
    expect(statusRingClass("idle")).toBe("");
    expect(statusRingClass("done")).toBe("");
    expect(statusRingClass("streaming")).toContain("ring-2");
    expect(statusRingClass("failed")).toContain("ring-2");
  });
  it("locked renders the upgrade label", () => {
    render(<NodeStatusBadge status="locked" />);
    expect(screen.getByText("Upgrade to run")).toBeInTheDocument();
  });
  it("compact hides the label with sr-only and puts a title on the wrapper", () => {
    render(<NodeStatusBadge status="locked" compact />);
    const label = screen.getByText("Upgrade to run");
    expect(label).toHaveClass("sr-only");
    expect(screen.getByTitle("Upgrade to run")).toHaveAttribute("data-slot", "node-status");
  });
  it("passes className through", () => {
    render(<NodeStatusBadge status="idle" className="test-class" />);
    expect(document.querySelector('[data-slot="node-status"]')!.className).toContain("test-class");
  });
});
