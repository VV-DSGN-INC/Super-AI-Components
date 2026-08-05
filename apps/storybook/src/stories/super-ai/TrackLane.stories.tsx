import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrackLane, type TrackClip } from "@/registry/super-ai/track-lane";
import { TrackLaneDocs } from "@/content/components/track-lane.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const DURATION = 20;
const PPS = 34;

const VIDEO: TrackClip[] = [
  { id: "v1", label: "Establishing drone", start: 0, end: 6 },
  { id: "v2", label: "Interview A-cam", start: 6.5, end: 14 },
  { id: "v3", label: "Cutaway: hands", start: 15, end: 19 },
];

const DIALOGUE: TrackClip[] = [
  { id: "d1", label: "Room tone", start: 0, end: 6, peaks: [0.2, 0.15, 0.25, 0.18, 0.22] },
  {
    id: "d2",
    label: "Interview VO",
    start: 6.5,
    end: 14,
    peaks: [0.4, 0.85, 0.6, 0.9, 0.55, 0.75, 0.45, 0.8],
  },
  { id: "d3", label: "Outro breath", start: 15, end: 19, peaks: [0.3, 0.5, 0.35, 0.2] },
];

const CAPTIONS: TrackClip[] = [
  { id: "c1", label: "Caption 1", start: 0, end: 6, text: "Nobody moves for the first minute." },
  { id: "c2", label: "Caption 2", start: 6.5, end: 14, text: "It started in a garage." },
  { id: "c3", label: "Caption 3", start: 15, end: 19, text: "And then it did not." },
];

const GRADE: TrackClip[] = [
  { id: "g1", label: "Exposure lift", start: 0, end: 6, adjustment: { name: "Exposure", amount: 12 } },
  { id: "g2", label: "Warmth", start: 6.5, end: 14, adjustment: { name: "Warmth", amount: 30 } },
  { id: "g3", label: "Vignette", start: 15, end: 19, adjustment: { name: "Vignette" } },
];

const meta: Meta<typeof TrackLane> = {
  title: "Super AI/Track Lane",
  component: TrackLane,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrackLaneDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    duration: DURATION,
    pixelsPerSecond: PPS,
    onSelectClip: () => {},
    onMutedChange: () => {},
    onSoloedChange: () => {},
    onLockedChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TrackLane>;

/** Video. The renderer draws frames; everything else is the same lane. */
export const Filmstrip: Story = {
  args: { name: "Video", type: "filmstrip", clips: VIDEO },
};

/** Audio. Same gutter, same geometry, same selection — different drawing. */
export const Waveform: Story = {
  args: { name: "Dialogue", type: "waveform", clips: DIALOGUE, soloed: true },
};

/** Captions and transcript lines are clips too, not a separate surface. */
export const Text: Story = {
  args: { name: "Captions", type: "text", clips: CAPTIONS },
};

/** Effects over a range: the fourth renderer, on the identical lane. */
export const Adjustment: Story = {
  args: { name: "Grade", type: "adjustment", clips: GRADE },
};

/** Locked is an icon, the word, and `aria-pressed` — never colour alone. */
export const Locked: Story = {
  args: { name: "Grade", type: "adjustment", clips: GRADE, locked: true, selectedClipId: "g2" },
};

/** Handles appear on selection and belong to the clip, so they move with it. */
export const TrimHandles: Story = {
  args: {
    name: "Video",
    type: "filmstrip",
    clips: VIDEO,
    selectedClipId: "v2",
    onTrimClip: () => {},
  },
};
