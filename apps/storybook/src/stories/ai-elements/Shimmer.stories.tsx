import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shimmer } from "@/components/ai-elements/shimmer";

const meta: Meta<typeof Shimmer> = {
  title: "AI Elements/Shimmer",
  component: Shimmer,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Shimmer>;

export const Default: Story = {
  render: () => (
    <Shimmer className="text-lg">Generating your marketing video…</Shimmer>
  ),
};

export const Heading: Story = {
  render: () => (
    <Shimmer as="h2" className="font-semibold text-2xl" duration={1.5}>
      Thinking through the storyboard
    </Shimmer>
  ),
};
