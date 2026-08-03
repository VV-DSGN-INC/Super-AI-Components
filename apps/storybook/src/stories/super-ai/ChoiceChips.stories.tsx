import type { Meta, StoryObj } from "@storybook/react-vite";

import ChoiceChipsDemo from "@/components/demos/choice-chips-demo";

const meta: Meta<typeof ChoiceChipsDemo> = {
  title: "Super AI/Choice Chips",
  component: ChoiceChipsDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ChoiceChipsDemo>;

export const Default: Story = {};
