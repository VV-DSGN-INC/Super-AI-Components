import type { Meta, StoryObj } from "@storybook/react-vite";
import { Loader } from "@/components/ai-elements/loader";

const meta: Meta<typeof Loader> = {
  title: "AI Elements/Loader",
  component: Loader,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {
  render: () => <Loader size={24} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-muted-foreground">
      <Loader size={16} />
      <Loader size={24} />
      <Loader size={32} />
      <span className="flex items-center gap-2 text-sm">
        <Loader size={16} /> Rendering video…
      </span>
    </div>
  ),
};
