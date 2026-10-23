import type { ModelMessage } from "ai";

import type { GeneratedChatMessage } from "@/registry/super-ai/generated-chat";

/** How many messages the model sees. Older ones are dropped. */
export const MAX_MESSAGES = 12;
/** The longest a single message may be when the model reads it. */
export const MAX_MESSAGE_CHARS = 1000;

type Part = GeneratedChatMessage["parts"][number];

/** A part as the model should read it, or nothing when it carries no meaning for the model. */
function describe(part: Part): string | null {
  switch (part.type) {
    case "text":
      return part.text.trim() || null;
    case "data-card":
      return `[Showed the ${part.data.type} card]`;
    case "data-view":
      return `[Built the view ${part.data.title}]`;
    case "data-question":
      return `[Asked: ${part.data.title}]`;
    case "data-widgets":
      return `[Showed widgets: ${part.data.items.map((item) => item.type).join(", ")}]`;
    default:
      // Chips, tool calls, step markers and anything newer: nothing to read.
      return null;
  }
}

/**
 * The conversation as plain text messages. Cards, views and questions become a
 * short bracketed line, so the model knows what the reader saw without the
 * data. The window keeps the last messages and opens on the person's turn.
 */
export function toModelMessages(messages: GeneratedChatMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = message.parts
      .map(describe)
      .filter((text): text is string => text !== null)
      .join("\n");
    const capped = content.length > MAX_MESSAGE_CHARS ? `${content.slice(0, MAX_MESSAGE_CHARS)}…` : content;
    if (capped) out.push({ role: message.role, content: capped });
  }
  const window = out.slice(-MAX_MESSAGES);
  while (window.length > 0 && window[0]!.role !== "user") window.shift();
  return window;
}
