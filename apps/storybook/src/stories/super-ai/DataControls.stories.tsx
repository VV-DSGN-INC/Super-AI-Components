import type { Meta, StoryObj } from "@storybook/react-vite";

import { DataControls } from "@/registry/super-ai/data-controls";
import { DataControlsDocs } from "@/content/components/data-controls.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof DataControls> = {
  title: "Super AI/Data Controls",
  component: DataControls,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DataControlsDocs) } },
};

export default meta;
type Story = StoryObj<typeof DataControls>;

export const TrainingOn: Story = {};
export const TrainingOff: Story = {};
export const Retention: Story = {};
export const PlanLocked: Story = {};
export const NoneCollected: Story = {};
export const AdminManaged: Story = {};
