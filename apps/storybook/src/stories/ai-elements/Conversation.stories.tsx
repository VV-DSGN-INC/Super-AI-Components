import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { MessageSquareIcon } from "lucide-react";

const meta: Meta<typeof Conversation> = {
  title: "AI Elements/Conversation",
  component: Conversation,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Conversation>;

export const Default: Story = {
  render: () => (
    <div className="h-[420px] w-[560px] rounded-lg border">
      <Conversation>
        <ConversationContent>
          <Message from="user">
            <MessageContent>
              Help me make a 20-second marketing video for our new analytics
              dashboard.
            </MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>
                {`Great — here's the plan. I'll structure it as **hook → problem → solution → CTA** and keep it under 22 seconds.\n\n1. Hook: product box opening\n2. Problem: late-night spreadsheet fatigue\n3. Solution: the dashboard animating in\n4. CTA: "Start your free trial."`}
              </MessageResponse>
            </MessageContent>
          </Message>
          <Message from="user">
            <MessageContent>Love it. Can you write the script?</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>
                {`On it. The script is ready in the artifact panel — four scenes, with a warm color grade returning on the payoff shot.`}
              </MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="h-[420px] w-[560px] rounded-lg border">
      <Conversation>
        <ConversationContent>
          <ConversationEmptyState
            description="Ask the assistant to draft a marketing video to get started."
            icon={<MessageSquareIcon className="size-8" />}
            title="No messages yet"
          />
        </ConversationContent>
      </Conversation>
    </div>
  ),
};
