import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, Film, Sparkles, Type, Wand2 } from "lucide-react";

import { TimelineShell, type TimelineShellProps } from "@/registry/super-ai/timeline-shell";
import { TimelineShellDocs } from "@/content/components/timeline-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

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

const TRANSCRIPT: TimelineShellProps["transcript"] = {
  speakers: [{ id: "ada", name: "Ada" }],
  segments: [
    {
      id: "seg1",
      speakerId: "ada",
      tokens: [
        { id: "w1", kind: "word", text: "The", start: 0.5, end: 0.8 },
        { id: "w2", kind: "word", text: "harbour", start: 0.8, end: 1.4 },
        { id: "w3", kind: "word", text: "never", start: 1.4, end: 1.9 },
        { id: "w4", kind: "word", text: "really", start: 1.9, end: 2.4 },
        { id: "w5", kind: "word", text: "actually", start: 2.4, end: 3, deleted: true },
        { id: "w6", kind: "word", text: "closes", start: 3, end: 3.6 },
        { id: "m1", kind: "media", media: "image", label: "Pier, dusk", start: 3.6, end: 5 },
      ],
    },
  ],
};

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

const STAGE = (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2">
    <Wand2 aria-hidden className="size-6" />
    <p className="text-sm">Harbour film — 0:13</p>
  </div>
);

const FULL_ARGS: TimelineShellProps = {
  railItems: RAIL,
  activeRailId: "media",
  onRailSelect: () => {},
  panel: { sections: PANEL_SECTIONS, searchable: true, searchPlaceholder: "Search media" },
  preview: STAGE,
  renderJobs: JOBS,
  onRetryJob: () => {},
  onCancelJob: () => {},
  onDownloadJob: () => {},
  duration: 13,
  currentTime: 3.2,
  onSeek: () => {},
  zoom: 44,
  snap: 1 / 24,
  inPoint: 1,
  outPoint: 9,
  transport: { variant: "frame-accurate", fps: 24 },
  tracks: TRACKS,
  selectedClipId: "v1",
  onSelectClip: () => {},
  inspector: {
    elementType: "clip",
    selectionLabel: "Harbour, wide",
    sections: {
      clip: [
        { id: "timing", label: "Timing", content: null },
        { id: "transform", label: "Transform", state: "modified", onReset: () => {}, content: null },
      ],
    },
  },
};

const meta: Meta<typeof TimelineShell> = {
  title: "Super AI/Timeline Shell",
  component: TimelineShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(TimelineShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimelineShell>;

/** The working editor: media panel, stage, staged renders, transport, three tracks. */
export const Tracks: Story = { args: FULL_ARGS };

/**
 * The other half of the one variant flag. H4 replaces the track stack entirely —
 * both are views of the same edit-decision list, so the playhead and the seek
 * callback are unchanged and only the dock is different.
 */
export const Transcript: Story = {
  args: {
    ...FULL_ARGS,
    variant: "transcript",
    transcript: TRANSCRIPT,
    currentTime: 1.6,
    selectedClipId: null,
  },
};

/**
 * Day one. Nothing on the timeline, nothing queued, nothing selected — five
 * empty affordances at once (stage, dock, queue, panel, inspector), which is
 * the version most new users actually see. Mandatory export for the block
 * contract.
 */
export const Empty: Story = {
  args: {
    railItems: RAIL,
    activeRailId: "media",
    duration: 0,
    transport: { variant: "frame-accurate", fps: 24 },
  },
};

/**
 * Narrow viewport. The content panel drops below `md` and the inspector below
 * `lg`, leaving the rail, the stage and the dock — the three things a timeline
 * editor cannot do without. Mandatory export for the block contract: a shell is
 * a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 * `options` is declared explicitly so the selection cannot silently resolve to
 * nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout here is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/** Export staged: a finished 720p proof and a 4K master still rendering, in one queue. */
export const Exporting: Story = {
  args: {
    ...FULL_ARGS,
    renderJobs: [
      ...JOBS,
      {
        id: "failed",
        name: "Vertical cut",
        stage: "export",
        state: "failed",
        spec: { format: "MP4", codec: "H.264", resolution: "1080×1920", fps: 30 },
        cost: { amount: 18, unit: "credits" },
        error: "The source clip was trimmed while the export was running.",
      },
    ],
  },
};
