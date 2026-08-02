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
  action?: React.ReactNode;
}

function PreviewTile({
  aspect = "square",
  state = "default",
  selected = false,
  label,
  labelPlacement = "overlay",
  badge,
  onSelect,
  action,
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
        {state === "loading" ? (
          <div data-slot="preview-tile-loading" className="bg-muted h-full w-full animate-pulse" />
        ) : state === "failed" ? (
          <div
            data-slot="preview-tile-failed"
            className="text-destructive absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs"
          >
            {action}
          </div>
        ) : (
          <>
            {children}
            {state === "locked" ? (
              // F1: locked shows the shape of what would have been made, then the
              // CTA — never an empty box with a padlock. Children stay, scrim over.
              <div
                data-slot="preview-tile-locked"
                className="bg-background/60 absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs backdrop-blur-[2px]"
              >
                {action}
              </div>
            ) : null}
          </>
        )}
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
