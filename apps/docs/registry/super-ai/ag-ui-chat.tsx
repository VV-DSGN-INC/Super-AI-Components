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
 *     const answer = useAnswerOnce(props.respond);
 *     return <PermissionPrompt open onAllowOnce={() => answer({ approved: true })}
 *       onDeny={() => answer({ approved: false })} ... />;
 *   } });
 *   const waiting = pendingToolCall(agent.messages, ["retry_runs"]);
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

/**
 * The newest gated tool call still waiting on a person. A call whose
 * arguments never finished streaming (the run was stopped mid-call) cannot be
 * approved, so it never counts as waiting and never locks the composer.
 */
export function pendingToolCall(
  messages: Message[],
  gated: readonly string[] | ((call: ToolCall) => boolean),
): ToolCall | undefined {
  const isGated =
    typeof gated === "function" ? gated : (call: ToolCall) => gated.includes(call.function.name);
  const answered = new Set(messages.flatMap((m) => (m.role === "tool" ? [m.toolCallId] : [])));
  return messages
    .flatMap((m) => (m.role === "assistant" ? (m.toolCalls ?? []) : []))
    .filter((call) => isGated(call) && !answered.has(call.id) && isComplete(call.function.arguments))
    .at(-1);
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
 * hear one answer, not two. A new `respond` (the next paused call) can be
 * answered again.
 */
export function useAnswerOnce<T>(respond: ((value: T) => unknown) | undefined): (value: T) => void {
  const answeredFor = React.useRef<unknown>(null);
  return React.useCallback(
    (value: T) => {
      if (!respond || answeredFor.current === respond) return;
      answeredFor.current = respond;
      void respond(value);
    },
    [respond],
  );
}
