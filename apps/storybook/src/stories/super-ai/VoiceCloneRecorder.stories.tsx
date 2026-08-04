import type { Meta, StoryObj } from "@storybook/react-vite";

import { VoiceCloneRecorder } from "@/registry/super-ai/voice-clone-recorder";
import { VoiceCloneRecorderDocs } from "@/content/components/voice-clone-recorder.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof VoiceCloneRecorder> = {
  title: "Super AI/Voice Clone Recorder",
  component: VoiceCloneRecorder,
  parameters: { layout: "centered", docs: { page: componentDocsPage(VoiceCloneRecorderDocs) } },
};

export default meta;
type Story = StoryObj<typeof VoiceCloneRecorder>;

const SCRIPT = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "She sells seashells by the seashore every summer morning.",
];

export const PromptScript: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "prompt-script",
    onStartRecording: () => {},
  },
};

export const LevelMetering: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "level-metering",
    level: 62,
    elapsedLabel: "0:07",
    onStopRecording: () => {},
  },
};

export const Retake: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "retake",
    takeSummary: "Take recorded — 7s",
    onRetake: () => {},
    onAcceptTake: () => {},
  },
};

export const ConsentCapture: Story = {
  args: {
    script: SCRIPT,
    currentLine: 0,
    state: "consent-capture",
    speakerName: "Jamie",
    onConsent: () => {},
    onConsentCancel: () => {},
  },
};
