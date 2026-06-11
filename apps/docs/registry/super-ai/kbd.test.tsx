import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "./kbd";

describe("Kbd", () => {
  it("renders a semantic <kbd> with content and custom class", () => {
    render(<Kbd className="extra">⌘</Kbd>);
    const el = screen.getByText("⌘");
    expect(el.tagName).toBe("KBD");
    expect(el).toHaveClass("extra");
  });
  it("KbdGroup renders children in order", () => {
    render(
      <KbdGroup data-testid="g">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByTestId("g").textContent).toBe("⌘K");
  });
});
