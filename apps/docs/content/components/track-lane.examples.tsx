"use client";

import { TrackLane, type TrackClip } from "@/registry/super-ai/track-lane";

/**
 * Live examples for track-lane.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or handler-bearing JSX.
 */

const VIDEO: TrackClip[] = [
  { id: "v1", label: "Wide", start: 0, end: 5 },
  { id: "v2", label: "Close", start: 6, end: 11 },
];

const AUDIO: TrackClip[] = [
  { id: "a1", label: "Room tone", start: 0, end: 5, peaks: [0.2, 0.3, 0.2, 0.25] },
  { id: "a2", label: "Voiceover", start: 6, end: 11, peaks: [0.5, 0.9, 0.6, 0.8, 0.4] },
];

/** DO — one scale for every stacked lane, so 0:06 is 0:06 in all of them. */
export function OneScaleForEveryLane() {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <TrackLane name="Video" type="filmstrip" clips={VIDEO} duration={12} pixelsPerSecond={32} />
      <TrackLane name="Dialogue" type="waveform" clips={AUDIO} duration={12} pixelsPerSecond={32} />
    </div>
  );
}

/** DO — selection lives on the clip, and the trim handles follow it there. */
export function HandlesBelongToTheClip() {
  return (
    <TrackLane
      name="Video"
      type="filmstrip"
      clips={[...VIDEO, { id: "v3", label: "Cutaway", start: 12, end: 16 }]}
      duration={17}
      pixelsPerSecond={32}
      selectedClipId="v2"
      onSelectClip={() => {}}
      onTrimClip={() => {}}
    />
  );
}

/**
 * DON&apos;T — two lanes at different scales. The two clips genuinely start at
 * the same moment; nothing on screen says so, and every edit made from this
 * view is made against a lie.
 */
export function MismatchedScales() {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <TrackLane name="Video" type="filmstrip" clips={VIDEO} duration={12} pixelsPerSecond={32} />
      <TrackLane name="Dialogue" type="waveform" clips={AUDIO} duration={12} pixelsPerSecond={18} />
    </div>
  );
}

/**
 * DON&apos;T — a lane per clip. Three gutters, three sets of mute/solo/lock,
 * and no way to say &quot;mute the dialogue&quot; in one action.
 */
export function ALanePerClip() {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <TrackLane name="Room tone" type="waveform" clips={[AUDIO[0]]} duration={12} pixelsPerSecond={32} />
      <TrackLane name="Voiceover" type="waveform" clips={[AUDIO[1]]} duration={12} pixelsPerSecond={32} />
    </div>
  );
}
