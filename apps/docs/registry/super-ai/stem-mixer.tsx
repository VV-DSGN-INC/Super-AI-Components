"use client";

import { Scissors, Sparkles, Upload } from "lucide-react";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Stem Mixer — per-stem lanes with mute / solo / volume / pan.
 *
 * Catalog: docs/design-system/catalog.md, row H7 — restored under D12 (see
 * docs/design-system/decisions.md §D12 and gaps.md R4). component-specs.md has
 * no prose section for H7; this file is built from the catalog row, gaps.md R4
 * and D12's restoration note, following the E9/E10 precedent (which is also
 * why `evidence` is empty in the docs module rather than invented).
 *
 * States: exclusive-solo · additive-solo · live-meters · stem-lineage
 *
 * Three rules do the work:
 *
 * 1. **Solo resolution is a prop, not a fork.** gaps.md R4: "Exclusive-vs-additive
 *    solo is a real behavioural decision H3 does not model." Both behaviours are
 *    the same control with the same markup; `soloMode` decides what pressing it
 *    resolves to. That is why `onSoloChange` reports the whole resulting solo
 *    **set** rather than a per-stem boolean — a boolean cannot express "and the
 *    other lanes just turned off", which is the entire difference between the
 *    two modes.
 * 2. **A lane's audibility is stated, never merely coloured.** A lane that is
 *    not soloed while some other lane is, is silent — a fact with no visual home
 *    of its own in most mixers. Every lane carries a text state ("Audible" ·
 *    "Solo" · "Muted" · "Silenced by solo") plus `data-audible`, and the meter
 *    is never the signal.
 * 3. **A stem knows where it came from.** gaps.md R4: "Stem lineage back to the
 *    source must stay visible." Lineage is a per-lane line of text, not a
 *    tooltip and not a detail panel, because the reason to open a stem mixer at
 *    all is usually to judge whether a separated drum track is good enough to
 *    keep.
 *
 * It owns no audio, no state and no timers: `level` is supplied by whatever is
 * actually playing, and every control emits rather than mutates.
 */

type StemSoloMode = "exclusive" | "additive";

type StemOrigin = "separated" | "generated" | "uploaded";

interface StemLineage {
  /** Where this stem came from. Rendered as text on the lane, never only as an icon. */
  origin: StemOrigin;
  /** The mix it was separated from, or the model/prompt that generated it. */
  source: string;
  /** Optional extra ("Demucs v4", "take 3"). Appended after a separator. */
  detail?: string;
}

interface Stem {
  id: string;
  /** Used verbatim in every accessible name on the lane ("Mute Drums"). */
  name: string;
  muted?: boolean;
  soloed?: boolean;
  /** 0–100. Defaults to 100. */
  volume?: number;
  /** -100 (hard left) … 0 (centre) … 100 (hard right). Defaults to 0. */
  pan?: number;
  /**
   * 0–100 output level, sampled by the consumer. Omit it and the lane renders
   * no meter at all — this component never invents a level it cannot measure.
   */
  level?: number;
  lineage?: StemLineage;
}

// `onVolumeChange` is also a DOM media event on every element, so it has to be
// omitted alongside `onChange` or the mixer's own two-argument callback is an
// incompatible override rather than a new prop.
interface StemMixerProps extends Omit<React.ComponentProps<"div">, "onChange" | "onVolumeChange"> {
  stems: Stem[];
  /**
   * How pressing Solo resolves. `exclusive` (the mixing-desk convention) clears
   * every other solo; `additive` builds a set. Both are the same control — see
   * the file header for why this is a prop.
   */
  soloMode?: StemSoloMode;
  /** Accessible name for the mixer group. */
  label?: string;
  onMuteChange?: (stemId: string, muted: boolean) => void;
  /**
   * `soloedIds` is the complete set of soloed stems *after* the press, in stem
   * order, already resolved against `soloMode`. Apply it wholesale; do not
   * re-derive it from `stemId` alone.
   */
  onSoloChange?: (stemId: string, soloedIds: string[]) => void;
  onVolumeChange?: (stemId: string, volume: number) => void;
  onPanChange?: (stemId: string, pan: number) => void;
}

const ORIGIN_LABEL: Record<StemOrigin, string> = {
  separated: "Separated from",
  generated: "Generated from",
  uploaded: "Uploaded from",
};

