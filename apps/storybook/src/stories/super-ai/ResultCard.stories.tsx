import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResultCard } from "@/registry/super-ai/result-card";
import { ResultCardDocs } from "@/content/components/result-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Media({ label }: { label: string }) {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-8" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

const meta: Meta<typeof ResultCard> = {
  title: "Super AI/Result Card",
  component: ResultCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ResultCardDocs) } },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: {
    aspect: "square",
    label: "A red bicycle leaning on a sunlit wall",
  },
};

export default meta;
type Story = StoryObj<typeof ResultCard>;

export const Idle: Story = {
  args: { state: "idle" },
};

export const Queued: Story = {
  args: { state: "queued", badge: "3rd in queue" },
};

export const Streaming: Story = {
  args: {
    state: "streaming",
    progress: 62,
    children: <Media label="Generating" />,
  },
};

export const Done: Story = {
  args: {
    state: "done",
    badge: "Image",
    footer: <span>17 credits · seed 4471</span>,
    children: <Media label="The finished result" />,
    actions: (
      <Button size="icon-sm" variant="secondary" aria-label="Download result">
        <Sparkles aria-hidden />
      </Button>
    ),
  },
};

export const Failed: Story = {
  args: {
    state: "failed",
    onRetry: () => {},
    children: <Media label="What failed to generate" />,
  },
};

export const Locked: Story = {
  args: {
    state: "locked",
    children: <Media label="A preview of the locked result" />,
    lockedAction: <Button size="sm">Upgrade to unlock</Button>,
  },
};

/**
 * The media is opaque to the card: an image, a clip, a waveform or a block of
 * generated text all sit in the same frame, which is why this is one component
 * rather than five.
 */
export const MediaTypes: Story = {
  render: (args) => (
    <div className="grid w-[34rem] grid-cols-3 gap-3">
      <ResultCard {...args} state="done" aspect="square" label="Image · 1:1">
        <Media label="A generated image" />
      </ResultCard>
      <ResultCard {...args} state="done" aspect="square" label="Audio · 0:32">
        <Media label="A generated audio clip" />
      </ResultCard>
      <ResultCard {...args} state="done" aspect="square" label="Text · 240 words">
        <p className="text-foreground h-full overflow-hidden p-3 text-xs">
          The bicycle leaned against a wall the colour of turned earth, its frame catching what was left of
          the afternoon.
        </p>
      </ResultCard>
    </div>
  ),
};

/**
 * Select mode. The checkbox takes the slot the hover actions would occupy —
 * the two are never live at the same time.
 */
export const SelectMode: Story = {
  args: {
    state: "done",
    selectable: true,
    selected: true,
    onSelect: () => {},
    footer: <span>17 credits</span>,
    children: <Media label="A selected result" />,
  },
};
