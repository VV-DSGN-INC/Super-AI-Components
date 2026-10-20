import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { WidgetGrid, WidgetGridItem } from "@/registry/super-ai/widget-grid";
import { WidgetGridDocs } from "@/content/components/widget-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof WidgetGrid> = {
  title: "Super AI/Widget Grid",
  component: WidgetGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WidgetGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof WidgetGrid>;

// Plain bordered divs stand in for tiles: this component does not depend on the widget component.
function Tile({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex flex-col gap-1 overflow-hidden rounded-lg border bg-card p-3 text-card-foreground">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{meta}</span>
    </div>
  );
}

const SMALL_TILES = [
  { title: "Credits left", meta: "1,240" },
  { title: "Failed overnight", meta: "2 runs" },
  { title: "Running now", meta: "3 runs" },
  { title: "Queue", meta: "5 waiting" },
];

function SmallTiles() {
  return (
    <>
      {SMALL_TILES.map((t) => (
        <WidgetGridItem key={t.title} size="small">
          <Tile {...t} />
        </WidgetGridItem>
      ))}
    </>
  );
}

function trackCount(el: Element) {
  return getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length;
}

/**
 * Below 43.5rem of the grid's own width: two columns. The 30rem frame is the
 * container, so this story would look the same in a 1200px window.
 */
export const TwoColumn: Story = {
  render: (args) => (
    <div data-testid="frame" className="w-[30rem] max-w-full">
      <WidgetGrid {...args} role="region" aria-label="Overnight runs">
        <SmallTiles />
      </WidgetGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole("region", { name: "Overnight runs" });
    // The track count is dictated by the component's own classes at a width the story sets (D21).
    await expect(trackCount(grid)).toBe(2);
  },
};

/** From 43.5rem of the grid's own width: four columns. The frame must be at least that wide. */
export const FourColumn: Story = {
  render: (args) => (
    <div data-testid="frame" className="w-[46rem]">
      <WidgetGrid {...args} role="region" aria-label="Overnight runs">
        <SmallTiles />
      </WidgetGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole("region", { name: "Overnight runs" });
    await expect(trackCount(grid)).toBe(4);
  },
};

/**
 * Small, medium and large in one grid. Tile order is DOM order; the grid does
 * not pack tiles to close gaps, so order them for the four-column case.
 */
export const MixedSizes: Story = {
  render: (args) => (
    <div data-testid="frame" className="w-[46rem]">
      <WidgetGrid {...args} role="region" aria-label="Overnight runs">
        <WidgetGridItem size="large">
          <Tile title="Running now" meta="3 runs" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Credits left" meta="1,240" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Failed overnight" meta="2 runs" />
        </WidgetGridItem>
        <WidgetGridItem size="medium">
          <Tile title="Queue" meta="5 waiting" />
        </WidgetGridItem>
      </WidgetGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = Array.from(canvasElement.querySelectorAll('[data-slot="widget-grid-item"]'));
    await expect(items.map((i) => i.getAttribute("data-size"))).toEqual([
      "large",
      "small",
      "small",
      "medium",
    ]);
    // Rows equal the column width: a small tile is square, a large one twice as wide and as tall.
    const small = items[1].getBoundingClientRect();
    const large = items[0].getBoundingClientRect();
    await expect(Math.abs(small.width - small.height)).toBeLessThan(1);
    await expect(Math.abs(large.width - large.height)).toBeLessThan(1);
  },
};

// Case stories.
// case-skip: RTL — columns and spans use logical grid flow only; grep -E "ml-|mr-|left|right|rtl" on widget-grid.tsx matches nothing
// case-skip: ReducedMotion — nothing animates; grep -E "animate|transition" on widget-grid.tsx matches nothing
// case-skip: KeyboardOrder — the grid renders plain divs and adds no focusable element or tab stop
// case-skip: Controlled — no value, selection or onChange API
// case-skip: EmptyLabel — no text slot; the grid renders only the children it is given
// case-skip: LongContent — no author-supplied text slot; tile content belongs to the caller
// case-skip: Boundary — no near-twin: recent-grid and artifact-grid lay out content cards, not fixed-size square tiles

/**
 * The 375px frame is the container, so unlike a media-query layout this one
 * genuinely moves: two columns, no horizontal scroll. The window stays
 * 1200px wide, which is exactly the point of a container query.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <WidgetGrid {...args} role="region" aria-label="Overnight runs">
        <SmallTiles />
      </WidgetGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("mobile-frame");
    const grid = within(frame).getByRole("region", { name: "Overnight runs" });
    await expect(trackCount(grid)).toBe(2);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
