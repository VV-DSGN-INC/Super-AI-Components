import * as React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RainbowButton } from "./rainbow-button";

describe("RainbowButton", () => {
  it("renders children with slot, default variant, and glow", () => {
    render(<RainbowButton>Get access</RainbowButton>);
    const button = screen.getByRole("button", { name: "Get access" });
    expect(button).toHaveAttribute("data-slot", "rainbow-button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("type", "button");
    const glow = button.parentElement!.querySelector('[data-slot="rainbow-button-glow"]')!;
    expect(glow).toHaveAttribute("aria-hidden", "true");
  });
  it("applies variant and size classes via cva", () => {
    render(
      <RainbowButton variant="outline" size="sm">
        Pricing
      </RainbowButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button.classList.contains("h-8")).toBe(true);
  });
  it("exposes the speed knob and merges className", () => {
    render(
      <RainbowButton speed="5s" className="uppercase">
        Go
      </RainbowButton>,
    );
    const button = screen.getByRole("button");
    expect(button.style.getPropertyValue("--marketing-rainbow-speed")).toBe("5s");
    expect(button.classList.contains("uppercase")).toBe(true);
  });
  it("forwards ref to the button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<RainbowButton ref={ref}>Go</RainbowButton>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
  it("suppresses the glow for disabled buttons via peer classes (visible-output invariant)", () => {
    render(<RainbowButton disabled>Go</RainbowButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.classList.contains("peer")).toBe(true);
    const glow = button.parentElement!.querySelector('[data-slot="rainbow-button-glow"]')!;
    expect(glow.classList.contains("peer-disabled:hidden")).toBe(true);
    expect(glow.classList.contains("-z-10")).toBe(true);
  });
});
