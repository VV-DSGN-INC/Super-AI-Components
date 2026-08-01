import type { Meta, StoryObj } from "@storybook/react-vite";

import TextAnimateDemo from "@/components/marketing/demos/text-animate-demo";

const meta: Meta<typeof TextAnimateDemo> = {
  title: "Marketing/Text/Text Animate",
  component: TextAnimateDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof TextAnimateDemo>;

export const Default: Story = {};
