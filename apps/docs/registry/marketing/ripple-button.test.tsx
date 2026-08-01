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
    // detail: 1 marks a real pointer click (jsdom defaults detail to 0, which the
    // component now reads as keyboard activation) so this exercises the
    // clientX/clientY ripple-placement math, not the keyboard-centering branch.
    fireEvent.click(button, { clientX: 10, clientY: 10, detail: 1 });
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(1);
    // The removal fires from a plain setTimeout callback (not a React event), so
    // React schedules it via its normal automatic-batching path — act() is needed
    // to flush that update synchronously under fake timers before we re-query.
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(button.querySelectorAll('[data-slot="ripple-button-ripple"]')).toHaveLength(0);
  });

  it("centers the ripple for keyboard activation and couples animation duration to the prop", () => {
    stubReducedMotion(false);
    render(<RippleButton rippleDuration={1500}>Go</RippleButton>);
    const button = screen.getByRole("button");
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    fireEvent.click(button, { detail: 0 });
    const keyboardRipple = button.querySelector<HTMLElement>('[data-slot="ripple-button-ripple"]')!;
    expect(keyboardRipple.style.left).toBe("0px");
    expect(keyboardRipple.style.top).toBe("-30px");
    expect(keyboardRipple.style.animationDuration).toBe("1500ms");
    fireEvent.click(button, { detail: 1, clientX: 20, clientY: 15 });
    const ripples = button.querySelectorAll<HTMLElement>('[data-slot="ripple-button-ripple"]');
    expect(ripples[1].style.left).toBe("-30px");
    expect(ripples[1].style.top).toBe("-35px");
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
