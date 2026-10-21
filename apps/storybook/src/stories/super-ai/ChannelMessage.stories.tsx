import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  ChannelMessage,
  type ChannelMessageData,
  type ChannelMessageState,
} from "@/registry/super-ai/channel-message";
import { ChannelMessageDocs } from "@/content/components/channel-message.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof ChannelMessage> = {
  title: "Super AI/Channel Message",
  component: ChannelMessage,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ChannelMessageDocs) } },
};

export default meta;
type Story = StoryObj<typeof ChannelMessage>;

const CHECK_IN: ChannelMessageData = {
  kind: "ask",
  from: "Dr O'Body",
  what: "Your blood pressure reading is due.",
  ask: "How did it go today?",
  options: ["Fine", "Not great", "Skip today"],
  link: "lifeos://vitals/7",
  expires: "Fri 18:00",
  quiet: "Stop asking",
};

const WEEKLY_REVIEW: ChannelMessageData = {
  kind: "ready",
  from: "Lifey",
  what: "Your Weekly Review is ready.",
  link: "lifeos://review/42",
  quiet: "Stop asking",
};

const TRANSFER: ChannelMessageData = {
  kind: "ask",
  from: "Case team",
  what: "We need one more document for [Member name]'s [program] renewal.",
  ask: "Can you send a recent bill?",
  options: ["I will send it", "I need help"],
  link: "case://renewal/19",
  expires: "Wed 17:00",
  quiet: "Stop asking",
  handoff: "A care manager will call you on Monday.",
  summary: "[Member name]'s renewal needs one document. A care manager is following up.",
};

/**
 * Written but not yet on its way. The options are drawn and cannot be pressed:
 * a pending message is not sent, so there is nothing to answer.
 */
export const Pending: Story = {
  args: { channel: "app", message: CHECK_IN, state: "pending", to: "member", onAnswer: fn() },
};

/**
 * Sent, and the only state whose options are buttons. Chat is the channel
 * where the inline buttons and the answer are easiest to see; the same message
 * is a lock-screen card on push and a spoken script on phone.
 */
export const Sent: Story = {
  args: {
    channel: "chat",
    message: CHECK_IN,
    state: "sent",
    to: "member",
    typeSize: "default",
    pace: "default",
    path: "live",
    onAnswer: fn(),
  },
};

/**
 * The controls are replaced by the result, and focus moves to it when the
 * state arrives. The message keeps its question so the answer still reads as
 * an answer to something.
 */
export const Answered: Story = {
  args: { channel: "chat", message: CHECK_IN, state: "answered", answer: "Not great", onAnswer: fn() },
};

/**
 * Another channel was answered first. The copy here is withdrawn, not deleted:
 * it stays in the record with its reason in words, and its options are text.
 */
export const Withdrawn: Story = {
  args: {
    channel: "push",
    locked: false,
    message: CHECK_IN,
    state: "withdrawn",
    reason: "answered on chat",
  },
};

/**
 * The deadline passed before anyone answered. Email shows its one button as
 * text, with the rest of the options counted as "in the app".
 */
export const Expired: Story = {
  args: { channel: "email", message: CHECK_IN, state: "expired", reason: "Fri 18:00 passed" },
};

/**
 * Live text for the phone failed a check, so it was not read out as written.
 * The state says so and the reason names the rule; the template that went out
 * instead is a separate `sent` message with `path="fallback"`.
 */
export const FailedCheck: Story = {
  args: {
    channel: "phone",
    message: CHECK_IN,
    state: "failed-check",
    path: "live",
    reason: "no-guilt failed",
    trust: "We never ask for codes.",
  },
};

/**
 * The router never reached this channel. There is no shape to draw because
 * nothing was sent, so the render is the state and the reason.
 */
export const NotRouted: Story = {
  args: { channel: "push", message: CHECK_IN, state: "not-routed", reason: "push was answered first" },
};

