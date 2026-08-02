import type { Meta, StoryObj } from "@storybook/react-vite";

import EntityRowDemo from "@/components/super-ai/demos/entity-row-demo";

const meta: Meta<typeof EntityRowDemo> = {
  title: "Super AI/Entity Row",
  component: EntityRowDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof EntityRowDemo>;

export const Default: Story = {};
