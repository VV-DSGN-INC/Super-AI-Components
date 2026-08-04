import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { MediaPromptBarDocs } from "@/content/components/media-prompt-bar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MediaPromptBar> = {
  title: "Super AI/Media Prompt Bar",
  component: MediaPromptBar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MediaPromptBarDocs) } },
};

export default meta;
type Story = StoryObj<typeof MediaPromptBar>;

const SETTINGS = (
  <GenSettingsBar aria-label="Generation settings">
    <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
    <GenSettingsItem>16:9</GenSettingsItem>
    <GenSettingsItem>720p</GenSettingsItem>
  </GenSettingsBar>
);

export const Floating: Story = {
  args: {
    presentation: "floating",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

export const Docked: Story = {
  args: {
    presentation: "docked",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

export const NodeEmbedded: Story = {
  args: {
    presentation: "node-embedded",
    cost: 2,
    onSubmit: () => {},
  },
};

export const Locked: Story = {
  args: {
    locked: true,
    lockedTitle: "You've hit your plan's limit",
    lockedDescription: "Upgrade to keep generating.",
    lockedCtaLabel: "Upgrade",
    onUnlock: () => {},
  },
};

export const NegativePrompt: Story = {
  args: {
    negativePrompt: true,
    negativeValue: "blurry, low quality, watermark",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};
