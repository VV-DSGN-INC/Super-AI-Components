import type { Meta, StoryObj } from "@storybook/react-vite";

import { PromptEnhancer } from "@/registry/super-ai/prompt-enhancer";
import { PromptEnhancerDocs } from "@/content/components/prompt-enhancer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PromptEnhancer> = {
  title: "Super AI/Prompt Enhancer",
  component: PromptEnhancer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromptEnhancerDocs) } },
};

export default meta;
type Story = StoryObj<typeof PromptEnhancer>;

export const Idle: Story = {};
export const Enhancing: Story = {};
export const Suggested: Story = {};
export const Accepted: Story = {};
export const Reverted: Story = {};
export const Failed: Story = {};
