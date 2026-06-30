import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  SparklesIcon,
  DownloadIcon,
  Share2Icon,
  Trash2Icon,
  SlidersHorizontalIcon,
} from "lucide-react";

const meta: Meta<typeof DropdownMenu> = {
  title: "shadcn/ui/Dropdown Menu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => {
    const [hires, setHires] = React.useState(true);
    const [quality, setQuality] = React.useState("balanced");
    return (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          Render actions
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>render-final-8k.png</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <SparklesIcon />
              Create variations
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <DownloadIcon />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PNG</DropdownMenuItem>
                <DropdownMenuItem>WebP</DropdownMenuItem>
                <DropdownMenuItem>Layered PSD</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>
              <Share2Icon />
              Share link
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel inset>
            <SlidersHorizontalIcon className="mr-1 inline size-3.5" />
            Quality
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={quality} onValueChange={setQuality}>
            <DropdownMenuRadioItem value="fast">Fast draft</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="balanced">Balanced</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="max">Max detail</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={hires} onCheckedChange={setHires}>
            Hi-res fix
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};
