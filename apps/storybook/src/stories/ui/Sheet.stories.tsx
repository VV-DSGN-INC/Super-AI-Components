import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Settings, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const meta: Meta<typeof Sheet> = {
  title: "shadcn/ui/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline">
            <Settings className="size-4" />
            Model settings
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Generation settings</SheetTitle>
          <SheetDescription>
            Configure how Nova responds in this conversation.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Temperature</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                0.7
              </span>
            </div>
            <Slider defaultValue={[0.7]} min={0} max={2} step={0.1} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Max output tokens</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                2,048
              </span>
            </div>
            <Slider defaultValue={[2048]} min={256} max={8192} step={256} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Top P</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                0.95
              </span>
            </div>
            <Slider defaultValue={[0.95]} min={0} max={1} step={0.05} />
          </div>
        </div>

        <SheetFooter>
          <Button>Save settings</Button>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftFilters: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Library filters
          </Button>
        }
      />
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filter renders</SheetTitle>
          <SheetDescription>
            Narrow your image library by model and style.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Model
            </span>
            {["Nova Image XL", "Nova Canvas", "Nova Vision"].map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={m !== "Nova Vision"} />
                {m}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Style
            </span>
            {["Photoreal", "Illustration", "3D render", "Anime"].map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={s === "Photoreal"} />
                {s}
              </label>
            ))}
          </div>
        </div>

        <SheetFooter>
          <Button>Apply filters</Button>
          <SheetClose render={<Button variant="ghost">Reset</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Controlled: Story = {
  render: () => {
    function ControlledSheet() {
      const [open, setOpen] = React.useState(false);
      return (
        <div className="flex flex-col items-center gap-3">
          <Button onClick={() => setOpen(true)}>Open settings panel</Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Workspace settings</SheetTitle>
                <SheetDescription>
                  Controlled open state from outside the sheet.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 text-sm text-muted-foreground">
                Credits remaining: 1,240 / 5,000
              </div>
              <SheetFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <p className="text-xs text-muted-foreground">
            State: {open ? "open" : "closed"}
          </p>
        </div>
      );
    }
    return <ControlledSheet />;
  },
};
