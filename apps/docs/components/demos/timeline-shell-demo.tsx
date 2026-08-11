"use client";

import { AudioLines, Film, Sparkles, Type, Wand2 } from "lucide-react";
import * as React from "react";

import { TimelineShell, type TimelineShellProps } from "@/registry/super-ai/timeline-shell";
import { PropertyRow } from "@/registry/super-ai/property-inspector";
import { Input } from "@/components/ui/input";

const RAIL = [
  { id: "media", label: "Media", icon: <Film /> },
  { id: "audio", label: "Audio", icon: <AudioLines /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "effects", label: "Effects", icon: <Sparkles />, badge: "new" as const },
];

const PANEL_SECTIONS = [
  {
    id: "recent",
    title: "Recent clips",
    count: 4,
    items: [
      { id: "m1", label: "Harbour, wide" },
      { id: "m2", label: "Harbour, close" },
      { id: "m3", label: "Interview A" },
      { id: "m4", label: "Interview B" },
    ],
  },
  {
    id: "b-roll",
    title: "Suggested b-roll",
    collapsible: true,
    items: [
      { id: "b1", label: "Gulls over the pier" },
      { id: "b2", label: "Crane at dusk" },
    ],
  },
];

const TRACKS: TimelineShellProps["tracks"] = [
  {
    id: "video",
    name: "Video",
    type: "filmstrip",
    clips: [
      { id: "v1", label: "Harbour, wide", start: 0, end: 5.5 },
      { id: "v2", label: "Interview A", start: 5.5, end: 13 },
    ],
  },
  {
    id: "voice",
    name: "Voice",
    type: "waveform",
    clips: [{ id: "a1", label: "Narration", start: 0.5, end: 12.5 }],
  },
  {
    id: "captions",
    name: "Captions",
    type: "text",
    clips: [
      { id: "t1", label: "Opening line", text: "The harbour never really closes.", start: 0.5, end: 4 },
      { id: "t2", label: "Second line", text: "It just gets quieter.", start: 4, end: 7 },
    ],
  },
];

const JOBS: TimelineShellProps["renderJobs"] = [
  {
    id: "preview",
    name: "Rough cut preview",
    stage: "preview",
    state: "done",
    spec: { format: "MP4", codec: "H.264", resolution: "1280×720", fps: 24 },
    cost: { amount: 2, unit: "credits" },
    downloadUrl: "#",
  },
  {
    id: "export",
    name: "Harbour film — final",
    stage: "export",
    state: "streaming",
    progress: 38,
    spec: { format: "MP4", codec: "H.265", resolution: "3840×2160", fps: 24 },
    cost: { amount: 40, unit: "credits" },
  },
];

export default function TimelineShellDemo() {
  const [currentTime, setCurrentTime] = React.useState(3.2);
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>("v1");

  return (
    <TimelineShell
      className="h-[42rem]"
      railItems={RAIL}
      activeRailId="media"
      panel={{ sections: PANEL_SECTIONS, searchable: true, searchPlaceholder: "Search media" }}
      preview={
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <Wand2 aria-hidden className="size-6" />
          <p className="text-sm">Harbour film — 0:13</p>
        </div>
      }
      renderJobs={JOBS}
      duration={13}
      currentTime={currentTime}
      onSeek={setCurrentTime}
      zoom={44}
      snap={1 / 24}
      inPoint={1}
      outPoint={9}
      transport={{ variant: "frame-accurate", fps: 24 }}
      tracks={TRACKS}
      selectedClipId={selectedClipId}
      onSelectClip={setSelectedClipId}
      inspector={{
        elementType: "clip",
        selectionLabel: "Harbour, wide",
        sections: {
          clip: [
            {
              id: "timing",
              label: "Timing",
              content: (
                <PropertyRow label="Speed" hint="Playback rate for this clip only.">
                  {(id) => <Input id={id} defaultValue="1.0×" className="h-8" />}
                </PropertyRow>
              ),
            },
            {
              id: "transform",
              label: "Transform",
              state: "modified",
              onReset: () => {},
              content: (
                <PropertyRow label="Scale" state="modified" onReset={() => {}}>
                  {(id) => <Input id={id} defaultValue="112%" className="h-8" />}
                </PropertyRow>
              ),
            },
          ],
        },
      }}
    />
  );
}
