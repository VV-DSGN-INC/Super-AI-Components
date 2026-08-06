"use client";

import { TrackList, type Track } from "@/registry/super-ai/track-list";

/** Live examples for track-list.docs.tsx — client sidecar, see the docs module. */

const COMPARABLE: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    tags: ["synthwave"],
    peaks: [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3],
    bpm: 124,
    musicalKey: "F minor",
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    tags: ["ambient"],
    peaks: [0.1, 0.3, 0.5, 0.2, 0.4, 0.2, 0.3, 0.1],
    bpm: 92,
    musicalKey: "C major",
  },
];

const SPARSE: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    tags: ["synthwave"],
    peaks: [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3],
    bpm: 124,
    musicalKey: "F minor",
  },
  // A separated stem has no cover art; a spoken clip has no key.
  {
    id: "2",
    title: "Drums (stem)",
    artist: "Nova Kane",
    peaks: [0.6, 0.9, 0.3, 0.8, 0.4, 0.9, 0.2, 0.7],
    bpm: 124,
  },
  { id: "3", title: "Voice memo 04", peaks: [0.4, 0.5, 0.3, 0.6, 0.2, 0.5, 0.3, 0.4] },
];

// Tempo and key smuggled into a free-text tag: unsortable, unfilterable, and
// impossible to line up two rows against.
const AS_GENERIC_METADATA: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    tags: ["synthwave", "124 BPM", "F minor"],
    peaks: [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3],
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    tags: ["ambient", "92bpm", "key of C"],
    peaks: [0.1, 0.3, 0.5, 0.2, 0.4, 0.2, 0.3, 0.1],
  },
];

// Absences filled in with values that are not true.
const ZERO_FILLED: Track[] = [
  {
    id: "2",
    title: "Drums (stem)",
    artist: "Nova Kane",
    tags: ["untagged"],
    peaks: [0.6, 0.9, 0.3, 0.8, 0.4, 0.9, 0.2, 0.7],
    bpm: 124,
    musicalKey: "n/a",
  },
  {
    id: "3",
    title: "Voice memo 04",
    tags: ["untagged"],
    peaks: [0.4, 0.5, 0.3, 0.6, 0.2, 0.5, 0.3, 0.4],
    bpm: 0,
    musicalKey: "n/a",
  },
];

/** DO — tempo and key get columns of their own, so two takes line up. */
export function TempoAndKeyAsColumns() {
  return (
    <TrackList tracks={COMPARABLE} label="Library" playingId="1" progress={45} onPlayToggle={() => {}} />
  );
}

/** DO — a row with no art, no tags or no key says so, in words. */
export function AbsenceIsStated() {
  return <TrackList tracks={SPARSE} label="Library" onPlayToggle={() => {}} />;
}

/** DO NOT — tempo and key as free-text tags. Nothing here can be sorted or compared. */
export function TempoBuriedInTags() {
  return <TrackList tracks={AS_GENERIC_METADATA} label="Library" onPlayToggle={() => {}} />;
}

/** DO NOT — filler values in place of absences. A stem is not 0 BPM. */
export function ZeroFilledMetadata() {
  return <TrackList tracks={ZERO_FILLED} label="Library" onPlayToggle={() => {}} />;
}
