import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  SparklesIcon,
  ImageIcon,
  VideoIcon,
  SettingsIcon,
  HistoryIcon,
  DownloadIcon,
  LayersIcon,
} from "lucide-react";

const meta: Meta<typeof Command> = {
  title: "shadcn/ui/Command",
  component: Command,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="w-80 rounded-xl border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Generate">
          <CommandItem>
            <SparklesIcon />
            New image prompt
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <VideoIcon />
            New video clip
            <CommandShortcut>⌘⇧N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <LayersIcon />
            Generate variations
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Library">
          <CommandItem>
            <ImageIcon />
            Browse renders
          </CommandItem>
          <CommandItem>
            <HistoryIcon />
            Recent threads
          </CommandItem>
          <CommandItem>
            <DownloadIcon />
            Export selection
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Workspace">
          <CommandItem>
            <SettingsIcon />
            Open settings
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
