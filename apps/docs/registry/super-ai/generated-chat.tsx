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

/**
 * Where a question stands. `skipped` covers both a "no" and a question closed
 * because a newer one was asked; `undone` is an approval taken back in its
 * undo window.
 */
type QuestionStatus = "requested" | "approved" | "skipped" | "undone";

interface QuestionState {
  /** The latest status per question id. */
  status: Record<string, QuestionStatus>;
  /** Which card shows each question now, keyed by question id. */
  cards: Record<string, string>;
  /** A card's status frozen when a newer card took its question over. */
  settled: Record<string, QuestionStatus>;
  /** The one question waiting for an answer, if any. */
  openId: string | null;
}

type QuestionAction =
  | { type: "ask"; id: string; cardKey: string }
  | { type: "answer"; id: string; approved: boolean }
  | { type: "undo"; id: string };

const initialQuestionState: QuestionState = { status: {}, cards: {}, settled: {}, openId: null };

/** A question waiting for its answer, or already approved, cannot be asked again. */
function isQuestionLocked(status: QuestionStatus | undefined): boolean {
  return status === "requested" || status === "approved";
}

/**
 * One open question at a time. Asking closes any other open question as
 * skipped; asking an approved one changes nothing, so a repeated click never
 * runs an action twice. When a question moves to a new card, the old card
 * keeps the answer it got.
 */
function questionReducer(state: QuestionState, action: QuestionAction): QuestionState {
  switch (action.type) {
    case "ask": {
      const current = state.status[action.id];
      if (isQuestionLocked(current)) return state;
      const status = { ...state.status, [action.id]: "requested" as const };
      if (state.openId && state.openId !== action.id) status[state.openId] = "skipped";
      const settled = { ...state.settled };
      const previousCard = state.cards[action.id];
      if (previousCard && previousCard !== action.cardKey && current) settled[previousCard] = current;
      return { status, cards: { ...state.cards, [action.id]: action.cardKey }, settled, openId: action.id };
    }
    case "answer": {
      if (state.status[action.id] !== "requested") return state;
      return {
        ...state,
        status: { ...state.status, [action.id]: action.approved ? "approved" : "skipped" },
        openId: state.openId === action.id ? null : state.openId,
      };
    }
    case "undo": {
      if (state.status[action.id] !== "approved") return state;
      return { ...state, status: { ...state.status, [action.id]: "undone" } };
    }
  }
}

/** What one card shows: the live status while it is the question's card, its frozen one after. */
function questionStatusFor(state: QuestionState, id: string, cardKey: string): QuestionStatus | undefined {
  return state.cards[id] === cardKey ? state.status[id] : state.settled[cardKey];
}

/**
 * A question id built from everything its sentence names, so changing what the
 * action would touch makes a new question rather than reusing a settled one.
 */
function questionId(...inputs: (string | number)[]): string {
  return normalise(inputs.join(" ")).replace(/ /g, "-");
}

/**
 * A saved view: the question that made it and its versions, never its rows.
 * Opening it reruns the question on current data.
 */
interface ViewSpec {
  id: string;
  kind: string;
  title: string;
  scope: string;
  origin: string;
  versions: ViewVersion[];
  current: number;
  /** True only on a pinned copy, stored under `pin:<id>`. */
  pinned: boolean;
  /** When the view last ran: built, shown, edited or rerun. */
  ranAt: number;
}

interface ViewState {
  views: Record<string, ViewSpec>;
  activeId: string | null;
  layout: ViewLayout;
  /** The view last built or touched, for a follow-up like "pin it". */
  recentId: string | null;
}

type ViewAction =
  | { type: "effect"; effect: ViewEffect; at: number }
  /** Shows a view and keeps the layout: a card clicked in the chat. */
  | { type: "show"; id: string; at: number }
  /** Shows a view as the page: opened from a library or a pin. */
  | { type: "open"; id: string; at: number }
  | { type: "edit"; id: string; version: ViewVersion; at: number }
  | { type: "undo"; id: string }
  | { type: "pin"; id: string }
  | { type: "rerun"; id: string; at: number }
  | { type: "close" };

const initialViewState: ViewState = { views: {}, activeId: null, layout: "docked", recentId: null };

function currentVersion(view: ViewSpec): ViewVersion {
  return view.versions[view.current]!;
}

function pinnedId(id: string): string {
  return `pin:${id}`;
}

function withView(state: ViewState, view: ViewSpec): ViewState {
  return { ...state, views: { ...state.views, [view.id]: view } };
}

/**
 * The view store. A turn builds a view and never shows it; only a click, or a
 * turn that names the view, shows one. `show` keeps the layout and `open`
 * makes the view the page: keep the two apart, because a chat card that
 * collapses the chat is the usual mistake. A pin is a copy, so later edits to
 * the chat's view never reach it.
 */
function viewReducer(state: ViewState, action: ViewAction): ViewState {
  if (action.type === "close") return { ...state, activeId: null, layout: "docked" };
  if (action.type === "effect") {
    const { effect, at } = action;
    if (effect.type === "build-view") {
      const { version, ...rest } = effect.view;
      const view: ViewSpec = { ...rest, versions: [version], current: 0, pinned: false, ranAt: at };
      return { ...withView(state, view), recentId: view.id };
    }
    if (effect.type === "edit-view")
      return viewReducer(state, { type: "edit", id: effect.id, version: effect.version, at });
    const shown = viewReducer(state, { type: "show", id: effect.id, at });
    return shown === state ? state : { ...shown, layout: effect.layout };
  }

  const view = state.views[action.id];
  if (!view) return state;
  switch (action.type) {
    case "show":
      return { ...withView(state, { ...view, ranAt: action.at }), activeId: view.id, recentId: view.id };
    case "open":
      return { ...viewReducer(state, { type: "show", id: view.id, at: action.at }), layout: "page" };
    case "edit": {
      const versions = [...view.versions.slice(0, view.current + 1), action.version];
      const edited = { ...view, versions, current: versions.length - 1, ranAt: action.at };
      return { ...withView(state, edited), recentId: view.id };
    }
    case "undo":
      return view.current > 0 ? withView(state, { ...view, current: view.current - 1 }) : state;
    case "pin":
      return withView(state, { ...view, id: pinnedId(view.id), pinned: true });
    case "rerun":
      return withView(state, { ...view, ranAt: action.at });
  }
}

export {
  createScriptedTransport,
  currentVersion,
  findTurn,
  hasScript,
  initialQuestionState,
  initialViewState,
  isQuestionLocked,
  lastUserText,
  normalise,
  questionId,
  questionReducer,
  questionStatusFor,
  pinnedId,
  viewReducer,
};
export type {
  CardData,
  GeneratedChatData,
  GeneratedChatMessage,
  QuestionAction,
  QuestionData,
  QuestionState,
  QuestionStatus,
  ScriptedTransportOptions,
  Turn,
  TurnPart,
  ViewCardData,
  ViewEffect,
  ViewAction,
  ViewInput,
  ViewLayout,
  ViewSpec,
  ViewState,
  ViewVersion,
  WidgetData,
  WidgetSize,
};
