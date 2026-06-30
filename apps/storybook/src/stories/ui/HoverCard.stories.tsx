import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof HoverCard> = {
  title: "shadcn/ui/Hover Card",
  component: HoverCard,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const ModelInfo: Story = {
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger render={<Button variant="link" />}>
        Aurora-XL 2.0
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Aurora-XL 2.0</span>
            <Badge variant="secondary">Photoreal</Badge>
          </div>
          <p className="text-muted-foreground">
            High-fidelity diffusion model with improved hands and text. Best for
            cinematic and product shots.
          </p>
          <div className="text-xs text-muted-foreground">
            4 credits / render &middot; up to 8K
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const ArtistProfile: Story = {
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger render={<Button variant="link" />}>
        @maya.renders
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <Avatar size="lg">
            <AvatarImage src="https://i.pravatar.cc/120?img=47" alt="Maya" />
            <AvatarFallback>MC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Maya Chen</span>
            <span className="text-xs text-muted-foreground">
              1,204 renders shared
            </span>
            <p className="mt-1 text-muted-foreground">
              Concept artist exploring neon-noir worlds with Aurora-XL.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
