import type { Meta, StoryObj } from "@storybook/react-vite";

import TypingAnimationDemo from "@/components/marketing/demos/typing-animation-demo";

const meta: Meta<typeof TypingAnimationDemo> = {
  title: "Marketing/Text/Typing Animation",
  component: TypingAnimationDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof TypingAnimationDemo>;

export const Default: Story = {};
