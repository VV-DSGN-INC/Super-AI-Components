import * as React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotPattern } from "./dot-pattern";

describe("DotPattern", () => {
  it("renders an aria-hidden svg with the data-slot contract", () => {
    const { container } = render(<DotPattern />);
    const svg = container.querySelector('[data-slot="dot-pattern"]');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
  it("applies pattern geometry from props", () => {
    const { container } = render(<DotPattern size={24} radius={2} />);
    expect(container.querySelector("pattern")).toHaveAttribute("width", "24");
    expect(container.querySelector("circle")).toHaveAttribute("r", "2");
  });
  it("merges className and toggles the fade mask class", () => {
    const { container } = render(<DotPattern fade className="opacity-50" />);
    const svg = container.querySelector('[data-slot="dot-pattern"]')!;
    expect(svg.classList.contains("marketing-dot-fade")).toBe(true);
    expect(svg.classList.contains("opacity-50")).toBe(true);
  });
  it("links the rect fill to the generated pattern id, uniquely per instance", () => {
    const { container } = render(
      <>
        <DotPattern />
        <DotPattern />
      </>,
    );
    const patterns = [...container.querySelectorAll("pattern")];
    const rects = [...container.querySelectorAll("rect")];
    expect(patterns).toHaveLength(2);
    expect(new Set(patterns.map((p) => p.id)).size).toBe(2);
    rects.forEach((rect, i) => {
      expect(rect.getAttribute("fill")).toBe(`url(#${patterns[i].id})`);
    });
  });
  it("forwards ref to the svg element", () => {
    const ref = React.createRef<SVGSVGElement>();
    render(<DotPattern ref={ref} />);
    expect(ref.current?.tagName).toBe("svg");
  });
});
