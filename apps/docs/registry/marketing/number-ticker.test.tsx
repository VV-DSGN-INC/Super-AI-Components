import * as React from "react";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NumberTicker } from "./number-ticker";

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

describe("NumberTicker", () => {
  it("renders the formatted start value with the data-slot contract", () => {
    stubReducedMotion(false);
    render(<NumberTicker value={500} startValue={100} />);
    const el = screen.getByText("100");
    expect(el).toHaveAttribute("data-slot", "number-ticker");
    expect(el.classList.contains("tabular-nums")).toBe(true);
  });
  it("renders the exact formatted final value under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    render(<NumberTicker value={1234.56} decimalPlaces={1} />);
    expect(screen.getByText("1,234.6")).toBeInTheDocument();
  });
  it("respects decimalPlaces in the initial render", () => {
    stubReducedMotion(false);
    render(<NumberTicker value={10} startValue={0} decimalPlaces={2} />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });
  it("forwards ref through to the span", () => {
    stubReducedMotion(false);
    const ref = React.createRef<HTMLSpanElement>();
    render(<NumberTicker ref={ref} value={5} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("number-ticker");
  });
});
