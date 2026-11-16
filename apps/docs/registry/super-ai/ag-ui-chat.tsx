"use client";

/**
 * AG-UI chat: the seam between the AG-UI protocol and this registry's chat
 * components.
 *
 * AG-UI is the open event protocol agent runtimes stream to a UI: text,
 * tool calls, tool results and shared state. Any AG-UI client (CopilotKit's
 * headless hooks, `@ag-ui/client`, your own) ends up holding a `Message[]`.
 * This file turns that list into what `chat-shell`, `permission-prompt` and
 * `agent-presence` take. It reads protocol types only, so it does not care
 * which client produced them, and it imports no other registry item.
 *
 * Proven with CopilotKit 1.87's headless hooks. The wiring, in outline:
 *
 *   const { agent } = useAgent();
 *   useHumanInTheLoop({ name: "retry_runs", parameters, render: (props) => {
 *     const answer = useAnswerOnce(props.respond, props.toolCallId);
 *     return <PermissionPrompt open onAllowOnce={() => answer({ approved: true })}
 *       onDeny={() => answer({ approved: false })} ... />;
 *   } });
 *   const waiting = pendingToolCall(agent.messages, ["retry_runs"]);
 *   // After the person stops, refuse any gated call still waiting, including
 *   // one that arrives after the click, until they send the next message:
 *   if (stoppedByPerson && !agent.isRunning)
 *     for (const m of answerPendingCalls(agent.messages, ["retry_runs"], refusal)) agent.addMessage(m);
 *   <ChatShell messages={toTurns(agent.messages).map(renderTurn)} ... />
 *   <AgentPresence state={presenceFor({ running: agent.isRunning,
 *     awaitingApproval: Boolean(waiting) })} ... />
 */

import type { Message, ToolCall } from "@ag-ui/core";
import * as React from "react";

type ToolMessage = Extract<Message, { role: "tool" }>;

/** One piece of a turn: a run of text, or a tool call with its result once it has one. */
export type AgUiTurnPiece =
  | { kind: "text"; id: string; text: string }
  | { kind: "tool"; id: string; call: ToolCall; result?: ToolMessage };

/** One chat bubble. Same `id` and `role` as a `chat-shell` message; the host renders the pieces. */
export interface AgUiTurn {
  id: string;
  role: "user" | "assistant";
  pieces: AgUiTurnPiece[];
}

/** The `agent-presence` states a run can be in from what AG-UI reports. */
export type AgUiPresence = "needs-you" | "idle" | "acting" | "watching";

const textOf = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .flatMap((part: { type?: unknown; text?: unknown } | null) =>
      part?.type === "text" && typeof part.text === "string" ? [part.text] : [],
    )
    .join(" ");
};

/**
 * AG-UI is finer-grained than a chat turn: one reply arrives as a text
 * message, a tool-call message, a tool-result message and another text
 * message. A chat shell draws one bubble per turn, so consecutive agent
 * messages fold into one turn and each tool result attaches to its call.
 */
export function toTurns(messages: Message[]): AgUiTurn[] {
  const results = new Map<string, ToolMessage>();
  for (const m of messages) if (m.role === "tool") results.set(m.toolCallId, m);

  const turns: AgUiTurn[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      turns.push({ id: m.id, role: "user", pieces: [{ kind: "text", id: m.id, text: textOf(m.content) }] });
      continue;
    }
    if (m.role !== "assistant") continue;

    const pieces: AgUiTurnPiece[] = [];
    const text = textOf(m.content);
    if (text) pieces.push({ kind: "text", id: m.id, text });
    for (const call of m.toolCalls ?? []) {
      pieces.push({ kind: "tool", id: call.id, call, result: results.get(call.id) });
    }
    // An empty placeholder (mid-stream, or a reply that said nothing) draws no bubble.
    if (pieces.length === 0) continue;

    const last = turns.at(-1);
    if (last?.role === "assistant") last.pieces.push(...pieces);
    else turns.push({ id: m.id, role: "assistant", pieces });
  }
  return turns;
}

const isComplete = (json: string) => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};

type Gated = readonly string[] | ((call: ToolCall) => boolean);

/** Gated calls with no result yet, oldest first. */
function unansweredGated(messages: Message[], gated: Gated): ToolCall[] {
  const isGated =
    typeof gated === "function" ? gated : (call: ToolCall) => gated.includes(call.function.name);
  const answered = new Set(messages.flatMap((m) => (m.role === "tool" ? [m.toolCallId] : [])));
  return messages
    .flatMap((m) => (m.role === "assistant" ? (m.toolCalls ?? []) : []))
    .filter((call) => isGated(call) && !answered.has(call.id));
}

/**
 * The newest gated tool call still waiting on a person. A call whose
 * arguments never finished streaming (the run was stopped mid-call) cannot be
 * approved, so it never counts as waiting.
 *
 * A call whose arguments did finish can still be stranded: a client may skip
 * the approval step on a stopped run (CopilotKit does), so no prompt ever
 * appears for it. After the person stops a run, answer what is pending with
 * `answerPendingCalls`, or the composer stays locked on a call nobody can
 * answer. Do it once the run has ended, not at the click: a call can still
 * arrive after Stop is pressed.
 */
export function pendingToolCall(messages: Message[], gated: Gated): ToolCall | undefined {
  return unansweredGated(messages, gated)
    .filter((call) => isComplete(call.function.arguments))
    .at(-1);
}

/**
 * One tool message per gated call still waiting, carrying `content` as the
 * answer. Add them to the conversation after the person stops a run: stopping
 * is a refusal, in the same way dismissing `permission-prompt` is a Deny, so
 * the agent's history ends with an answer instead of a dangling call. Calls
 * whose arguments never finished are answered too, so the history stays whole.
 */
export function answerPendingCalls(messages: Message[], gated: Gated, content: string): ToolMessage[] {
  return unansweredGated(messages, gated).map((call) => ({
    id: `${call.id}-stopped`,
    role: "tool",
    toolCallId: call.id,
    content,
  }));
}

/**
 * Run state to an `agent-presence` state. A waiting approval outranks
 * everything; nothing running is idle; otherwise the chip goes solid only
 * while the caller says something is being changed. Which work counts as
 * changing something is app knowledge, so the caller passes `acting`.
 */
export function presenceFor(input: {
  running: boolean;
  awaitingApproval: boolean;
  acting?: boolean;
}): AgUiPresence {
  if (input.awaitingApproval) return "needs-you";
  if (!input.running) return "idle";
  return input.acting ? "acting" : "watching";
}

/**
 * Wraps a client's respond function so a paused call is answered exactly
 * once. A dialog can report more than one way of closing, and the agent must
 * hear one answer, not two.
 *
 * Pass the paused call's id. Some clients (CopilotKit's `useHumanInTheLoop`
 * among them) hand every paused call the same stable `respond`, so the call
 * id, not the function, is what tells one call from the next. A new call id,
 * or a new `respond`, can be answered again.
 */
export function useAnswerOnce<T>(
  respond: ((value: T) => unknown) | undefined,
  callId?: string,
): (value: T) => void {
  const answeredFor = React.useRef<{ respond: unknown; callId: string | undefined } | null>(null);
  return React.useCallback(
    (value: T) => {
      const last = answeredFor.current;
      if (!respond || (last?.respond === respond && last.callId === callId)) return;
      answeredFor.current = { respond, callId };
      void respond(value);
    },
    [respond, callId],
  );
}
