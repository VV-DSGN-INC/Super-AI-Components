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
  selected,
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
  // Same rule as A9 entity-row: presence of `selected`, not its value, is what
  // makes the frame a toggle. Defaulting it to `false` meant a tile that merely
  // opens a project ("Open Q3 launch") announced as an unpressed toggle.
  const isToggle = selected !== undefined;
  // With the label outside the frame there is nothing inside the button but the
  // caller's thumbnail, so the control is announced by whatever alt text that
  // node happens to carry — or, in `recent-grid`'s list layout, by nothing at
  // all. A clipped copy inside the frame gives it a name from content.
  //
  // Deliberately not `typeof label === "string" ? aria-label : undefined`:
  // that is the exact degrade-on-a-non-string-child pattern this registry keeps
  // rediscovering (filter-bar's remove button, citation-ref's marker,
  // reference-strip's roleLabel). Rendering the node works for any ReactNode.
  const needsClippedLabel = interactive && label && labelPlacement !== "overlay";

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
          ? {
              type: "button" as const,
              onClick: onSelect,
              ...(isToggle ? { "aria-pressed": selected } : {}),
            }
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
          // motion-reduce:animate-none: the skeleton is the only thing in this
          // file that moves, and a pulsing placeholder is exactly the motion a
          // reduced-motion user asked not to see. One class, per CONTINUE.md §9.
          <div
            data-slot="preview-tile-loading"
            className="bg-muted h-full w-full animate-pulse motion-reduce:animate-none"
          />
        ) : state === "failed" ? (
          <div
            data-slot="preview-tile-failed"
            // text-foreground, not text-destructive: destructive on this frame's
            // bg-muted measures 4.34:1 against a 4.5:1 minimum — the pairing
            // a11y-baseline.md records as this system's recurring failure, and
            // one of the two violations that kept this file on the axe exclusion
            // list. Both real consumers (result-card.tsx:129, frame-strip.tsx:162)
            // already override the inherited colour back to text-foreground at
            // the call site, so this makes the shipped look the default rather
            // than changing it — the same move cost-chip took across nineteen
            // call sites. Callers that want the failure coloured put the colour
            // on an icon, where 4.0:1 is enough and meaning is never carried by
            // colour alone.
            className="text-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs"
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
        {needsClippedLabel ? (
          <span data-slot="preview-tile-frame-label" className="sr-only">
            {label}
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
