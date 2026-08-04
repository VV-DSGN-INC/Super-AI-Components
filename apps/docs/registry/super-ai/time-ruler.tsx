"use client";

import * as React from "react";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * Time Ruler — the scrubbable ruler, playhead and in/out range of a timeline.
 *
 * Spec: docs/design-system/component-specs.md#h2-time-ruler
 * States: zoom-levels · snap · in-out-range · scrubbing
 *
 * Three rules from the spec do the work:
 *
 * 1. "Tick density is derived from zoom. Labels thin out rather than
 *    overlapping." Nothing about the scale is hardcoded: `timeRulerScale`
 *    picks a tick interval and a label interval from one ladder of
 *    human-readable durations, subject to two minimum gaps in pixels. Zoom in
 *    and ticks subdivide; zoom out and labels drop out before they can collide.
 * 2. "The playhead spans every track, not just the ruler." The playhead is its
 *    own exported component and the ruler never clips it, so the same line can
 *    be drawn down a whole stack of `track-lane`s from the same two numbers.
 * 3. "In/out handles are a separate layer from the playhead." Three independent
 *    values — playhead, in, out — on two independent sliders. Moving the
 *    playhead never moves the range, and setting a range never seeks.
 *
 * The coordinate model (`timeToPixels` / `pixelsToTime` / `timeRulerScale`) is
 * exported as pure functions with no component state, because H3 `track-lane`
 * has to place clips on exactly the same grid this ruler labels.
 */

/** Ticks never crowd closer than this. Below it, the ruler reads as a smear. */
const MIN_TICK_GAP_PX = 12;
/** Labels never crowd closer than this. This is what makes them thin out. */
const MIN_LABEL_GAP_PX = 64;

/**
 * The only intervals a ruler is allowed to use, in seconds. Every one of them
 * is a number a human reads without arithmetic — which is the reason the
 * ladder exists rather than dividing the visible span by a constant.
 */
const TICK_INTERVALS = [
  0.04, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
] as const;

interface TimeRulerTick {
  /** Seconds from the start of the timeline. */
  time: number;
  /** Pixels from the left edge, at the zoom the scale was built for. */
  offset: number;
  /** Major ticks carry a label; minor ticks are the subdivision between them. */
  major: boolean;
}

interface TimeRulerScale {
  /** Seconds between adjacent ticks. */
  interval: number;
  /** Seconds between labels. Always a whole multiple of `interval`. */
  labelInterval: number;
  /** Decimal places a label needs at this interval. */
  labelDecimals: number;
  ticks: TimeRulerTick[];
}

/** Seconds → pixels. The whole coordinate model, in one line. */
function timeToPixels(time: number, zoom: number): number {
  return time * zoom;
}

/** Pixels → seconds. */
function pixelsToTime(pixels: number, zoom: number): number {
  return zoom > 0 ? pixels / zoom : 0;
}

function roundTime(time: number): number {
  return Math.round(time * 1e6) / 1e6;
}

/** Rounds a time to the nearest snap increment. A falsy snap is a no-op. */
function snapTime(time: number, snap?: number): number {
  if (!snap || snap <= 0) return roundTime(time);
  return roundTime(Math.round(time / snap) * snap);
}

function divides(interval: number, into: number): boolean {
  const ratio = into / interval;
  return Math.abs(ratio - Math.round(ratio)) < 1e-6;
}

/**
 * Derives the tick and label intervals from zoom alone.
 *
 * Labels are chosen first: the coarsest thing you can read is the thing that
 * must not overlap, so the label interval is the first ladder value wide enough
 * to clear `MIN_LABEL_GAP_PX`. Ticks are then the *densest* ladder value that
 * both clears `MIN_TICK_GAP_PX` and divides the label interval evenly — so
 * every label lands on a tick, at every zoom, without a special case.
 */
function timeRulerScale(duration: number, zoom: number): TimeRulerScale {
  const labelInterval =
    TICK_INTERVALS.find((v) => timeToPixels(v, zoom) >= MIN_LABEL_GAP_PX) ??
    TICK_INTERVALS[TICK_INTERVALS.length - 1];

  const interval =
    TICK_INTERVALS.find(
      (v) => timeToPixels(v, zoom) >= MIN_TICK_GAP_PX && v <= labelInterval && divides(v, labelInterval),
    ) ?? labelInterval;

  const labelDecimals = labelInterval < 0.1 ? 2 : labelInterval < 1 ? 1 : 0;

  const ticks: TimeRulerTick[] = [];
  if (duration > 0 && zoom > 0) {
    const count = Math.floor(roundTime(duration / interval));
    for (let i = 0; i <= count; i += 1) {
      const time = roundTime(i * interval);
      ticks.push({
        time,
        offset: timeToPixels(time, zoom),
        major: divides(labelInterval, time) || time === 0,
      });
    }
  }

  return { interval, labelInterval, labelDecimals, ticks };
}

