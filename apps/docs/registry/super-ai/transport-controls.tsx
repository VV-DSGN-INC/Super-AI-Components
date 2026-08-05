"use client";

import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Transport Controls — Play / skip / speed / elapsed
 *
 * Spec: docs/design-system/component-specs.md#h1-transport-controls
 * States: simple · frame-accurate
 *
 * Two variants, one component. The load-bearing rule from the spec is that
 * frame-accurate *adds* — frame step, in/out, a frame-precise timecode — and
 * never reorders. So the transport cluster is rendered from a single ordered
 * array (`TRANSPORT_ORDER`) whose first three entries are the ones both
 * variants share; the frame-accurate entries are filtered in *after* them,
 * never interleaved. `simple`'s button order is therefore a literal prefix of
 * `frame-accurate`'s, which is what the suite pins: a refactor that wedges
 * "previous frame" next to "play" because it looks tidier breaks the test, not
 * someone's muscle memory in production.
 *
 * Elapsed is an `<input>`, not a caption — the spec is explicit that typing a
 * timecode seeks. It accepts `SS`, `M:SS`, `H:MM:SS` and (frame-accurate)
 * `HH:MM:SS:FF`, commits on Enter or blur, and reverts on Escape. Total
 * duration sits beside it in a `ButtonGroupText` so the pair reads as one
 * joined field.
 *
 * Every control has a keyboard equivalent, because the spec calls transport
 * without one "preview, not editing". Two layers of that: each control is a
 * real `<button>` with a real accessible name (a tooltip is never the only
 * source — see docs/design-system/component-build-brief.md), and the root
 * handles the editor shortcuts — Space, arrows, `,`/`.`, I/O — declared on
 * each button via `aria-keyshortcuts` so assistive tech can read them out.
 */

type TransportControlsVariant = "simple" | "frame-accurate";

type TransportControlKey =
  | "skip-back"
  | "play"
  | "skip-forward"
  | "step-back"
  | "step-forward"
  | "mark-in"
  | "mark-out";

interface TransportControlsProps extends React.ComponentProps<"div"> {
  /** Declared state from the spec. `frame-accurate` adds; it never reorders. */
  variant?: TransportControlsVariant;
  /** Controlled — the consumer owns the player, this only renders it. */
  playing?: boolean;
  /** Playhead position in seconds. */
  currentTime?: number;
  /** Total length in seconds. Shown beside elapsed, and clamps seeks. */
  duration?: number;
  /** Frames per second. Drives frame stepping and the `:FF` field. */
  fps?: number;
  /** Seconds jumped by skip back / skip forward. */
  skipBy?: number;
  /** Current playback rate. */
  speed?: number;
  /** Offered playback rates. */
  speeds?: number[];
  /** In point in seconds. Frame-accurate only; `null` means unset. */
  inPoint?: number | null;
  /** Out point in seconds. Frame-accurate only; `null` means unset. */
  outPoint?: number | null;
  /** Called with the state the player should move to, not the current one. */
  onPlayPause?: (playing: boolean) => void;
  /** Skip back/forward. Falls back to `onSeek(currentTime + delta)` when absent. */
  onSkip?: (deltaSeconds: number) => void;
  /** Frame step, in frames (-1 / +1). Falls back to `onSeek` when absent. */
  onStepFrame?: (deltaFrames: number) => void;
  /** Fired by a typed timecode, and by skip/step when their own handler is absent. */
  onSeek?: (seconds: number) => void;
  onSpeedChange?: (speed: number) => void;
  onMarkIn?: (seconds: number) => void;
  onMarkOut?: (seconds: number) => void;
}

/**
 * The single source of button order. `simple` renders the entries with
 * `frameAccurateOnly: false`; `frame-accurate` renders all of them, in this
 * same order. Because the three shared entries come first, `simple`'s rendered
 * order is always a prefix of `frame-accurate`'s — that is the invariant, and
 * the reason additions are appended rather than slotted in beside the control
 * they conceptually belong to.
 */
const TRANSPORT_ORDER: { key: TransportControlKey; frameAccurateOnly: boolean }[] = [
  { key: "skip-back", frameAccurateOnly: false },
  { key: "play", frameAccurateOnly: false },
  { key: "skip-forward", frameAccurateOnly: false },
  { key: "step-back", frameAccurateOnly: true },
  { key: "step-forward", frameAccurateOnly: true },
  { key: "mark-in", frameAccurateOnly: true },
  { key: "mark-out", frameAccurateOnly: true },
];

