import type { Meta, StoryObj } from "@storybook/react-vite";

import { AiLabel } from "@/registry/super-ai/ai-label";
import { AiLabelDocs } from "@/content/components/ai-label.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AiLabel> = {
  title: "Super AI/AI Label",
  component: AiLabel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AiLabelDocs) } },
};

export default meta;
type Story = StoryObj<typeof AiLabel>;

export const Generated: Story = {};
export const Edited: Story = {};
export const Summarized: Story = {};
export const Sender: Story = {};
export const AfterHandoff: Story = {};
export const TextTint: Story = {};
