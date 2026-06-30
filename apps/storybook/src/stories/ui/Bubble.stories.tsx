import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BubbleGroup,
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@/components/ui/bubble";

const meta: Meta<typeof Bubble> = {
  title: "shadcn/ui/Bubble",
  component: Bubble,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Bubble>;

export const Conversation: Story = {
  render: () => (
    <BubbleGroup className="w-96">
      <Bubble variant="muted" align="start">
        <BubbleContent>
          Make me a cyberpunk alley at night, neon reflections in the puddles.
        </BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>
          On it &mdash; rendering 4 variations with Aurora-XL at 1024&times;1024.
        </BubbleContent>
      </Bubble>
      <Bubble variant="muted" align="start">
        <BubbleContent>Can you make the rain heavier?</BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>
          Added volumetric rain and stronger ground reflections. Here are the new
          renders.
        </BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};

export const Variants: Story = {
  render: () => (
    <BubbleGroup className="w-96">
      <Bubble variant="secondary" align="start">
        <BubbleContent>Secondary bubble &mdash; system note</BubbleContent>
      </Bubble>
      <Bubble variant="tinted" align="end">
        <BubbleContent>Tinted bubble &mdash; highlighted reply</BubbleContent>
      </Bubble>
      <Bubble variant="outline" align="start">
        <BubbleContent>Outline bubble &mdash; quoted prompt</BubbleContent>
      </Bubble>
      <Bubble variant="destructive" align="end">
        <BubbleContent>Destructive bubble &mdash; render failed</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};

export const WithReactions: Story = {
  render: () => (
    <BubbleGroup className="w-96">
      <Bubble variant="default" align="end" className="mb-3">
        <BubbleContent>
          Final 8K upscale is ready. Want me to export it as a layered PSD?
        </BubbleContent>
        <BubbleReactions side="bottom" align="end">
          🔥 3
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  ),
};
