import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeStatusBadge, statusRingClass } from "./node-status";

describe("node-status", () => {
  it("announces status politely", () => {
    render(<NodeStatusBadge status="streaming" />);
    const badge = screen.getByText("Running");
    expect(badge.closest("[data-slot=node-status]")).toHaveAttribute("aria-live", "polite");
  });
  it("maps statuses to ring classes; idle gets none", () => {
    expect(statusRingClass("idle")).toBe("");
    expect(statusRingClass("streaming")).toContain("ring-2");
    expect(statusRingClass("failed")).toContain("ring-2");
  });
  it("locked renders lock label", () => {
    render(<NodeStatusBadge status="locked" />);
    expect(screen.getByText("Upgrade to run")).toBeInTheDocument();
  });
  it("compact renders the label visually hidden (sr-only) with title tooltip on wrapper", () => {
    render(<NodeStatusBadge status="locked" compact />);
    // Label text must still exist in the DOM for screen-reader announcement
    const label = screen.getByText("Upgrade to run");
    expect(label).toBeInTheDocument();
    // But it must be visually hidden via sr-only
    expect(label).toHaveClass("sr-only");
    // The wrapper carries the title for sighted hover
    expect(screen.getByTitle("Upgrade to run")).toHaveAttribute("data-slot", "node-status");
  });
});
