import * as React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BorderBeam } from "./border-beam";

describe("BorderBeam", () => {
  it("renders an aria-hidden beam with the data-slot contract", () => {
    const { container } = render(<BorderBeam />);
    const beam = container.querySelector('[data-slot="border-beam"]')!;
    expect(beam).toHaveAttribute("aria-hidden", "true");
    expect(beam.classList.contains("marketing-border-beam")).toBe(true);
  });
  it("exposes size, timing, and radius knobs", () => {
    const { container } = render(<BorderBeam size={96} duration={10} delay={2} borderRadius={16} />);
    const beam = container.querySelector<HTMLElement>('[data-slot="border-beam"]')!;
    expect(beam.style.width).toBe("96px");
    expect(beam.style.getPropertyValue("--marketing-beam-duration")).toBe("10");
    expect(beam.style.getPropertyValue("--marketing-beam-delay")).toBe("2");
    expect(beam.style.getPropertyValue("--marketing-beam-radius")).toBe("16px");
  });
  it("merges className", () => {
    const { container } = render(<BorderBeam className="opacity-80" />);
    const beam = container.querySelector('[data-slot="border-beam"]')!;
    expect(beam.classList.contains("opacity-80")).toBe(true);
  });
  it("forwards ref to the beam element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<BorderBeam ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("border-beam");
  });
});
