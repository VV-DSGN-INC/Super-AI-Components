import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Message } from "@ag-ui/core";
import { renderHook } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import type { AgentPresenceState } from "./agent-presence";
import type { ChatShell } from "./chat-shell";
import {
  answerPendingCalls,
  pendingToolCall,
  presenceFor,
  toTurns,
  useAnswerOnce,
  type AgUiPresence,
  type AgUiTurn,
} from "./ag-ui-chat";

const call = (id: string, name: string, args = "{}") => ({
  id,
  type: "function" as const,
  function: { name, arguments: args },
});

/** One reply as AG-UI delivers it: text, a read call, its result, text, a gated call. */
const firstRun: Message[] = [
  { id: "u1", role: "user", content: "What failed overnight?" },
  { id: "a1", role: "assistant", content: "Reading last night's runs." },
  { id: "a2", role: "assistant", toolCalls: [call("list", "list")] },
  { id: "t1", role: "tool", toolCallId: "list", content: '{"runs":[]}' },
  { id: "a3", role: "assistant", content: "2 runs timed out overnight." },
  { id: "a4", role: "assistant", toolCalls: [call("retry", "retry")] },
];

const texts = (turn: AgUiTurn) => turn.pieces.flatMap((p) => (p.kind === "text" ? [p.text] : []));

describe("toTurns", () => {
  it("folds one reply's four agent messages into a single assistant turn", () => {
    const turns = toTurns(firstRun);
    expect(turns.map((t) => t.role)).toEqual(["user", "assistant"]);
    expect(turns[1].pieces.map((p) => p.kind)).toEqual(["text", "tool", "text", "tool"]);
  });

  it("attaches a tool result to its call and draws no turn for it", () => {
    const [, reply] = toTurns(firstRun);
    const [list, retry] = reply.pieces.filter((p) => p.kind === "tool");
    expect(list.kind === "tool" && list.result?.id).toBe("t1");
    expect(retry.kind === "tool" && retry.result).toBeUndefined();
  });

  it("starts a new assistant turn after the next user message", () => {
    const turns = toTurns([
      ...firstRun,
      { id: "u2", role: "user", content: "And credits?" },
      { id: "a5", role: "assistant", content: "360 left." },
    ]);
    expect(turns.map((t) => t.role)).toEqual(["user", "assistant", "user", "assistant"]);
  });

  it("reads a user message sent as text parts as one line", () => {
    const [turn] = toTurns([
      {
        id: "u1",
        role: "user",
        content: [
          { type: "text", text: "What failed" },
          { type: "text", text: "overnight?" },
        ],
      },
    ]);
    expect(turn.role).toBe("user");
    expect(texts(turn)).toEqual(["What failed overnight?"]);
  });

  it("draws nothing for an empty agent placeholder and keeps the reply in one turn", () => {
    const turns = toTurns([
      { id: "u1", role: "user", content: "Hi" },
      { id: "a1", role: "assistant", content: "A" },
      { id: "a2", role: "assistant" },
      { id: "a3", role: "assistant", content: "B" },
    ]);
    expect(turns.map((t) => t.role)).toEqual(["user", "assistant"]);
    expect(texts(turns[1])).toEqual(["A", "B"]);
  });
});

describe("pendingToolCall", () => {
  const answered: Message[] = [...firstRun, { id: "t2", role: "tool", toolCallId: "retry", content: "{}" }];

  it("finds the unanswered gated call by a list of names", () => {
    expect(pendingToolCall(firstRun, ["retry"])?.id).toBe("retry");
    expect(pendingToolCall(answered, ["retry"])).toBeUndefined();
  });

  it("finds the unanswered gated call by a predicate", () => {
    const isRetry = (c: { function: { name: string } }) => c.function.name === "retry";
    expect(pendingToolCall(firstRun, isRetry)?.id).toBe("retry");
    expect(pendingToolCall(answered, isRetry)).toBeUndefined();
  });

  it("ignores calls that are not gated", () => {
    expect(pendingToolCall(firstRun.slice(0, 3), ["retry"])).toBeUndefined();
  });

  it("returns the newest of two unanswered gated calls", () => {
    const messages: Message[] = [
      ...firstRun,
      { id: "a5", role: "assistant", toolCalls: [call("retry-2", "retry")] },
    ];
    expect(pendingToolCall(messages, ["retry"])?.id).toBe("retry-2");
  });

  it("skips a gated call whose arguments never finished streaming", () => {
    const messages: Message[] = [
      { id: "u1", role: "user", content: "Retry them" },
      { id: "a1", role: "assistant", toolCalls: [call("retry", "retry", '{"runIds":["r1"')] },
    ];
    expect(pendingToolCall(messages, ["retry"])).toBeUndefined();
  });
});

