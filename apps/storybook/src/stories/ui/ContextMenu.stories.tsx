import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  CopyIcon,
  DownloadIcon,
  Trash2Icon,
  SparklesIcon,
} from "lucide-react";

const meta: Meta<typeof ContextMenu> = {
  title: "shadcn/ui/Context Menu",
  component: ContextMenu,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => {
    const [favorite, setFavorite] = React.useState(true);
    const [format, setFormat] = React.useState("png");
    return (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-44 w-72 flex-col items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Right-click this render
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>render-final-8k.png</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              <SparklesIcon />
              Create variations
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <CopyIcon />
              Copy prompt
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <DownloadIcon />
                Export as
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuRadioGroup value={format} onValueChange={setFormat}>
                  <ContextMenuRadioItem value="png">PNG</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="webp">WebP</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="psd">Layered PSD</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem
            checked={favorite}
            onCheckedChange={setFavorite}
          >
            Add to favorites
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <Trash2Icon />
            Delete render
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};
