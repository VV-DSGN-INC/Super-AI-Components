import type { Meta, StoryObj } from "@storybook/react-vite";

import ConfettiDemo from "@/components/marketing/demos/confetti-demo";

const meta: Meta<typeof ConfettiDemo> = {
  title: "Marketing/Effects/Confetti",
  component: ConfettiDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ConfettiDemo>;

export const Default: Story = {};
