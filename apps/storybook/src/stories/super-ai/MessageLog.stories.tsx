import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { MessageLog, type MessageLogEvent } from "@/registry/super-ai/message-log";
import { MessageLogDocs } from "@/content/components/message-log.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MessageLog> = {
  title: "Super AI/Message Log",
  component: MessageLog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MessageLogDocs) } },
};

export default meta;
type Story = StoryObj<typeof MessageLog>;

const TRACE: MessageLogEvent[] = [
  { id: "1", at: 0, type: "message.created" },
  { id: "2", at: 0, type: "message.sent", channel: "app", path: "code" },
  { id: "3", at: 0, type: "message.delivered", channel: "app" },
  { id: "4", at: 1, type: "message.sent", channel: "push", path: "code" },
  { id: "5", at: 2, type: "message.delivered", channel: "push" },
  { id: "6", at: 20, type: "message.skipped", channel: "chat", reason: "no consent for chat" },
  { id: "7", at: 21, type: "message.sent", channel: "email", path: "code" },
  { id: "8", at: 34, type: "message.answered", channel: "email", value: "Opened" },
  { id: "9", at: 34, type: "message.withdrawn", channel: "push", reason: "answered on email" },
];

/**
 * Nothing has happened to the message yet. The list says so in words, because
 * a blank list reads as a failure to load.
 */
export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="message-log-empty"]')!.textContent).toBe(
      "Nothing sent yet",
    );
  },
};

/**
 * Nine events from a `ready` message: the app first, then push, a chat skip
 * with its reason, an email, and the answer that withdrew the push copy. One
 * sentence per row.
 */
export const Populated: Story = {
  args: { events: TRACE },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="message-log-row"]')).toHaveLength(9);
  },
};

/* -------------------------------------------------------------------------
 * Case stories.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: RTL — the row is a flex row with no physical left/right classes
 * `grep -nE "\b(ml|mr|pl|pr|left|right|text-left|text-right)-" registry/super-ai/message-log.tsx`
 * matches nothing, so the time column and the sentence swap sides under
 * `dir="rtl"` through flex flow alone, and there is no icon or chevron to mirror.
 *
 * // case-skip: ReducedMotion — nothing in the tree animates
 * `grep -nE "animate-|transition|duration-" registry/super-ai/message-log.tsx`
 * matches nothing; the log is static text.
 *
 * // case-skip: KeyboardOrder — nothing in the tree is focusable
 * The list holds only text, so there is no tab sequence to document.
 *
 * // case-skip: Controlled — there is no value or onChange pair
 * The component renders `events` and owns no state.
 *
 * // case-skip: EmptyLabel — no text slot is optional except the empty text
 * `emptyText` defaults to "Nothing sent yet", and `Empty` renders it.
 *
 * // case-skip: Boundary — its near-twin shares no data shape
 * `trace-timeline` positions model-run spans by start time with durations and
 * nesting; this component takes flat events and prints sentences. A side-by-side
 * would need invented spans. The choosing rule is `insteadUse` in the docs.
 * ---------------------------------------------------------------------- */

/**
 * A reason three times as long as the others, and a six-word channel sentence.
 * The sentence wraps inside its own column and never runs under the time.
 */
export const LongContent: Story = {
  args: {
    events: [
      { id: "1", at: 0, type: "message.created" },
      {
        id: "2",
        at: 3,
        type: "message.skipped",
        channel: "push",
        reason: "quiet hours until 08:00 and the daily cap of two escalations was already reached today",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll<HTMLElement>('[data-slot="message-log-row"]');
    const box = canvasElement
      .querySelector<HTMLElement>('[data-slot="message-log"]')!
      .getBoundingClientRect();
    for (const el of rows[1]!.querySelectorAll<HTMLElement>("*")) {
      await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
    }
    // The sentence wraps in its own column: it starts at or after the time column's right edge.
    const [time, sentence] = rows[1]!.children as unknown as HTMLElement[];
    await expect(sentence!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      time!.getBoundingClientRect().right,
    );
  },
};

/**
 * A real 375x812 viewport (the log is a column, but a viewport is the stronger
 * test than a narrow box). Rows wrap; nothing scrolls sideways.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full p-4">
      <MessageLog events={TRACE} />
    </div>
  ),
  play: async () => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375);
  },
};
