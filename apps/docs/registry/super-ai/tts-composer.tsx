"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { CheckCircle2, Circle, Loader2, Pause, Play, RefreshCw, Square, SquareCheck, TriangleAlert } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";

/**
 * Tts Composer — Script editor with per-segment voice, emotion, speed
 *
 * Spec: docs/design-system/component-specs.md#e9-tts-composer
 * States: segment-select · per-segment-regenerate · whole-script-play
 *
 * Restored by D12 (docs/design-system/decisions.md) after gaps.md R6 flagged
 * it as a wrongly-dropped item: "a structured document, not a textarea with
 * settings." The load-bearing idea is granularity — a script is a sequence
 * of independently regenerable segments, plus a play-the-whole-thing
 * control. Deliberately absent: any "regenerate whole script" action —
 * gaps.md is explicit that whole-script regeneration "wastes credits and
 * discards good takes," so the only regenerate affordance here is per
 * segment, each priced with its own A2 `cost-chip`.
 *
 * Composition:
 * - Each row is A9 `entity-row`, rendered without `onSelect` so it stays a
 *   plain, non-interactive wrapper (the generation-queue/skill-menu
 *   convention) — select/play/regenerate are real sibling `<button>`s in its
 *   `trailing` slot, never nested inside another interactive element.
 * - The segment's own script text is an editable `Textarea` (a base the
 *   catalog names for this component) rendered below the row, not inside
 *   `entity-row`'s `description` slot — that slot is styled to truncate to
 *   one line, which is the wrong shape for an editable multi-line field.
 * - The selected segment's Voice / Emotion / Speed settings expand into an
 *   inspector built from A6 `field-row` (the catalog's other named base),
 *   the same label/control/reset grid A11 `reset-affordance` and E3
 *   `parameter-panel` use elsewhere in this family.
 */

type TtsComposerSegmentStatus = "idle" | "generating" | "ready" | "failed";

interface TtsComposerSegment {
  id: string;
  /** The segment's script text. Rendered as an editable `Textarea`. */
  text: string;
  voice: string;
  emotion?: string;
  /** Playback speed multiplier. Defaults to 1 (normal) when omitted. */
  speed?: number;
  status: TtsComposerSegmentStatus;
  /** Pre-formatted, e.g. "0:04". Only ever shown once the segment is `ready`. */
  durationLabel?: string;
  /** Cost to regenerate this one segment. Omit to render no cost chip. */
  regenerateCost?: number;
}

interface TtsComposerProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  segments: TtsComposerSegment[];

  /** The segment currently selected for editing — its settings inspector is expanded. */
  selectedSegmentId?: string;
  onSelectSegment?: (id: string) => void;
  onSegmentTextChange?: (id: string, text: string) => void;

  /**
   * The segment currently audible, whichever control started it — a single
   * segment preview or the whole-script transport advancing through the
   * list. There is deliberately one source of truth for "what's playing."
   */
  playingSegmentId?: string | null;
  onPlaySegment?: (id: string) => void;
  onPauseSegment?: (id: string) => void;

  /** Whole-script transport state — the "whole-script-play" declared state. */
  isPlayingScript?: boolean;
  onPlayScript?: () => void;
  onPauseScript?: () => void;
  /** Pre-formatted total runtime, e.g. "0:32". Omit to hide it from the header. */
  scriptDurationLabel?: string;

  /** Fired when a segment's regenerate control is pressed — the "per-segment-regenerate" state. */
  onRegenerateSegment?: (id: string) => void;
  costUnit?: string;

  /** Omit to render each segment's voice as plain text instead of a picker. */
  voiceOptions?: string[];
  /** Omit (with no segment carrying an `emotion`) to hide the Emotion row entirely. */
  emotionOptions?: string[];
  onSegmentVoiceChange?: (id: string, voice: string) => void;
  onSegmentEmotionChange?: (id: string, emotion: string) => void;
  onSegmentSpeedChange?: (id: string, speed: number) => void;

  /** Defaults to "Segment {n}". Used as the root of every per-row accessible name. */
  segmentLabel?: (segment: TtsComposerSegment, index: number) => string;
  playScriptLabel?: string;
  pauseScriptLabel?: string;
  emptyMessage?: string;
}

