import { EventType, type BaseEvent, type Message } from "@ag-ui/core";
import { describe, expect, it } from "vitest";

import { retryCost, timedOutOvernight } from "@/components/generated-chat/fixtures";

import { LIST_TOOL, RETRY_TOOL, scriptFor } from "./scripted-agent";

const ids = { threadId: "t1", runId: "run1" };
const user: Message = { id: "u1", role: "user", content: "What failed overnight?" };

const types = (events: BaseEvent[]) => events.map((e) => e.type);
const said = (events: BaseEvent[]) =>
  events
    .flatMap((e) =>
      e.type === EventType.TEXT_MESSAGE_CONTENT ? [(e as unknown as { delta: string }).delta] : [],
    )
    .join("");

/** The conversation as the browser holds it once the retry call is answered. */
const answered = (content: string): Message[] => [
  user,
  {
    id: "a1",
    role: "assistant",
    toolCalls: [{ id: "run1-retry", type: "function", function: { name: RETRY_TOOL, arguments: "{}" } }],
  },
  { id: "tool1", role: "tool", toolCallId: "run1-retry", content },
];

describe("scriptFor", () => {
  it("opens and closes every run, with nothing left streaming", () => {
    for (const messages of [[user], answered('{"approved":true}'), answered('{"approved":false}')]) {
      const events = scriptFor({ ...ids, messages });
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events.at(-1)?.type).toBe(EventType.RUN_FINISHED);
      const count = (t: EventType) => types(events).filter((x) => x === t).length;
      expect(count(EventType.TEXT_MESSAGE_START)).toBe(count(EventType.TEXT_MESSAGE_END));
      expect(count(EventType.TOOL_CALL_START)).toBe(count(EventType.TOOL_CALL_END));
    }
  });

  it("first run reads, answers its own read tool, then stops on the retry call", () => {
    const events = scriptFor({ ...ids, messages: [user] });
    const calls = events.filter((e) => e.type === EventType.TOOL_CALL_START) as unknown as {
      toolCallName: string;
      toolCallId: string;
    }[];
    expect(calls.map((c) => c.toolCallName)).toEqual([LIST_TOOL, RETRY_TOOL]);

    // The read tool is the agent's own: it carries a result. The retry call does
    // not, which is what hands it to the browser.
    const results = events.filter((e) => e.type === EventType.TOOL_CALL_RESULT) as unknown as {
      toolCallId: string;
    }[];
    expect(results.map((r) => r.toolCallId)).toEqual([calls[0].toolCallId]);
  });

  it("asks for exactly the runs and credits the fixture holds", () => {
    const events = scriptFor({ ...ids, messages: [user] });
    const args = events.filter((e) => e.type === EventType.TOOL_CALL_ARGS) as unknown as { delta: string }[];
    const failed = timedOutOvernight();
    expect(failed.length).toBeGreaterThan(0);
    expect(JSON.parse(args[1].delta)).toEqual({
      runIds: failed.map((r) => r.id),
      credits: retryCost(failed),
    });
  });

  it("retries after approval and reports the spend", () => {
    const events = scriptFor({ ...ids, messages: answered('{"approved":true}') });
    expect(said(events)).toContain(`Retrying ${timedOutOvernight().length} runs`);
    expect(events.some((e) => e.type === EventType.TOOL_CALL_START)).toBe(false);
  });

  it("honours an edited call over the one it proposed", () => {
    const [first] = timedOutOvernight();
    const events = scriptFor({
      ...ids,
      messages: answered(JSON.stringify({ approved: true, runIds: [first.id] })),
    });
    expect(said(events)).toContain("Retrying 1 run now");
    expect(said(events)).toContain(`${first.credits} credits`);
  });

  it("spends nothing on an edit that names only unknown runs", () => {
    const events = scriptFor({
      ...ids,
      messages: answered(JSON.stringify({ approved: true, runIds: ["not-a-run"] })),
    });
    expect(said(events)).toBe("Left them as they are. Nothing was spent.");
  });

  it("spends nothing on a refusal, an empty edit or an unreadable answer", () => {
    for (const content of ['{"approved":false}', '{"approved":true,"runIds":[]}', "not json"]) {
      const events = scriptFor({ ...ids, messages: answered(content) });
      expect(said(events)).toBe("Left them as they are. Nothing was spent.");
    }
  });
});
