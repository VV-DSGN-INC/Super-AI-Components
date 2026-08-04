import type { Meta, StoryObj } from "@storybook/react-vite";

import SectionHeaderDemo from "@/components/demos/section-header-demo";

const meta: Meta<typeof SectionHeaderDemo> = {
  title: "Super AI/Section Header",
  component: SectionHeaderDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof SectionHeaderDemo>;

export const Default: Story = {};
