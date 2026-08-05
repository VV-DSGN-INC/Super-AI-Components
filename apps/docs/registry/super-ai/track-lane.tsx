"use client";

import * as React from "react";

import {
  AudioLines,
  Film,
  Headphones,
  Lock,
  LockOpen,
  SlidersHorizontal,
  Type as TypeIcon,
  Volume2,
  VolumeOff,
} from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

/**
 * Track Lane — one timeline track: a fixed gutter and a scrolling row of clips.
 *
 * Spec: docs/design-system/component-specs.md#h3-track-lane
 * States: filmstrip · waveform · text · adjustment · locked · trim-handles
 *
 * Three rules from the spec do all the work here:
 *
 * 1. "The lane header is a fixed-width gutter with mute, solo and lock. It
 *    never scrolls horizontally." The gutter and the clip row are separate
 *    scroll contexts — the gutter is a `shrink-0` sibling of the scroller, not
 *    a child of it — so scrolling to 0:48 never takes the mute button with it.
 * 2. "Trim handles appear only on selection and belong to the clip, not the
 *    lane." They are rendered inside the selected clip's own element, so a lane
 *    with three clips and one selected has exactly two handles and they move
 *    with that clip.
 * 3. "Track type changes clip rendering but not lane behaviour. One component,
 *    four renderers." Everything outside `<ClipBody>` — gutter width, lane
 *    height, clip geometry, selection, trimming, lock — is identical for all
 *    four types. Only what a clip *draws* changes.
 */

type TrackType = "filmstrip" | "waveform" | "text" | "adjustment";

interface TrackClip {
  id: string;
  /** The clip's accessible name. Always present, whatever the renderer draws. */
  label: string;
  /** Seconds from the start of the lane. */
  start: number;
  /** Seconds from the start of the lane. */
  end: number;
  /** `filmstrip`: thumbnail sources, drawn edge to edge across the clip. */
  frames?: string[];
  /** `waveform`: amplitudes in 0–1, one per drawn bar. */
  peaks?: number[];
  /** `text`: the caption or transcript line this clip carries. */
  text?: string;
  /** `adjustment`: the effect and, optionally, its strength as a percentage. */
  adjustment?: { name: string; amount?: number };
}

interface TrackLaneProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** Track name. Also the stem of every control's accessible name. */
  name: string;
  /** Changes what a clip draws. It changes nothing else. */
  type: TrackType;
  clips: TrackClip[];
  /** Total lane length in seconds. With `pixelsPerSecond`, this is the scale. */
  duration: number;
  /**
   * The lane owns its own scale. Give every stacked lane the same value — a
   * clip at 0:04 has to sit at 0:04 in each of them.
   */
  pixelsPerSecond?: number;
  selectedClipId?: string | null;
  onSelectClip?: (clipId: string) => void;
  /** Fires from the trim handles. `delta` is in seconds and may be negative. */
  onTrimClip?: (clipId: string, edge: "start" | "end", delta: number) => void;
  /** Seconds moved per arrow-key press on a trim handle. */
  trimStep?: number;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  soloed?: boolean;
  onSoloedChange?: (soloed: boolean) => void;
  /** Suppresses selection and trimming. Never signalled by colour alone. */
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
}

/** Fixed, and fixed on purpose: it is what makes stacked lanes line up. */
const HEADER_CLASS =
  "bg-card flex w-40 shrink-0 flex-col justify-center gap-1 overflow-hidden border-r px-2 py-2";

/** The one horizontal scroller in the lane. */
const CLIPS_CLASS =
  "focus-visible:ring-ring relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden focus-visible:ring-2 focus-visible:outline-none";

const TRACK_HEIGHT_CLASS = "relative h-16";

const MIN_CLIP_PX = 12;

const TYPE_ICONS: Record<TrackType, React.ComponentType<{ className?: string }>> = {
  filmstrip: Film,
  waveform: AudioLines,
  text: TypeIcon,
  adjustment: SlidersHorizontal,
};

/**
 * The only part of the lane that knows about `type`. Everything it draws is
 * `pointer-events-none` so the clip's own select button stays clickable
 * underneath it — a renderer must never become a second interactive layer.
 */
