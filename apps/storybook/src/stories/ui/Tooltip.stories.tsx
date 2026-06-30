import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "shadcn/ui/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  // defaultOpen renders the tooltip immediately so it's visible in the story.
  render: () => (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Regenerate image">
              <RefreshCw />
            </Button>
          }
        />
        <TooltipContent>Regenerate image</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const WithShortcut: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={
            <Button size="icon" aria-label="Generate">
              <Sparkles />
            </Button>
          }
        />
        <TooltipContent>
          Generate
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const OnHover: Story = {
  // No defaultOpen here — hover the button to reveal the tooltip.
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" aria-label="Download render">
              <Download />
              Export
            </Button>
          }
        />
        <TooltipContent side="bottom">Download as PNG (2048px)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
