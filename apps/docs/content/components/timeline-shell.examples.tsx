"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { TimeRuler, TimeRulerPlayhead } from "@/registry/super-ai/time-ruler";
import { TrackLane } from "@/registry/super-ai/track-lane";

/**
 * Live examples for timeline-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler never has to cross the server/client
 * boundary.
 *
 * These are fragments of the dock, not whole shells: four full editors stacked
 * down a documentation page would teach nothing the live preview at the top of
 * the page does not already teach.
 */

const CLIPS = [
  { id: "c1", label: "Harbour, wide", start: 0, end: 3 },
  { id: "c2", label: "Interview A", start: 3, end: 7 },
];

const DURATION = 8;
const ZOOM = 36;
/** H3's gutter is a fixed `w-40` and the lane draws a 1px border outside it. */
const GUTTER = "w-[calc(10rem+1px)]";
/** The same offset again, plus the frame's own padding. */
const PLAYHEAD_INSET = "left-[calc(0.5rem+10rem+1px)]";

function DockFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex w-full max-w-xl flex-col gap-1 rounded-lg border p-2">
      {children}
    </div>
  );
}

/** Do — one scale for the ruler and the lane, and the gutter accounted for. */
export function RulerAlignedWithItsLanes() {
  return (
    <DockFrame>
      <div className="flex items-end">
        <div aria-hidden="true" className={cn("shrink-0", GUTTER)} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <TimeRuler duration={DURATION} zoom={ZOOM} playhead={2} />
        </div>
      </div>
      <TrackLane name="Video" type="filmstrip" clips={CLIPS} duration={DURATION} pixelsPerSecond={ZOOM} />
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-y-2 right-2", PLAYHEAD_INSET)}
      >
        <TimeRulerPlayhead time={2} zoom={ZOOM} />
      </div>
    </DockFrame>
  );
}

/**
 * Don't — the ruler starts at the dock's left edge and runs at its own zoom, so
 * every clip sits under the wrong timecode.
 */
export function RulerDriftingFromItsLanes() {
  return (
    <DockFrame>
      <div className="overflow-hidden">
        <TimeRuler duration={DURATION} zoom={22} playhead={2} />
      </div>
      <TrackLane name="Video" type="filmstrip" clips={CLIPS} duration={DURATION} pixelsPerSecond={ZOOM} />
    </DockFrame>
  );
}

/** Do — the lane keeps H3's own mute, solo and lock in its fixed gutter. */
export function LaneKeepsItsOwnControls() {
  return (
    <DockFrame>
      <TrackLane
        name="Voice"
        type="waveform"
        clips={[{ id: "a1", label: "Narration", start: 0, end: 6 }]}
        duration={DURATION}
        pixelsPerSecond={ZOOM}
        muted
      />
    </DockFrame>
  );
}

/**
 * Don't — a hand-rolled row. It looks like a lane and has no gutter, no mute,
 * no lock, no trim handles, and no accessible name for the clip.
 */
export function LaneRolledByHand() {
  return (
    <DockFrame>
      <div className="bg-card relative h-16 w-full overflow-hidden rounded-lg border">
        <div className="bg-secondary absolute inset-y-1 left-0 rounded-md border" style={{ width: 6 * ZOOM }}>
          <span className="text-secondary-foreground absolute top-1 left-1 text-[0.625rem]">Narration</span>
        </div>
      </div>
    </DockFrame>
  );
}
