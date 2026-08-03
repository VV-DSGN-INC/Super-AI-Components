import type { Meta, StoryObj } from "@storybook/react-vite";

import ResetAffordanceDemo from "@/components/demos/reset-affordance-demo";

const meta: Meta<typeof ResetAffordanceDemo> = {
  title: "Super AI/Reset Affordance",
  component: ResetAffordanceDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ResetAffordanceDemo>;

export const Default: Story = {};
