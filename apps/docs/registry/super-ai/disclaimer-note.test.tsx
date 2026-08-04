import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DisclaimerNote } from "./disclaimer-note";

describe("DisclaimerNote", () => {
  it("renders the under-composer state", () => {
    render(<DisclaimerNote variant="under-composer" />);
    const root = document.querySelector('[data-slot="disclaimer-note"]')!;
    expect(root).toHaveAttribute("data-variant", "under-composer");
    expect(root.className).toContain("text-center");
    expect(screen.getByText("AI can make mistakes. Check important info.")).toBeInTheDocument();
  });

  it("renders the in-card state", () => {
    render(<DisclaimerNote variant="in-card" />);
    const root = document.querySelector('[data-slot="disclaimer-note"]')!;
    expect(root).toHaveAttribute("data-variant", "in-card");
    // Separated from the card content above it with a rule, not a tinted background.
    expect(root.className).toContain("border-t");
  });

  it("renders the inline state", () => {
    render(<DisclaimerNote variant="inline" />);
    const root = document.querySelector('[data-slot="disclaimer-note"]')!;
    expect(root).toHaveAttribute("data-variant", "inline");
    expect(root.className).toContain("inline-flex");
  });

  it("passes className through", () => {
    render(<DisclaimerNote className="test-class" />);
    expect(document.querySelector('[data-slot="disclaimer-note"]')!.className).toContain("test-class");
  });

  it("is never dismissible — there is no close control in the DOM", () => {
    render(<DisclaimerNote />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("accepts custom copy in place of the default message", () => {
    render(<DisclaimerNote>Custom disclaimer copy.</DisclaimerNote>);
    expect(screen.getByText("Custom disclaimer copy.")).toBeInTheDocument();
    expect(screen.queryByText("AI can make mistakes. Check important info.")).not.toBeInTheDocument();
  });

  it("renders an accessible, named link when one is provided", () => {
    render(<DisclaimerNote link={{ label: "Learn how AI features work", href: "/ai-disclosure" }} />);
    const link = screen.getByRole("link", { name: "Learn how AI features work" });
    expect(link).toHaveAttribute("href", "/ai-disclosure");
  });
});
