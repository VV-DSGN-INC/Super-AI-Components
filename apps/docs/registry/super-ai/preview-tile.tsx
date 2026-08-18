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
  /**
   * Accessible name for the interactive frame, for the one case the component
   * cannot name itself: `labelPlacement="none"` renders no label element to
   * point at. With `"below"` the frame is named from the label automatically
   * and this is unnecessary; with `"overlay"` the label is already inside the
   * button. If both an overlay label and `frameLabel` are supplied, `aria-label`
   * (from `frameLabel`) wins over the frame's own subtree-derived name — that
   * pairing is a caller error, not a supported override.
   */
  frameLabel?: string;
  /**
   * What pressing the frame means. `"toggle"` reports `aria-pressed` — right
   * for a filter or a selectable cell. `"open"` omits it — right for a tile
   * that navigates, where "pressed" is a claim about state the tile does not
   * hold. Default is `"toggle"`, which is what every caller got before this
   * prop existed.
   */
  selectMode?: "toggle" | "open";
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
  frameLabel,
  selectMode = "toggle",
  badge,
  onSelect,
  action,
  className,
  children,
  ...props
}: PreviewTileProps) {
  const interactive = typeof onSelect === "function";
  const Frame = interactive ? "button" : "div";

  // The `below` label is a sibling of the frame, so it cannot name the button
  // by containment the way the overlay label does. Pointing at it beats a
  // `frameLabel` string: the name is the visible label by construction and
  // cannot drift from it.
  const labelId = React.useId();
  const namedByLabel = interactive && Boolean(label) && labelPlacement === "below";

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
              ...(selectMode === "toggle" ? { "aria-pressed": selected } : {}),
              ...(namedByLabel ? { "aria-labelledby": labelId } : {}),
              ...(!namedByLabel && frameLabel ? { "aria-label": frameLabel } : {}),
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
        <span
          id={labelId}
          data-slot="preview-tile-label"
          className="text-foreground truncate text-sm"
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export { PreviewTile };
export type { PreviewTileAspect, PreviewTileProps, PreviewTileState };
