import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { CopyIcon, RefreshCwIcon, ThumbsUpIcon } from "lucide-react";

const meta: Meta<typeof Message> = {
  title: "AI Elements/Message",
  component: Message,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Message>;

export const Default: Story = {
  render: () => (
    <div className="flex w-[560px] flex-col gap-8">
      <Message from="user">
        <MessageContent>
          Can you turn the dashboard launch into a 20-second promo video?
        </MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          <MessageResponse>
            {`Absolutely. Here's a tight **four-scene** cut:\n\n- **Hook** — the box opening\n- **Problem** — late-night spreadsheet\n- **Solution** — the dashboard animating in\n- **CTA** — "Start your free trial."\n\nWant me to render a draft?`}
          </MessageResponse>
        </MessageContent>
        <MessageActions>
          <MessageAction label="Copy" tooltip="Copy">
            <CopyIcon className="size-4" />
          </MessageAction>
          <MessageAction label="Regenerate" tooltip="Regenerate">
            <RefreshCwIcon className="size-4" />
          </MessageAction>
          <MessageAction label="Good response" tooltip="Good response">
            <ThumbsUpIcon className="size-4" />
          </MessageAction>
        </MessageActions>
      </Message>
    </div>
  ),
};
