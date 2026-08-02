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
}

function PreviewTile({
  aspect = "square",
  state = "default",
  className,
  children,
  ...props
}: PreviewTileProps) {
  return (
    <div
      data-slot="preview-tile"
      data-state={state}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div
        data-slot="preview-tile-frame"
        className={cn("bg-muted relative w-full overflow-hidden rounded-lg", ASPECT[aspect])}
      >
        {children}
      </div>
    </div>
  );
}

export { PreviewTile };
export type { PreviewTileAspect, PreviewTileProps, PreviewTileState };
