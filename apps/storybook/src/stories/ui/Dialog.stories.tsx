import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Dialog> = {
  title: "shadcn/ui/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button />}>Rename thread</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename thread</DialogTitle>
          <DialogDescription>
            Give this generation thread a memorable name.
          </DialogDescription>
        </DialogHeader>
        <Input defaultValue="Neon city concepts" />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ShareRender: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline" />}>Share render</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &ldquo;render-final-8k.png&rdquo;</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this render and its prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value="https://aurora.studio/r/48213-neon" />
          <Button>Copy</Button>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
};
