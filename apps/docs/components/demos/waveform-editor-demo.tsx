"use client";

import * as React from "react";

import { WaveformEditor, type WaveformRegion, type WaveformView } from "@/registry/super-ai/waveform-editor";

const SAMPLE_RATE = 44_100;
const SAMPLE_COUNT = 131_072;

// A deterministic stand-in for real peak data — a decaying phrase with a
// breath in the middle, so there is something worth selecting.
const PEAKS = Array.from({ length: 256 }, (_, i) => {
  const t = i / 256;
  const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
  return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
});

const REGION_ACTIONS = [
  { id: "trim", label: "Trim to region" },
  { id: "silence", label: "Silence" },
  { id: "fade", label: "Fade in" },
  { id: "delete", label: "Delete", destructive: true },
];

export default function WaveformEditorDemo() {
  const [view, setView] = React.useState<WaveformView>({ start: 0, end: SAMPLE_COUNT });
  const [region, setRegion] = React.useState<WaveformRegion | null>({
    start: 54_000,
    end: 68_500,
    label: "Breath",
  });
  const [playhead, setPlayhead] = React.useState(54_000);

  return (
    <WaveformEditor
      peaks={PEAKS}
      sampleCount={SAMPLE_COUNT}
      sampleRate={SAMPLE_RATE}
      label="Interview take 3"
      view={view}
      onViewChange={setView}
      region={region}
      onRegionChange={setRegion}
      playhead={playhead}
      // No timer anywhere: the component reports where the playhead was put
      // and this demo simply records it. Playback is the host app's concern.
      onScrub={setPlayhead}
      regionActions={REGION_ACTIONS}
      onRegionAction={(actionId, acted) => {
        if (actionId === "delete") {
          setRegion(null);
          setPlayhead(acted.start);
          return;
        }
        if (actionId === "trim") {
          setView({ start: acted.start, end: acted.end });
        }
      }}
    />
  );
}
