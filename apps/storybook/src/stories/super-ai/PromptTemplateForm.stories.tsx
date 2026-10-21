import type { Meta, StoryObj } from "@storybook/react-vite";

import { PromptTemplateForm } from "@/registry/super-ai/prompt-template-form";
import { PromptTemplateFormDocs } from "@/content/components/prompt-template-form.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PromptTemplateForm> = {
  title: "Super AI/Prompt Template Form",
  component: PromptTemplateForm,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromptTemplateFormDocs) } },
};

export default meta;
type Story = StoryObj<typeof PromptTemplateForm>;

export const Empty: Story = {};
export const PartiallyFilled: Story = {};
export const Complete: Story = {};
export const WithDefaults: Story = {};
export const MissingRequired: Story = {};
export const MultiStep: Story = {};
