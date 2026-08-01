import * as React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marquee } from "./marquee";

describe("Marquee", () => {
  it("duplicates content into aria-hidden clone tracks for the loop", () => {
    const { container } = render(
      <Marquee>
        <span>Acme</span>
      </Marquee>,
    );
    const tracks = container.querySelectorAll('[data-slot="marquee-track"]');
    expect(tracks).toHaveLength(4);
    expect(tracks[0]).not.toHaveAttribute("aria-hidden");
    [...tracks].slice(1).forEach((t) => expect(t).toHaveAttribute("aria-hidden", "true"));
  });
  it("reflects direction, reverse, and pause-on-hover in the DOM contract", () => {
    const { container } = render(
      <Marquee vertical reverse pauseOnHover repeat={2}>
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector('[data-slot="marquee"]')!;
    expect(root).toHaveAttribute("data-pause-on-hover", "true");
    const tracks = container.querySelectorAll('[data-slot="marquee-track"]');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toHaveAttribute("data-orientation", "vertical");
    expect(tracks[0]).toHaveAttribute("data-reverse", "true");
  });
  it("exposes duration and gap knobs as CSS custom properties", () => {
    const { container } = render(
      <Marquee duration={30} gap="2rem">
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector<HTMLElement>('[data-slot="marquee"]')!;
    expect(root.style.getPropertyValue("--marketing-marquee-duration")).toBe("30s");
    expect(root.style.getPropertyValue("--marketing-marquee-gap")).toBe("2rem");
  });
  it("forwards ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Marquee ref={ref}>
        <span>Acme</span>
      </Marquee>,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("marquee");
  });
});