const SHORTCUTS: Record<TransportControlKey, string> = {
  "skip-back": "ArrowLeft",
  play: "Space",
  "skip-forward": "ArrowRight",
  "step-back": ",",
  "step-forward": ".",
  "mark-in": "I",
  "mark-out": "O",
};

function pad(value: number, width = 2) {
  return String(Math.max(0, Math.floor(value))).padStart(width, "0");
}

/**
 * `M:SS` / `H:MM:SS` for the simple variant; `HH:MM:SS:FF` for frame-accurate.
 * The frame field is what the spec means by "frame-accurate adds timecode" —
 * both variants show elapsed/total, only one of them shows frames.
 */
function formatTimecode(seconds: number, frameAccurate: boolean, fps: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const whole = Math.floor(safe);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;

  if (frameAccurate) {
    const frames = Math.min(fps - 1, Math.round((safe - whole) * fps));
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}:${pad(frames)}`;
  }
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** Accepts `SS`, `M:SS`, `H:MM:SS`, `HH:MM:SS:FF`. Returns null when unusable. */
function parseTimecode(input: string, fps: number): number | null {
  const parts = input.trim().split(":");
  if (parts.length === 0 || parts.length > 4) return null;
  if (parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part.trim()))) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((value) => !Number.isFinite(value))) return null;

  if (numbers.length === 4) {
    const [hours, minutes, secs, frames] = numbers;
    return hours * 3600 + minutes * 60 + secs + frames / fps;
  }
  if (numbers.length === 3) {
    const [hours, minutes, secs] = numbers;
    return hours * 3600 + minutes * 60 + secs;
  }
  if (numbers.length === 2) {
    const [minutes, secs] = numbers;
    return minutes * 60 + secs;
  }
  return numbers[0];
}

function TransportControls({
  variant = "simple",
  playing = false,
  currentTime = 0,
  duration = 0,
  fps = 24,
  skipBy = 5,
  speed = 1,
  speeds = [0.25, 0.5, 1, 1.5, 2],
  inPoint = null,
  outPoint = null,
  onPlayPause,
  onSkip,
  onStepFrame,
  onSeek,
  onSpeedChange,
  onMarkIn,
  onMarkOut,
  onKeyDown,
  className,
  "aria-label": ariaLabel = "Transport controls",
  ...props
}: TransportControlsProps) {
  const frameAccurate = variant === "frame-accurate";
  const formatted = formatTimecode(currentTime, frameAccurate, fps);

  // Draft is non-null only while the field is being edited, so an external
  // playhead update never fights the characters someone is typing.
  const [draft, setDraft] = React.useState<string | null>(null);

  const clamp = (seconds: number) => {
    const lower = Math.max(0, seconds);
    return duration > 0 ? Math.min(duration, lower) : lower;
  };

  const seekBy = (deltaSeconds: number) => onSeek?.(clamp(currentTime + deltaSeconds));

  const actions: Record<TransportControlKey, () => void> = {
    "skip-back": () => (onSkip ? onSkip(-skipBy) : seekBy(-skipBy)),
    play: () => onPlayPause?.(!playing),
    "skip-forward": () => (onSkip ? onSkip(skipBy) : seekBy(skipBy)),
    "step-back": () => (onStepFrame ? onStepFrame(-1) : seekBy(-1 / fps)),
    "step-forward": () => (onStepFrame ? onStepFrame(1) : seekBy(1 / fps)),
    "mark-in": () => onMarkIn?.(currentTime),
    "mark-out": () => onMarkOut?.(currentTime),
  };

  const icons: Record<TransportControlKey, React.ReactNode> = {
    "skip-back": <SkipBack aria-hidden />,
    play: playing ? <Pause aria-hidden /> : <Play aria-hidden />,
    "skip-forward": <SkipForward aria-hidden />,
    "step-back": <StepBack aria-hidden />,
    "step-forward": <StepForward aria-hidden />,
    "mark-in": <ArrowRightToLine aria-hidden />,
    "mark-out": <ArrowLeftToLine aria-hidden />,
  };

  const labels: Record<TransportControlKey, string> = {
    "skip-back": `Skip back ${skipBy} seconds`,
    play: playing ? "Pause" : "Play",
    "skip-forward": `Skip forward ${skipBy} seconds`,
    "step-back": "Previous frame",
    "step-forward": "Next frame",
    "mark-in": "Mark in point",
    "mark-out": "Mark out point",
  };

  const commitTimecode = () => {
    if (draft === null) return;
    const parsed = parseTimecode(draft, fps);
    setDraft(null);
    if (parsed !== null) onSeek?.(clamp(parsed));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName?.toLowerCase();
    // Typing a timecode must not also scrub, and the speed menu owns its own
    // arrow keys.
    if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
    if (target.closest?.('[data-slot="transport-controls-speed"]')) return;
    // Space/Enter on a focused button is already that button's own activation.
    if (tag === "button" && (event.key === " " || event.key === "Enter")) return;

    const pressed = event.key === " " ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
    const match = TRANSPORT_ORDER.find(
      (entry) => SHORTCUTS[entry.key] === pressed && (frameAccurate || !entry.frameAccurateOnly),
    );
    if (!match) return;

    event.preventDefault();
    actions[match.key]();
  };

  const rangeReadout =
    frameAccurate && (inPoint != null || outPoint != null)
      ? `In ${inPoint != null ? formatTimecode(inPoint, true, fps) : "--"} · Out ${
          outPoint != null ? formatTimecode(outPoint, true, fps) : "--"
        }`
      : null;

  return (
    <div
      data-slot="transport-controls"
      data-variant={variant}
      data-state={playing ? "playing" : "paused"}
      role="group"
      aria-label={ariaLabel}
      className={cn("flex w-fit flex-wrap items-center gap-2", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <ButtonGroup>
        {TRANSPORT_ORDER.filter((entry) => frameAccurate || !entry.frameAccurateOnly).map((entry, index) => (
          <React.Fragment key={entry.key}>
            {/* Rules only, never a reorder: the separators mark where the
                frame-accurate additions begin, so the shared cluster still
                reads as the same three buttons it is in `simple`. */}
            {entry.key === "step-back" || entry.key === "mark-in" ? <ButtonGroupSeparator /> : null}
            <Button
              type="button"
              variant={entry.key === "play" ? "default" : "outline"}
              size="icon"
              data-slot={`transport-controls-${entry.key}`}
              data-index={index}
              aria-label={labels[entry.key]}
              aria-keyshortcuts={SHORTCUTS[entry.key]}
              title={`${labels[entry.key]} (${SHORTCUTS[entry.key]})`}
              onClick={actions[entry.key]}
            >
              {icons[entry.key]}
            </Button>
          </React.Fragment>
        ))}
      </ButtonGroup>

      <ButtonGroup>
        <Input
          data-slot="transport-controls-timecode"
          aria-label="Elapsed time — type a timecode to seek"
          inputMode="numeric"
          value={draft ?? formatted}
          className={cn("font-mono tabular-nums", frameAccurate ? "w-28" : "w-20")}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitTimecode}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTimecode();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setDraft(null);
            }
          }}
        />
        {/* ButtonGroupText's frame is bg-muted, so nothing inside it may be
            text-muted-foreground (4.34:1). Inherited foreground it is. */}
        <ButtonGroupText>
          <span data-slot="transport-controls-duration" className="font-mono tabular-nums">
            {formatTimecode(duration, frameAccurate, fps)}
          </span>
        </ButtonGroupText>
      </ButtonGroup>

      <div data-slot="transport-controls-speed" className="inline-flex">
        <Select value={String(speed)} onValueChange={(next) => onSpeedChange?.(Number(next))}>
          <SelectTrigger size="sm" aria-label="Playback speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {speeds.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}×
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rangeReadout ? (
        <span data-slot="transport-controls-range" className="text-muted-foreground font-mono text-xs tabular-nums">
          {rangeReadout}
        </span>
      ) : null}

      {/* Play/pause is a state change, not just a repaint — announce it. */}
      <span data-slot="transport-controls-status" role="status" className="sr-only">
        {playing ? "Playing" : "Paused"}
      </span>
    </div>
  );
}

export { TransportControls };
export type { TransportControlKey, TransportControlsProps, TransportControlsVariant };
