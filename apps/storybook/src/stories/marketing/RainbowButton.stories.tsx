import type { Meta, StoryObj } from "@storybook/react-vite";

import RainbowButtonDemo from "@/components/marketing/demos/rainbow-button-demo";

const meta: Meta<typeof RainbowButtonDemo> = {
  title: "Marketing/Buttons/Rainbow Button",
  component: RainbowButtonDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof RainbowButtonDemo>;

export const Default: Story = {};