/** `0:07`, `0:07.25`, `1:02:30`. Never a bare seconds count. */
function formatTimecode(seconds: number, decimals = 0): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(safe * factor) / factor;

  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded - hours * 3600) / 60);
  const rest = rounded - hours * 3600 - minutes * 60;

  const secs = rest.toFixed(decimals);
  const padded = rest < 10 ? `0${secs}` : secs;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${padded}`
    : `${minutes}:${padded}`;
}

interface TimeRulerPlayheadProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Seconds. */
  time: number;
  /** Pixels per second — the same value the ruler was given. */
  zoom: number;
  /** A timecode bubble at the head. Announced, so use it while scrubbing. */
  label?: React.ReactNode;
}

/**
 * The playhead, as a standalone layer.
 *
 * Exported on its own because the spec's "the playhead spans every track" is
 * not something a ruler can do from inside its own box. Render one of these in
 * whatever positioned container holds the ruler *and* the lanes and it will
 * draw the full height of the stack; it takes the same `time` and `zoom` the
 * ruler took, so the two can never disagree about where "now" is.
 *
 * Inside the ruler its height comes from `--time-ruler-playhead-height`, which
 * defaults to the ruler's own height — set it to the height of your track stack
 * and the line runs the whole way down without a second component.
 */
function TimeRulerPlayhead({
  time,
  zoom,
  label,
  className,
  style,
  ...props
}: TimeRulerPlayheadProps) {
  return (
    <div
      data-slot="time-ruler-playhead"
      data-time={time}
      className={cn(
        "bg-primary pointer-events-none absolute top-0 z-40 w-0.5 -translate-x-1/2",
        className,
      )}
      style={{
        left: timeToPixels(time, zoom),
        height: "var(--time-ruler-playhead-height, 100%)",
        ...style,
      }}
      {...props}
    >
      {/* A shape, not a colour: the head is visible even where the line is
          crossed by clip artwork. */}
      <span
        aria-hidden="true"
        className="bg-primary absolute top-0 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[1px]"
      />
      {label ? (
        <span
          data-slot="time-ruler-playhead-time"
          role="status"
          className="bg-primary text-primary-foreground absolute top-0 left-2 rounded px-1.5 py-0.5 text-xs tabular-nums"
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

interface TimeRulerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** Total length of the timeline, in seconds. */
  duration: number;
  /**
   * Pixels per second. The one input the whole scale is derived from — tick
   * density, label density and the ruler's own width all follow from it.
   */
  zoom?: number;
  /** Seconds. Controlled. */
  playhead?: number;
  onPlayheadChange?: (time: number) => void;
  /**
   * Snap increment in seconds — a frame (`1 / 30`), a beat, a second. Applies
   * to the playhead and to both range handles.
   */
  snap?: number;
  /** Seconds. Both `inPoint` and `outPoint` must be set for the range to draw. */
  inPoint?: number;
  outPoint?: number;
  onRangeChange?: (range: { in: number; out: number }) => void;
  /**
   * Shows the timecode bubble and marks the ruler `data-scrubbing`. Left
   * undefined the ruler tracks its own drags, so this is only for driving the
   * state from outside — a transport control held down, say.
   */
  scrubbing?: boolean;
  /** Overrides the timecode format everywhere, labels included. */
  formatTime?: (seconds: number) => string;
}

function TimeRuler({
  duration,
  zoom = 40,
  playhead = 0,
  onPlayheadChange,
  snap,
  inPoint,
  outPoint,
  onRangeChange,
  scrubbing,
  formatTime,
  className,
  style,
  ...props
}: TimeRulerProps) {
  const [dragging, setDragging] = React.useState(false);
  const isScrubbing = scrubbing ?? dragging;

  const scale = React.useMemo(() => timeRulerScale(duration, zoom), [duration, zoom]);
  const hasRange = typeof inPoint === "number" && typeof outPoint === "number";

  /** Without a snap the finest meaningful increment is one pixel of ruler. */
  const step = snap && snap > 0 ? snap : pixelsToTime(1, zoom);

  const readout = React.useCallback(
    (time: number) => (formatTime ? formatTime(time) : formatTimecode(time, 2)),
    [formatTime],
  );
  const labelFor = React.useCallback(
    (time: number) => (formatTime ? formatTime(time) : formatTimecode(time, scale.labelDecimals)),
    [formatTime, scale.labelDecimals],
  );

  return (
    <div
      data-slot="time-ruler"
      data-zoom={zoom}
      data-tick-interval={scale.interval}
      data-label-interval={scale.labelInterval}
      data-scrubbing={isScrubbing ? "true" : undefined}
      className={cn(
        "bg-background relative h-8 shrink-0 border-b select-none",
        // Never clipped: the playhead is drawn out of this box and down the
        // tracks below it.
        "overflow-visible",
        className,
      )}
      style={{ width: timeToPixels(duration, zoom), ...style }}
      {...props}
    >
      {/* Ticks. Decorative — the sliders below carry every value a screen
          reader needs, and 200 tick elements in the accessibility tree would
          bury them. */}
      <div
        data-slot="time-ruler-ticks"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
      >
        {scale.ticks.map((tick) => (
          <React.Fragment key={tick.time}>
            <span
              data-slot="time-ruler-tick"
              data-major={tick.major ? "true" : undefined}
              data-time={tick.time}
              className={cn(
                "absolute bottom-0 w-px",
                tick.major ? "bg-foreground h-3" : "bg-border h-1.5",
              )}
              style={{ left: tick.offset }}
            />
            {tick.major ? (
              <span
                data-slot="time-ruler-label"
                className="text-muted-foreground absolute top-0.5 pl-1 text-[10px] leading-none tabular-nums"
                style={{ left: tick.offset }}
              >
                {labelFor(tick.time)}
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {/* Layer 1 — the playhead's own slider. Covers the whole ruler, so
          pressing anywhere seeks. */}
      <SliderPrimitive.Root
        data-slot="time-ruler-scrub"
        value={playhead}
        min={0}
        max={duration}
        step={step}
        largeStep={step * 10}
        onValueChange={(value, details) => {
          const next = Array.isArray(value) ? value[0] : value;
          if (details.reason === "drag") setDragging(true);
          onPlayheadChange?.(snapTime(next, snap));
        }}
        onValueCommitted={() => setDragging(false)}
        className="absolute inset-0 z-20"
      >
        <SliderPrimitive.Control className="relative flex h-full w-full touch-none items-start select-none">
          <SliderPrimitive.Track className="relative h-full w-full grow select-none">
            <SliderPrimitive.Indicator className="h-0 select-none" />
          </SliderPrimitive.Track>
          {/* Composes Base UI directly rather than components/ui/slider: that
              wrapper forwards neither getAriaLabel nor getAriaValueText, so its
              thumb ends up with no accessible name and axe fails it. See
              compare-viewer.tsx, which hit the same wall. */}
          <SliderPrimitive.Thumb
            data-slot="time-ruler-scrub-thumb"
            getAriaLabel={() => "Playhead"}
            getAriaValueText={(_formatted, value) => readout(value)}
            className="border-primary bg-background ring-ring/50 relative block size-3 shrink-0 rounded-full border-2 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>

      {/* Layer 2 — in/out. A separate slider with its own two values, so a
          seek can never drag the range and vice versa. Only the handles take
          pointer events; the band lets presses fall through to the scrubber. */}
      {hasRange ? (
        <SliderPrimitive.Root
          data-slot="time-ruler-range"
          value={[inPoint, outPoint]}
          min={0}
          max={duration}
          step={step}
          largeStep={step * 10}
          thumbCollisionBehavior="none"
          onValueChange={(value) => {
            const [nextIn, nextOut] = value as number[];
            onRangeChange?.({ in: snapTime(nextIn, snap), out: snapTime(nextOut, snap) });
          }}
          className="pointer-events-none absolute inset-0 z-30"
        >
          <SliderPrimitive.Control className="relative flex h-full w-full touch-none items-center select-none">
            <SliderPrimitive.Track className="relative h-full w-full grow select-none">
              <SliderPrimitive.Indicator
                data-slot="time-ruler-range-band"
                className="bg-primary/15 border-primary h-full border-x-2 select-none"
              />
            </SliderPrimitive.Track>
            {(["In point", "Out point"] as const).map((name, index) => (
              <SliderPrimitive.Thumb
                key={name}
                data-slot={index === 0 ? "time-ruler-in-handle" : "time-ruler-out-handle"}
                index={index}
                getAriaLabel={() => name}
                getAriaValueText={(_formatted, value) => readout(value)}
                className="border-primary bg-background ring-ring/50 pointer-events-auto relative block h-4 w-2 shrink-0 rounded-[2px] border-2 select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
              />
            ))}
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
      ) : null}

      {/* Layer 3 — the playhead itself, drawn rather than dragged. */}
      <TimeRulerPlayhead
        time={playhead}
        zoom={zoom}
        label={isScrubbing ? readout(playhead) : undefined}
      />
    </div>
  );
}

export {
  TimeRuler,
  TimeRulerPlayhead,
  formatTimecode,
  pixelsToTime,
  snapTime,
  timeRulerScale,
  timeToPixels,
  MIN_LABEL_GAP_PX,
  MIN_TICK_GAP_PX,
};
export type { TimeRulerProps, TimeRulerPlayheadProps, TimeRulerScale, TimeRulerTick };
