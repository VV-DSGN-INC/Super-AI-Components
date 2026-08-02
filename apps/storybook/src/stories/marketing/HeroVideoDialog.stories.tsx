import type { Meta, StoryObj } from "@storybook/react-vite";

import HeroVideoDialogDemo from "@/components/demos/hero-video-dialog-demo";

const meta: Meta<typeof HeroVideoDialogDemo> = {
  title: "Marketing/Layout/Hero Video Dialog",
  component: HeroVideoDialogDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof HeroVideoDialogDemo>;

export const Default: Story = {};
