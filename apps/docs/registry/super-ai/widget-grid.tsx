import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Widget Grid — The container-query grid that places a widget family two or four columns wide.
 *
 * Spec: docs/design-system/component-specs.md#r2-widget-grid
 * States: two-column · four-column · mixed-sizes
 */

/**
 * The width of the grid's own container, in rem, at which it switches from two
 * columns to four.
 *
 * A literal on purpose: it is the size model's contract (a large tile is two
 * columns wide, so four columns need room for two of them side by side), not a
 * design value that a token could carry. It was measured once and callers and
 * tests read this one source. Tailwind has to see the class text, so the same
 * number is written out in `FOUR_COLUMN_QUERY` below; a test fails if the two
 * drift.
 */
export const FOUR_COLUMN_MIN_REM = 43.5;

type WidgetGridItemSize = "small" | "medium" | "large";

/**
 * Column count, gap and row height are all defined here, once, as custom
 * properties on the grid. The gap is Tailwind's spacing scale (`--spacing`,
 * 0.25rem) times 3, the same value as `gap-3`. The row height subtracts that
 * very `--wg-gap` from the container width, so changing the gap moves the rows
 * with it and a tile cannot go out of square.
 *
 * `100cqw` is the width of the nearest `@container`, which is the wrapper
 * `WidgetGrid` renders. A container query resolves against an ancestor, never
 * against the element that establishes the container, which is why the wrapper
 * and the grid are two elements.
 */
const FOUR_COLUMN_QUERY = "@[43.5rem]:[--wg-cols:4]";
const GRID_CLASSES = [
  "grid",
  "[--wg-cols:2]",
  FOUR_COLUMN_QUERY,
  "[--wg-gap:--spacing(3)]",
  "gap-(--wg-gap)",
  "grid-cols-[repeat(var(--wg-cols),minmax(0,1fr))]",
  "auto-rows-[calc((100cqw-(var(--wg-cols)-1)*var(--wg-gap))/var(--wg-cols))]",
].join(" ");

const SIZE_CLASSES: Record<WidgetGridItemSize, string> = {
  small: "col-span-1 row-span-1",
  medium: "col-span-2 row-span-1",
  large: "col-span-2 row-span-2",
};

/**
 * `className` and the rest of the props go to the grid element, not the
 * wrapper. Keep horizontal padding and margin off the grid: the row height is
 * derived from the container's width, so anything that narrows the grid inside
 * it makes the tiles slightly taller than wide. Pad the parent instead.
 */
function WidgetGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="@container">
      <div data-slot="widget-grid" className={cn(GRID_CLASSES, className)} {...props} />
    </div>
  );
}

interface WidgetGridItemProps extends React.ComponentProps<"div"> {
  /** small is 1 column by 1 row, medium 2 by 1, large 2 by 2. */
  size: WidgetGridItemSize;
}

function WidgetGridItem({ size, className, ...props }: WidgetGridItemProps) {
  return (
    <div
      data-slot="widget-grid-item"
      data-size={size}
      className={cn("grid min-h-0 min-w-0 *:min-h-0 *:min-w-0", SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}

export { WidgetGrid, WidgetGridItem };
export type { WidgetGridItemProps, WidgetGridItemSize };
