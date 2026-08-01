import { render, screen } from "@testing-library/react";
import * as React from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedSpan, Terminal, TerminalTyping } from "./terminal";

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

describe("Terminal", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders window chrome with title and children in a pre block", () => {
    stubReducedMotion(false);
    const { container } = render(
      <Terminal title="zsh">
        <AnimatedSpan>$ pnpm dev</AnimatedSpan>
      </Terminal>,
    );
    expect(screen.getByText("zsh")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="terminal-body"]')?.tagName).toBe("PRE");
    expect(screen.getByText("$ pnpm dev")).toBeInTheDocument();
  });

  it("forwards ref to the terminal root", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Terminal ref={ref}>
        <AnimatedSpan>ok</AnimatedSpan>
      </Terminal>,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("terminal");
  });

  it("skips the entrance animation for AnimatedSpan under reduced motion", () => {
    stubReducedMotion(true);
    render(<AnimatedSpan delay={500}>line</AnimatedSpan>);
    const line = screen.getByText("line");
    expect(line.getAttribute("data-slot")).toBe("terminal-line");
    expect(line.style.opacity).not.toBe("0");
  });

  describe("TerminalTyping", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      vi.useRealTimers();
      window.matchMedia = originalMatchMedia;
    });

    it("types its line over time and instantly under reduced motion", () => {
      stubReducedMotion(false);
      const { container, unmount } = render(<TerminalTyping duration={50}>$ npx create</TerminalTyping>);
      const visible = () => container.querySelector('[data-slot="terminal-typing-visible"]')!.textContent;
      expect(visible()).toBe("");
      expect(container.querySelector('[data-slot="terminal-typing"] .sr-only')!.textContent).toBe(
        "$ npx create",
      );
      act(() => vi.advanceTimersByTime(50 * 12 + 50));
      expect(visible()).toBe("$ npx create");
      unmount();

      stubReducedMotion(true);
      const { container: c2 } = render(<TerminalTyping>$ done</TerminalTyping>);
      expect(c2.querySelector('[data-slot="terminal-typing-visible"]')!.textContent).toBe("$ done");
    });
  });
});
