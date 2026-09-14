import type { Meta, StoryObj } from "@storybook/react-vite";

import { AiNode } from "@/registry/super-ai/ai-node";
import { AiNodeDocs } from "@/content/components/ai-node.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AiNode> = {
  title: "Super AI/AI Node",
  component: AiNode,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiNodeDocs) } },
};

export default meta;
type Story = StoryObj<typeof AiNode>;

export const Idle: Story = {};
export const Queued: Story = {};
export const Streaming: Story = {};
export const Done: Story = {};
export const Failed: Story = {};
export const Locked: Story = {};
export const Selected: Story = {};
export const MenuFloating: Story = {};