/* -------------------------------------------------------------------------
 * Case stories: the situations this component meets in a product.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing this component adds animates
 * `grep -nE "animate-|transition|duration-|motion-" registry/super-ai/channel-message.tsx`
 * matches nothing. The vendored Button and Badge carry `transition-all` for
 * their hover and focus colour and ring, which moves nothing, so there is no
 * reduced-motion branch to document.
 *
 * // case-skip: EmptyLabel — every control is a text label, and none is optional
 * Options render as their own text, and an empty `options` list renders no
 * controls at all rather than an icon-only one. The optional slots (`ask`,
 * `handoff`, `expires`, `trust`) are lines of text that are omitted, not
 * controls that lose a label.
 *
 * // case-skip: Boundary — no shipped item draws one message for several channels
 * `chat-shell` is the live thread a person types into and `escalation-handoff`
 * is a packet for a human; neither takes a `channel`. The choosing rule is
 * written as `insteadUse` in the docs module.
 * ---------------------------------------------------------------------- */

/**
 * The phone script, slowed. `pace="slow"` says the key fact twice, and the
 * trust line opens the script. The options are read aloud with a keypad digit
 * and, with `onAnswer`, are the buttons a listener's keypad press stands for.
 */
export const SlowPace: Story = {
  args: {
    channel: "phone",
    message: CHECK_IN,
    state: "sent",
    pace: "slow",
    trust: "We never ask for codes.",
    onAnswer: fn(),
  },
};

/**
 * A caregiver reading the same message. `to="second"` swaps the body for the
 * summary and drops the question, the options and the handoff line: status and
 * next step, no detail.
 */
export const SecondRecipient: Story = {
  args: {
    channel: "email",
    message: TRANSFER,
    state: "sent",
    to: "second",
    trust: "We never ask for codes by text.",
  },
};

/**
 * The lock screen. The card shows who and what kind, and nothing from the
 * message: the body and the actions are not in the DOM until `locked` is
 * false.
 */
