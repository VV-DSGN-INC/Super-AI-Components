import type { Meta, StoryObj } from "@storybook/react-vite";

import { DirectionProvider } from "@/components/ui/direction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, SendIcon } from "lucide-react";

const meta: Meta<typeof DirectionProvider> = {
  title: "shadcn/ui/Direction",
  component: DirectionProvider,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DirectionProvider>;

function PromptBar() {
  return (
    <div className="flex w-80 items-center gap-2 rounded-xl border p-2">
      <Badge variant="secondary">
        <SparklesIcon data-icon="inline-start" />
        Aurora-XL
      </Badge>
      <Input placeholder="Describe your image..." className="flex-1" />
      <Button size="icon" aria-label="Send">
        <SendIcon />
      </Button>
    </div>
  );
}

export const LeftToRight: Story = {
  render: () => (
    <DirectionProvider direction="ltr">
      <div dir="ltr">
        <PromptBar />
      </div>
    </DirectionProvider>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <PromptBar />
      </div>
    </DirectionProvider>
  ),
};
