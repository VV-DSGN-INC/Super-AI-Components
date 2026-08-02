import type { Meta, StoryObj } from "@storybook/react-vite";

import TerminalDemo from "@/components/demos/terminal-demo";

const meta: Meta<typeof TerminalDemo> = {
  title: "Marketing/Layout/Terminal",
  component: TerminalDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof TerminalDemo>;

export const Default: Story = {};
