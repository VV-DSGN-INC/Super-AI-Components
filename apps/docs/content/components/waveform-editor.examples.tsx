"use client";

import { WaveformEditor } from "@/registry/super-ai/waveform-editor";

/**
 * Live examples for waveform-editor.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so waveform-editor.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a zero-prop
 * element, so a handler like `onRegionChange` is never serialized across the
 * server/client boundary — it is created and consumed entirely in here.
 */

const SAMPLE_RATE = 44_100;
const SAMPLE_COUNT = 65_536;
const PEAKS = Array.from(
  { length: 128 },
  (_, i) => Math.abs(Math.sin(i / 6)) * (0.3 + 0.6 * Math.sin((Math.PI * i) / 128)),
);

export function BoundariesAreTypeable() {
  return (
    <WaveformEditor
      peaks={PEAKS}
      sampleCount={SAMPLE_COUNT}
      sampleRate={SAMPLE_RATE}
      label="Take 3"
      region={{ start: 18_400, end: 25_600, label: "Breath" }}
      onRegionChange={() => {}}
      playhead={18_400}
      onScrub={() => {}}
      onViewChange={() => {}}
    />
  );
}

export function ZoomedToSampleLevel() {
  return (
    <WaveformEditor
      peaks={PEAKS}
      sampleCount={SAMPLE_COUNT}
      sampleRate={SAMPLE_RATE}
      label="Take 3"
      view={{ start: 18_392, end: 18_408 }}
      playhead={18_400}
      onScrub={() => {}}
      region={{ start: 18_396, end: 18_402 }}
      onRegionChange={() => {}}
      onViewChange={() => {}}
    />
  );
}

/** A selection that exists only as a shaded band — nothing to read, nothing to type. */
export function SelectionAsPictureOnly() {
  return (
    <div className="bg-card relative h-16 w-full max-w-md overflow-hidden rounded-md border">
      <div className="absolute inset-0 flex items-center gap-px px-1">
        {Array.from({ length: 48 }, (_, i) => (
          <span
            key={i}
            className="bg-primary/70 flex-1 rounded-full"
            style={{ height: `${20 + 60 * Math.abs(Math.sin(i / 3))}%` }}
          />
        ))}
      </div>
      <div className="border-primary bg-primary/20 absolute inset-y-0 left-[38%] w-[22%] border-x" />
    </div>
  );
}

/** Boundaries rounded to a display unit the edit cannot actually be made in. */
export function BoundariesInSeconds() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-sm">
      <div className="grid grid-cols-[6rem_1fr] items-center gap-3">
        <span className="text-foreground">Start</span>
        <span className="border-input inline-flex h-8 w-24 items-center rounded-md border px-2 text-sm tabular-nums">
          0.42 s
        </span>
      </div>
      <div className="grid grid-cols-[6rem_1fr] items-center gap-3">
        <span className="text-foreground">End</span>
        <span className="border-input inline-flex h-8 w-24 items-center rounded-md border px-2 text-sm tabular-nums">
          0.58 s
        </span>
      </div>
      <p className="text-foreground text-xs">
        Two decimal places of a second is 441 samples. Every edit inside that window is unreachable.
      </p>
    </div>
  );
}
