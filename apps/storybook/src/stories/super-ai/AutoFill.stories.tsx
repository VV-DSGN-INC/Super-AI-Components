import type { Meta, StoryObj } from "@storybook/react-vite";

import { AutoFill } from "@/registry/super-ai/auto-fill";
import { AutoFillDocs } from "@/content/components/auto-fill.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AutoFill> = {
  title: "Super AI/Auto Fill",
  component: AutoFill,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AutoFillDocs) } },
};

export default meta;
type Story = StoryObj<typeof AutoFill>;

export const Configuring: Story = {};
export const SamplePreview: Story = {};
export const Applying: Story = {};
export const Suggested: Story = {};
export const Accepted: Story = {};
export const Overridden: Story = {};
export const Failed: Story = {};
