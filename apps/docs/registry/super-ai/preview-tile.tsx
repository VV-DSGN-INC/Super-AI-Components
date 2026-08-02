"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type PreviewTileAspect = "square" | "video" | "portrait" | "wide";
type PreviewTileState = "default" | "loading" | "locked" | "failed";

const ASPECT: Record<PreviewTileAspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

interface PreviewTileProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  aspect?: PreviewTileAspect;
  state?: PreviewTileState;
  selected?: boolean;
  label?: React.ReactNode;
  labelPlacement?: "overlay" | "below" | "none";
  badge?: React.ReactNode;
  onSelect?: () => void;
}

function PreviewTile({
  aspect = "square",
  state = "default",
  selected = false,
  label,
  labelPlacement = "overlay",
  badge,
  onSelect,
  className,
  children,
  ...props
}: PreviewTileProps) {
  const interactive = typeof onSelect === "function";
  const Frame = interactive ? "button" : "div";

  return (
    <div
      data-slot="preview-tile"
      data-state={state}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <Frame
        // A native button gives Enter/Space, focus and disabled semantics for free.
        // Decorative tiles stay a div so they never enter the tab order.
        {...(interactive
          ? { type: "button" as const, onClick: onSelect, "aria-pressed": selected }
          : {})}
        data-slot="preview-tile-frame"
        className={cn(
          "bg-muted relative w-full overflow-hidden rounded-lg",
          ASPECT[aspect],
          interactive && "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          // A ring is a box-shadow: zero layout contribution, so selecting never
          // reflows the grid. A border would add 2px per side. This is the reason
          // E4 preset-grid and H5 frame-strip both specify a ring.
          selected && "ring-ring ring-offset-background ring-2 ring-offset-2",
        )}
      >
        {children}
        {badge ? (
          <span data-slot="preview-tile-badge" className="absolute top-2 right-2">
            {badge}
          </span>
        ) : null}
        {label && labelPlacement === "overlay" ? (
          <span
            data-slot="preview-tile-label"
            className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 truncate px-2 py-1 text-xs backdrop-blur-sm"
          >
            {label}
          </span>
        ) : null}
      </Frame>
      {label && labelPlacement === "below" ? (
        <span data-slot="preview-tile-label" className="text-foreground truncate text-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export { PreviewTile };
export type { PreviewTileAspect, PreviewTileProps, PreviewTileState };
