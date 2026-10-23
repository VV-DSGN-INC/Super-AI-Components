"use client";

import { MessageLog, type MessageLogEvent } from "@/registry/super-ai/message-log";

// An illustrative trace for a `ready` message: the app is the record, push follows, chat is
// skipped for want of consent, and an answer on email withdraws the push copy.
const WEEKLY_REVIEW_TRACE: MessageLogEvent[] = [
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

export default function MessageLogDemo() {
  return (
    <div className="w-full max-w-md">
      <MessageLog events={WEEKLY_REVIEW_TRACE} />
    </div>
  );
}
