import type { Meta, StoryObj } from "@storybook/react-vite";

import { AgentPresence } from "@/registry/super-ai/agent-presence";
import { AgentPresenceDocs } from "@/content/components/agent-presence.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AgentPresence> = {
  title: "Super AI/Agent Presence",
  component: AgentPresence,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AgentPresenceDocs) } },
};

export default meta;
type Story = StoryObj<typeof AgentPresence>;

export const Idle: Story = {};
export const Watching: Story = {};
export const Acting: Story = {};
export const NeedsYou: Story = {};
export const Paused: Story = {};
export const TakenOver: Story = {};
