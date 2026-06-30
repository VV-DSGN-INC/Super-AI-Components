import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/ui/badge";
import { CheckIcon, SparklesIcon, ZapIcon } from "lucide-react";

const meta: Meta<typeof Badge> = {
  title: "shadcn/ui/Badge",
  component: Badge,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: () => <Badge>Pro</Badge>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Beta</Badge>
      <Badge variant="outline">Aurora-XL</Badge>
      <Badge variant="destructive">Rate limited</Badge>
      <Badge variant="ghost">Draft</Badge>
      <Badge variant="link">View thread</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>
        <SparklesIcon data-icon="inline-start" />
        New model
      </Badge>
      <Badge variant="secondary">
        <ZapIcon data-icon="inline-start" />
        Turbo
      </Badge>
      <Badge variant="outline">
        Verified
        <CheckIcon data-icon="inline-end" />
      </Badge>
    </div>
  ),
};
