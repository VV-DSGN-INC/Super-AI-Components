import type { Message } from "@ag-ui/core";
import { describe, expect, it } from "vitest";

import { pendingRetry, presenceFor, toTurns } from "./adapter";
import { LIST_TOOL, RETRY_TOOL } from "./scripted-agent";

const call = (id: string, name: string) => ({
  id,
  type: "function" as const,
  function: { name, arguments: "{}" },
});

/** What the browser holds after the first scripted run. */
const firstRun: Message[] = [
  { id: "u1", role: "user", content: "What failed overnight?" },
  { id: "a1", role: "assistant", content: "Reading last night's runs." },
  { id: "a2", role: "assistant", toolCalls: [call("list", LIST_TOOL)] },
  { id: "t1", role: "tool", toolCallId: "list", content: '{"runs":[]}' },
  { id: "a3", role: "assistant", content: "2 runs timed out overnight." },
  { id: "a4", role: "assistant", toolCalls: [call("retry", RETRY_TOOL)] },
];

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
});

describe("pendingRetry", () => {
  it("finds the unanswered retry call and loses it once answered", () => {
    expect(pendingRetry(firstRun)?.id).toBe("retry");
    const answered: Message[] = [...firstRun, { id: "t2", role: "tool", toolCallId: "retry", content: "{}" }];
    expect(pendingRetry(answered)).toBeUndefined();
  });
});

describe("presenceFor", () => {
  it("puts a waiting approval above everything else", () => {
    expect(presenceFor({ running: true, awaitingApproval: true, phase: "waiting" })).toBe("needs-you");
    expect(presenceFor({ running: false, awaitingApproval: true, phase: "waiting" })).toBe("needs-you");
  });

  it("is solid only while something is being changed", () => {
    expect(presenceFor({ running: true, awaitingApproval: false, phase: "reading" })).toBe("watching");
    expect(presenceFor({ running: true, awaitingApproval: false, phase: "retrying" })).toBe("acting");
    expect(presenceFor({ running: false, awaitingApproval: false, phase: "done" })).toBe("idle");
  });
});
