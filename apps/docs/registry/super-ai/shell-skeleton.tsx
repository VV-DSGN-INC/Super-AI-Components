import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shell skeletons: the parts a shell draws while `loading`.
 *
 * Contract: docs/design-system/block-build-brief.md, "Status and loading".
 *
 * Every part is built on the vendored `Skeleton` and adds three things the bare
 * primitive does not have:
 *
 * 1. It is hidden from assistive tech. A skeleton has nothing to say; the shell
 *    root's `aria-busy` and `ShellLoadingLabel` say it, once.
 * 2. It stills the pulse under reduced motion. `Skeleton` pulses with no
 *    reduced-motion branch of its own.
 * 3. It renders the same markup on the server and on the client. The vendored
 *    `SidebarMenuSkeleton` picks a random bar width in state, which differs
 *    between the two and fails hydration; rows here cycle through fixed widths
 *    at the same 32px row height instead.
 */

/** The pulse, stilled for anyone who asked for less motion. */
const STILL = "motion-reduce:animate-none";

/** Bar widths a column of rows cycles through, so it reads as text rather than as a barcode. */
const ROW_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6"] as const;

interface ShellSkeletonRegionProps extends React.ComponentProps<"div"> {
  /** The manifest region this skeleton stands in for, such as "topbar". */
  region: string;
}

/**
 * One region of a loading shell. It carries the region marker the contract gate
 * reads and the marker the loading twin measures, and it is hidden from
 * assistive tech. A caller can override none of the three.
 */
function ShellSkeletonRegion({ region, ...props }: ShellSkeletonRegionProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="shell-skeleton-region"
      data-region={region}
      data-loading-region={region}
    />
  );
}

/** One pulse block, sized by its classes. */
function ShellSkeletonBlock({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton {...props} aria-hidden="true" className={cn(STILL, className)} />;
}

interface ShellSkeletonCountProps {
  count?: number;
  className?: string;
}

/** Rows the height of a sidebar menu item: 32px, an icon and a bar. For rails, navs and lists. */
function ShellSkeletonRows({ count = 6, className }: ShellSkeletonCountProps) {
  return (
    <div data-slot="shell-skeleton-rows" className={cn("flex flex-col gap-1", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="shell-skeleton-row" className="flex h-8 items-center gap-2 px-2">
          <ShellSkeletonBlock className="size-4 shrink-0" />
          <ShellSkeletonBlock className={cn("h-4", ROW_WIDTHS[index % ROW_WIDTHS.length])} />
        </div>
      ))}
    </div>
  );
}

/** Lines of prose, 16px each, the last one short. */
function ShellSkeletonLines({ count = 3, className }: ShellSkeletonCountProps) {
  return (
    <div data-slot="shell-skeleton-lines" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ShellSkeletonBlock key={index} className={cn("h-4", index === count - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

interface ShellSkeletonTilesProps extends ShellSkeletonCountProps {
  /** Classes for every tile. The default is a 16:9 tile as wide as its column. */
  tileClassName?: string;
}

/** Tiles for a grid. Pass the loaded grid's own column classes as `className`. */
function ShellSkeletonTiles({ count = 6, className, tileClassName }: ShellSkeletonTilesProps) {
  return (
    <div data-slot="shell-skeleton-tiles" className={cn("grid gap-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ShellSkeletonBlock key={index} className={cn("aspect-video w-full rounded-lg", tileClassName)} />
      ))}
    </div>
  );
}

interface ShellSkeletonSidebarProps {
  /** The manifest region: "sidebar", or the docs shell's "icon-rail". */
  region: string;
  /** The sidebar provider's state. Read it with `useSidebar()` inside the provider. */
  collapsed?: boolean;
  className?: string;
}

/**
 * A B1 sidebar's skeleton, at B1's own width. Render it inside the shell's
 * `SidebarProvider`, which sets the two width variables it reads. Hidden below
 * `md`, where B1 is a drawer and draws nothing until it is opened.
 */
function ShellSkeletonSidebar({ region, collapsed = false, className }: ShellSkeletonSidebarProps) {
  return (
    <ShellSkeletonRegion
      region={region}
      className={cn(
        "bg-sidebar hidden h-full shrink-0 flex-col gap-2 border-e p-2 md:flex",
        collapsed ? "w-(--sidebar-width-icon)" : "w-(--sidebar-width)",
        className,
      )}
    >
      <ShellSkeletonBlock className="h-8 w-full" />
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          {Array.from({ length: 6 }, (_, index) => (
            <ShellSkeletonBlock key={index} className="size-8" />
          ))}
        </div>
      ) : (
        <ShellSkeletonRows count={8} />
      )}
    </ShellSkeletonRegion>
  );
}

/** The one line a screen reader finds inside a loading shell. */
function ShellLoadingLabel() {
  return (
    <p data-slot="shell-loading-label" className="sr-only">
      Loading
    </p>
  );
}

export {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
};
export type { ShellSkeletonRegionProps, ShellSkeletonSidebarProps, ShellSkeletonTilesProps };