function ClipBody({ clip, type }: { clip: TrackClip; type: TrackType }) {
  const common = "pointer-events-none absolute inset-0 flex items-center";

  if (type === "filmstrip") {
    const frames = clip.frames?.length ? clip.frames : [undefined, undefined, undefined, undefined];
    return (
      <div data-slot="track-lane-clip-body" data-render="filmstrip" className={cn(common)}>
        <div className="absolute inset-0 flex">
          {frames.map((src, i) => (
            <span
              key={i}
              data-slot="track-lane-frame"
              className="bg-foreground/15 border-background/40 h-full min-w-0 flex-1 border-r last:border-r-0"
              style={
                src
                  ? {
                      backgroundImage: `url(${src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            />
          ))}
        </div>
        <ClipCaption>{clip.label}</ClipCaption>
      </div>
    );
  }

  if (type === "waveform") {
    const peaks = clip.peaks?.length ? clip.peaks : [0.3, 0.6, 0.45, 0.8, 0.5, 0.7, 0.35];
    return (
      <div data-slot="track-lane-clip-body" data-render="waveform" className={cn(common)}>
        <div className="absolute inset-0 flex items-center gap-px px-1">
          {peaks.map((peak, i) => (
            <span
              key={i}
              data-slot="track-lane-peak"
              className="bg-foreground/60 min-w-px flex-1 rounded-full"
              style={{ height: `${Math.max(8, Math.min(1, peak) * 100)}%` }}
            />
          ))}
        </div>
        <ClipCaption>{clip.label}</ClipCaption>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div data-slot="track-lane-clip-body" data-render="text" className={cn(common, "gap-1.5 px-2")}>
        <TypeIcon className="size-3 shrink-0" aria-hidden="true" />
        <span className="text-secondary-foreground truncate text-xs">{clip.text ?? clip.label}</span>
      </div>
    );
  }

  return (
    <div data-slot="track-lane-clip-body" data-render="adjustment" className={cn(common, "gap-1.5 px-2")}>
      <SlidersHorizontal className="size-3 shrink-0" aria-hidden="true" />
      <span className="text-secondary-foreground truncate text-xs">
        {clip.adjustment?.name ?? clip.label}
      </span>
      {clip.adjustment?.amount != null ? (
        <span className="text-secondary-foreground ml-auto shrink-0 text-xs tabular-nums">
          {clip.adjustment.amount}%
        </span>
      ) : null}
    </div>
  );
}

/** A readable caption over media that has no text of its own. */
function ClipCaption({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-background text-foreground absolute top-1 left-1 max-w-[calc(100%-0.5rem)] truncate rounded px-1 text-[0.625rem] leading-4">
      {children}
    </span>
  );
}

/**
 * Rendered inside the clip, never inside the lane — a handle that belonged to
 * the lane would stay put while its clip moved.
 */
function TrimHandle({
  edge,
  clipLabel,
  step,
  onTrim,
}: {
  edge: "start" | "end";
  clipLabel: string;
  step: number;
  onTrim?: (edge: "start" | "end", delta: number) => void;
}) {
  return (
    <button
      type="button"
      data-slot="track-lane-trim-handle"
      data-edge={edge}
      aria-label={`Trim ${edge} of ${clipLabel}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onTrim?.(edge, -step);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onTrim?.(edge, step);
        }
      }}
      className={cn(
        "bg-primary focus-visible:ring-ring absolute inset-y-0 z-20 w-2 cursor-ew-resize focus-visible:ring-2 focus-visible:outline-none",
        edge === "start" ? "left-0 rounded-l-md" : "right-0 rounded-r-md",
      )}
    >
      <span
        aria-hidden="true"
        className="bg-primary-foreground/80 absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
    </button>
  );
}

function TrackLane({
  name,
  type,
  clips,
  duration,
  pixelsPerSecond = 40,
  selectedClipId,
  onSelectClip,
  onTrimClip,
  trimStep = 0.1,
  muted,
  onMutedChange,
  soloed,
  onSoloedChange,
  locked = false,
  onLockedChange,
  className,
  ...props
}: TrackLaneProps) {
  const TypeIcon_ = TYPE_ICONS[type];

  return (
    <div
      data-slot="track-lane"
      data-type={type}
      data-locked={locked ? "true" : undefined}
      className={cn(
        "bg-card text-card-foreground flex w-full items-stretch overflow-hidden rounded-lg border",
        className,
      )}
      {...props}
    >
      {/* The gutter. A sibling of the scroller, never a child of it — that is
          the whole of "it never scrolls horizontally". */}
      <div data-slot="track-lane-header" className={HEADER_CLASS}>
        <div className="flex min-w-0 items-center gap-1.5">
          <TypeIcon_ className="size-3.5 shrink-0" />
          <span data-slot="track-lane-name" className="truncate text-xs font-medium">
            {name}
          </span>
          {locked ? (
            // Lock is never colour alone: an icon, the word, and aria-pressed
            // on the control below.
            <span
              data-slot="track-lane-locked-badge"
              className="text-foreground ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 text-[0.625rem] leading-4"
            >
              <Lock className="size-2.5" aria-hidden="true" />
              Locked
            </span>
          ) : null}
        </div>

        <div
          data-slot="track-lane-controls"
          role="group"
          aria-label={`${name} track controls`}
          className="flex items-center gap-0.5"
        >
          {/* No `data-slot` on these: the primitive owns `toggle`, and passing
              our own would silently replace it. `data-control` is the hook. */}
          <Toggle
            size="sm"
            data-control="mute"
            pressed={muted}
            onPressedChange={(pressed) => onMutedChange?.(pressed)}
          >
            {muted ? (
              <VolumeOff className="size-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-3.5" aria-hidden="true" />
            )}
            <span className="sr-only">Mute {name}</span>
          </Toggle>

          <Toggle
            size="sm"
            data-control="solo"
            pressed={soloed}
            onPressedChange={(pressed) => onSoloedChange?.(pressed)}
          >
            <Headphones className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Solo {name}</span>
          </Toggle>

          <Toggle
            size="sm"
            data-control="lock"
            pressed={locked}
            onPressedChange={(pressed) => onLockedChange?.(pressed)}
          >
            {locked ? (
              <Lock className="size-3.5" aria-hidden="true" />
            ) : (
              <LockOpen className="size-3.5" aria-hidden="true" />
            )}
            <span className="sr-only">Lock {name}</span>
          </Toggle>
        </div>
      </div>

      {/* The scroller. Focusable because a scrollable region must be reachable
          from the keyboard (axe scrollable-region-focusable). */}
      <div
        data-slot="track-lane-clips"
        role="region"
        aria-label={`${name} clips`}
        tabIndex={0}
        className={CLIPS_CLASS}
      >
        <div
          data-slot="track-lane-track"
          className={TRACK_HEIGHT_CLASS}
          style={{ width: duration * pixelsPerSecond }}
        >
          {clips.map((clip) => {
            const isSelected = clip.id === selectedClipId;
            const left = clip.start * pixelsPerSecond;
            const width = Math.max(MIN_CLIP_PX, Math.max(0, clip.end - clip.start) * pixelsPerSecond);

            return (
              <div
                key={clip.id}
                data-slot="track-lane-clip"
                data-clip-id={clip.id}
                data-selected={isSelected ? "true" : undefined}
                className={cn(
                  "bg-secondary text-secondary-foreground absolute inset-y-1 overflow-hidden rounded-md border",
                  isSelected && "ring-ring ring-2",
                )}
                style={{ left, width }}
              >
                {/* The select target sits *under* the renderer rather than
                    wrapping it, so the trim handles are siblings of this
                    button and never nested inside it (axe nested-interactive). */}
                <button
                  type="button"
                  data-slot="track-lane-clip-select"
                  aria-label={clip.label}
                  aria-pressed={isSelected}
                  disabled={locked}
                  onClick={() => onSelectClip?.(clip.id)}
                  className="focus-visible:ring-ring absolute inset-0 z-0 cursor-pointer focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default"
                />

                {/* Above the select button so the renderer is what you see,
                    but pointer-transparent so the button is what you hit. */}
                <div className="pointer-events-none absolute inset-0 z-10">
                  <ClipBody clip={clip} type={type} />
                </div>

                {isSelected && !locked ? (
                  <>
                    <TrimHandle
                      edge="start"
                      clipLabel={clip.label}
                      step={trimStep}
                      onTrim={(edge, delta) => onTrimClip?.(clip.id, edge, delta)}
                    />
                    <TrimHandle
                      edge="end"
                      clipLabel={clip.label}
                      step={trimStep}
                      onTrim={(edge, delta) => onTrimClip?.(clip.id, edge, delta)}
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { TrackLane };
export type { TrackClip, TrackLaneProps, TrackType };
