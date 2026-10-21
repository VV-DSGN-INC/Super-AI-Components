import type { ComponentDocs } from "@/lib/component-docs";
import { MessageLog } from "@/registry/super-ai/message-log";

/**
 * Seeded from docs/design-system/component-specs.md#s2-message-log.
 *
 * No "use client" here, and no event handlers: message-log is a plain function
 * component, so its examples can sit in this module directly.
 */
export const MessageLogDocs: ComponentDocs = {
  whatItIs:
    'The append-only trace of one message, one sentence per event. Each row has a time as plus minutes from the start and a sentence such as "Sent on chat, written live", "Skipped push: quiet hours until 08:00" or "Answered on chat: Read it". It renders the events in the order you give them and edits nothing.',
  whyItMatters:
    "A person checking what a system did with a message needs the trace in plain sentences. Designing Bots treats the transcript as how a bot is judged: scripts are mockups, and reading the real conversations is how a team finds out where they fail (chapters 17 and 19). The log is the transcript of one message across channels. No product count is claimed for this item; it rests on the book and on the content system's log, and shares the family decision.",
  evidence: ["Designing Bots (chapters 17 and 19)"],
  anatomy: [
    { slot: "message-log", note: "The ordered list. One item per event, in the order given." },
    { slot: "message-log-row", note: "One event: its time, then one sentence." },
    { slot: "message-log-empty", note: "The only item when there are no events. Says so in words." },
  ],
  usage:
    'Pass the events as they happened, oldest first. `at` is minutes since the first event. Add a `reason` to a `message.skipped` event, because a skip without a reason explains nothing; add the failed rule as the `reason` on a fallback `message.sent`. Set `emptyText` when "Nothing sent yet" is the wrong sentence for your screen.',
  dos: [
    {
      text: "Name the reason on every skip. The channel and the reason read as one sentence.",
      example: (
        <MessageLog
          events={[
            { id: "1", at: 0, type: "message.created" },
            { id: "2", at: 2, type: "message.skipped", channel: "push", reason: "quiet hours until 08:00" },
          ]}
        />
      ),
    },
    {
      text: "Log the withdrawals that follow an answer as their own rows. The log shows them; it does not work them out.",
      example: (
        <MessageLog
          events={[
            { id: "1", at: 9, type: "message.answered", channel: "chat", value: "Read it" },
            { id: "2", at: 9, type: "message.withdrawn", channel: "push", reason: "answered on chat" },
          ]}
        />
      ),
    },
  ],
  donts: [
    {
      text: "Don't hand it unsorted events and expect it to order them. It renders what it is given, because an append-only log has no other order.",
      example: (
        <MessageLog
          events={[
            { id: "2", at: 5, type: "message.delivered", channel: "chat" },
            { id: "1", at: 1, type: "message.created" },
          ]}
        />
      ),
    },
    {
      text: 'Don\'t leave a skipped event without a reason. The row then says only "Skipped push", which is a log that explains nothing.',
      example: <MessageLog events={[{ id: "1", at: 2, type: "message.skipped", channel: "push" }]} />,
    },
  ],
  accessibility: {
    keyboard: [
      "No tab stops. The log is a list of text, and nothing in it is a control.",
      "There is no keyboard navigation inside it. A long log is read by moving through the page as ordinary text.",
    ],
    screenReader: [
      "An ordered list (`ol`) with one list item per event, so a screen reader announces the count and the position.",
      'Each row reads its time first, as "plus 4 min", then the sentence. Nothing in a row is conveyed by colour.',
      "The empty state is a single list item with the empty text, so an empty log is announced as a list with one item and not as nothing.",
      "Nothing announces a new event. The list owns no live region, so put one around it if events arrive while the page is open.",
    ],
  },
  pitfalls: [
    "`at` is minutes since the first event. A clock time or an epoch value prints as a huge offset, which widens the time column and takes space from the sentence.",
    "The sentence is built from the event type, channel, path, reason and value. An event type outside the union is a compile error; if one reaches the page anyway, the row prints the raw type string.",
    "A very long `reason` wraps inside its row. The time column stays the same width, so a reason is never pushed under it.",
  ],
  variants: {
    none: "The log renders every event the same way, as a time and a sentence, because the reader's job is to compare rows and a row styled by type would make them compare styles instead.",
  },
  insteadUse: [
    {
      component: "trace-timeline",
      when: "You are showing the steps of a model run with durations and nesting. Message-log is one sentence per event in one flat list, for the life of a single message.",
    },
  ],
};
