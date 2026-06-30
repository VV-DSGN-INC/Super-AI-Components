import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ImageIcon,
  MessageSquare,
  Zap,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  Cpu,
} from "lucide-react";

const meta: Meta<typeof Item> = {
  title: "shadcn/ui/Item",
  component: Item,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "inline-radio",
      options: ["default", "sm", "xs"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Item>;

export const Default: Story = {
  args: { variant: "outline" },
  render: (args) => (
    <Item {...args} className="w-[380px]">
      <ItemMedia variant="icon">
        <Sparkles />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Aurora Diffusion XL</ItemTitle>
        <ItemDescription>
          High-fidelity text-to-image model. Best for cinematic stills and
          product renders.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          Use model
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const ModelList: Story = {
  render: () => (
    <ItemGroup className="w-[440px]">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Sparkles />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            Aurora Diffusion XL
            <Badge variant="secondary">New</Badge>
          </ItemTitle>
          <ItemDescription>1024px · 8 credits / image</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            <ArrowUpRight />
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Cpu />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Lumen Realtime</ItemTitle>
          <ItemDescription>512px · 2 credits / image</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            <ArrowUpRight />
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Zap />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Flux Turbo</ItemTitle>
          <ItemDescription>768px · 4 credits / image</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            <ArrowUpRight />
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};

export const WithImageMedia: Story = {
  render: () => (
    <Item variant="muted" className="w-[400px]">
      <ItemMedia variant="image">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&h=160&fit=crop"
          alt="Generated artwork thumbnail"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Neon koi in a midnight pond</ItemTitle>
        <ItemDescription>
          Aurora Diffusion XL · seed 84213 · 1024×1024
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          <Download />
          Save
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const HeaderAndFooter: Story = {
  render: () => (
    <Item variant="outline" className="w-[420px]">
      <ItemHeader>
        <ItemTitle>Render queue</ItemTitle>
        <Badge variant="secondary">3 pending</Badge>
      </ItemHeader>
      <ItemMedia variant="icon">
        <ImageIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Batch: &quot;Cyberpunk alley pack&quot;</ItemTitle>
        <ItemDescription>
          12 of 16 images complete · est. 40s remaining
        </ItemDescription>
      </ItemContent>
      <ItemFooter>
        <span className="text-xs text-muted-foreground">
          Started 2:14 PM · 96 credits used
        </span>
        <Button size="sm" variant="ghost">
          <MoreHorizontal />
        </Button>
      </ItemFooter>
    </Item>
  ),
};

export const Sizes: Story = {
  render: () => (
    <ItemGroup className="w-[400px]">
      <Item variant="outline" size="default">
        <ItemMedia variant="icon">
          <MessageSquare />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Default size</ItemTitle>
          <ItemDescription>Comfortable padding for cards.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <MessageSquare />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Small size</ItemTitle>
          <ItemDescription>Tighter spacing for dense lists.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" size="xs">
        <ItemMedia variant="icon">
          <MessageSquare />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Extra small</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
