import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

const meta: Meta<typeof Tool> = {
  title: "AI Elements/Tool",
  component: Tool,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Tool>;

export const Completed: Story = {
  render: () => (
    <div className="w-[520px]">
      <Tool defaultOpen>
        <ToolHeader state="output-available" type="tool-render_video" />
        <ToolContent>
          <ToolInput
            input={{
              script: "scene-storyboard.json",
              resolution: "1080p",
              durationSeconds: 20,
              aspectRatio: "16:9",
            }}
          />
          <ToolOutput
            errorText={undefined}
            output={{
              status: "completed",
              url: "https://cdn.example.com/renders/promo-1080p.mp4",
              renderTimeSeconds: 38,
              creditsUsed: 12,
            }}
          />
        </ToolContent>
      </Tool>
    </div>
  ),
};

export const Errored: Story = {
  render: () => (
    <div className="w-[520px]">
      <Tool defaultOpen>
        <ToolHeader state="output-error" type="tool-render_video" />
        <ToolContent>
          <ToolInput
            input={{
              script: "scene-storyboard.json",
              resolution: "4k",
              durationSeconds: 20,
            }}
          />
          <ToolOutput
            errorText="Render failed: 4K output requires the Pro plan."
            output={undefined}
          />
        </ToolContent>
      </Tool>
    </div>
  ),
};
