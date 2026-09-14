import type { Meta, StoryObj } from "@storybook/react-vite";

import { NodeStatus } from "@/registry/super-ai/node-status";
import { NodeStatusDocs } from "@/content/components/node-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof NodeStatus> = {
  title: "Super AI/Node Status",
  component: NodeStatus,
  parameters: { layout: "centered", docs: { page: componentDocsPage(NodeStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof NodeStatus>;

export const Idle: Story = {};
export const Queued: Story = {};
export const Streaming: Story = {};
export const Done: Story = {};
export const Failed: Story = {};
export const Locked: Story = {};
export const Compact: Story = {};
