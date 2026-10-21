import * as React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BentoCard, BentoGrid } from "./bento-grid";

describe("BentoGrid", () => {
  it("renders a grid with the data-slot contract and merged className", () => {
    const { container } = render(
      <BentoGrid className="grid-cols-2">
        <div>child</div>
      </BentoGrid>,
    );
    const grid = container.querySelector('[data-slot="bento-grid"]')!;
    expect(grid.classList.contains("grid")).toBe(true);
    expect(grid.classList.contains("grid-cols-2")).toBe(true);
  });
  it("is one column on a phone, two from sm and three from lg", () => {
    const { container } = render(<BentoGrid />);
    const grid = container.querySelector('[data-slot="bento-grid"]')!;
    for (const cls of ["grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3"]) {
      expect(grid.classList.contains(cls), cls).toBe(true);
    }
    expect(grid.classList.contains("grid-cols-3")).toBe(false);
  });
});

describe("BentoCard", () => {
  it("renders name, description, CTA link, and optional background", () => {
    render(
      <BentoCard
        name="Realtime sync"
        description="Every device, same state."
        cta="See how"
        href="/sync"
        background={<div data-testid="bg" />}
      />,
    );
    expect(screen.getByText("Realtime sync")).toBeInTheDocument();
    expect(screen.getByText("Every device, same state.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /See how/ });
    expect(link).toHaveAttribute("href", "/sync");
    expect(screen.getByTestId("bg")).toBeInTheDocument();
  });
  it("exposes the card slot and renders an icon node when given", () => {
    const { container } = render(<BentoCard name="X" description="Y" icon={<svg data-testid="icon" />} />);
    expect(container.querySelector('[data-slot="bento-card"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="bento-card-icon"]')).not.toBeNull();
  });
  it("reveals the CTA on keyboard focus and on a touch screen, not just hover", () => {
    const { container } = render(<BentoCard name="X" description="Y" href="/x" cta="Read the X guide" />);
    const cta = container.querySelector('[data-slot="bento-card-cta"]')!;
    expect(cta.className).toContain("group-focus-within:opacity-100");
    expect(cta.className).toContain("group-focus-within:translate-y-0");
    // No hover on a coarse pointer, so a hover-only reveal would hide the link.
    expect(cta.className).toContain("pointer-coarse:opacity-100");
  });
  it("renders no link at all without an href — never a generic label pointing at #", () => {
    const { container } = render(<BentoCard name="X" description="Y" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector('[data-slot="bento-card-cta"]')).toBeNull();
    expect(container.textContent).not.toContain("Learn more");
  });
  it("gives the link a visible focus treatment", () => {
    render(<BentoCard name="X" description="Y" href="/x" cta="Read the X guide" />);
    expect(screen.getByRole("link", { name: /Read the X guide/ }).className).toContain(
      "focus-visible:ring-2",
    );
  });
});

describe("ref forwarding", () => {
  it("forwards ref to the grid and card roots", () => {
    const gridRef = React.createRef<HTMLDivElement>();
    const cardRef = React.createRef<HTMLDivElement>();
    render(
      <BentoGrid ref={gridRef}>
        <BentoCard ref={cardRef} name="X" description="Y" />
      </BentoGrid>,
    );
    expect(gridRef.current?.getAttribute("data-slot")).toBe("bento-grid");
    expect(cardRef.current?.getAttribute("data-slot")).toBe("bento-card");
  });
});
