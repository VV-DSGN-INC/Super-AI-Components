"use client";

import * as React from "react";

import { TimeRuler } from "@/registry/super-ai/time-ruler";

/**
 * Live examples for time-ruler.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or handler-bearing JSX.
 */

function Scroller({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="focus-visible:ring-ring w-full overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="w-max">{children}</div>
    </div>
  );
}

function Lane({ title }: { title: string }) {
  return (
    <div className="bg-background flex h-10 items-center border-b">
      <span className="bg-primary/15 text-foreground mx-1 flex h-8 flex-1 items-center rounded px-2 text-xs">
        {title}
      </span>
    </div>
  );
}

/**
 * DO — change one number. The same 90 seconds at 8 px/s and at 120 px/s: ticks
 * subdivide and labels thin out without anyone choosing either.
 */
export function ZoomIsTheOnlyDial() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Scroller label="Whole clip">
        <TimeRuler duration={90} zoom={8} playhead={21} />
      </Scroller>
      <Scroller label="Zoomed in">
        <TimeRuler duration={90} zoom={120} playhead={21} />
      </Scroller>
    </div>
  );
}

/**
 * DO — give the playhead the height of the stack, so it crosses every lane
 * rather than stopping at the bottom of the ruler.
 */
export function PlayheadCrossesTheLanes() {
  return (
    <Scroller label="Timeline">
      <TimeRuler
        duration={60}
        zoom={20}
        playhead={18}
        inPoint={9}
        outPoint={38}
        style={{ "--time-ruler-playhead-height": "112px" } as React.CSSProperties}
      />
      <Lane title="Interview A" />
      <Lane title="B-roll" />
    </Scroller>
  );
}

/**
 * DON&apos;T — clip the ruler. An `overflow-hidden` frame cuts the playhead off
 * at the ruler&apos;s own 32 pixels, and the lanes below lose the one line that
 * tells you what they are showing.
 */
export function ClippedPlayhead() {
  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <div className="w-max">
        <TimeRuler
          duration={60}
          zoom={20}
          playhead={18}
          style={{ "--time-ruler-playhead-height": "112px" } as React.CSSProperties}
        />
        <Lane title="Interview A" />
        <Lane title="B-roll" />
      </div>
    </div>
  );
}

/**
 * DON&apos;T — collapse in and out onto the current time to mark position. The
 * range is a second, independent thing; used this way it can no longer say what
 * you are about to export, and the playhead already had the job.
 */
export function RangeStandingInForThePlayhead() {
  return (
    <Scroller label="Range collapsed onto the playhead">
      <TimeRuler duration={60} zoom={20} playhead={18} inPoint={18} outPoint={18} />
    </Scroller>
  );
}