const STATUS_META: Record<TtsComposerSegmentStatus, { label: string; badgeLabel: string; badgeVariant: "outline" | "secondary" | "destructive" }> = {
  idle: { label: "Not generated", badgeLabel: "Not generated", badgeVariant: "outline" },
  generating: { label: "Generating…", badgeLabel: "Generating…", badgeVariant: "outline" },
  ready: { label: "Ready", badgeLabel: "Ready", badgeVariant: "secondary" },
  failed: { label: "Failed to generate", badgeLabel: "Failed", badgeVariant: "destructive" },
};

function StatusIcon({ status }: { status: TtsComposerSegmentStatus }) {
  switch (status) {
    case "generating":
      return <Loader2 aria-hidden className="size-4 animate-spin" />;
    case "ready":
      return <CheckCircle2 aria-hidden className="size-4" />;
    case "failed":
      return <TriangleAlert aria-hidden className="text-destructive size-4" />;
    default:
      return <Circle aria-hidden className="size-4" />;
  }
}

function TtsComposerSegmentRow({
  segment,
  label,
  selected,
  isPlaying,
  onSelectSegment,
  onSegmentTextChange,
  onPlaySegment,
  onPauseSegment,
  onRegenerateSegment,
  costUnit,
  voiceOptions,
  emotionOptions,
  onSegmentVoiceChange,
  onSegmentEmotionChange,
  onSegmentSpeedChange,
}: {
  segment: TtsComposerSegment;
  label: string;
  selected: boolean;
  isPlaying: boolean;
  onSelectSegment?: (id: string) => void;
  onSegmentTextChange?: (id: string, text: string) => void;
  onPlaySegment?: (id: string) => void;
  onPauseSegment?: (id: string) => void;
  onRegenerateSegment?: (id: string) => void;
  costUnit?: string;
  voiceOptions?: string[];
  emotionOptions?: string[];
  onSegmentVoiceChange?: (id: string, voice: string) => void;
  onSegmentEmotionChange?: (id: string, emotion: string) => void;
  onSegmentSpeedChange?: (id: string, speed: number) => void;
}) {
  const { id, text, voice, emotion, status, durationLabel, regenerateCost } = segment;
  const speed = segment.speed ?? 1;
  const canPlay = status === "ready" || isPlaying;
  const canRegenerate = status !== "generating";

  const meta = [voice, emotion, `${speed.toFixed(1)}×`].filter(Boolean).join(" · ");

  const rowStatusText =
    status === "generating"
      ? `${label}: ${STATUS_META.generating.label}`
      : status === "failed"
        ? `${label}: ${STATUS_META.failed.label}`
        : status === "ready"
          ? `${label}: ${STATUS_META.ready.label}${durationLabel ? `, ${durationLabel}` : ""}`
          : `${label}: ${STATUS_META.idle.label}`;

  const trailing = (
    <div className="flex shrink-0 items-center gap-2">
      {/* Status is never icon-shape-alone: a visible text badge sits beside
          it too, the same convention E6 `generation-queue` established. */}
      <Badge
        data-slot="tts-composer-segment-badge"
        variant={STATUS_META[status].badgeVariant}
        // Badge's own destructive variant (bg-destructive/10 text-destructive)
        // is 4.0:1 against a 4.5:1 minimum — vendored shadcn primitive, fixed
        // at the call site rather than in components/ui/badge.tsx. Going
        // solid (bg-destructive text-background, same substitution
        // generation-queue and promo-card's quota-warning CTA use) clears
        // 4.5:1. See docs/design-system/a11y-baseline.md.
        className={status === "failed" ? "bg-destructive text-background" : undefined}
      >
        {STATUS_META[status].badgeLabel}
      </Badge>
      <div data-slot="tts-composer-segment-actions" className="flex items-center gap-1">
        <Button
          type="button"
          variant={selected ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={selected}
          aria-label={`Select ${label}`}
          data-slot="tts-composer-segment-select"
          data-state={selected ? "on" : "off"}
          onClick={() => onSelectSegment?.(id)}
        >
          {selected ? <SquareCheck aria-hidden /> : <Square aria-hidden />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canPlay}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
          data-slot="tts-composer-segment-play"
          data-state={isPlaying ? "on" : "off"}
          onClick={() => (isPlaying ? onPauseSegment?.(id) : onPlaySegment?.(id))}
        >
          {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canRegenerate}
          aria-label={`Regenerate ${label}`}
          data-slot="tts-composer-segment-regenerate"
          onClick={() => onRegenerateSegment?.(id)}
        >
          <RefreshCw aria-hidden className={cn(status === "generating" && "animate-spin")} />
        </Button>
        {regenerateCost != null ? (
          // CostChip's own bg-muted + text-muted-foreground pairing measures
          // 4.34:1 — under the 4.5:1 minimum (a11y-baseline.md). Overriding to
          // text-foreground at the embedding site is the established fix
          // (hero-omnibox, run-button); CostChip itself is left untouched.
          <CostChip amount={regenerateCost} unit={costUnit} className="text-foreground" />
        ) : null}
      </div>
    </div>
  );

  const showEmotionRow = emotionOptions !== undefined || emotion !== undefined;

  return (
    <li data-slot="tts-composer-segment" data-status={status} data-state={selected ? "on" : "off"}>
      <div
        className={cn(
          // A background tint here would sit directly behind entity-row's own
          // text-muted-foreground description span — the exact
          // muted-on-accent contrast failure a11y-baseline.md documents
          // (4.34:1, under the 4.5:1 minimum). A border carries the same
          // "this row is selected/playing" cue without putting anything
          // behind that text, and it's supplementary chrome regardless: the
          // load-bearing, programmatic signal is the Select button's
          // aria-pressed state and its icon swap (Square → SquareCheck).
          "rounded-lg border border-transparent",
          selected && "border-border",
          isPlaying && "ring-primary ring-1",
        )}
      >
        <EntityRow icon={<StatusIcon status={status} />} title={label} description={meta} trailing={trailing} />

        <div className="px-3 pb-3">
          <Textarea
            data-slot="tts-composer-segment-text"
            aria-label={`${label} script text`}
            value={text}
            onFocus={() => onSelectSegment?.(id)}
            onChange={(event) => onSegmentTextChange?.(id, event.target.value)}
          />
        </div>

        {selected ? (
          <div
            role="group"
            aria-label={`${label} settings`}
            data-slot="tts-composer-segment-settings"
            className="space-y-3 border-t px-3 pt-3 pb-3"
          >
            <FieldRow label="Voice">
              {() =>
                voiceOptions && voiceOptions.length > 0 ? (
                  <Select value={voice} onValueChange={(next) => onSegmentVoiceChange?.(id, String(next))}>
                    <SelectTrigger size="sm" aria-label={`Voice for ${label}`} className="w-full">
                      <SelectValue placeholder="Voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-foreground text-sm">{voice}</span>
                )
              }
            </FieldRow>

            {showEmotionRow ? (
              <FieldRow label="Emotion">
                {() =>
                  emotionOptions && emotionOptions.length > 0 ? (
                    <Select
                      value={emotion}
                      onValueChange={(next) => onSegmentEmotionChange?.(id, String(next))}
                    >
                      <SelectTrigger size="sm" aria-label={`Emotion for ${label}`} className="w-full">
                        <SelectValue placeholder="Emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {emotionOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-foreground text-sm">{emotion ?? "—"}</span>
                  )
                }
              </FieldRow>
            ) : null}

            <FieldRow
              label="Speed"
              reset={
                <ResetAffordance
                  state={speed !== 1 ? "modified" : "default"}
                  label={`Reset speed for ${label}`}
                  onReset={() => onSegmentSpeedChange?.(id, 1)}
                />
              }
            >
              {(_controlId, describedBy) => (
                <div className="flex flex-1 items-center gap-3">
                  {/*
                    Composed directly from the Base UI `Slider` primitive, the
                    same technique E3 `parameter-panel`'s `ParameterSlider`
                    uses: `FieldRow`'s `<label for>` can't reach a nested
                    Slider thumb, so the accessible name is duplicated onto
                    the thumb via `getAriaLabel` instead of relying on it.
                  */}
                  <SliderPrimitive.Root
                    value={speed}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={(next) => onSegmentSpeedChange?.(id, next as number)}
                    thumbAlignment="edge"
                    className="w-full"
                  >
                    <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
                      <SliderPrimitive.Track
                        data-slot="tts-composer-speed-track"
                        className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none"
                      >
                        <SliderPrimitive.Indicator data-slot="tts-composer-speed-range" className="bg-primary h-full select-none" />
                      </SliderPrimitive.Track>
                      <SliderPrimitive.Thumb
                        data-slot="tts-composer-speed-thumb"
                        aria-describedby={describedBy}
                        getAriaLabel={() => `Speed for ${label}`}
                        getAriaValueText={() => `${speed.toFixed(1)}×`}
                        className="border-ring bg-background ring-ring/50 relative block size-3 shrink-0 rounded-full border shadow-sm transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
                      />
                    </SliderPrimitive.Control>
                  </SliderPrimitive.Root>
                  <UnitInput
                    aria-label={`Speed for ${label} value`}
                    aria-describedby={describedBy}
                    unit="×"
                    value={speed}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={(next) => onSegmentSpeedChange?.(id, next)}
                    className="shrink-0"
                  />
                </div>
              )}
            </FieldRow>
          </div>
        ) : null}
      </div>

      {/* Announces idle → generating → ready/failed even though the icon and
          text next to the row already make the state visible — same
          convention E6 `generation-queue` established for per-row status. */}
      <span data-slot="tts-composer-segment-status" role="status" className="sr-only">
        {rowStatusText}
      </span>
    </li>
  );
}

function TtsComposer({
  segments,
  selectedSegmentId,
  onSelectSegment,
  onSegmentTextChange,
  playingSegmentId,
  onPlaySegment,
  onPauseSegment,
  isPlayingScript = false,
  onPlayScript,
  onPauseScript,
  scriptDurationLabel,
  onRegenerateSegment,
  costUnit,
  voiceOptions,
  emotionOptions,
  onSegmentVoiceChange,
  onSegmentEmotionChange,
  onSegmentSpeedChange,
  segmentLabel = (_segment, index) => `Segment ${index + 1}`,
  playScriptLabel = "Play script",
  pauseScriptLabel = "Pause script",
  emptyMessage = "No segments yet.",
  className,
  ...props
}: TtsComposerProps) {
  const playingIndex = playingSegmentId != null ? segments.findIndex((segment) => segment.id === playingSegmentId) : -1;
  const playbackStatusText = isPlayingScript
    ? playingIndex >= 0
      ? `Playing script — ${segmentLabel(segments[playingIndex]!, playingIndex)}`
      : "Playing script"
    : "";

  return (
    <div data-slot="tts-composer" className={cn("flex w-full max-w-xl flex-col gap-3", className)} {...props}>
      <div data-slot="tts-composer-header" className="flex items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          aria-pressed={isPlayingScript}
          data-slot="tts-composer-play-script"
          data-state={isPlayingScript ? "on" : "off"}
          onClick={() => (isPlayingScript ? onPauseScript?.() : onPlayScript?.())}
        >
          {isPlayingScript ? <Pause aria-hidden /> : <Play aria-hidden />}
          {isPlayingScript ? pauseScriptLabel : playScriptLabel}
        </Button>
        {scriptDurationLabel ? (
          <span data-slot="tts-composer-duration" className="text-foreground text-xs tabular-nums">
            {scriptDurationLabel}
          </span>
        ) : null}
      </div>

      {/* Whole-script playback is announced independently of per-segment
          generation status (each row already announces its own) — the two
          are different concerns and shouldn't share one region. */}
      <span data-slot="tts-composer-playback-status" role="status" aria-live="polite" className="sr-only">
        {playbackStatusText}
      </span>

      {segments.length === 0 ? (
        <p data-slot="tts-composer-empty" className="text-muted-foreground text-sm">
          {emptyMessage}
        </p>
      ) : (
        <ul data-slot="tts-composer-segments" className="flex flex-col gap-2">
          {segments.map((segment, index) => (
            <TtsComposerSegmentRow
              key={segment.id}
              segment={segment}
              label={segmentLabel(segment, index)}
              selected={segment.id === selectedSegmentId}
              isPlaying={segment.id === playingSegmentId}
              onSelectSegment={onSelectSegment}
              onSegmentTextChange={onSegmentTextChange}
              onPlaySegment={onPlaySegment}
              onPauseSegment={onPauseSegment}
              onRegenerateSegment={onRegenerateSegment}
              costUnit={costUnit}
              voiceOptions={voiceOptions}
              emotionOptions={emotionOptions}
              onSegmentVoiceChange={onSegmentVoiceChange}
              onSegmentEmotionChange={onSegmentEmotionChange}
              onSegmentSpeedChange={onSegmentSpeedChange}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export { TtsComposer };
export type { TtsComposerProps, TtsComposerSegment, TtsComposerSegmentStatus };
