import type { Meta, StoryObj } from "@storybook/react-vite";

import { VoiceProfile } from "@/registry/super-ai/voice-profile";
import { VoiceProfileDocs } from "@/content/components/voice-profile.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof VoiceProfile> = {
  title: "Super AI/Voice Profile",
  component: VoiceProfile,
  parameters: { layout: "centered", docs: { page: componentDocsPage(VoiceProfileDocs) } },
};

export default meta;
type Story = StoryObj<typeof VoiceProfile>;

export const None: Story = {};
export const Preset: Story = {};
export const Custom: Story = {};
export const Editing: Story = {};
export const Scoped: Story = {};
export const Conflict: Story = {};
export const Reset: Story = {};
