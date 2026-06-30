import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Crop, Layers, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

const meta: Meta<typeof Popover> = {
  title: "shadcn/ui/Popover",
  component: Popover,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Popover>;

const aspectRatios = ["1:1", "4:3", "16:9", "9:16", "3:2"];

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <Sparkles className="size-4" />
            Generation settings
          </Button>
        }
      />
      <PopoverContent className="w-80" align="start">
        <PopoverHeader>
          <PopoverTitle>Image generation</PopoverTitle>
          <PopoverDescription>
            Tune how Nova renders your next prompt.
          </PopoverDescription>
        </PopoverHeader>

        <div className="mt-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              <Crop className="size-3.5" />
              Aspect ratio
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {aspectRatios.map((ratio, i) => (
                <Button
                  key={ratio}
                  size="sm"
                  variant={i === 2 ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                <Zap className="size-3.5" />
                Inference steps
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                32
              </span>
            </div>
            <Slider defaultValue={[32]} min={10} max={60} step={1} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                <Layers className="size-3.5" />
                Guidance scale
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                7.5
              </span>
            </div>
            <Slider defaultValue={[7.5]} min={1} max={15} step={0.5} />
          </div>

          <Button size="sm" className="mt-1 w-full">
            Apply to canvas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Controlled: Story = {
  render: () => {
    function ControlledPopover() {
      const [open, setOpen] = React.useState(false);
      return (
        <div className="flex flex-col items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button>
                  {open ? "Hide" : "Show"} credits
                </Button>
              }
            />
            <PopoverContent align="center">
              <PopoverHeader>
                <PopoverTitle>Credit balance</PopoverTitle>
                <PopoverDescription>
                  Renews on the 1st of each month.
                </PopoverDescription>
              </PopoverHeader>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums">
                  1,240
                </span>
                <span className="text-xs text-muted-foreground">
                  / 5,000 credits
                </span>
              </div>
              <Button size="sm" variant="outline" className="mt-1 w-full">
                Buy more credits
              </Button>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            State: {open ? "open" : "closed"}
          </p>
        </div>
      );
    }
    return <ControlledPopover />;
  },
};
