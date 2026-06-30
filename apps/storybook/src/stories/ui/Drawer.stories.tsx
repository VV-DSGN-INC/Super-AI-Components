import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Drawer> = {
  title: "shadcn/ui/Drawer",
  component: Drawer,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">Open render settings</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Render settings</DrawerTitle>
          <DrawerDescription>
            Tune the parameters for your next Aurora-XL generation.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4">
          <label className="text-sm">
            Negative prompt
            <Input className="mt-1" placeholder="blurry, low quality, watermark" />
          </label>
          <label className="text-sm">
            Seed
            <Input className="mt-1" defaultValue="48213" />
          </label>
        </div>
        <DrawerFooter>
          <Button>Apply &amp; generate</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const RightSide: Story = {
  render: () => (
    <Drawer direction="right" defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">View prompt history</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Prompt history</DrawerTitle>
          <DrawerDescription>Your last 5 prompts in this thread.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 px-4 text-sm">
          {[
            "cyberpunk alley, heavy rain",
            "same but golden hour",
            "add a lone figure with umbrella",
            "make it snow instead",
            "wide cinematic crop",
          ].map((p, i) => (
            <div key={i} className="rounded-lg border px-3 py-2 text-muted-foreground">
              {p}
            </div>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
