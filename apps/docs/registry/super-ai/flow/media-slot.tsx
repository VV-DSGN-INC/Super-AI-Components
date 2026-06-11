import * as React from "react";
import { AudioLines, ImageIcon, Type, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FlowStatus } from "./flow-types";

export type MediaKind = "image" | "video" | "audio" | "text";
export type MediaAspect = "video" | "square" | "auto";

export interface MediaSlotProps extends Omit<React.ComponentProps<"div">, "children"> {
  kind: MediaKind;
  status: FlowStatus;
  src?: string;
  alt?: string;
  emptyText?: string;
  aspect?: MediaAspect;
  className?: string;
  children?: React.ReactNode;
}

const EMPTY_COPY: Record<MediaKind, string> = {
  image: "Your generation will appear here",
  video: "Your generation will appear here",
  audio: "Your audio will appear here",
  text: "Generated text will appear here",
};

const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
  text: Type,
};

/**
 * Aspect-locked media preview for a flow node, driven by the kind × status matrix:
 *
 * - `done` + content — `image` renders `<img src>`, `video` renders `<video controls>`,
 *   `audio` renders `<audio controls>` in a compact row, `text` renders `children`.
 * - `failed` — a unified "Failed" fallback, identical across all kinds.
 * - `streaming` — a shimmer overlay on top of the empty-state copy (all kinds).
 * - `idle` / `queued` / `locked` — the empty state (kind icon + copy). queued and locked
 *   deliberately fall through here: their affordances (status badge, locked CTA) are owned
 *   by the node shell (ai-node), not the media slot.
 *
 * `emptyText` is the extension point for the empty-state copy — hosts override the per-kind
 * default (e.g. "Drop image here") without touching the state logic. `audio` is a compact
 * fixed-height row; every other kind is aspect-locked via `aspect` (video | square | auto).
 */
export function MediaSlot({
  kind,
  status,
  src,
  alt,
  emptyText,
  aspect = "video",
  className,
  children,
  ...rest
}: MediaSlotProps) {
  const Icon = KIND_ICON[kind];
  const copy = emptyText ?? EMPTY_COPY[kind];
  const hasContent = !!src || (kind === "text" && !!children);

  // Audio uses a compact row; everything else is aspect-locked.
  const isAudio = kind === "audio";
  const aspectClass =
    !isAudio && (aspect === "square" ? "aspect-square" : aspect === "auto" ? "" : "aspect-video");

  return (
    <div
      data-slot="media-slot"
      data-status={status}
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        // Audio: compact row — not aspect-locked
        isAudio ? "flex h-10 items-center px-2" : aspectClass,
        className,
      )}
      {...rest}
    >
      {/* Shimmer — rendered on top for ALL kinds while streaming */}
      {status === "streaming" && (
        <div data-shimmer className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
      )}

      {/* Done branch */}
      {status === "done" && hasContent ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" />
        ) : kind === "video" ? (
          <video controls src={src} className="h-full w-full object-cover" />
        ) : kind === "audio" ? (
          <audio controls src={src} className="h-full w-full" />
        ) : (
          // text
          <div className="p-3 text-sm">{children}</div>
        )
      ) : status === "failed" ? (
        /* Failed — unified across all kinds */
        <div
          className={cn(
            "flex items-center justify-center",
            !isAudio && "h-full w-full",
            isAudio && "min-h-10 px-1",
          )}
        >
          <span className="text-xs text-muted-foreground">Failed</span>
        </div>
      ) : (
        /* Empty / idle / queued / streaming — copy visible underneath shimmer.
           queued/locked deliberately fall through here; badge/CTA live at node level. */
        <div
          className={cn(
            "flex min-h-10 items-center justify-center gap-1.5",
            !isAudio && "h-full w-full",
            isAudio && "w-full",
          )}
        >
          <Icon className={cn("text-muted-foreground", isAudio ? "size-3" : "size-4")} aria-hidden />
          <span className="text-xs text-muted-foreground">{copy}</span>
        </div>
      )}
    </div>
  );
}