export const LockedPush: Story = {
  args: { channel: "push", message: CHECK_IN, state: "sent", locked: true, onAnswer: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("has a check-in")).toBeInTheDocument();
    await expect(canvas.queryByText(CHECK_IN.what)).toBeNull();
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

/**
 * Six options on an unlocked push. Three actions show and the card says how
 * many more are in the app, so nothing is dropped without a word.
 */
export const OptionsOverflow: Story = {
  args: {
    channel: "push",
    locked: false,
    message: { ...CHECK_IN, options: ["Fine", "Tired", "Dizzy", "Sore", "Anxious", "Skip today"] },
    state: "sent",
    onAnswer: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button")).toHaveLength(3);
    await expect(canvas.getByText("and 3 more in the app")).toBeInTheDocument();
  },
};

/**
 * Right-to-left. The bubble's pointed corner is `rounded-ss-sm`, a logical
 * property, so it moves to the right-hand side with the sender's name. The
 * assertion reads the two top corners back from the browser: a class dictates
 * them, so it is portable.
 */
export const RTL: Story = {
  args: { channel: "chat", message: WEEKLY_REVIEW, state: "sent" },
  render: (args) => (
    <div dir="rtl" className="w-full max-w-md">
      <ChannelMessage {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const bubble = canvasElement.querySelector('[data-slot="channel-message-what"]')!.parentElement!;
    const style = getComputedStyle(bubble);
    await expect(parseFloat(style.borderTopRightRadius)).toBeLessThan(parseFloat(style.borderTopLeftRadius));
  },
};

/**
 * The tab sequence through a sent chat message: the three option buttons, in
 * reading order, and nothing else. The quiet line, the link label and the state
 * are text, so they add no stops. Each stop paints a settled focus ring.
 */
export const KeyboardOrder: Story = {
  args: { channel: "chat", message: CHECK_IN, state: "sent", onAnswer: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    await expect(buttons.map((b) => b.textContent)).toEqual(["Fine", "Not great", "Skip today"]);
    for (const button of buttons) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(button);
      await settledFocusRing(button, waitFor);
    }
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * The caller owns the state. Pressing an option reports the value and changes
 * nothing; only when the parent sets `state="answered"` do the buttons give
 * way to the result. Here a separate control of the caller's sets the state,
 * so focus stays on that control; when the pressed option button itself had
 * focus, the result takes it instead (pinned in the unit tests).
 */
export const Controlled: Story = {
  args: { channel: "chat", message: CHECK_IN, state: "sent" },
  render: function Render(args) {
    const [state, setState] = React.useState<ChannelMessageState>("sent");
    const [pending, setPending] = React.useState<string>();
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <ChannelMessage
          {...args}
          state={state}
          answer={state === "answered" ? pending : undefined}
          onAnswer={(value) => setPending(value)}
        />
        <Button variant="outline" size="sm" onClick={() => setState("answered")}>
          Apply the answer
        </Button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Not great" }));
    // Interaction alone moves nothing: the buttons are still there.
    await expect(canvas.getAllByRole("button", { name: /Fine|Not great|Skip today/ })).toHaveLength(3);
    await expect(canvasElement.querySelector('[data-slot="channel-message-answer"]')).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Apply the answer" }));
    const answer = canvasElement.querySelector<HTMLElement>('[data-slot="channel-message-answer"]')!;
    await expect(answer.textContent).toBe("Answered: Not great");
    // The caller's own control set the state, so focus stays on it rather than jumping.
    await expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Apply the answer" }));
  },
};

/**
 * Three times the sentence and six options with long labels, on chat. The
 * text wraps (`overflow-wrap: break-word` is dictated by `break-words`), the
 * options wrap onto further lines, and the fifth-plus overflow line counts the
 * sixth. Nothing is truncated, and nothing leaves the card.
 */
export const LongContent: Story = {
  args: {
    channel: "chat",
    state: "sent",
    onAnswer: fn(),
    message: {
      ...CHECK_IN,
      what: CHECK_IN.what.repeat(3),
      options: [
        "Fine, and I took it twice today",
        "Not great, and I am worried",
        "Skip today, I will do it tomorrow",
        "Ask me again this evening",
        "Call me instead of messaging",
        "Something else",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const article = canvasElement.querySelector<HTMLElement>('[data-slot="channel-message"]')!;
    const what = canvasElement.querySelector<HTMLElement>('[data-slot="channel-message-what"]')!;
    await expect(getComputedStyle(what).overflowWrap).toBe("break-word");
    await expect(within(canvasElement).getByText("and 1 more in the app")).toBeInTheDocument();
    const box = article.getBoundingClientRect();
    for (const el of article.querySelectorAll<HTMLElement>("*")) {
      await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
    }
  },
};

/**
 * A real 375x812 viewport with the larger type scale, all five channels one
 * under the other (Review Focus 4). `page.viewport` resizes the iframe, so the
 * page's own scroll width is a fair measure: nothing may push it past 375.
 * Every element must also stay inside its card's right edge, which is a
 * relation between two rectangles and so holds on any platform. The frame is
 * 375px wide because a `layout: "centered"` wrapper would otherwise size the
 * cards to their content.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile-frame" className="flex w-[375px] max-w-full flex-col gap-6 p-4">
      {(["app", "push", "chat", "email", "phone"] as const).map((channel) => (
        <ChannelMessage
          key={channel}
          channel={channel}
          locked={false}
          typeSize="large"
          trust="We never ask for codes by text."
          message={{ ...CHECK_IN, handoff: "A care manager will call you on Monday." }}
          state="sent"
          onAnswer={() => {}}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375);
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    for (const article of frame.querySelectorAll<HTMLElement>('[data-slot="channel-message"]')) {
      const box = article.getBoundingClientRect();
      await expect(box.right).toBeLessThanOrEqual(375);
      for (const el of article.querySelectorAll<HTMLElement>("*")) {
        await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
      }
    }
  },
};
