import type { Meta, StoryObj } from "@storybook/react-vite";

import { TtsComposer } from "@/registry/super-ai/tts-composer";
import { TtsComposerDocs } from "@/content/components/tts-composer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TtsComposer> = {
  title: "Super AI/Tts Composer",
  component: TtsComposer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TtsComposerDocs) } },
};

export default meta;
type Story = StoryObj<typeof TtsComposer>;

const VOICE_OPTIONS = ["Bella — Warm", "Atlas — Deep", "Nova — Bright"];
const EMOTION_OPTIONS = ["Neutral", "Warm", "Excited", "Serious"];

export const SegmentSelect: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Welcome back to Signal Boost — the show about products people actually finish building.",
        voice: "Bella — Warm",
        emotion: "Warm",
        status: "ready",
        durationLabel: "0:05",
        regenerateCost: 2,
      },
      {
        id: "s2",
        text: "Today we're talking about the part of a design system nobody puts on the roadmap.",
        voice: "Bella — Warm",
        emotion: "Neutral",
        status: "ready",
        durationLabel: "0:04",
        regenerateCost: 2,
      },
      {
        id: "s3",
        text: "Our guest spent three years shipping the component library at a company you've used.",
        voice: "Atlas — Deep",
        emotion: "Excited",
        speed: 1.2,
        status: "idle",
        regenerateCost: 3,
      },
    ],
    selectedSegmentId: "s2",
    onSelectSegment: () => {},
    onSegmentTextChange: () => {},
    voiceOptions: VOICE_OPTIONS,
    emotionOptions: EMOTION_OPTIONS,
    onSegmentVoiceChange: () => {},
    onSegmentEmotionChange: () => {},
    onSegmentSpeedChange: () => {},
    onRegenerateSegment: () => {},
  },
};

export const PerSegmentRegenerate: Story = {
  args: {
    segments: [
      {
        id: "s1",
        text: "Welcome back to Signal Boost.",
        voice: "Bella — Warm",
        status: "ready",
        durationLabel: "0:03",
        regenerateCost: 2,
      },
      {
        id: "s2",
        text: "Today we're talking about accessibility in design systems.",
        voice: "Bella — Warm",
        status: "generating",
        regenerateCost: 2,
      },
      {
        id: "s3",
        text: "Here's a take that came out wrong the first time.",
        voice: "Atlas — Deep",
        status: "failed",
        regenerateCost: 3,
      },
    ],
    onSelectSegment: () => {},
    onRegenerateSegment: () => {},
  },
};

export const WholeScriptPlay: Story = {
  args: {
    segments: [
      { id: "s1", text: "Welcome back to Signal Boost.", voice: "Bella — Warm", status: "ready", durationLabel: "0:03" },
      {
        id: "s2",
        text: "Today we're talking about accessibility in design systems.",
        voice: "Bella — Warm",
        status: "ready",
        durationLabel: "0:05",
      },
      {
        id: "s3",
        text: "Our guest spent three years shipping the component library everyone uses.",
        voice: "Atlas — Deep",
        status: "ready",
        durationLabel: "0:07",
      },
    ],
    isPlayingScript: true,
    playingSegmentId: "s2",
    scriptDurationLabel: "0:15",
    onPlayScript: () => {},
    onPauseScript: () => {},
    onPlaySegment: () => {},
    onPauseSegment: () => {},
    onSelectSegment: () => {},
    onRegenerateSegment: () => {},
  },
};
