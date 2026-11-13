import type { Message, ToolCall } from "@ag-ui/core";

import type { AgentPresenceState } from "@/registry/super-ai/agent-presence";

import { RETRY_TOOL, type AgentState } from "./scripted-agent";

/**
 * SPIKE. The seam between AG-UI's data and this registry's props. Everything
 * CopilotKit-specific that a consumer would have to write lives in this file
 * and in copilotkit-demo.tsx; no registry component was changed.
 */

export type TurnPiece =
  | { kind: "text"; id: string; text: string }
  | { kind: "tool"; id: string; call: ToolCall; result?: Extract<Message, { role: "tool" }> };

export interface Turn {
  id: string;
  role: "user" | "assistant";
  pieces: TurnPiece[];
}

const textOf = (content: unknown): string =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.flatMap((part) => (part?.type === "text" ? [String(part.text)] : [])).join(" ")
      : "";

/**
 * AG-UI is finer-grained than a chat turn: one reply arrives as a text message,
 * a tool-call message, a tool-result message and another text message. ChatShell
 * draws one bubble per `ChatShellMessage`, so consecutive agent messages fold
 * into a single turn and tool results attach to the call they answer.
 */
export function toTurns(messages: Message[]): Turn[] {
  const results = new Map<string, Extract<Message, { role: "tool" }>>();
  for (const m of messages) if (m.role === "tool") results.set(m.toolCallId, m);

  const turns: Turn[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      turns.push({ id: m.id, role: "user", pieces: [{ kind: "text", id: m.id, text: textOf(m.content) }] });
      continue;
    }
    if (m.role !== "assistant") continue;

    const pieces: TurnPiece[] = [];
    const text = textOf(m.content);
    if (text) pieces.push({ kind: "text", id: m.id, text });
    for (const call of m.toolCalls ?? []) {
      pieces.push({ kind: "tool", id: call.id, call, result: results.get(call.id) });
    }
    if (pieces.length === 0) continue;

    const last = turns.at(-1);
    if (last?.role === "assistant") last.pieces.push(...pieces);
    else turns.push({ id: m.id, role: "assistant", pieces });
  }
  return turns;
}

/** The retry call still waiting on a human, if there is one. */
export function pendingRetry(messages: Message[]): ToolCall | undefined {
  const answered = new Set(messages.flatMap((m) => (m.role === "tool" ? [m.toolCallId] : [])));
  return messages
    .flatMap((m) => (m.role === "assistant" ? (m.toolCalls ?? []) : []))
    .find((call) => call.function.name === RETRY_TOOL && !answered.has(call.id));
}

/**
 * Agent run + shared state -> the six states `agent-presence` can show.
 *
 * DECISION FOR NICK: this mapping is a design call, not plumbing. The default
 * below reads a read-only step as `watching` and a step with side effects as
 * `acting`, so the chip only goes solid when something is being changed.
 */
export function presenceFor(input: {
  running: boolean;
  awaitingApproval: boolean;
  phase: AgentState["phase"] | undefined;
}): AgentPresenceState {
  if (input.awaitingApproval) return "needs-you";
  if (!input.running) return "idle";
  return input.phase === "retrying" ? "acting" : "watching";
}
