"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { Kbd, KbdGroup } from "@/registry/super-ai/kbd";
import { StatReadout } from "@/registry/super-ai/stat-readout";

/**
 * Waveform Editor — sample-level audio editing.
 *
 * Catalog: docs/design-system/catalog.md, row H6 — "Sample-level audio
 * editing: region select, zoom to sample, scrub, region actions."
 * States: region-select · zoom-to-sample · scrub · region-actions
 *
 * There is no component-specs.md entry for H6. It is a D12 restoration and its
 * design is derived from gaps.md R3, which is unusually explicit about why it
 * exists: it was wrongly collapsed into H3 `track-lane`, "which selects whole
 * clips. Region selection has no equivalent there, and H2's ruler tops out at
 * frames rather than samples."
 *
 * Two consequences shape the whole API:
 *
 * 1. The sample is the unit. Every offset in and out of this component —
 *    region boundaries, playhead, the visible window — is an integer sample
 *    index, never a second and never a frame. `sampleRate` exists only so a
 *    sample offset can also be *shown* as a time; nothing is stored that way.
 *    A component that rounds to frames is H2, not this one.
 *
 * 2. A waveform is a picture, and this has to work without it. The peak strip
 *    is `aria-hidden` decoration. Every operation is driven by a real control
 *    with an accessible name: the playhead and both region boundaries are Base
 *    UI sliders (keyboard-adjustable, one sample per arrow press), and the
 *    boundaries additionally have numeric fields you can type exact sample
 *    offsets into. Nothing here is drag-only.
 *
 * Boundary: this edits audio that already exists. Generation — script in,
 * audio out — is E9 `tts-composer`. There is deliberately no generate,
 * regenerate or voice control anywhere in this component.
 *
 * Ownership: fully controlled and timer-free. It never advances the playhead,
 * holds no interval and touches no audio element. `onScrub` reports where the
 * user put the playhead; playing from there is the caller's job.
 *
 * Composition: A6 `field-row` and its `UnitInput` for the numeric boundaries,
 * `stat-readout` for the derived length, `kbd` for the nudge hint, and the Base
 * UI `Slider` primitive directly rather than `components/ui/slider` — that
 * wrapper forwards neither `getAriaLabel` nor `getAriaValueText`, which are the
 * only way to name a slider thumb, and an unnamed slider fails axe. F5
 * `compare-viewer` set that precedent.
 */

interface WaveformRegion {
  /** Inclusive start offset, in samples. */
  start: number;
  /** Exclusive end offset, in samples. */
  end: number;
  /** Optional human name, e.g. "Breath". Shown beside the boundary fields. */
  label?: string;
}

/** The visible window, in samples. Zoom is a window, not a magnification factor. */
interface WaveformView {
  start: number;
  end: number;
}

interface WaveformRegionAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Rendered with a solid destructive fill, never a tint (contrast). */
  destructive?: boolean;
  disabled?: boolean;
}

interface WaveformEditorProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /**
   * Pre-summarised peak amplitudes, 0–1, spread evenly across the whole
   * buffer. Purely decorative: the strip drawn from it is `aria-hidden`.
   */
  peaks: number[];
  /** Total length of the buffer, in samples. */
  sampleCount: number;
  /** Only used to render a sample offset as a time. Nothing is stored in seconds. */
  sampleRate: number;

  /** Visible window in samples. Defaults to the whole buffer. */
  view?: WaveformView;
  onViewChange?: (view: WaveformView) => void;
  /**
   * Zoom floor. The default of 8 is well under the 96-column strip, so the
   * innermost zoom stop is always one column per sample.
   */
  minVisibleSamples?: number;

  /** The selected region, or null when nothing is selected. */
  region?: WaveformRegion | null;
  onRegionChange?: (region: WaveformRegion) => void;

  /** Playhead offset in samples. This component never moves it on its own. */
  playhead?: number;
  onScrub?: (sample: number) => void;

  /** Actions that operate on the selected region — trim, silence, fade, delete. */
  regionActions?: WaveformRegionAction[];
  onRegionAction?: (actionId: string, region: WaveformRegion) => void;

  /** Accessible name of the editor as a whole. */
  label?: string;
  emptyRegionMessage?: string;
}

