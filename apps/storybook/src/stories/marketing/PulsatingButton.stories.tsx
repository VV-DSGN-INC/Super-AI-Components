import type { Meta, StoryObj } from "@storybook/react-vite";

import PulsatingButtonDemo from "@/components/demos/pulsating-button-demo";

const meta: Meta<typeof PulsatingButtonDemo> = {
  title: "Marketing/Buttons/Pulsating Button",
  component: PulsatingButtonDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PulsatingButtonDemo>;

export const Default: Story = {};
