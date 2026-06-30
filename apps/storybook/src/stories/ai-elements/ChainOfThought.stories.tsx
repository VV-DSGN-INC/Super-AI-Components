import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  GlobeIcon,
  PencilIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

const meta: Meta<typeof ChainOfThought> = {
  title: "AI Elements/Chain of Thought",
  component: ChainOfThought,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ChainOfThought>;

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader>Planning the marketing video</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep
            icon={SearchIcon}
            label="Researching short-form video best practices"
            description="Looking at hook timing and retention curves for 2026 social ads."
          >
            <ChainOfThoughtSearchResults>
              <ChainOfThoughtSearchResult>
                <GlobeIcon className="size-3" />
                hootsuite.com
              </ChainOfThoughtSearchResult>
              <ChainOfThoughtSearchResult>
                <GlobeIcon className="size-3" />
                buffer.com
              </ChainOfThoughtSearchResult>
              <ChainOfThoughtSearchResult>
                <GlobeIcon className="size-3" />
                later.com
              </ChainOfThoughtSearchResult>
            </ChainOfThoughtSearchResults>
          </ChainOfThoughtStep>
          <ChainOfThoughtStep
            icon={PencilIcon}
            label="Drafting a 4-scene script structure"
            description="Hook, problem, solution, CTA — keeping it under 22 seconds."
          />
          <ChainOfThoughtStep
            icon={SparklesIcon}
            label="Choosing a color grade and music direction"
            status="active"
            description="Warm grade for the payoff, upbeat synth-pop sting on the hook."
          />
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  ),
};
