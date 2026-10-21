import { DefaultChatTransport, type ChatTransport, type UIMessageChunk } from "ai";

import { hasScript, type GeneratedChatMessage, type Turn } from "@/registry/super-ai/generated-chat";

interface ModelTransportOptions<C> {
  /** The chat route. */
  api: string;
  /** Plays chips, ready prompts and the fallback reply. */
  scripted: ChatTransport<GeneratedChatMessage>;
  turns: Turn<C>[];
  fetch?: typeof globalThis.fetch;
}

type SendOptions = Parameters<ChatTransport<GeneratedChatMessage>["sendMessages"]>[0];

function lastUserText(messages: GeneratedChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .trim();
}

/**
 * Forwards the model's stream. When it reports an error or breaks, it closes
 * whatever text was open, then plays the fallback reply into the same message,
 * so the reader keeps what arrived and still gets words and chips.
 */
function withFallback(
  model: ReadableStream<UIMessageChunk>,
  fallback: () => Promise<ReadableStream<UIMessageChunk>>,
): ReadableStream<UIMessageChunk> {
  return new ReadableStream<UIMessageChunk>({
    async start(controller) {
      let started = false;
      const openText = new Set<string>();
      let broke = false;
      const reader = model.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value.type === "error") {
            broke = true;
            break;
          }
          if (value.type === "start") started = true;
          if (value.type === "text-start") openText.add(value.id);
          if (value.type === "text-end") openText.delete(value.id);
          controller.enqueue(value);
        }
      } catch {
        broke = true;
      }
      if (broke) {
        void reader.cancel().catch(() => {});
        for (const id of openText) controller.enqueue({ type: "text-end", id });
        const rest = (await fallback()).getReader();
        for (;;) {
          const { done, value } = await rest.read();
          if (done) break;
          if (value.type === "start" && started) continue;
          controller.enqueue(value);
        }
      }
      controller.close();
    },
  });
}

/**
 * A transport for the demo with the model on. A message that matches a
 * scripted turn (every chip and ready prompt does) plays the script. Anything
 * else goes to the chat route. A refusal, a network failure or a broken
 * stream falls back to the scripted fallback reply.
 */
export function createModelTransport<C>({
  api,
  scripted,
  turns,
  fetch,
}: ModelTransportOptions<C>): ChatTransport<GeneratedChatMessage> {
  const model = new DefaultChatTransport<GeneratedChatMessage>({ api, fetch });
  const playScript = (options: SendOptions) => scripted.sendMessages(options);

  return {
    async sendMessages(options) {
      if (hasScript(lastUserText(options.messages), turns)) return playScript(options);
      let stream: ReadableStream<UIMessageChunk>;
      try {
        stream = await model.sendMessages(options);
      } catch {
        return playScript(options);
      }
      return withFallback(stream, () => playScript(options));
    },
    async reconnectToStream() {
      return null;
    },
  };
}