const ORIGIN_ICON: Record<StemOrigin, React.ComponentType<{ className?: string }>> = {
  separated: Scissors,
  generated: Sparkles,
  uploaded: Upload,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** "-30" is not a pan position anyone can read. This is what the thumb announces. */
function panValueText(pan: number) {
  const value = Math.round(pan);
  if (value === 0) return "Centre";
  return value < 0 ? `${Math.abs(value)}% left` : `${value}% right`;
}

function firstValue(value: number | readonly number[]) {
  return Array.isArray(value) ? value[0] : (value as number);
}

/**
 * Base UI directly rather than components/ui/slider: that wrapper forwards
 * neither `getAriaLabel` nor `getAriaValueText`, which are the only way to give
 * a thumb an accessible name — an `aria-label` on the wrapper lands on the root
 * while `role="slider"` is on the thumb. Eight unnamed sliders on one screen is
 * an axe failure and an unusable mixer. Same call as compare-viewer.
 */
function LaneSlider({
  slot,
  value,
  min,
  max,
  ariaLabel,
  valueText,
  visibleLabel,
  readout,
  onValueCommit,
}: {
  slot: string;
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  valueText: (formatted: string, value: number) => string;
  visibleLabel: string;
  readout: string;
  onValueCommit?: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{visibleLabel}</span>
        <span className="text-foreground tabular-nums">{readout}</span>
      </div>
      <SliderPrimitive.Root
        data-slot={slot}
        value={value}
        min={min}
        max={max}
        thumbAlignment="edge"
        onValueChange={(next) => onValueCommit?.(firstValue(next))}
        className="w-full"
      >
        <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
          <SliderPrimitive.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none">
            <SliderPrimitive.Indicator className="bg-primary h-full select-none" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            data-slot={`${slot}-thumb`}
            getAriaLabel={() => ariaLabel}
            getAriaValueText={(formatted, v) => valueText(formatted, v)}
            className="border-ring ring-ring/50 relative block size-3 shrink-0 rounded-full border bg-white transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </div>
  );
}

function StemLineageLine({ lineage }: { lineage: StemLineage }) {
  const Icon = ORIGIN_ICON[lineage.origin];
  return (
    <p
      data-slot="stem-mixer-lineage"
      data-origin={lineage.origin}
      className="text-muted-foreground flex items-center gap-1.5 text-xs"
    >
      {/* The icon is decoration; the origin is spelled out, so a separated stem
          never reads identically to a generated one. */}
      <Icon className="size-3 shrink-0" aria-hidden />
      <span>
        {ORIGIN_LABEL[lineage.origin]} {lineage.source}
        {lineage.detail ? ` · ${lineage.detail}` : ""}
      </span>
    </p>
  );
}

function StemMixer({
  stems,
  soloMode = "exclusive",
  label = "Stem mixer",
  onMuteChange,
  onSoloChange,
  onVolumeChange,
  onPanChange,
  className,
  ...props
}: StemMixerProps) {
  const soloedIds = stems.filter((stem) => stem.soloed).map((stem) => stem.id);
  const anySoloed = soloedIds.length > 0;

  /**
   * The one place the two modes differ. `exclusive` collapses the set to the
   * pressed stem (or empties it, when that stem was already the solo);
   * `additive` toggles membership and preserves stem order.
   */
  const nextSoloed = (stemId: string) => {
    const wasSoloed = soloedIds.includes(stemId);
    if (soloMode === "exclusive") return wasSoloed ? [] : [stemId];
    return stems
      .filter((stem) => (stem.id === stemId ? !wasSoloed : Boolean(stem.soloed)))
      .map((stem) => stem.id);
  };

  const audibleCount = stems.filter(
    (stem) => !stem.muted && (!anySoloed || Boolean(stem.soloed)),
  ).length;

  const soloedNames = stems.filter((stem) => stem.soloed).map((stem) => stem.name);
  const summary = anySoloed
    ? `Soloing ${soloedNames.join(", ")}. ${audibleCount} of ${stems.length} stems audible.`
    : `${audibleCount} of ${stems.length} stems audible.`;

  return (
    <div
      data-slot="stem-mixer"
      data-solo-mode={soloMode}
      role="group"
      aria-label={label}
      className={cn("flex w-full max-w-2xl flex-col gap-3", className)}
      {...props}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* The mode is not inferable from the lanes: two soloed stems could be
            additive, or exclusive caught mid-render. So it is stated. */}
        <p data-slot="stem-mixer-solo-mode" className="text-foreground text-xs font-medium">
          {soloMode === "exclusive"
            ? "Solo is exclusive — soloing a stem clears the others."
            : "Solo is additive — stems can be soloed together."}
        </p>
        <p
          data-slot="stem-mixer-summary"
          role="status"
          aria-live="polite"
          className="text-muted-foreground text-xs"
        >
          {summary}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {stems.map((stem) => {
          const muted = Boolean(stem.muted);
          const soloed = Boolean(stem.soloed);
          const silencedBySolo = anySoloed && !soloed;
          const audible = !muted && !silencedBySolo;
          const volume = clamp(stem.volume ?? 100, 0, 100);
          const pan = clamp(stem.pan ?? 0, -100, 100);

          // Mute takes the label because it is the explicit act; being silenced
          // by someone else's solo is the surprising one, so it gets said too.
          const stateText = muted
            ? "Muted"
            : silencedBySolo
              ? "Silenced by solo"
              : soloed
                ? "Solo"
                : "Audible";

          return (
            <div
              key={stem.id}
              data-slot="stem-mixer-lane"
              data-stem-id={stem.id}
              data-muted={muted || undefined}
              data-soloed={soloed || undefined}
              data-audible={audible}
              // Deliberately not dimmed when inaudible. Dimming is the reflex
              // here, and it is both the colour-alone failure this component
              // exists to avoid and a contrast risk: ancestor opacity quietly
              // pushes muted text under 4.5:1. The lane state text carries it.
              className={cn("flex flex-col gap-2 rounded-lg border p-3", soloed && "border-ring")}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  data-slot="stem-mixer-lane-name"
                  className="text-foreground text-sm font-medium"
                >
                  {stem.name}
                </span>
                {/* Text, not a tint: "Muted" and "Silenced by solo" are
                    indistinguishable if you only dim the lane. */}
                <span data-slot="stem-mixer-lane-state" className="text-muted-foreground text-xs">
                  {stateText}
                </span>

                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="xs"
                    variant={muted ? "secondary" : "outline"}
                    data-slot="stem-mixer-mute"
                    aria-pressed={muted}
                    aria-label={`Mute ${stem.name}`}
                    onClick={() => onMuteChange?.(stem.id, !muted)}
                  >
                    Mute
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={soloed ? "secondary" : "outline"}
                    data-slot="stem-mixer-solo"
                    aria-pressed={soloed}
                    aria-label={`Solo ${stem.name}`}
                    onClick={() => onSoloChange?.(stem.id, nextSoloed(stem.id))}
                  >
                    Solo
                  </Button>
                </div>
              </div>

              {stem.lineage ? <StemLineageLine lineage={stem.lineage} /> : null}

              {typeof stem.level === "number" ? (
                <div data-slot="stem-mixer-meter">
                  {/* Named per stem, so eight meters are eight distinct
                      readouts rather than eight anonymous progressbars. The bar
                      is never the only signal of anything — mute, solo and
                      silenced-by-solo are all carried by the lane state text
                      above, which does not move when the level does. */}
                  <Progress
                    value={clamp(stem.level, 0, 100)}
                    aria-label={`${stem.name} level`}
                    className="gap-0"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <LaneSlider
                  slot="stem-mixer-volume"
                  value={volume}
                  min={0}
                  max={100}
                  ariaLabel={`${stem.name} volume`}
                  valueText={(formatted) => `${formatted} percent`}
                  visibleLabel="Volume"
                  readout={`${volume}`}
                  onValueCommit={(next) => onVolumeChange?.(stem.id, next)}
                />
                <LaneSlider
                  slot="stem-mixer-pan"
                  value={pan}
                  min={-100}
                  max={100}
                  ariaLabel={`${stem.name} pan`}
                  valueText={(_formatted, value) => panValueText(value)}
                  visibleLabel="Pan"
                  readout={panValueText(pan)}
                  onValueCommit={(next) => onPanChange?.(stem.id, next)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { StemMixer };
export type { Stem, StemLineage, StemMixerProps, StemOrigin, StemSoloMode };
