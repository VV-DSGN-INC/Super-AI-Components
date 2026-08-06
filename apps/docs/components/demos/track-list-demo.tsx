"use client";

import * as React from "react";

import { TrackList, type Track } from "@/registry/super-ai/track-list";

const TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    tags: ["synthwave", "instrumental"],
    peaks: [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4, 0.5],
    bpm: 124,
    musicalKey: "F minor",
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    tags: ["ambient", "loop"],
    peaks: [0.1, 0.3, 0.5, 0.2, 0.4, 0.2, 0.3, 0.1, 0.4, 0.2, 0.3, 0.2],
    bpm: 92,
    musicalKey: "C major",
  },
  // A separated stem keeps the tempo of its source but has no cover art.
  {
    id: "3",
    title: "Drums (stem)",
    artist: "Nova Kane",
    peaks: [0.6, 0.9, 0.3, 0.8, 0.4, 0.9, 0.2, 0.7, 0.5, 0.9, 0.3, 0.8],
    bpm: 124,
  },
  // A spoken clip has neither.
  {
    id: "4",
    title: "Voice memo 04",
    peaks: [0.4, 0.5, 0.3, 0.6, 0.2, 0.5, 0.3, 0.4, 0.2, 0.5, 0.3, 0.4],
  },
];

export default function TrackListDemo() {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);

  // The playhead lives out here, not in the component: nothing in the registry
  // owns an <audio> element. This stands in for whatever is actually sounding.
  React.useEffect(() => {
    if (!playingId) return;
    const timer = setInterval(() => {
      setProgress((current) => (current >= 100 ? 0 : current + 4));
    }, 160);
    return () => clearInterval(timer);
  }, [playingId]);

  return (
    <TrackList
      tracks={TRACKS}
      label="Library"
      playingId={playingId}
      progress={progress}
      // Audition is in place: the list never unmounts and nothing navigates.
      onPlayToggle={(id, playing) => {
        setProgress(0);
        setPlayingId(playing ? id : null);
      }}
      onSelect={() => {}}
    />
  );
}