/**
 * The peak strip is never drawn wider than this many columns. At or below it,
 * one column is exactly one sample — which is the whole definition of the
 * sample-level regime, and what `data-sample-level` reports.
 */
const MAX_COLUMNS = 96;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Deliberately not `toLocaleString`: the grouping this produces has to be
 * identical in a test runner, a CI box and a browser in any locale, because the
 * sample offsets it formats are load-bearing text, not decoration.
 */
function groupDigits(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** `m:ss.mmm` — milliseconds, because a frame-resolution timecode is H2's job. */
function formatSampleTime(sample: number, sampleRate: number) {
  const seconds = sampleRate > 0 ? sample / sampleRate : 0;
  const minutes = Math.floor(seconds / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${minutes}:${String(wholeSeconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatMillis(samples: number, sampleRate: number) {
  const ms = sampleRate > 0 ? (samples / sampleRate) * 1000 : 0;
  return `${ms.toFixed(1)} ms`;
}

function WaveformEditor({
  peaks,
  sampleCount,
  sampleRate,
  view,
  onViewChange,
  minVisibleSamples = 8,
  region: regionProp = null,
  onRegionChange,
  playhead = 0,
  onScrub,
  regionActions,
  onRegionAction,
  label = "Waveform editor",
  emptyRegionMessage = "No region selected. Select a region to edit part of this audio.",
  className,
  ...props
}: WaveformEditorProps) {
  // Bound to a `const` so the null-narrowing below survives into the render
  // callbacks and slider handlers; TypeScript resets a parameter's narrowing
  // inside a nested function, and every boundary control is one.
  const region = regionProp;

  const total = Math.max(2, Math.round(sampleCount));
  const floorSamples = clamp(Math.round(minVisibleSamples), 1, total);

  // The window is normalised once, here, so nothing downstream has to defend
  // against an inverted or out-of-range view arriving from a caller.
  const viewStart = clamp(Math.round(view?.start ?? 0), 0, total - 1);
  const viewEnd = clamp(Math.round(view?.end ?? total), viewStart + 1, total);
  const visible = viewEnd - viewStart;

  const columns = Math.max(1, Math.min(visible, MAX_COLUMNS));
  const samplesPerColumn = visible / columns;
  const sampleLevel = visible <= MAX_COLUMNS;

  const clampedPlayhead = clamp(Math.round(playhead), viewStart, viewEnd);

  const bars = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < columns; i += 1) {
      const position = viewStart + ((i + 0.5) * visible) / columns;
      const index =
        peaks.length > 0 ? clamp(Math.floor((position / total) * peaks.length), 0, peaks.length - 1) : -1;
      out.push(index >= 0 ? clamp(Math.abs(peaks[index] ?? 0), 0, 1) : 0);
    }
    return out;
  }, [columns, peaks, total, viewStart, visible]);

  // Zoom is exponential: a linear "samples visible" slider spends most of its
  // travel between useless and slightly-less-useless. One stop is one power of
  // two, so every arrow press halves or doubles the window.
  const maxExponent = Math.max(1, Math.ceil(Math.log2(total)));
  const minExponent = clamp(Math.floor(Math.log2(floorSamples)), 0, maxExponent);
  const currentExponent = clamp(Math.round(Math.log2(visible)), minExponent, maxExponent);
  const zoomMax = Math.max(1, maxExponent - minExponent);
  const zoomValue = clamp(maxExponent - currentExponent, 0, zoomMax);
  const visibleAtZoom = (value: number) => Math.round(clamp(2 ** (maxExponent - value), floorSamples, total));

  const emitView = (nextVisible: number, anchorSample: number) => {
    const span = clamp(Math.round(nextVisible), 1, total);
    const start = clamp(Math.round(anchorSample - span / 2), 0, Math.max(0, total - span));
    onViewChange?.({ start, end: start + span });
  };

  const handleZoom = (value: number) => {
    // Anchored on the playhead when it is on screen, and only on the window's
    // centre when it is not. Zooming in on audio you are not looking at is the
    // fastest way to lose your place.
    const anchor =
      clampedPlayhead >= viewStart && clampedPlayhead <= viewEnd
        ? clampedPlayhead
        : (viewStart + viewEnd) / 2;
    emitView(visibleAtZoom(value), anchor);
  };

  const regionStart = region ? Math.round(region.start) : 0;
  const regionEnd = region ? Math.round(region.end) : 0;
  const regionLength = Math.max(0, regionEnd - regionStart);
  const regionOutsideView = region ? regionStart < viewStart || regionEnd > viewEnd : false;

  const bandValue = React.useMemo<number[]>(() => {
    if (!region) return [viewStart, viewEnd];
    const low = clamp(regionStart, viewStart, viewEnd);
    const high = clamp(regionEnd, viewStart, viewEnd);
    return [Math.min(low, high), Math.max(low, high)];
  }, [region, regionEnd, regionStart, viewEnd, viewStart]);

  const regionStatus = region
    ? `Region ${groupDigits(regionStart)} to ${groupDigits(regionEnd)} samples, ${formatSampleTime(
        regionStart,
        sampleRate,
      )} to ${formatSampleTime(regionEnd, sampleRate)}, ${groupDigits(regionLength)} samples long`
    : "No region selected";

  const viewStatus = `Showing ${groupDigits(visible)} samples from ${groupDigits(viewStart)}${
    sampleLevel ? ", one column per sample" : ""
  }`;

  const overlayLeft = region ? clamp(((regionStart - viewStart) / visible) * 100, 0, 100) : 0;
  const overlayRight = region ? clamp(((regionEnd - viewStart) / visible) * 100, 0, 100) : 0;

  return (
    <div
      data-slot="waveform-editor"
      role="group"
      aria-label={label}
      data-sample-level={sampleLevel ? "true" : "false"}
      className={cn("flex w-full max-w-xl flex-col gap-3", className)}
      {...props}
    >
      <div
        data-slot="waveform-editor-toolbar"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <span className="text-foreground text-xs font-medium">Zoom</span>
          {onViewChange ? (
            <SliderPrimitive.Root
              data-slot="waveform-editor-zoom"
              value={zoomValue}
              min={0}
              max={zoomMax}
              step={1}
              thumbAlignment="edge"
              onValueChange={(next) => handleZoom(Math.round(next as number))}
              className="min-w-24 flex-1"
            >
              <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
                <SliderPrimitive.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none">
                  <SliderPrimitive.Indicator className="bg-primary h-full select-none" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                  data-slot="waveform-editor-zoom-thumb"
                  // components/ui/slider forwards neither of these, which is
                  // why this composes the primitive: without a name the thumb
                  // is an anonymous "slider" to a screen reader and axe fails
                  // it. The value text is the only place a zoom stop is
                  // expressed in the unit that matters — samples.
                  getAriaLabel={() => "Zoom level"}
                  getAriaValueText={(_formatted, value) =>
                    `${groupDigits(visibleAtZoom(value))} samples visible`
                  }
                  className="border-ring bg-background ring-ring/50 relative block size-3 shrink-0 rounded-full border shadow-sm transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
                />
              </SliderPrimitive.Control>
            </SliderPrimitive.Root>
          ) : null}
          {onViewChange ? (
            <div className="flex items-center gap-1">
              {region ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  data-slot="waveform-editor-zoom-to-region"
                  onClick={() => {
                    const span = Math.max(regionLength, floorSamples);
                    emitView(span, (regionStart + regionEnd) / 2);
                  }}
                >
                  Zoom to region
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="xs"
                data-slot="waveform-editor-zoom-fit"
                onClick={() => onViewChange({ start: 0, end: total })}
              >
                Fit
              </Button>
            </div>
          ) : null}
        </div>

        {/* The zoom level in words. A magnification factor tells you nothing
            about whether you can address an individual sample; "1 sample per
            column" tells you exactly that, and it reads with the strip off. */}
        <span data-slot="waveform-editor-view-readout" className="text-foreground text-xs tabular-nums">
          {groupDigits(visible)} samples visible ·{" "}
          {sampleLevel ? "1 sample" : `${groupDigits(samplesPerColumn)} samples`} per column
        </span>
      </div>

      <div
        data-slot="waveform-editor-canvas"
        className="bg-card relative h-24 w-full overflow-hidden rounded-md border"
      >
        {/* Decoration. Everything it shows is also stated as text elsewhere. */}
        <div
          data-slot="waveform-editor-peaks"
          aria-hidden="true"
          className="absolute inset-0 flex items-center gap-px px-1"
        >
          {bars.map((amplitude, index) => (
            <span
              key={index}
              className={cn("bg-primary/70 min-w-px flex-1 rounded-full", sampleLevel && "min-w-1")}
              style={{ height: `${Math.max(3, amplitude * 100)}%` }}
            />
          ))}
        </div>

        {region ? (
          <div
            data-slot="waveform-editor-region-overlay"
            aria-hidden="true"
            className="border-primary bg-primary/20 absolute inset-y-0 border-x"
            style={{
              left: `${overlayLeft}%`,
              width: `${Math.max(0, overlayRight - overlayLeft)}%`,
            }}
          />
        ) : null}

        {/* The playhead is the slider, not a decorated div: dragging it across
            the strip and pressing the right-arrow key have to be the same
            gesture, and the arrow key has to move exactly one sample. */}
        <SliderPrimitive.Root
          data-slot="waveform-editor-playhead"
          value={clampedPlayhead}
          min={viewStart}
          max={viewEnd}
          step={1}
          largeStep={Math.max(1, Math.round(visible / 10))}
          disabled={!onScrub}
          thumbAlignment="edge"
          onValueChange={(next) => onScrub?.(Math.round(next as number))}
          className="absolute inset-0"
        >
          <SliderPrimitive.Control className="relative flex h-full w-full touch-none items-stretch select-none">
            <SliderPrimitive.Track className="relative h-full w-full grow select-none">
              <SliderPrimitive.Indicator className="hidden" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              data-slot="waveform-editor-playhead-thumb"
              getAriaLabel={() => "Playhead"}
              getAriaValueText={(_formatted, value) =>
                `${groupDigits(value)} samples, ${formatSampleTime(value, sampleRate)}`
              }
              className="bg-primary ring-ring/50 relative block h-full w-0.5 shrink-0 select-none after:absolute after:-inset-x-2 after:inset-y-0 focus-visible:ring-3 focus-visible:outline-hidden"
            />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-slot="waveform-editor-playhead-readout" className="text-foreground text-xs tabular-nums">
          Playhead {groupDigits(clampedPlayhead)} smp · {formatSampleTime(clampedPlayhead, sampleRate)}
        </span>
        <span className="text-muted-foreground text-xs">
          <KbdGroup>
            <Kbd>Left</Kbd>
            <Kbd>Right</Kbd>
          </KbdGroup>{" "}
          nudge the focused handle by one sample
        </span>
      </div>

      {region ? (
        <div data-slot="waveform-editor-region" className="flex flex-col gap-3">
          <SliderPrimitive.Root
            data-slot="waveform-editor-region-band"
            value={bandValue}
            min={viewStart}
            max={viewEnd}
            step={1}
            largeStep={Math.max(1, Math.round(visible / 10))}
            // `none`, not the default `push`: a boundary must never be shoved
            // by the other one. Off-screen boundaries are clamped for display,
            // and a push would write that clamped value back as if the user had
            // chosen it.
            thumbCollisionBehavior="none"
            disabled={!onRegionChange}
            thumbAlignment="edge"
            onValueChange={(next, details) => {
              if (!onRegionChange || !region) return;
              const values = next as number[];
              // Only the handle that actually moved is written back. The other
              // boundary keeps its true value even when it sits outside the
              // visible window and its thumb is therefore parked at the edge.
              if (details.activeThumbIndex === 1) {
                onRegionChange({
                  ...region,
                  end: Math.max(Math.round(values[1] ?? regionEnd), regionStart + 1),
                });
              } else {
                onRegionChange({
                  ...region,
                  start: Math.min(Math.round(values[0] ?? regionStart), regionEnd - 1),
                });
              }
            }}
            className="w-full"
          >
            <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
              <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full select-none">
                <SliderPrimitive.Indicator
                  data-slot="waveform-editor-region-extent"
                  className="bg-primary h-full select-none"
                />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                index={0}
                data-slot="waveform-editor-region-start-thumb"
                getAriaLabel={() => "Region start"}
                getAriaValueText={(_formatted, value) =>
                  `${groupDigits(value)} samples, ${formatSampleTime(value, sampleRate)}`
                }
                className="border-ring bg-background ring-ring/50 relative block h-4 w-2 shrink-0 rounded-sm border shadow-sm transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
              />
              <SliderPrimitive.Thumb
                index={1}
                data-slot="waveform-editor-region-end-thumb"
                getAriaLabel={() => "Region end"}
                getAriaValueText={(_formatted, value) =>
                  `${groupDigits(value)} samples, ${formatSampleTime(value, sampleRate)}`
                }
                className="border-ring bg-background ring-ring/50 relative block h-4 w-2 shrink-0 rounded-sm border shadow-sm transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
              />
            </SliderPrimitive.Control>
          </SliderPrimitive.Root>

          {regionOutsideView ? (
            <p data-slot="waveform-editor-region-clipped" className="text-foreground text-xs">
              This region extends past the visible window. Its handle is parked at the edge — type an exact
              offset below, or zoom out.
            </p>
          ) : null}

          {/* The boundaries as numbers you can read and type. A waveform is a
              picture; this is the same information without it. */}
          <div data-slot="waveform-editor-region-fields" className="flex flex-col gap-2">
            <FieldRow label="Start" hint={formatSampleTime(regionStart, sampleRate)}>
              {(controlId, describedBy) => (
                <UnitInput
                  id={controlId}
                  aria-describedby={describedBy}
                  unit="smp"
                  value={regionStart}
                  min={0}
                  max={Math.max(0, regionEnd - 1)}
                  step={1}
                  readOnly={!onRegionChange}
                  onValueChange={(next) =>
                    onRegionChange?.({
                      ...region,
                      start: clamp(Math.round(next), 0, regionEnd - 1),
                    })
                  }
                  className="w-28"
                />
              )}
            </FieldRow>
            <FieldRow label="End" hint={formatSampleTime(regionEnd, sampleRate)}>
              {(controlId, describedBy) => (
                <UnitInput
                  id={controlId}
                  aria-describedby={describedBy}
                  unit="smp"
                  value={regionEnd}
                  min={regionStart + 1}
                  max={total}
                  step={1}
                  readOnly={!onRegionChange}
                  onValueChange={(next) =>
                    onRegionChange?.({
                      ...region,
                      end: clamp(Math.round(next), regionStart + 1, total),
                    })
                  }
                  className="w-28"
                />
              )}
            </FieldRow>

            <StatReadout
              items={[
                { label: "Length", value: `${groupDigits(regionLength)} smp` },
                { label: "Duration", value: formatMillis(regionLength, sampleRate) },
                ...(region.label ? [{ label: "Region", value: region.label }] : []),
              ]}
            />
          </div>

          {regionActions && regionActions.length > 0 ? (
            <div
              data-slot="waveform-editor-region-actions"
              role="group"
              aria-label="Region actions"
              className="flex flex-wrap items-center gap-2"
            >
              {regionActions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant={action.destructive ? "destructive" : "outline"}
                  disabled={action.disabled}
                  data-slot="waveform-editor-region-action"
                  // Button's destructive variant is bg-destructive/10 plus
                  // text-destructive, which measures 4.0:1 against a 4.5:1
                  // minimum. Going solid is the substitution promo-card's
                  // quota-warning CTA and generation-queue's failed badge use.
                  className={action.destructive ? "bg-destructive text-background" : undefined}
                  // Every action names the region it will act on, so the
                  // control is unambiguous when read out of context.
                  aria-label={`${action.label} region ${groupDigits(regionStart)} to ${groupDigits(regionEnd)} samples`}
                  onClick={() => onRegionAction?.(action.id, { ...region })}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p data-slot="waveform-editor-no-region" className="text-muted-foreground text-sm">
          {emptyRegionMessage}
        </p>
      )}

      {/* Selection and zoom are announced. The playhead deliberately is not: it
          changes on every arrow press, and a live region on it would talk over
          everything else. The playhead slider's own aria-valuetext already
          reports it on focus. */}
      <span data-slot="waveform-editor-region-status" role="status" className="sr-only">
        {regionStatus}
      </span>
      <span data-slot="waveform-editor-view-status" role="status" className="sr-only">
        {viewStatus}
      </span>
    </div>
  );
}

export { WaveformEditor };
export type { WaveformEditorProps, WaveformRegion, WaveformRegionAction, WaveformView };
