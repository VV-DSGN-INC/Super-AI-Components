import * as React from "react"
import { AudioLines, ImageIcon, Type, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import type { FlowStatus } from "./flow-types"

export type MediaKind = "image" | "video" | "audio" | "text"
export type MediaAspect = "video" | "square" | "auto"

export interface MediaSlotProps {
  kind: MediaKind
  status: FlowStatus
  src?: string
  alt?: string
  emptyText?: string
  aspect?: MediaAspect
  className?: string
  children?: React.ReactNode
}

const EMPTY_COPY: Record<MediaKind, string> = {
  image: "Your generation will appear here",
  video: "Your generation will appear here",
  audio: "Your audio will appear here",
  text: "Generated text will appear here",
}

const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
  text: Type,
}

export function MediaSlot({
  kind,
  status,
  src,
  alt,
  emptyText,
  aspect = "video",
  className,
  children,
}: MediaSlotProps) {
  const Icon = KIND_ICON[kind]
  const copy = emptyText ?? EMPTY_COPY[kind]
  const hasContent = !!src || (kind === "text" && !!children)

  // Audio: compact row — not aspect-locked
  if (kind === "audio") {
    return (
      <div
        data-slot="media-slot"
        data-status={status}
        className={cn(
          "relative flex h-10 w-full items-center overflow-hidden rounded-lg bg-muted",
          className,
        )}
      >
        {status === "streaming" && (
          <div
            data-shimmer
            className="absolute inset-0 animate-pulse bg-muted-foreground/10"
          />
        )}
        {status === "done" && src ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={src} className="h-full w-full" />
        ) : status === "failed" ? (
          <span className="px-3 text-[11px] text-muted-foreground">Failed</span>
        ) : status !== "streaming" ? (
          <div className="flex w-full items-center justify-center gap-1.5 px-3">
            <Icon className="size-3 text-muted-foreground" aria-hidden />
            <span className="text-[11px] text-muted-foreground">{copy}</span>
          </div>
        ) : null}
      </div>
    )
  }

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "auto" ? "" : "aspect-video"

  return (
    <div
      data-slot="media-slot"
      data-status={status}
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        aspectClass,
        className,
      )}
    >
      {/* Streaming shimmer — always rendered on top when streaming */}
      {status === "streaming" && (
        <div
          data-shimmer
          className="absolute inset-0 animate-pulse bg-muted-foreground/10"
        />
      )}

      {/* Content */}
      {status === "done" && hasContent ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" />
        ) : kind === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video controls src={src} className="h-full w-full object-cover" />
        ) : kind === "text" ? (
          <div className="p-3 text-sm">{children}</div>
        ) : null
      ) : status === "failed" ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Failed</span>
        </div>
      ) : (
        /* Empty / idle / queued / streaming-with-copy-underneath */
        <div className="flex h-full w-full items-center justify-center gap-1.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-[11px] text-muted-foreground">{copy}</span>
        </div>
      )}
    </div>
  )
}
