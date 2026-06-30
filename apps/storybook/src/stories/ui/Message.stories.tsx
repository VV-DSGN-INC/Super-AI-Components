import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import { Sparkles, Copy, RefreshCw, ThumbsUp } from "lucide-react";

const meta: Meta<typeof Message> = {
  title: "shadcn/ui/Message",
  component: Message,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Message>;

const bubble =
  "rounded-2xl bg-muted px-3 py-2";
const bubblePrimary =
  "rounded-2xl bg-primary px-3 py-2 text-primary-foreground";

export const Default: Story = {
  render: () => (
    <MessageGroup className="w-[420px]">
      <Message align="end">
        <MessageContent>
          <div className={bubblePrimary}>
            Generate a moody cyberpunk alley at night, neon reflections in the
            puddles, 16:9.
          </div>
        </MessageContent>
        <MessageAvatar>
          <img src="https://i.pravatar.cc/64?img=12" alt="You" className="size-8" />
        </MessageAvatar>
      </Message>

      <Message align="start">
        <MessageAvatar>
          <span className="flex size-8 items-center justify-center bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
        </MessageAvatar>
        <MessageContent>
          <div className={bubble}>
            On it. Rendering 4 variations with Flux Pro at 1024&times;576 — neon
            magenta and cyan, wet asphalt, volumetric haze. This should take about
            8 seconds.
          </div>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <MessageGroup className="w-[440px]">
      <Message align="start">
        <MessageAvatar>
          <span className="flex size-8 items-center justify-center bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Nova &middot; Flux Pro</MessageHeader>
          <div className={bubble}>
            Here are your 4 renders. I leaned into a high-contrast palette and
            added a lone figure under the sign for scale. Want me to upscale the
            top-left one to 4K?
          </div>
          <MessageFooter className="gap-3">
            <button className="inline-flex items-center gap-1 hover:text-foreground">
              <Copy className="size-3.5" /> Copy
            </button>
            <button className="inline-flex items-center gap-1 hover:text-foreground">
              <RefreshCw className="size-3.5" /> Regenerate
            </button>
            <button className="inline-flex items-center gap-1 hover:text-foreground">
              <ThumbsUp className="size-3.5" /> Like
            </button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};

export const Conversation: Story = {
  render: () => (
    <MessageGroup className="w-[460px]">
      <Message align="end">
        <MessageContent>
          <div className={bubblePrimary}>What models can I use for video?</div>
        </MessageContent>
        <MessageAvatar>
          <img src="https://i.pravatar.cc/64?img=12" alt="You" className="size-8" />
        </MessageAvatar>
      </Message>

      <Message align="start">
        <MessageAvatar>
          <span className="flex size-8 items-center justify-center bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
        </MessageAvatar>
        <MessageContent>
          <div className={bubble}>
            You have Runway Gen-3, Kling 1.6, and Sora Turbo on the Pro plan.
            Kling is fastest; Sora handles complex camera moves best.
          </div>
        </MessageContent>
      </Message>

      <Message align="end">
        <MessageContent>
          <div className={bubblePrimary}>
            Use Sora Turbo. Animate the cyberpunk alley with a slow dolly-in.
          </div>
        </MessageContent>
        <MessageAvatar>
          <img src="https://i.pravatar.cc/64?img=12" alt="You" className="size-8" />
        </MessageAvatar>
      </Message>

      <Message align="start">
        <MessageAvatar>
          <span className="flex size-8 items-center justify-center bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
        </MessageAvatar>
        <MessageContent>
          <div className={bubble}>
            Queued a 5s clip with Sora Turbo — 24fps, slow dolly-in toward the
            sign. This will use 40 credits.
          </div>
          <MessageFooter>2:14 PM &middot; 40 credits</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};
