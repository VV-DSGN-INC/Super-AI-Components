import type { Meta, StoryObj } from "@storybook/react-vite";

import BentoGridDemo from "@/components/marketing/demos/bento-grid-demo";

const meta: Meta<typeof BentoGridDemo> = {
  title: "Marketing/Layout/Bento Grid",
  component: BentoGridDemo,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BentoGridDemo>;

export const Default: Story = {};
