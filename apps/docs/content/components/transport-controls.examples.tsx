"use client";

import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { TransportControls } from "@/registry/super-ai/transport-controls";

/**
 * Live examples for transport-controls.docs.tsx.
 *
 * Client sidecar, kept separate on purpose: the docs module is plain data read
 * by a Server Component, so it cannot carry "use client" and cannot hold JSX
 * with event handlers. Every example here is zero-prop, so nothing has to
 * serialise across the boundary.
 */

/** Do — frame-accurate adds; the shared three keep their places. */
export function OrderHeldSteady() {
  const [currentTime, setCurrentTime] = useState(12.5);
  return (
    <div className="flex flex-col gap-3">
      <TransportControls currentTime={currentTime} duration={90} onSeek={setCurrentTime} />
      <TransportControls
        variant="frame-accurate"
        currentTime={currentTime}
        duration={90}
        inPoint={2}
        outPoint={30}
        onSeek={setCurrentTime}
        onStepFrame={(frames) => setCurrentTime((time) => Math.max(0, time + frames / 24))}
      />
    </div>
  );
}

/** Do — elapsed is a field. Typing a timecode seeks. */
export function ElapsedIsAField() {
  const [currentTime, setCurrentTime] = useState(12);
  return (
    <div className="flex flex-col gap-2">
      <TransportControls currentTime={currentTime} duration={600} onSeek={setCurrentTime} />
      <p className="text-muted-foreground text-xs">
        Type <span className="font-mono">2:30</span> into the elapsed field and press Enter.
      </p>
    </div>
  );
}

/** Don't — frame step wedged between skip-back and play, so play moves. */
export function ReorderedForFrameAccurate() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="icon" aria-label="Skip back 5 seconds">
        <SkipBack aria-hidden />
      </Button>
      <Button variant="outline" size="icon" aria-label="Previous frame">
        <StepBack aria-hidden />
      </Button>
      <Button size="icon" aria-label="Play">
        <Play aria-hidden />
      </Button>
      <Button variant="outline" size="icon" aria-label="Next frame">
        <StepForward aria-hidden />
      </Button>
      <Button variant="outline" size="icon" aria-label="Skip forward 5 seconds">
        <SkipForward aria-hidden />
      </Button>
    </ButtonGroup>
  );
}

/** Don't — elapsed/total rendered as a caption, so the only way to seek is scrubbing. */
export function TimecodeAsCaption() {
  const [playing, setPlaying] = useState(false);
  return (
    <ButtonGroup>
      <Button variant="outline" size="icon" aria-label="Skip back 5 seconds">
        <SkipBack aria-hidden />
      </Button>
      <Button size="icon" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((on) => !on)}>
        {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
      </Button>
      <Button variant="outline" size="icon" aria-label="Skip forward 5 seconds">
        <SkipForward aria-hidden />
      </Button>
      <ButtonGroupText>
        <span className="font-mono tabular-nums">0:12 / 1:30</span>
      </ButtonGroupText>
    </ButtonGroup>
  );
}
