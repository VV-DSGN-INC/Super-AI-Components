import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import { Sparkles } from "lucide-react";

const meta: Meta<typeof MessageScroller> = {
  title: "shadcn/ui/Message Scroller",
  component: MessageScroller,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof MessageScroller>;

const bubble = "rounded-2xl bg-muted px-3 py-2";
const bubblePrimary =
  "rounded-2xl bg-primary px-3 py-2 text-primary-foreground";

function Bot({ children }: { children: React.ReactNode }) {
  return (
    <Message align="start">
      <MessageAvatar>
        <span className="flex size-8 items-center justify-center bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </span>
      </MessageAvatar>
      <MessageContent>
        <div className={bubble}>{children}</div>
      </MessageContent>
    </Message>
  );
}

function User({ children }: { children: React.ReactNode }) {
  return (
    <Message align="end">
      <MessageContent>
        <div className={bubblePrimary}>{children}</div>
      </MessageContent>
      <MessageAvatar>
        <img src="https://i.pravatar.cc/64?img=12" alt="You" className="size-8" />
      </MessageAvatar>
    </Message>
  );
}

const thread = [
  { role: "user", text: "Make me a logo for a coffee brand called Orbit Roasters." },
  { role: "bot", text: "Sketching concepts — a planetary ring formed from a coffee bean. Want minimalist or retro?" },
  { role: "user", text: "Retro, warm palette, 70s vibe." },
  { role: "bot", text: "Generating 6 retro marks with burnt-orange and cream tones using Recraft V3." },
  { role: "user", text: "I like #3. Can you make a horizontal lockup with the wordmark?" },
  { role: "bot", text: "Done. Added a condensed serif wordmark to the right of the orbit mark. Exported SVG + PNG." },
  { role: "user", text: "Now a dark-mode version." },
  { role: "bot", text: "Inverted the lockup — cream mark on charcoal, kept the orange accent. Looks great on dark UIs." },
  { role: "user", text: "Perfect. Generate a few social avatars from this." },
  { role: "bot", text: "Cropped the orbit mark into 6 circular avatars at 512×512. Ready to download." },
];

export const Default: Story = {
  render: () => (
    <MessageScroller className="h-[420px] w-[440px] rounded-xl border">
      <MessageScrollerViewport className="p-4">
        <MessageScrollerContent>
          <MessageGroup>
            {thread.map((m, i) => (
              <MessageScrollerItem key={i} scrollAnchor={i === thread.length - 1}>
                {m.role === "user" ? (
                  <User>{m.text}</User>
                ) : (
                  <Bot>{m.text}</Bot>
                )}
              </MessageScrollerItem>
            ))}
          </MessageGroup>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton direction="end" />
    </MessageScroller>
  ),
};

export const ShortThread: Story = {
  render: () => (
    <MessageScroller className="h-[280px] w-[440px] rounded-xl border">
      <MessageScrollerViewport className="p-4">
        <MessageScrollerContent>
          <MessageGroup>
            <MessageScrollerItem>
              <User>Upscale the top-left render to 4K.</User>
            </MessageScrollerItem>
            <MessageScrollerItem scrollAnchor>
              <Bot>
                Upscaled to 3840×2160 with the Topaz pipeline. Edges are crisp
                and the neon kept its glow. 12 credits used.
              </Bot>
            </MessageScrollerItem>
          </MessageGroup>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton direction="end" />
    </MessageScroller>
  ),
};
