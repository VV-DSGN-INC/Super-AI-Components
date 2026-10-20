import type { Meta, StoryObj } from "@storybook/react-vite";

import { ViewFrame } from "@/registry/super-ai/view-frame";
import { ViewFrameDocs } from "@/content/components/view-frame.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ViewFrame> = {
  title: "Super AI/View Frame",
  component: ViewFrame,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ViewFrameDocs) } },
};

export default meta;
type Story = StoryObj<typeof ViewFrame>;

export const Docked: Story = {};
export const Page: Story = {};
export const WithModes: Story = {};
export const WithAskBar: Story = {};
export const Rerunning: Story = {};
export const Failed: Story = {};
