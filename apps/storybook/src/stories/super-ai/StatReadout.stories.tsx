import type { Meta, StoryObj } from "@storybook/react-vite";

import StatReadoutDemo from "@/components/demos/stat-readout-demo";

const meta: Meta<typeof StatReadoutDemo> = {
  title: "Super AI/Stat Readout",
  component: StatReadoutDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof StatReadoutDemo>;

export const Default: Story = {};
