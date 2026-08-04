import type { Meta, StoryObj } from "@storybook/react-vite";

import { WaveformEditor } from "@/registry/super-ai/waveform-editor";
import { WaveformEditorDocs } from "@/content/components/waveform-editor.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof WaveformEditor> = {
  title: "Super AI/Waveform Editor",
  component: WaveformEditor,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WaveformEditorDocs) } },
};

export default meta;
type Story = StoryObj<typeof WaveformEditor>;

const SAMPLE_RATE = 44_100;
const SAMPLE_COUNT = 131_072;

// A deterministic stand-in for real peak data — a decaying phrase with a
// breath in the middle, so there is something worth selecting.
const PEAKS = Array.from({ length: 256 }, (_, i) => {
  const t = i / 256;
  const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
  return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
});

const BASE = {
  peaks: PEAKS,
  sampleCount: SAMPLE_COUNT,
  sampleRate: SAMPLE_RATE,
  label: "Interview take 3",
};

export const RegionSelect: Story = {
  args: {
    ...BASE,
    view: { start: 0, end: SAMPLE_COUNT },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 54_000,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
  },
};

export const ZoomToSample: Story = {
  args: {
    ...BASE,
    // Sixteen samples across the whole strip: one column is one sample, which
    // is the point at which a click or a plosive can actually be edited.
    view: { start: 61_432, end: 61_448 },
    region: { start: 61_436, end: 61_442 },
    playhead: 61_440,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
  },
};

export const Scrub: Story = {
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    playhead: 61_440,
    region: null,
    onScrub: () => {},
    onViewChange: () => {},
  },
};

export const RegionActions: Story = {
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 54_000,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
    regionActions: [
      { id: "trim", label: "Trim to region" },
      { id: "silence", label: "Silence" },
      { id: "fade", label: "Fade in" },
      { id: "delete", label: "Delete", destructive: true },
    ],
    onRegionAction: () => {},
  },
};
