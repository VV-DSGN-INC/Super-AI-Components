import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { SparklesIcon, PlusIcon, ArrowRightIcon } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "shadcn/ui/Button",
  component: Button,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: () => <Button>Generate image</Button>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Generate</Button>
      <Button variant="secondary">Save preset</Button>
      <Button variant="outline">Edit prompt</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete render</Button>
      <Button variant="link">Learn more</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <SparklesIcon data-icon="inline-start" />
        Enhance
      </Button>
      <Button variant="outline">
        New thread
        <PlusIcon data-icon="inline-end" />
      </Button>
      <Button variant="secondary">
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button disabled>Rendering&hellip;</Button>
      <Button variant="outline" disabled>
        Out of credits
      </Button>
    </div>
  ),
};
