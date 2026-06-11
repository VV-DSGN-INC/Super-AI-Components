"use client";

import * as React from "react";

import { ModelBar, type ModelBarPatch, type ModelBarSegment } from "@/registry/super-ai/flow/model-bar";

const IMAGE_SEGMENTS: ModelBarSegment[] = [
  {
    kind: "model",
    id: "model",
    value: "flux-1.1-pro",
    options: [
      { value: "flux-1.1-pro", label: "Flux 1.1 Pro" },
      { value: "imagen-4", label: "Imagen 4" },
    ],
  },
  {
    kind: "aspect",
    id: "aspect",
    value: "16:9",
    options: [
      { value: "1:1", label: "1:1" },
      { value: "16:9", label: "16:9" },
      { value: "9:16", label: "9:16" },
    ],
  },
  {
    kind: "resolution",
    id: "resolution",
    value: "1k",
    options: [
      { value: "1k", label: "1K" },
      { value: "2k", label: "2K" },
    ],
  },
  {
    kind: "quality",
    id: "quality",
    value: "medium",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },
];

const VIDEO_SEGMENTS: ModelBarSegment[] = [
  {
    kind: "model",
    id: "model",
    value: "veo-3.1-fast",
    options: [
      { value: "veo-3.1-fast", label: "Veo 3.1 Fast" },
      { value: "veo-3.1", label: "Veo 3.1" },
    ],
  },
  {
    kind: "aspect",
    id: "aspect",
    value: "16:9",
    options: [
      { value: "16:9", label: "16:9" },
      { value: "9:16", label: "9:16" },
    ],
  },
  {
    kind: "resolution",
    id: "resolution",
    value: "720p",
    options: [
      { value: "720p", label: "720p" },
      { value: "1080p", label: "1080p" },
    ],
  },
  { kind: "duration", id: "duration", value: 4, options: [4, 6, 8] },
  { kind: "toggle", id: "mute", label: "Mute", value: false },
];

const SFX_SEGMENTS: ModelBarSegment[] = [
  { kind: "toggle", id: "loop", label: "Loop", value: false },
  { kind: "duration", id: "duration", value: "auto", options: [4, 6, 8] },
  { kind: "percent", id: "influence", label: "Prompt influence", value: 30 },
];

const LLM_SEGMENTS: ModelBarSegment[] = [
  {
    kind: "model",
    id: "model",
    value: "claude-sonnet-4-5",
    options: [
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
  { kind: "toggle", id: "thinking", label: "Thinking", value: false },
  {
    kind: "duration",
    id: "length",
    label: "Length",
    value: "auto",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
];

function DemoBar({ caption, initial }: { caption: string; initial: ModelBarSegment[] }) {
  const [segments, setSegments] = React.useState(initial);
  const onChange = React.useCallback((patch: ModelBarPatch) => {
    setSegments((prev) => prev.map((s) => (s.id === patch.id ? { ...s, value: patch.value } : s)));
  }, []);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{caption}</span>
      <ModelBar aria-label={`${caption} settings`} segments={segments} onChange={onChange} />
    </div>
  );
}

export default function ModelBarDemo() {
  return (
    <div className="flex flex-col gap-6">
      <DemoBar caption="Image" initial={IMAGE_SEGMENTS} />
      <DemoBar caption="Video" initial={VIDEO_SEGMENTS} />
      <DemoBar caption="SFX" initial={SFX_SEGMENTS} />
      <DemoBar caption="LLM" initial={LLM_SEGMENTS} />
    </div>
  );
}
