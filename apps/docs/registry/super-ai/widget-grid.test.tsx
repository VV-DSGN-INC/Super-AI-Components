import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FOUR_COLUMN_MIN_REM, WidgetGrid, WidgetGridItem } from "./widget-grid";

function Tile({ title }: { title: string }) {
  return <div className="rounded-lg border p-3">{title}</div>;
}

function grid() {
  return document.querySelector<HTMLElement>('[data-slot="widget-grid"]')!;
}

describe("WidgetGrid", () => {
  it("renders the two-column state: a grid of small tiles inside a container wrapper", () => {
    render(
      <WidgetGrid>
        <WidgetGridItem size="small">
          <Tile title="Credits left" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Failed overnight" />
        </WidgetGridItem>
      </WidgetGrid>,
    );
    const el = grid();
    // The grid is not the query container itself: a container query never
    // resolves against the element that establishes it, so a wrapper holds it.
    expect(el.parentElement).not.toBeNull();
    expect(el.parentElement).not.toBe(document.body);
    expect(el.parentElement!.children).toHaveLength(1);
    expect(el.querySelectorAll('[data-slot="widget-grid-item"]')).toHaveLength(2);
    expect(screen.getByText("Credits left")).toBeInTheDocument();
  });

  it("renders the four-column state: items keep DOM order and carry their size", () => {
    render(
      <WidgetGrid>
        {["Credits left", "Failed overnight", "Running now", "Queue"].map((title) => (
          <WidgetGridItem key={title} size="small">
            <Tile title={title} />
          </WidgetGridItem>
        ))}
      </WidgetGrid>,
    );
    const items = Array.from(grid().querySelectorAll('[data-slot="widget-grid-item"]'));
    expect(items.map((i) => i.textContent)).toEqual([
      "Credits left",
      "Failed overnight",
      "Running now",
      "Queue",
    ]);
    expect(items.every((i) => i.getAttribute("data-size") === "small")).toBe(true);
  });

  it("renders the mixed-sizes state: each size is reported on its item", () => {
    render(
      <WidgetGrid>
        <WidgetGridItem size="large">
          <Tile title="Running now" />
        </WidgetGridItem>
        <WidgetGridItem size="medium">
          <Tile title="Queue" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Credits left" />
        </WidgetGridItem>
      </WidgetGrid>,
    );
    const sizes = Array.from(grid().querySelectorAll('[data-slot="widget-grid-item"]')).map((i) =>
      i.getAttribute("data-size"),
    );
    expect(sizes).toEqual(["large", "medium", "small"]);
  });

  it("gives each size a different span, so the three are distinguishable on the element", () => {
    render(
      <WidgetGrid>
        <WidgetGridItem size="small" data-testid="s" />
        <WidgetGridItem size="medium" data-testid="m" />
        <WidgetGridItem size="large" data-testid="l" />
      </WidgetGrid>,
    );
    const classes = ["s", "m", "l"].map((id) => screen.getByTestId(id).className);
    expect(new Set(classes).size).toBe(3);
  });

  it("uses plain divs with no list or grid semantics", () => {
    render(
      <WidgetGrid>
        <WidgetGridItem size="small">
          <Tile title="Queue" />
        </WidgetGridItem>
      </WidgetGrid>,
    );
    expect(grid().tagName).toBe("DIV");
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(grid().getAttribute("role")).toBeNull();
  });

  it("lets the caller name the region", () => {
    render(<WidgetGrid role="region" aria-label="Overnight runs" />);
    expect(screen.getByRole("region", { name: "Overnight runs" })).toBe(grid());
  });

  it("exports the four-column threshold as 43.5rem and keeps the class literal in step with it", () => {
    expect(FOUR_COLUMN_MIN_REM).toBe(43.5);
    // Tailwind reads class text statically, so the number cannot be
    // interpolated. This pins the literal in the source to the export.
    const source = readFileSync(join(__dirname, "widget-grid.tsx"), "utf8");
    expect(source).toContain(`@[${FOUR_COLUMN_MIN_REM}rem]:`);
  });

  it("passes className through to the grid and to an item", () => {
    render(
      <WidgetGrid className="test-class">
        <WidgetGridItem size="small" className="item-class" />
      </WidgetGrid>,
    );
    expect(grid().className).toContain("test-class");
    expect(document.querySelector('[data-slot="widget-grid-item"]')!.className).toContain("item-class");
  });
});
