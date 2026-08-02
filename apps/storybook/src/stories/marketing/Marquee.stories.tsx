import type { Meta, StoryObj } from "@storybook/react-vite";

import MarqueeDemo from "@/components/demos/marquee-demo";

const meta: Meta<typeof MarqueeDemo> = {
  title: "Marketing/Layout/Marquee",
  component: MarqueeDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof MarqueeDemo>;

export const Default: Story = {};
