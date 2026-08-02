import type { Meta, StoryObj } from "@storybook/react-vite";

import DotPatternDemo from "@/components/demos/dot-pattern-demo";

const meta: Meta<typeof DotPatternDemo> = {
  title: "Marketing/Effects/Dot Pattern",
  component: DotPatternDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DotPatternDemo>;

export const Default: Story = {};
