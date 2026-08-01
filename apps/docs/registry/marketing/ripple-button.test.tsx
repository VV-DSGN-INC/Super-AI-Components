import * as React from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RippleButton } from "./ripple-button";

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

describe("RippleButton", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("spawns a ripple at the click point and removes it after its lifetime", () => {
    stubReducedMotion(false);
    render(<RippleButton>Go</RippleButton>);
    const button = screen.getByRole("button", { name: "Go" });
    fireEvent.click(button, { clientX: 10, clientY: 10 });
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(1);
    // The removal fires from a plain setTimeout callback (not a React event), so
    // React schedules it via its normal automatic-batching path — act() is needed
    // to flush that update synchronously under fake timers before we re-query.
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(0);
  });

  it("does not spawn ripples under prefers-reduced-motion but still fires onClick", () => {
    stubReducedMotion(true);
    const onClick = vi.fn();
    render(<RippleButton onClick={onClick}>Go</RippleButton>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(0);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("exposes the data-slot contract and merges className", () => {
    stubReducedMotion(false);
    render(<RippleButton className="w-40">Go</RippleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "ripple-button");
    expect(button).toHaveAttribute("type", "button");
    expect(button.classList.contains("w-40")).toBe(true);
  });

  it("forwards ref to the button element", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLButtonElement>();
    render(<RippleButton ref={ref}>Go</RippleButton>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});
