import type { Meta, StoryObj } from "@storybook/react-vite";

import AuroraTextDemo from "@/components/marketing/demos/aurora-text-demo";

const meta: Meta<typeof AuroraTextDemo> = {
  title: "Marketing/Text/Aurora Text",
  component: AuroraTextDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AuroraTextDemo>;

export const Default: Story = {};