describe("answerPendingCalls", () => {
  const refusal = JSON.stringify({ approved: false });

  it("answers the gated call a stopped run left waiting, which unlocks the composer", () => {
    const answers = answerPendingCalls(firstRun, ["retry"], refusal);
    expect(answers).toEqual([
      { id: expect.any(String), role: "tool", toolCallId: "retry", content: refusal },
    ]);
    expect(pendingToolCall([...firstRun, ...answers], ["retry"])).toBeUndefined();
  });

  it("also answers a gated call whose arguments never finished, so the history stays whole", () => {
    const messages: Message[] = [
      { id: "u1", role: "user", content: "Retry them" },
      { id: "a1", role: "assistant", toolCalls: [call("retry", "retry", '{"runIds":["r1"')] },
    ];
    expect(answerPendingCalls(messages, ["retry"], refusal).map((m) => m.toolCallId)).toEqual(["retry"]);
  });

  it("leaves answered and ungated calls alone", () => {
    const answered: Message[] = [...firstRun, { id: "t2", role: "tool", toolCallId: "retry", content: "{}" }];
    expect(answerPendingCalls(answered, ["retry"], refusal)).toEqual([]);
    expect(answerPendingCalls(firstRun.slice(0, 3), ["retry"], refusal)).toEqual([]);
  });
});

describe("presenceFor", () => {
  it("puts a waiting approval above everything else", () => {
    expect(presenceFor({ running: true, awaitingApproval: true })).toBe("needs-you");
    expect(presenceFor({ running: false, awaitingApproval: true })).toBe("needs-you");
  });

  it("is idle whenever nothing is running", () => {
    expect(presenceFor({ running: false, awaitingApproval: false, acting: true })).toBe("idle");
  });

  it("is solid only while the caller says something is being changed", () => {
    expect(presenceFor({ running: true, awaitingApproval: false, acting: true })).toBe("acting");
    expect(presenceFor({ running: true, awaitingApproval: false })).toBe("watching");
  });
});

describe("useAnswerOnce", () => {
  it("sends the first answer and drops the rest", () => {
    const respond = vi.fn();
    const { result } = renderHook(() => useAnswerOnce<string>(respond));
    result.current("deny");
    result.current("allow");
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith("deny");
  });

  it("answers again once the client hands over a new respond", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ respond }) => useAnswerOnce<string>(respond), {
      initialProps: { respond: first },
    });
    result.current("deny");
    rerender({ respond: second });
    result.current("allow");
    result.current("allow again");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith("allow");
  });

  it("answers each paused call once when the client reuses one respond", () => {
    // CopilotKit's useHumanInTheLoop hands every paused call the same stable respond.
    const respond = vi.fn();
    const { result, rerender } = renderHook(({ callId }) => useAnswerOnce<string>(respond, callId), {
      initialProps: { callId: "call-1" },
    });
    result.current("deny");
    result.current("deny again");
    rerender({ callId: "call-2" });
    result.current("allow");
    expect(respond.mock.calls).toEqual([["deny"], ["allow"]]);
  });

  it("does nothing while there is no respond yet", () => {
    const { result } = renderHook(() => useAnswerOnce<string>(undefined));
    expect(() => result.current("deny")).not.toThrow();
  });
});

describe("contract with the components it feeds", () => {
  it("produces only presence states agent-presence can show", () => {
    expectTypeOf<AgUiPresence>().toMatchTypeOf<AgentPresenceState>();
  });

  it("produces turn roles chat-shell accepts", () => {
    type ShellRole = NonNullable<React.ComponentProps<typeof ChatShell>["messages"]>[number]["role"];
    expectTypeOf<AgUiTurn["role"]>().toEqualTypeOf<ShellRole>();
  });

  it("imports nothing but the protocol types and React, so it installs as one file", () => {
    const source = readFileSync(join(__dirname, "ag-ui-chat.tsx"), "utf8");
    const specifiers = new Set([...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]));
    expect([...specifiers].filter((s) => !["@ag-ui/core", "react"].includes(s))).toEqual([]);
  });
});
