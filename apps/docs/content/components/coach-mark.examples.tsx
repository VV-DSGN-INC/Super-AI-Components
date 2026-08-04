"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { CoachMark } from "@/registry/super-ai/coach-mark";

/**
 * Live Do/Don't examples for the coach-mark guidance module.
 *
 * Every export takes zero props, because `coach-mark.docs.tsx` is read by a
 * Server Component and can only reference these as bare elements. All of them
 * are interactive, which is why they live here behind "use client" rather than
 * in the docs module.
 *
 * Each example is scoped to a positioned container with `overflow-hidden`, so
 * the spotlight's 9999px shadow spread dims the example card and not the whole
 * documentation page.
 */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card relative flex h-44 items-center justify-center overflow-hidden rounded-lg border">
      {children}
    </div>
  );
}

/** The whole point: the anchor keeps its own colours, everything else dims. */
export function CutOutKeepsTheTargetLit() {
  return (
    <Stage>
      <CoachMark
        title="Export lives here"
        description="Renders in the background — you can keep editing while it finishes."
        step={2}
        total={4}
        side="top"
        autoFocus={false}
        onSkip={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      >
        <Button type="button">Export</Button>
      </CoachMark>
    </Stage>
  );
}

/** Counter and Skip are structural: they show up even on a one-step tip. */
export function CounterAndSkipAlwaysPresent() {
  return (
    <Stage>
      <CoachMark
        title="One thing before you start"
        description="Autosave is on. Nothing here needs a save button."
        step={1}
        total={1}
        side="top"
        autoFocus={false}
        onSkip={() => {}}
      >
        <Button variant="outline" type="button">
          Autosave
        </Button>
      </CoachMark>
    </Stage>
  );
}

/**
 * The don't: a full-bleed scrim laid over the anchor. The target is still
 * there, but it is as dim as everything else, so the coach-mark points at
 * nothing you can actually read.
 */
export function ScrimCoveringTheTarget() {
  return (
    <Stage>
      <div className="relative">
        <Button type="button">Export</Button>
        {/* Wrong on purpose: no cut-out, so the anchor is dimmed too. */}
        <div aria-hidden="true" className="bg-foreground/40 pointer-events-none absolute -inset-24" />
      </div>
      <p className="text-foreground absolute bottom-3 text-xs">
        The target is under the scrim — dimmed like everything else.
      </p>
    </Stage>
  );
}

/**
 * The don't: progress rendered as dots alone. Nothing tells a screen-reader
 * user, or anyone who cannot separate the two greys, how long this tour is.
 */
export function DotsWithoutACounter() {
  return (
    <Stage>
      <div className="bg-popover text-popover-foreground ring-foreground/10 flex w-64 flex-col gap-3 rounded-lg p-4 text-sm shadow-md ring-1">
        <p className="font-medium">Swap the model anytime</p>
        <p className="text-foreground text-xs">
          Faster models cost less and you can change this between runs.
        </p>
        <div className="flex items-center justify-between">
          {/* Wrong on purpose: dots only, and no way out. */}
          <span className="flex items-center gap-1">
            <span className="bg-border size-1.5 rounded-full" />
            <span className="bg-primary size-1.5 rounded-full" />
            <span className="bg-border size-1.5 rounded-full" />
          </span>
          <Button size="sm" type="button">
            Next
          </Button>
        </div>
      </div>
    </Stage>
  );
}
