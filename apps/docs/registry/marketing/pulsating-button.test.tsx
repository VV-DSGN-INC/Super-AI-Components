import * as React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PulsatingButton } from "./pulsating-button";

describe("PulsatingButton", () => {
  it("renders children in a button with the data-slot contract", () => {
    render(<PulsatingButton>Claim access</PulsatingButton>);
    const button = screen.getByRole("button", { name: "Claim access" });
    expect(button).toHaveAttribute("data-slot", "pulsating-button");
  });
  it("renders an aria-hidden halo and exposes the duration knob", () => {
    render(<PulsatingButton duration={2}>Go</PulsatingButton>);
    const button = screen.getByRole("button");
    const halo = button.querySelector('[data-slot="pulsating-button-halo"]')!;
    expect(halo).toHaveAttribute("aria-hidden", "true");
    expect(button.style.getPropertyValue("--marketing-pulse-duration")).toBe("2");
  });
  it("merges className and forwards onClick", () => {
    const onClick = vi.fn();
    render(
      <PulsatingButton className="w-full" onClick={onClick}>
        Go
      </PulsatingButton>,
    );
    const button = screen.getByRole("button");
    expect(button.classList.contains("w-full")).toBe(true);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("forwards ref to the button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<PulsatingButton ref={ref}>Go</PulsatingButton>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
  it("keeps children above the halo (visible-output invariant)", () => {
    render(<PulsatingButton>Go</PulsatingButton>);
    const button = screen.getByRole("button");
    const halo = button.querySelector('[data-slot="pulsating-button-halo"]')!;
    expect(halo.classList.contains("marketing-pulse-halo")).toBe(true);
    const label = screen.getByText("Go");
    expect(label.classList.contains("z-10")).toBe(true);
  });
});
