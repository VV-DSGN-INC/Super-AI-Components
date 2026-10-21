import { cn } from "@/lib/utils";

type Channel = "app" | "push" | "chat" | "email" | "phone";
type LogEventType =
  | "message.created"
  | "message.sent"
  | "message.delivered"
  | "message.answered"
  | "message.skipped"
  | "message.expired"
  | "message.withdrawn";

interface MessageLogEvent {
  id: string;
  /** Minutes since the first event. Rendered as "+N min". */
  at: number;
  type: LogEventType;
  channel?: Channel;
  to?: "member" | "second";
  path?: "code" | "live" | "fallback";
  /** The answer, for `message.answered`. */
  value?: string;
  /** Why, for `message.skipped`, and the failed rule for a `fallback` send. */
  reason?: string;
}

interface MessageLogProps extends React.ComponentProps<"ol"> {
  /** Rendered in the order given. The log is append-only, so it is never sorted or grouped here. */
  events: MessageLogEvent[];
  /** Shown when there are no events. Defaults to "Nothing sent yet". */
  emptyText?: string;
}

const PATH_WORDS: Record<NonNullable<MessageLogEvent["path"]>, string> = {
  code: "written by code",
  live: "written live",
  fallback: "fallback template",
};

/** One event as one sentence, so the log reads without a legend. */
function sentence(event: MessageLogEvent): string {
  const on = event.channel ? ` on ${event.channel}` : "";
  switch (event.type) {
    case "message.created":
      return "Message created";
    case "message.sent": {
      const recipient = event.to === "second" ? " to the second recipient" : "";
      const path = event.path ? `, ${PATH_WORDS[event.path]}` : "";
      // On a fallback the reason is the failed rule, and it belongs in the same sentence.
      const why = event.reason ? `: ${event.reason}` : "";
      return `Sent${on}${recipient}${path}${why}`;
    }
    case "message.delivered":
      return `Delivered${on}`;
    case "message.answered":
      return `Answered${on}${event.value ? `: ${event.value}` : ""}`;
    case "message.skipped":
      return `Skipped${event.channel ? ` ${event.channel}` : ""}${event.reason ? `: ${event.reason}` : ""}`;
    case "message.expired":
      return `Expired${on}`;
    case "message.withdrawn":
      return `Withdrawn${on}${event.reason ? `: ${event.reason}` : ""}`;
    default:
      // A type outside the union is a compile error; at runtime the row still says something.
      return String((event as { type: string }).type);
  }
}

/**
 * The append-only trace of one message, one sentence per event.
 *
 * Spec: docs/design-system/component-specs.md#s2-message-log
 * States: empty · populated
 */
function MessageLog({ events, emptyText = "Nothing sent yet", className, ...props }: MessageLogProps) {
  return (
    <ol
      data-slot="message-log"
      className={cn("flex w-full min-w-0 list-none flex-col p-0 text-sm text-foreground", className)}
      {...props}
    >
      {events.length === 0 ? (
        <li data-slot="message-log-empty" className="py-2">
          {emptyText}
        </li>
      ) : (
        events.map((event) => (
          <li
            key={event.id}
            data-slot="message-log-row"
            className="flex min-w-0 gap-3 border-b border-border py-1.5 last:border-b-0"
          >
            <span className="min-w-16 shrink-0 whitespace-nowrap font-mono text-xs tabular-nums leading-5">
              +{event.at} min
            </span>
            <span className="min-w-0 break-words">{sentence(event)}</span>
          </li>
        ))
      )}
    </ol>
  );
}

export { MessageLog };
export type { Channel, LogEventType, MessageLogEvent, MessageLogProps };
