import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  type LanguageModel,
} from "ai";
import { z } from "zod";

import type { GeneratedChatMessage } from "@/registry/super-ai/generated-chat";

import { buildFailedRunsView, buildSpendView, CHIPS, FALLBACK_TEXT, READY_PROMPTS } from "../views";
import { toModelMessages } from "./model-messages";
import type { RateLimiter } from "./rate-limit";
import { systemPrompt } from "./system-prompt";

/** The largest request body the route reads, in bytes. */
export const BODY_LIMIT = 32 * 1024;
/** The most the model may write in one reply. */
export const MAX_OUTPUT_TOKENS = 800;
/** Model calls per reply: room for a card, a view and the chips, then words. */
const MAX_STEPS = 4;

interface ChatHandlerOptions {
  /** The gateway model, or null when the kill switch is off. */
  model: LanguageModel | null;
  limiter: RateLimiter;
  now?: () => number;
}

const refuse = (status: number, error: string) => Response.json({ error }, { status });

/** The caller's address as the platform forwards it. Only used to count requests. */
function clientAddress(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function lastUserText(messages: GeneratedChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .trim();
}

/**
 * The chat route. It streams the same message parts the scripted transport
 * writes: the model's words, plus cards, views and chips that its three
 * read-only tools post. Chips always come last, a reply always has words and
 * chips, and a model failure becomes the scripted fallback reply.
 */
export function createChatHandler({ model, limiter, now = Date.now }: ChatHandlerOptions) {
  return async function handle(req: Request): Promise<Response> {
    if (!model) return refuse(503, "The model is off. Replies are scripted.");
    if (!limiter.check(clientAddress(req), now()))
      return refuse(429, "Too many questions. Try again in a few minutes.");

    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > BODY_LIMIT) return refuse(413, "The conversation is too long to send.");
    const raw = await req.text();
    if (raw.length > BODY_LIMIT) return refuse(413, "The conversation is too long to send.");

    let messages: GeneratedChatMessage[];
    try {
      messages = (JSON.parse(raw) as { messages?: GeneratedChatMessage[] }).messages ?? [];
    } catch {
      return refuse(400, "The request could not be read.");
    }
    if (!Array.isArray(messages) || messages.length === 0)
      return refuse(400, "There is no question to answer.");
    const question = lastUserText(messages).slice(0, 80) || "Chat";

    const stream = createUIMessageStream<GeneratedChatMessage>({
      execute: async ({ writer }) => {
        let chips: string[] = [];
        let wroteText = false;
        // The scripted transport opens and closes each reply the same way.
        writer.write({ type: "start" });

        const result = streamText({
          model,
          system: systemPrompt(),
          messages: toModelMessages(messages),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          stopWhen: isStepCount(MAX_STEPS),
          tools: {
            show_card: tool({
              description:
                "Show a card in the reply: failed-runs lists the failed runs, week-spend shows this week's spend.",
              inputSchema: z.object({ card: z.enum(["failed-runs", "week-spend"]) }),
              execute: async ({ card }) => {
                writer.write({ type: "data-card", data: { type: card } });
                return `Showed the ${card} card.`;
              },
            }),
            build_view: tool({
              description:
                "Build a view the person can open beside the chat from the card it posts: failed-runs or spend. It does not open the view.",
              inputSchema: z.object({ view: z.enum(["failed-runs", "spend"]) }),
              execute: async ({ view }) => {
                const input = view === "spend" ? buildSpendView(question) : buildFailedRunsView(question);
                // The view exists before its card is posted, as in the script.
                writer.write({
                  type: "data-effect",
                  data: { type: "build-view", view: input },
                  transient: true,
                });
                writer.write({
                  type: "data-view",
                  data: { viewId: input.id, title: input.title, kind: input.kind },
                });
                return `Built the view ${input.title}. The person opens it from its card.`;
              },
            }),
            suggest_followups: tool({
              description:
                "Offer one to three follow-up chips, chosen from the allowed phrases. They appear after your words.",
              inputSchema: z.object({ items: z.array(z.enum(CHIPS)).min(1).max(3) }),
              execute: async ({ items }) => {
                chips = items;
                return "The chips will appear after your words.";
              },
            }),
          },
        });

        let failed = false;
        try {
          for await (const part of result.stream) {
            if (part.type === "text-start") writer.write({ type: "text-start", id: part.id });
            else if (part.type === "text-delta") {
              if (part.text.trim()) wroteText = true;
              writer.write({ type: "text-delta", id: part.id, delta: part.text });
            } else if (part.type === "text-end") writer.write({ type: "text-end", id: part.id });
            else if (part.type === "error") {
              failed = true;
              break;
            }
          }
        } catch {
          failed = true;
        }
        if (failed) {
          console.error("[generated-chat] the model failed; sending the fallback reply");
          chips = [];
        }

        if (!wroteText || failed) {
          writer.write({ type: "text-start", id: "fallback" });
          writer.write({ type: "text-delta", id: "fallback", delta: FALLBACK_TEXT });
          writer.write({ type: "text-end", id: "fallback" });
        }
        writer.write({ type: "data-suggestions", data: { items: chips.length > 0 ? chips : READY_PROMPTS } });
        writer.write({ type: "finish" });
      },
      onError: () => "The model could not answer.",
    });

    return createUIMessageStreamResponse({ stream });
  };
}
