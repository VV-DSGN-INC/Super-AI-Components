import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarGroup,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";
import {
  Sparkles,
  ImageIcon,
  Download,
  Upload,
  Plus,
  Settings,
} from "lucide-react";

const meta: Meta<typeof Menubar> = {
  title: "shadcn/ui/Menubar",
  component: Menubar,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  render: () => {
    const [autoSave, setAutoSave] = React.useState(true);
    const [showGrid, setShowGrid] = React.useState(false);
    const [model, setModel] = React.useState("aurora");

    return (
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Project</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Plus />
              New canvas
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Upload />
              Import reference
              <MenubarShortcut>⌘I</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>
                <Download />
                Export as
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PNG · 1024px</MenubarItem>
                <MenubarItem>JPEG · 1024px</MenubarItem>
                <MenubarItem>WebP · 1024px</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Upscaled · 4096px</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Delete project</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Generate</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Sparkles />
              Run prompt
              <MenubarShortcut>⌘↵</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <ImageIcon />
              Create variations
              <MenubarShortcut>⌘D</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarLabel>Active model</MenubarLabel>
            <MenubarRadioGroup value={model} onValueChange={setModel}>
              <MenubarRadioItem value="aurora">
                Aurora Diffusion XL
              </MenubarRadioItem>
              <MenubarRadioItem value="lumen">Lumen Realtime</MenubarRadioItem>
              <MenubarRadioItem value="flux">Flux Turbo</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarCheckboxItem
                checked={autoSave}
                onCheckedChange={setAutoSave}
              >
                Auto-save renders
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={showGrid}
                onCheckedChange={setShowGrid}
              >
                Show alignment grid
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem>
              <Settings />
              Workspace settings
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
};

export const Simple: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Credits</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>1,240 credits left</MenubarLabel>
          <MenubarSeparator />
          <MenubarItem>
            <Plus />
            Top up balance
          </MenubarItem>
          <MenubarItem>View usage history</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};
