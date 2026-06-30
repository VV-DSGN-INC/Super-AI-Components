import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Spinner> = {
  title: "shadcn/ui/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  render: () => <Spinner />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-muted-foreground">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
      <Spinner className="size-10" />
    </div>
  ),
};

export const InlineLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner className="size-4" />
      Generating 4 variations…
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner className="size-4" />
      Rendering…
    </Button>
  ),
};

export const CenteredLoader: Story = {
  render: () => (
    <div className="flex h-48 w-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground">Loading your gallery…</p>
    </div>
  ),
};
