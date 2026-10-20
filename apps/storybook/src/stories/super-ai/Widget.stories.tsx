import type { Meta, StoryObj } from "@storybook/react-vite";

import { Widget } from "@/registry/super-ai/widget";
import { WidgetDocs } from "@/content/components/widget.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof Widget> = {
  title: "Super AI/Widget",
  component: Widget,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WidgetDocs) } },
};

export default meta;
type Story = StoryObj<typeof Widget>;

export const Small: Story = {};
export const Medium: Story = {};
export const Large: Story = {};
export const Loading: Story = {};
export const Openable: Story = {};
export const HeaderHidden: Story = {};
