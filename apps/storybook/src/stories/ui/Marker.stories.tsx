import type { Meta, StoryObj } from "@storybook/react-vite";
import { Marker, MarkerIcon, MarkerContent } from "@/components/ui/marker";
import { Sparkles, Check, ImageIcon, Clock } from "lucide-react";

const meta: Meta<typeof Marker> = {
  title: "shadcn/ui/Marker",
  component: Marker,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "separator", "border"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Marker>;

export const Default: Story = {
  args: { variant: "default" },
  render: (args) => (
    <div className="w-[360px]">
      <Marker {...args}>
        <MarkerIcon>
          <Sparkles />
        </MarkerIcon>
        <MarkerContent>Generated with Aurora Diffusion XL</MarkerContent>
      </Marker>
    </div>
  ),
};

export const Separator: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <p className="text-sm text-muted-foreground">12 images in this batch.</p>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <p className="text-sm text-muted-foreground">4 more from yesterday.</p>
      <Marker variant="separator">
        <MarkerContent>Earlier</MarkerContent>
      </Marker>
    </div>
  ),
};

export const Border: Story = {
  render: () => (
    <div className="w-[360px]">
      <Marker variant="border">
        <MarkerIcon>
          <ImageIcon />
        </MarkerIcon>
        <MarkerContent>Render history</MarkerContent>
      </Marker>
    </div>
  ),
};

export const StatusList: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-3">
      <Marker>
        <MarkerIcon>
          <Check className="text-emerald-500" />
        </MarkerIcon>
        <MarkerContent>Upscaled to 4096px · 18 credits</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Clock className="text-amber-500" />
        </MarkerIcon>
        <MarkerContent>Variation pending in queue</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Sparkles />
        </MarkerIcon>
        <MarkerContent>Prompt enhanced by Lumen Assist</MarkerContent>
      </Marker>
    </div>
  ),
};
