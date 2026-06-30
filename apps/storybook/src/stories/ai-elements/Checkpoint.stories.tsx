import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ai-elements/checkpoint";

const meta: Meta<typeof Checkpoint> = {
  title: "AI Elements/Checkpoint",
  component: Checkpoint,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Checkpoint>;

export const Default: Story = {
  render: () => (
    <div className="w-[420px]">
      <Checkpoint>
        <CheckpointTrigger tooltip="Restore the conversation to this point">
          <CheckpointIcon />
          Checkpoint: video script approved
        </CheckpointTrigger>
      </Checkpoint>
    </div>
  ),
};
