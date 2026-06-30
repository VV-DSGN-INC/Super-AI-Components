import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

const meta: Meta<typeof Reasoning> = {
  title: "AI Elements/Reasoning",
  component: Reasoning,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Reasoning>;

const reasoningText = `The user wants a 20-second promo, which is short enough that pacing matters a lot. I should front-load the hook in the first 3 seconds before any branding, since retention drops off sharply after that.

A four-beat structure (hook → problem → solution → CTA) fits cleanly into 20 seconds: roughly 3s / 5s / 10s / 2s. I'll keep the problem desaturated and let the warm color grade return on the solution shot to signal the payoff.`;

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Reasoning defaultOpen duration={6} isStreaming={false}>
        <ReasoningTrigger />
        <ReasoningContent>{reasoningText}</ReasoningContent>
      </Reasoning>
    </div>
  ),
};
