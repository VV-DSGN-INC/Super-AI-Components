import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontalIcon } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "shadcn/ui/Card",
  component: Card,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Aurora-XL 2.0</CardTitle>
        <CardDescription>
          Photoreal diffusion model with improved text rendering.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">New</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5 text-muted-foreground">
          <li>Resolution up to 8K</li>
          <li>4 credits per standard render</li>
          <li>Supports depth &amp; pose control</li>
        </ul>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-muted-foreground">Used in 12 threads</span>
        <Button size="sm">Select model</Button>
      </CardFooter>
    </Card>
  ),
};

export const UsageStat: Story = {
  render: () => (
    <Card size="sm" className="w-64">
      <CardHeader>
        <CardDescription>Credits remaining</CardDescription>
        <CardTitle className="text-2xl tabular-nums">3,820</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Resets in 9 days &middot; 1,180 used this cycle
        </p>
      </CardContent>
    </Card>
  ),
};

export const RenderPreview: Story = {
  render: () => (
    <Card className="w-72">
      <img
        src="https://picsum.photos/seed/aurora/400/240"
        alt="Generated render"
        className="h-40 w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Neon city alley</CardTitle>
        <CardDescription>Aurora-XL &middot; 1024&times;1024 &middot; seed 48213</CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          Upscale
        </Button>
        <Button size="sm" className="flex-1">
          Variations
        </Button>
      </CardFooter>
    </Card>
  ),
};
