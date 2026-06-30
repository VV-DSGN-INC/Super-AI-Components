import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { FileVideoIcon } from "lucide-react";

const meta: Meta<typeof Task> = {
  title: "AI Elements/Task",
  component: Task,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Task>;

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Task defaultOpen>
        <TaskTrigger title="Assembled the marketing video draft" />
        <TaskContent>
          <TaskItem>Trimmed the hook to 2.8 seconds for faster payoff.</TaskItem>
          <TaskItem>
            Rendered four scenes and stitched them together:
          </TaskItem>
          <TaskItem>
            <TaskItemFile>
              <FileVideoIcon className="size-3" />
              scene-1-hook.mp4
            </TaskItemFile>{" "}
            <TaskItemFile>
              <FileVideoIcon className="size-3" />
              scene-2-problem.mp4
            </TaskItemFile>{" "}
            <TaskItemFile>
              <FileVideoIcon className="size-3" />
              final-draft-1080p.mp4
            </TaskItemFile>
          </TaskItem>
          <TaskItem>Applied a warm color grade to the solution shot.</TaskItem>
        </TaskContent>
      </Task>
    </div>
  ),
};
