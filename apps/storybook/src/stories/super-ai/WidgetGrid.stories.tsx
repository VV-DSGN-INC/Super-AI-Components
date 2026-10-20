import type { Meta, StoryObj } from "@storybook/react-vite";

import { WidgetGrid } from "@/registry/super-ai/widget-grid";
import { WidgetGridDocs } from "@/content/components/widget-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof WidgetGrid> = {
  title: "Super AI/Widget Grid",
  component: WidgetGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WidgetGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof WidgetGrid>;

export const TwoColumn: Story = {};
export const FourColumn: Story = {};
export const MixedSizes: Story = {};
