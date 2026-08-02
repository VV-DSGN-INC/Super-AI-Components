import type { Meta, StoryObj } from "@storybook/react-vite";

import RippleButtonDemo from "@/components/marketing/demos/ripple-button-demo";

const meta: Meta<typeof RippleButtonDemo> = {
  title: "Marketing/Buttons/Ripple Button",
  component: RippleButtonDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof RippleButtonDemo>;

export const Default: Story = {};
