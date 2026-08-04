"use client";

import * as React from "react";

import { TtsComposer, type TtsComposerSegment } from "@/registry/super-ai/tts-composer";

const VOICE_OPTIONS = ["Bella — Warm", "Atlas — Deep", "Nova — Bright"];
const EMOTION_OPTIONS = ["Neutral", "Warm", "Excited", "Serious"];

const INITIAL_SEGMENTS: TtsComposerSegment[] = [
  {
    id: "s1",
    text: "Welcome back to Signal Boost — the show about products people actually finish building.",
    voice: "Bella — Warm",
    emotion: "Warm",
    speed: 1,
    status: "ready",
    durationLabel: "0:05",
    regenerateCost: 2,
  },
  {
    id: "s2",
    text: "Today we're talking about the part of a design system nobody puts on the roadmap: accessibility.",
    voice: "Bella — Warm",
    emotion: "Neutral",
    speed: 1,
    status: "ready",
    durationLabel: "0:06",
    regenerateCost: 2,
  },
  {
    id: "s3",
    text: "Our guest spent three years shipping the component library at a company you've definitely used.",
    voice: "Atlas — Deep",
    emotion: "Excited",
    speed: 1.2,
    status: "idle",
    regenerateCost: 3,
  },
];

export default function TtsComposerDemo() {
  const [segments, setSegments] = React.useState<TtsComposerSegment[]>(INITIAL_SEGMENTS);
  const [selectedSegmentId, setSelectedSegmentId] = React.useState<string | undefined>("s1");
  const [playingSegmentId, setPlayingSegmentId] = React.useState<string | null>(null);
  const [isPlayingScript, setIsPlayingScript] = React.useState(false);

  const patchSegment = (id: string, patch: Partial<TtsComposerSegment>) => {
    setSegments((current) => current.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)));
  };

  const handleRegenerateSegment = (id: string) => {
    patchSegment(id, { status: "generating" });
    // Simulated regeneration — a real integration awaits the TTS call here.
    window.setTimeout(() => {
      patchSegment(id, { status: "ready", durationLabel: "0:04" });
    }, 1200);
  };

  const handlePlayScript = () => {
    setIsPlayingScript(true);
    setPlayingSegmentId(segments.find((segment) => segment.status === "ready")?.id ?? null);
  };

  const handlePauseScript = () => {
    setIsPlayingScript(false);
    setPlayingSegmentId(null);
  };

  return (
    <TtsComposer
      segments={segments}
      selectedSegmentId={selectedSegmentId}
      onSelectSegment={setSelectedSegmentId}
      onSegmentTextChange={(id, text) => patchSegment(id, { text })}
      playingSegmentId={playingSegmentId}
      onPlaySegment={(id) => setPlayingSegmentId(id)}
      onPauseSegment={() => setPlayingSegmentId(null)}
      isPlayingScript={isPlayingScript}
      onPlayScript={handlePlayScript}
      onPauseScript={handlePauseScript}
      scriptDurationLabel="0:15"
      onRegenerateSegment={handleRegenerateSegment}
      voiceOptions={VOICE_OPTIONS}
      emotionOptions={EMOTION_OPTIONS}
      onSegmentVoiceChange={(id, voice) => patchSegment(id, { voice })}
      onSegmentEmotionChange={(id, emotion) => patchSegment(id, { emotion })}
      onSegmentSpeedChange={(id, speed) => patchSegment(id, { speed })}
    />
  );
}
