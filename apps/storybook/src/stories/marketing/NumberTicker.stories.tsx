import type { Meta, StoryObj } from "@storybook/react-vite";

import NumberTickerDemo from "@/components/marketing/demos/number-ticker-demo";

const meta: Meta<typeof NumberTickerDemo> = {
  title: "Marketing/Text/Number Ticker",
  component: NumberTickerDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof NumberTickerDemo>;

export const Default: Story = {};
