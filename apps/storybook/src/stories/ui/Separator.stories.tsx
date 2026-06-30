import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "shadcn/ui/Separator",
  component: Separator,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Nova workspace</h4>
        <p className="text-sm text-muted-foreground">
          AI image and chat studio for your team.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Chat</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Image Studio</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Library</span>
      </div>
    </div>
  ),
};

export const StatRow: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4 rounded-lg border bg-card px-4 text-card-foreground">
      <div className="flex flex-col">
        <span className="text-lg font-semibold tabular-nums">1,240</span>
        <span className="text-xs text-muted-foreground">Credits</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold tabular-nums">386</span>
        <span className="text-xs text-muted-foreground">Renders</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold tabular-nums">8</span>
        <span className="text-xs text-muted-foreground">Members</span>
      </div>
    </div>
  ),
};

export const SettingsGroup: Story = {
  render: () => (
    <div className="w-80 rounded-lg border bg-card p-1 text-card-foreground">
      <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent">
        <span>Default model</span>
        <span className="text-muted-foreground">Nova 3 Sonnet</span>
      </button>
      <Separator />
      <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent">
        <span>Streaming responses</span>
        <span className="text-muted-foreground">On</span>
      </button>
      <Separator />
      <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent">
        <span>Save prompt history</span>
        <span className="text-muted-foreground">30 days</span>
      </button>
    </div>
  ),
};
