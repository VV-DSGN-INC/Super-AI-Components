import type { Meta, StoryObj } from "@storybook/react-vite";

import PreviewTileDemo from "@/components/super-ai/demos/preview-tile-demo";

const meta: Meta<typeof PreviewTileDemo> = {
  title: "Super AI/Preview Tile",
  component: PreviewTileDemo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PreviewTileDemo>;

export const Default: Story = {};
