import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "@/components/ai-elements/queue";
import { ListTodoIcon } from "lucide-react";

const meta: Meta<typeof Queue> = {
  title: "AI Elements/Queue",
  component: Queue,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Queue>;

const todos = [
  { id: "1", title: "Generate scene 1 keyframe", status: "completed" as const },
  { id: "2", title: "Generate scene 2 keyframe", status: "completed" as const },
  { id: "3", title: "Render the 20-second draft", status: "pending" as const },
  { id: "4", title: "Add captions and music bed", status: "pending" as const },
];

export const Default: Story = {
  render: () => (
    <div className="w-[420px]">
      <Queue>
        <QueueSection defaultOpen>
          <QueueSectionTrigger>
            <QueueSectionLabel
              count={todos.length}
              icon={<ListTodoIcon className="size-4" />}
              label="queued tasks"
            />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {todos.map((todo) => {
                const completed = todo.status === "completed";
                return (
                  <QueueItem key={todo.id}>
                    <div className="flex items-start gap-2">
                      <QueueItemIndicator completed={completed} />
                      <QueueItemContent completed={completed}>
                        {todo.title}
                      </QueueItemContent>
                    </div>
                  </QueueItem>
                );
              })}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      </Queue>
    </div>
  ),
};
