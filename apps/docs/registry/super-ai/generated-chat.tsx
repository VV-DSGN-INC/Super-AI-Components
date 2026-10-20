"use client";

/**
 * Generated chat: the contracts behind a chat whose replies are registry
 * components.
 *
 * A reply is an AI SDK 7 `UIMessage`. Text stays a text part; everything else
 * rides as a typed data part (`data-card`, `data-widgets`, `data-question`,
 * `data-view`, `data-suggestions`). Two producers write those parts: a scripted
 * transport for the prompts an app knows exactly, and a model reaching the same
 * parts through tools. One renderer, `ReplyParts`, draws them.
 *
 * Effects that change a saved view travel as transient `data-effect` parts.
 * `useChat` hands them to `onData` and never stores them, so the host applies
 * them and the chat state never holds view logic.
 */

import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";

/** A tile's size family. Each size is its own layout, tested at its own size. */
type WidgetSize = "small" | "medium" | "large";

/** A card in a reply: a component the consumer registered under `type`. */
interface CardData {
  type: string;
  props?: Record<string, unknown>;
}

/** One tile in a reply's widget row. */
interface WidgetData {
  type: string;
  size: WidgetSize;
  props?: Record<string, unknown>;
}

/**
 * A question asked before an action that affects other people or spends
 * something. The summary says what happens, to whom, and what it costs.
 * `after` is posted as a new assistant message once approved.
 */
interface QuestionData {
  id: string;
  title: string;
  summary: string;
  undoable?: boolean;
  after?: TurnPart[];
}

/** The card a reply posts for a view it built. A click shows the view. */
interface ViewCardData {
  viewId: string;
  title: string;
  kind: string;
}

/** One saved version of a view: the question's settings, never its rows. */
interface ViewVersion {
  label: string;
  mode: string;
  variant?: string;
}

/** What a turn hands the view store to build a view. */
interface ViewInput {
  id: string;
  kind: string;
  title: string;
  scope: string;
  /** The chat or prompt that made it, shown in the frame's footer. */
  origin: string;
  version: ViewVersion;
}

/** Docked: the view is the page and the chat sits beside it. Page: the view alone. */
type ViewLayout = "docked" | "page";

/** A change to the view store, carried as data and applied by the host. */
type ViewEffect =
  | { type: "build-view"; view: ViewInput }
  | { type: "edit-view"; id: string; version: ViewVersion }
  | { type: "show-view"; id: string; layout: ViewLayout };

type GeneratedChatData = {
  card: CardData;
  widgets: { items: WidgetData[] };
  question: QuestionData;
  view: ViewCardData;
  suggestions: { items: string[] };
  effect: ViewEffect;
};

type GeneratedChatMessage = UIMessage<never, GeneratedChatData>;

/** One part of a scripted turn. Effects are listed on the turn, not here. */
type TurnPart =
  | { type: "text"; text: string }
  | { type: "data-card"; data: CardData }
  | { type: "data-widgets"; data: { items: WidgetData[] } }
  | { type: "data-question"; data: QuestionData }
  | { type: "data-view"; data: ViewCardData }
  | { type: "data-suggestions"; data: { items: string[] } };

/**
 * A scripted reply. `match` holds every phrasing that reaches it, already
 * normalised: matching is exact, so a chip and the same words typed land on
 * the same turn and nothing lands by accident.
 */
interface Turn<C = unknown> {
  id: string;
  match: string[];
  parts: TurnPart[] | ((ctx: C) => TurnPart[]);
  effects?: ViewEffect[] | ((ctx: C) => ViewEffect[]);
}

/** Lower case, punctuation to spaces, whitespace collapsed. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The turn whose `match` holds the normalised text, else the fallback. */
function findTurn<C>(text: string, turns: Turn<C>[], fallback: Turn<C>): Turn<C> {
  const key = normalise(text);
  if (key === "") return fallback;
  return turns.find((turn) => turn !== fallback && turn.match.includes(key)) ?? fallback;
}

/** Whether a scripted turn answers this text. */
function hasScript<C>(text: string, turns: Turn<C>[]): boolean {
  const key = normalise(text);
  return key !== "" && turns.some((turn) => turn.match.includes(key));
}

/** The text parts of the last user message, joined with spaces. */
function lastUserText(messages: GeneratedChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    if (message.role !== "user") continue;
    return message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join(" ")
      .trim();
  }
  return "";
}

interface ScriptedTransportOptions<C> {
  turns: Turn<C>[];
  fallback: Turn<C>;
  /** Pause between parts, so a scripted reply arrives the way a streamed one does. */
  stepMs?: number;
  /** Read when a turn starts, for turns whose reply depends on host state. */
  context?: () => C;
}

type GeneratedChatChunk = UIMessageChunk<never, GeneratedChatData>;

/** Resolves after `ms`, or at once when the signal aborts. */
function pause(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (ms <= 0 || signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}

/**
 * A `ChatTransport` that plays scripted turns as a real stream: one part per
 * step, then the turn's effects as transient data, then `finish`. A scripted
 * reply goes through the same `useChat` state a model reply does, so there is
 * one reveal clock, not two. Stopping the chat aborts the signal; the stream
 * then closes with what has arrived and sends nothing more.
 */
function createScriptedTransport<C>({
  turns,
  fallback,
  stepMs = 350,
  context,
}: ScriptedTransportOptions<C>): ChatTransport<GeneratedChatMessage> {
  return {
    async sendMessages({ messages, abortSignal }) {
      const turn = findTurn(lastUserText(messages), turns, fallback);
      const ctx = context?.() as C;
      const parts = typeof turn.parts === "function" ? turn.parts(ctx) : turn.parts;
      const effects = typeof turn.effects === "function" ? turn.effects(ctx) : (turn.effects ?? []);

      return new ReadableStream<GeneratedChatChunk>({
        async start(controller) {
          let open = true;
          const emit = (chunk: GeneratedChatChunk) => {
            if (open) controller.enqueue(chunk);
          };
          const stopped = () => {
            if (!abortSignal?.aborted) return false;
            if (open) {
              open = false;
              controller.close();
            }
            return true;
          };

          emit({ type: "start" });
          for (const [index, part] of parts.entries()) {
            if (index > 0) await pause(stepMs, abortSignal);
            if (stopped()) return;
            if (part.type === "text") {
              const id = `${turn.id}-text-${index}`;
              emit({ type: "text-start", id });
              emit({ type: "text-delta", id, delta: part.text });
              emit({ type: "text-end", id });
            } else {
              emit({
                type: part.type,
                id: `${turn.id}-part-${index}`,
                data: part.data,
              } as GeneratedChatChunk);
            }
          }
          if (stopped()) return;
          for (const effect of effects) emit({ type: "data-effect", data: effect, transient: true });
          emit({ type: "finish" });
          open = false;
          controller.close();
        },
      }) as ReadableStream<UIMessageChunk>;
    },
    async reconnectToStream() {
      return null;
    },
  };
}

export { createScriptedTransport, findTurn, hasScript, lastUserText, normalise };
export type {
  CardData,
  GeneratedChatData,
  GeneratedChatMessage,
  QuestionData,
  ScriptedTransportOptions,
  Turn,
  TurnPart,
  ViewCardData,
  ViewEffect,
  ViewInput,
  ViewLayout,
  ViewVersion,
  WidgetData,
  WidgetSize,
};
