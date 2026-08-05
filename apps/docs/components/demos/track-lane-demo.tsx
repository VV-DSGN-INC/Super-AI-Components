"use client";

import * as React from "react";

import { TrackLane, type TrackClip } from "@/registry/super-ai/track-lane";

const DURATION = 24;
const PPS = 36;

const VIDEO: TrackClip[] = [
  { id: "v1", label: "Establishing drone", start: 0, end: 7 },
  { id: "v2", label: "Interview A-cam", start: 7.5, end: 16 },
  { id: "v3", label: "Cutaway: hands", start: 17, end: 23 },
];

const DIALOGUE: TrackClip[] = [
  { id: "d1", label: "Room tone", start: 0, end: 7, peaks: [0.2, 0.15, 0.25, 0.18, 0.22] },
  {
    id: "d2",
    label: "Interview VO",
    start: 7.5,
    end: 16,
    peaks: [0.4, 0.85, 0.6, 0.9, 0.55, 0.75, 0.45, 0.8],
  },
  { id: "d3", label: "Outro breath", start: 17, end: 23, peaks: [0.3, 0.5, 0.35, 0.2] },
];

const CAPTIONS: TrackClip[] = [
  { id: "c1", label: "Caption 1", start: 0, end: 7, text: "Nobody moves for the first minute." },
  { id: "c2", label: "Caption 2", start: 7.5, end: 16, text: "It started in a garage." },
  { id: "c3", label: "Caption 3", start: 17, end: 23, text: "And then it did not." },
];

const GRADE: TrackClip[] = [
  { id: "g1", label: "Exposure lift", start: 0, end: 7, adjustment: { name: "Exposure", amount: 12 } },
  { id: "g2", label: "Warmth", start: 7.5, end: 16, adjustment: { name: "Warmth", amount: 30 } },
  { id: "g3", label: "Vignette", start: 17, end: 23, adjustment: { name: "Vignette" } },
];

export default function TrackLaneDemo() {
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>("d2");
  const [muted, setMuted] = React.useState(false);
  const [soloed, setSoloed] = React.useState(false);
  const [locked, setLocked] = React.useState(true);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-1.5">
      <TrackLane
        name="Video"
        type="filmstrip"
        clips={VIDEO}
        duration={DURATION}
        pixelsPerSecond={PPS}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
      />
      <TrackLane
        name="Dialogue"
        type="waveform"
        clips={DIALOGUE}
        duration={DURATION}
        pixelsPerSecond={PPS}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        muted={muted}
        onMutedChange={setMuted}
        soloed={soloed}
        onSoloedChange={setSoloed}
      />
      <TrackLane
        name="Captions"
        type="text"
        clips={CAPTIONS}
        duration={DURATION}
        pixelsPerSecond={PPS}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
      />
      <TrackLane
        name="Grade"
        type="adjustment"
        clips={GRADE}
        duration={DURATION}
        pixelsPerSecond={PPS}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        locked={locked}
        onLockedChange={setLocked}
      />
    </div>
  );
}
