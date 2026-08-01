import * as React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import confetti from "canvas-confetti";
import { ConfettiButton } from "./confetti";

const confettiMock = vi.mocked(confetti);

const originalMatchMedia = window.matchMedia;
function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  confettiMock.mockClear();
});

describe("ConfettiButton", () => {
  it("fires confetti from the button position on click", () => {
    stubReducedMotion(false);
    render(<ConfettiButton>Ship it</ConfettiButton>);
    fireEvent.click(screen.getByRole("button", { name: "Ship it" }));
    expect(confettiMock).toHaveBeenCalledOnce();
    const options = confettiMock.mock.calls[0][0]!;
    expect(options.origin).toBeDefined();
  });
  it("no-ops under prefers-reduced-motion but still forwards onClick", () => {
    stubReducedMotion(true);
    const onClick = vi.fn();
    render(<ConfettiButton onClick={onClick}>Ship it</ConfettiButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(confettiMock).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("exposes the data-slot contract and merges className", () => {
    stubReducedMotion(false);
    render(<ConfettiButton className="w-40">Go</ConfettiButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "confetti-button");
    expect(button).toHaveAttribute("type", "button");
    expect(button.classList.contains("w-40")).toBe(true);
  });
  it("forwards ref to the button element", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLButtonElement>();
    render(<ConfettiButton ref={ref}>Go</ConfettiButton>);
    expect(ref.current?.getAttribute("data-slot")).toBe("confetti-button");
  });
});
