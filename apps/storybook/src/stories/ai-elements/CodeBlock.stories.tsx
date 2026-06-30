import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";

const meta: Meta<typeof CodeBlock> = {
  title: "AI Elements/Code Block",
  component: CodeBlock,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const tsCode = `import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function renderScript(brief: string) {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: "You write punchy short-form video scripts.",
    prompt: brief,
  });

  return text.trim();
}`;

export const Default: Story = {
  render: () => (
    <div className="w-[560px]">
      <CodeBlock code={tsCode} language="typescript">
        <CodeBlockCopyButton />
      </CodeBlock>
    </div>
  ),
};

export const WithLineNumbers: Story = {
  render: () => (
    <div className="w-[560px]">
      <CodeBlock code={tsCode} language="typescript" showLineNumbers>
        <CodeBlockCopyButton />
      </CodeBlock>
    </div>
  ),
};
