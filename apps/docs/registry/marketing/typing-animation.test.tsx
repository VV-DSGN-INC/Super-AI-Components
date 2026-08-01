import { render } from "@testing-library/react";
import * as React from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TypingAnimation } from "./typing-animation";

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

describe("TypingAnimation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  const visibleText = (container: HTMLElement) =>
    container.querySelector('[data-slot="typing-animation-visible"]')!.textContent;

  it("types the text character by character", () => {
    stubReducedMotion(false);
    const { container } = render(<TypingAnimation duration={50}>Ship</TypingAnimation>);
    expect(visibleText(container)).toBe("");
    act(() => vi.advanceTimersByTime(100));
    expect(visibleText(container)).toBe("Sh");
    act(() => vi.advanceTimersByTime(100));
    expect(visibleText(container)).toBe("Ship");
  });

  it("exposes the full text to assistive tech from the start", () => {
    stubReducedMotion(false);
    const { container } = render(<TypingAnimation>Ship faster</TypingAnimation>);
    const root = container.querySelector('[data-slot="typing-animation"]')!;
    expect(root).toHaveAttribute("aria-label", "Ship faster");
  });

  it("renders the full text instantly under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    const { container } = render(<TypingAnimation>Ship faster</TypingAnimation>);
    expect(visibleText(container)).toBe("Ship faster");
  });

  it("shows the caret only while typing", () => {
    stubReducedMotion(false);
    const { container } = render(
      <TypingAnimation duration={50} showCursor>
        Hi
      </TypingAnimation>,
    );
    expect(container.querySelector('[data-slot="typing-animation-cursor"]')).not.toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(container.querySelector('[data-slot="typing-animation-cursor"]')).toBeNull();
  });

  it("forwards ref to the root span", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLSpanElement>();
    render(<TypingAnimation ref={ref}>Hi</TypingAnimation>);
    expect(ref.current?.getAttribute("data-slot")).toBe("typing-animation");
  });
});
