import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageIcon } from "lucide-react";

const meta: Meta<typeof AspectRatio> = {
  title: "shadcn/ui/Aspect Ratio",
  component: AspectRatio,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <div className="w-96">
      <AspectRatio
        ratio={16 / 9}
        className="overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
      >
        <div className="flex size-full flex-col items-center justify-center gap-2 text-white">
          <ImageIcon className="size-8" />
          <span className="text-sm font-medium">16 : 9 &mdash; Cinematic render</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-72">
      <AspectRatio
        ratio={1}
        className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-teal-400 to-blue-600 text-white"
      >
        <span className="text-sm font-medium">1 : 1 &mdash; Avatar preview</span>
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-56">
      <AspectRatio
        ratio={3 / 4}
        className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-amber-400 to-rose-600 text-white"
      >
        <span className="text-sm font-medium">3 : 4 &mdash; Poster</span>
      </AspectRatio>
    </div>
  ),
};
