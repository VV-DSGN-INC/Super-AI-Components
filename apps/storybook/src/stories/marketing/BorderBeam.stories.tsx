import type { Meta, StoryObj } from "@storybook/react-vite";

import BorderBeamDemo from "@/components/marketing/demos/border-beam-demo";

const meta: Meta<typeof BorderBeamDemo> = {
  title: "Marketing/Effects/Border Beam",
  component: BorderBeamDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof BorderBeamDemo>;

export const Default: Story = {};
