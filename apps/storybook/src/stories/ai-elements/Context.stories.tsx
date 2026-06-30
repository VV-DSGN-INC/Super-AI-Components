import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "@/components/ai-elements/context";

const meta: Meta<typeof Context> = {
  title: "AI Elements/Context",
  component: Context,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Context>;

export const Default: Story = {
  render: () => (
    <Context
      maxTokens={200_000}
      modelId="openai:gpt-4o"
      open
      usedTokens={48_320}
      // The Context component reads the flat token fields below; cast to the
      // prop type since the installed AI SDK's LanguageModelUsage is nested.
      usage={
        {
          inputTokens: 41_200,
          outputTokens: 6_120,
          reasoningTokens: 800,
          cachedInputTokens: 12_000,
          totalTokens: 48_320,
        } as never
      }
    >
      <ContextTrigger />
      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody>
          <div className="space-y-2">
            <ContextInputUsage />
            <ContextOutputUsage />
            <ContextReasoningUsage />
            <ContextCacheUsage />
          </div>
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  ),
};
