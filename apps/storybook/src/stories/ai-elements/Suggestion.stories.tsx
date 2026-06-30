import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";

const meta: Meta<typeof Suggestion> = {
  title: "AI Elements/Suggestion",
  component: Suggestion,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Suggestion>;

const suggestions = [
  "Make it 15 seconds instead",
  "Add captions",
  "Try a more upbeat soundtrack",
  "Render in vertical 9:16",
  "Write three headline variations",
];

export const Default: Story = {
  render: () => (
    <div className="w-[560px]">
      <Suggestions>
        {suggestions.map((suggestion) => (
          <Suggestion
            key={suggestion}
            onClick={() => undefined}
            suggestion={suggestion}
          />
        ))}
      </Suggestions>
    </div>
  ),
};
