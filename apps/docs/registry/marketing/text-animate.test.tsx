import * as React from "react";

import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TextAnimate } from "./text-animate";

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
});

describe("TextAnimate", () => {
  it("splits into word segments hidden from assistive tech, labeled on the root", () => {
    stubReducedMotion(false);
    const { container } = render(<TextAnimate by="word">Ship it now</TextAnimate>);
    const root = container.querySelector('[data-slot="text-animate"]')!;
    const segments = container.querySelectorAll('[data-slot="text-animate-segment"]');
    expect(segments).toHaveLength(5); // words + whitespace segments
    segments.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
    const srText = root.querySelector(".sr-only")!;
    expect(srText.textContent).toBe("Ship it now");
    expect(srText).not.toHaveAttribute("aria-hidden");
    const segmentText = [...segments].map((s) => s.textContent).join("");
    expect(segmentText).toBe("Ship it now");
  });
  it("splits by character when asked", () => {
    stubReducedMotion(false);
    const { container } = render(<TextAnimate by="character">Hey</TextAnimate>);
    expect(container.querySelectorAll('[data-slot="text-animate-segment"]')).toHaveLength(3);
  });
  it("renders a plain span with full text under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    const { container } = render(<TextAnimate>Ship it now</TextAnimate>);
    const root = container.querySelector('[data-slot="text-animate"]')!;
    expect(root.textContent).toBe("Ship it now");
    expect(container.querySelectorAll('[data-slot="text-animate-segment"]')).toHaveLength(0);
  });
  it("forwards ref to the motion root", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLSpanElement>();
    render(<TextAnimate ref={ref}>Hey</TextAnimate>);
    expect(ref.current?.getAttribute("data-slot")).toBe("text-animate");
  });
  it("keeps whitespace segments inline so newlines can break lines", () => {
    stubReducedMotion(false);
    const { container } = render(<TextAnimate by="word">{"a\nb"}</TextAnimate>);
    const segments = container.querySelectorAll('[data-slot="text-animate-segment"]');
    expect(segments).toHaveLength(3);
    expect(segments[0].classList.contains("inline-block")).toBe(true);
    expect(segments[1].classList.contains("inline-block")).toBe(false);
    expect(segments[1].classList.contains("whitespace-pre")).toBe(true);
  });
});
