import type { Meta, StoryObj } from "@storybook/react-vite";

import OrbitingCirclesDemo from "@/components/demos/orbiting-circles-demo";

const meta: Meta<typeof OrbitingCirclesDemo> = {
  title: "Marketing/Effects/Orbiting Circles",
  component: OrbitingCirclesDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof OrbitingCirclesDemo>;

export const Default: Story = {};
