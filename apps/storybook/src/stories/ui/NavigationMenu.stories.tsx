import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Sparkles, Image, Video, Music, Settings, Zap } from "lucide-react";

const meta: Meta<typeof NavigationMenu> = {
  title: "shadcn/ui/Navigation Menu",
  component: NavigationMenu,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof NavigationMenu>;

function FeatureLink({
  icon,
  title,
  desc,
  href = "#",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
}) {
  return (
    <NavigationMenuLink href={href} className="items-start">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{desc}</span>
      </span>
    </NavigationMenuLink>
  );
}

export const Default: Story = {
  render: () => (
    <div className="flex h-[360px] items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Generate</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[360px] gap-1">
                <FeatureLink
                  icon={<Image className="size-4" />}
                  title="Images"
                  desc="Flux Pro, DALL-E 3, Recraft V3"
                />
                <FeatureLink
                  icon={<Video className="size-4" />}
                  title="Video"
                  desc="Sora Turbo, Kling 1.6, Runway Gen-3"
                />
                <FeatureLink
                  icon={<Music className="size-4" />}
                  title="Audio"
                  desc="Suno v4, ElevenLabs voices"
                />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Workspace</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[320px] gap-1">
                <FeatureLink
                  icon={<Sparkles className="size-4" />}
                  title="My projects"
                  desc="Open recent boards and threads"
                />
                <FeatureLink
                  icon={<Zap className="size-4" />}
                  title="Credits"
                  desc="2,480 left this cycle"
                />
                <FeatureLink
                  icon={<Settings className="size-4" />}
                  title="Settings"
                  desc="Defaults, API keys, billing"
                />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink href="#" className="h-9 px-2.5 font-medium">
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <div className="flex h-[360px] items-start justify-center pt-4">
      <NavigationMenu defaultValue="generate">
        <NavigationMenuList>
          <NavigationMenuItem value="generate">
            <NavigationMenuTrigger>Generate</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[360px] gap-1">
                <FeatureLink
                  icon={<Image className="size-4" />}
                  title="Images"
                  desc="Flux Pro, DALL-E 3, Recraft V3"
                />
                <FeatureLink
                  icon={<Video className="size-4" />}
                  title="Video"
                  desc="Sora Turbo, Kling 1.6, Runway Gen-3"
                />
                <FeatureLink
                  icon={<Music className="size-4" />}
                  title="Audio"
                  desc="Suno v4, ElevenLabs voices"
                />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
};
