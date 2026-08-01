import * as React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrbitingCircles } from "./orbiting-circles";

describe("OrbitingCircles", () => {
  it("distributes children evenly around the orbit", () => {
    const { container } = render(
      <OrbitingCircles>
        <i>a</i>
        <i>b</i>
        <i>c</i>
      </OrbitingCircles>,
    );
    const items = container.querySelectorAll<HTMLElement>('[data-slot="orbiting-circles-item"]');
    expect(items).toHaveLength(3);
    expect(items[0].style.getPropertyValue("--marketing-orbit-angle")).toBe("0");
    expect(items[1].style.getPropertyValue("--marketing-orbit-angle")).toBe("120");
    expect(items[2].style.getPropertyValue("--marketing-orbit-angle")).toBe("240");
  });
  it("exposes radius/duration knobs and the path ring toggle", () => {
    const { container } = render(
      <OrbitingCircles radius={100} duration={30} path={false}>
        <i>a</i>
      </OrbitingCircles>,
    );
    const root = container.querySelector<HTMLElement>('[data-slot="orbiting-circles"]')!;
    expect(root.style.getPropertyValue("--marketing-orbit-radius")).toBe("100");
    expect(root.style.getPropertyValue("--marketing-orbit-duration")).toBe("30");
    expect(container.querySelector('[data-slot="orbiting-circles-path"]')).toBeNull();
  });
  it("marks reversed orbits on each item", () => {
    const { container } = render(
      <OrbitingCircles reverse>
        <i>a</i>
      </OrbitingCircles>,
    );
    const item = container.querySelector('[data-slot="orbiting-circles-item"]')!;
    expect(item).toHaveAttribute("data-reverse", "true");
  });
  it("forwards ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <OrbitingCircles ref={ref}>
        <i>a</i>
      </OrbitingCircles>,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("orbiting-circles");
  });
});
