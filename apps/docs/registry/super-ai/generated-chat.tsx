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

import type { UIMessage } from "ai";

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

export { findTurn, hasScript, lastUserText, normalise };
export type {
  CardData,
  GeneratedChatData,
  GeneratedChatMessage,
  QuestionData,
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
