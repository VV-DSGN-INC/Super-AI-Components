import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrackList, type Track } from "@/registry/super-ai/track-list";
import { TrackListDocs } from "@/content/components/track-list.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PEAKS = [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4, 0.5];
const QUIET = [0.1, 0.3, 0.5, 0.2, 0.4, 0.2, 0.3, 0.1, 0.4, 0.2, 0.3, 0.2];

const art = (label: string) => (
  <img
    src={`https://placehold.co/80x80?text=${encodeURIComponent(label)}`}
    alt=""
    className="h-full w-full object-cover"
  />
);

const TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    artwork: art("MD"),
    tags: ["synthwave", "instrumental"],
    peaks: PEAKS,
    bpm: 124,
    musicalKey: "F minor",
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    artwork: art("PL"),
    tags: ["ambient", "loop"],
    peaks: QUIET,
    bpm: 92,
    musicalKey: "C major",
  },
  {
    id: "3",
    title: "Drums (stem)",
    artist: "Nova Kane",
    tags: ["stem"],
    peaks: PEAKS,
    bpm: 124,
    musicalKey: "F minor",
  },
];

const meta: Meta<typeof TrackList> = {
  title: "Super AI/Track List",
  component: TrackList,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrackListDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[56rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    tracks: TRACKS,
    label: "Library",
    onPlayToggle: () => {},
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TrackList>;

/** Cover art is the caller's own node, decorative so it never re-announces the title. */
export const Artwork: Story = {};

/** Tags describe; they are not where tempo or key belong. */
export const Tags: Story = {
  args: {
    tracks: TRACKS.map((t) => ({ ...t, artwork: undefined })),
  },
};

/** A row-height audition strip, filling in place while a row sounds. */
export const InlineWaveform: Story = {
  args: { playingId: "1", progress: 45 },
};

/** Right-aligned and tabular, so two tempos line up digit for digit. */
export const Bpm: Story = {
  args: {
    tracks: [
      { id: "1", title: "Midnight Drive", artist: "Nova Kane", peaks: PEAKS, bpm: 124 },
      { id: "2", title: "Paper Lanterns", artist: "Ilya Sound", peaks: QUIET, bpm: 92 },
      { id: "3", title: "Half-time edit", artist: "Nova Kane", peaks: PEAKS, bpm: 62 },
    ],
  },
};

/** Free text, because notation conventions differ between tools. */
export const MusicalKey: Story = {
  args: {
    tracks: [
      { id: "1", title: "Midnight Drive", peaks: PEAKS, bpm: 124, musicalKey: "F minor" },
      { id: "2", title: "Paper Lanterns", peaks: QUIET, bpm: 92, musicalKey: "C major" },
      { id: "3", title: "Harmonic import", peaks: PEAKS, bpm: 128, musicalKey: "9A" },
    ],
  },
};

/** A stem has no cover art and a spoken clip has no key. Both absences are stated. */
export const SparseMetadata: Story = {
  args: {
    tracks: [
      TRACKS[0],
      { id: "3", title: "Drums (stem)", artist: "Nova Kane", peaks: PEAKS, bpm: 124 },
      { id: "4", title: "Voice memo 04", peaks: QUIET },
    ],
  },
};
