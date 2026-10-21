import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import type { GeneratedChatMessage } from "@/registry/super-ai/generated-chat";

import { buildSpendView, FALLBACK_TEXT, READY_PROMPTS } from "../views";
import { BODY_LIMIT, createChatHandler, MAX_OUTPUT_TOKENS } from "./chat-handler";
import { createRateLimiter } from "./rate-limit";

type Chunk = Record<string, unknown> & { type: string };

const finish = (reason: "stop" | "tool-calls") => ({
  type: "finish" as const,
  finishReason: { unified: reason, raw: undefined },
  logprobs: undefined,
  usage: {
    inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 5, text: 5, reasoning: undefined },
  },
});
const text = (id: string, value: string) => [
  { type: "text-start" as const, id },
  { type: "text-delta" as const, id, delta: value },
  { type: "text-end" as const, id },
];
const call = (id: string, toolName: string, input: unknown) => ({
  type: "tool-call" as const,
  toolCallId: id,
  toolName,
  input: JSON.stringify(input),
});

/** A mock model that plays one list of chunks per step and records each call. */
function scriptedModel(...steps: unknown[][]) {
  const calls: { prompt: unknown[]; maxOutputTokens?: number }[] = [];
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      calls.push({ prompt: options.prompt as unknown[], maxOutputTokens: options.maxOutputTokens });
      const chunks = steps[calls.length - 1] ?? [...text("t-end", "Done."), finish("stop")];
      return { stream: simulateReadableStream({ chunks: chunks as never[] }) };
    },
  });
  return { model, calls };
}

const ask = (question: string, extra: GeneratedChatMessage[] = []) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    body: JSON.stringify({
      messages: [...extra, { id: "u", role: "user", parts: [{ type: "text", text: question }] }],
    }),
  });

async function chunksOf(res: Response): Promise<Chunk[]> {
  const body = await res.text();
  return body
    .split("\n")
    .filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.slice(6)) as Chunk);
}
const textOf = (chunks: Chunk[]) =>
  chunks
    .filter((c) => c.type === "text-delta")
    .map((c) => c.delta as string)
    .join("");
const open = () => createRateLimiter({ limit: 100, windowMs: 60_000 });

describe("createChatHandler", () => {
  it("answers 503 when the model is off", async () => {
    const res = await createChatHandler({ model: null, limiter: open() })(ask("hi"));
    expect(res.status).toBe(503);
  });

  it("answers 429 when the address is over its limit", async () => {
    const { model } = scriptedModel();
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const handler = createChatHandler({ model, limiter, now: () => 0 });
    expect((await handler(ask("one"))).status).toBe(200);
    expect((await handler(ask("two"))).status).toBe(429);
  });

  it("answers 413 for a body over the cap and 400 for one it cannot read", async () => {
    const { model } = scriptedModel();
    const handler = createChatHandler({ model, limiter: open() });
    expect((await handler(ask("x".repeat(BODY_LIMIT)))).status).toBe(413);
    const bad = new Request("http://localhost/api/chat", { method: "POST", body: "{not json" });
    expect((await handler(bad)).status).toBe(400);
    const empty = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    });
    expect((await handler(empty)).status).toBe(400);
  });

  it("streams a card the model shows, with its words, and ends on the ready prompts when it offers no chips", async () => {
    const { model } = scriptedModel(
      [call("c1", "show_card", { card: "failed-runs" }), finish("tool-calls")],
      [...text("t1", "Three runs failed overnight."), finish("stop")],
    );
    const chunks = await chunksOf(
      await createChatHandler({ model, limiter: open() })(ask("which runs broke?")),
    );
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: "data-card", data: { type: "failed-runs" } }),
    );
    expect(textOf(chunks)).toBe("Three runs failed overnight.");
    expect(chunks.filter((c) => c.type.startsWith("tool-"))).toEqual([]);
    const data = chunks.filter((c) => c.type.startsWith("data-"));
    expect(data.at(-1)).toEqual(
      expect.objectContaining({ type: "data-suggestions", data: { items: READY_PROMPTS } }),
    );
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("builds a view before posting its card, with the question as its origin", async () => {
    const { model } = scriptedModel(
      [call("c1", "build_view", { view: "spend" }), finish("tool-calls")],
      [...text("t1", "Built it."), finish("stop")],
    );
    const chunks = await chunksOf(
      await createChatHandler({ model, limiter: open() })(ask("keep an eye on spend")),
    );
    const effect = chunks.findIndex((c) => c.type === "data-effect");
    const card = chunks.findIndex((c) => c.type === "data-view");
    expect(chunks[effect]).toEqual(
      expect.objectContaining({
        transient: true,
        data: { type: "build-view", view: buildSpendView("keep an eye on spend") },
      }),
    );
    expect(chunks[card]).toEqual(
      expect.objectContaining({
        data: { viewId: "spend", title: "Spend by project this week", kind: "generated" },
      }),
    );
    expect(effect).toBeLessThan(card);
  });

  it("puts the chips the model chose last, after words it wrote later", async () => {
    const { model } = scriptedModel(
      [call("c1", "suggest_followups", { items: ["Show spend by project"] }), finish("tool-calls")],
      [...text("t1", "Video took most of it."), finish("stop")],
    );
    const chunks = await chunksOf(
      await createChatHandler({ model, limiter: open() })(ask("where did credits go")),
    );
    const last = chunks.filter((c) => c.type !== "finish").at(-1);
    expect(last).toEqual(
      expect.objectContaining({ type: "data-suggestions", data: { items: ["Show spend by project"] } }),
    );
    expect(textOf(chunks)).toBe("Video took most of it.");
  });

  it("writes the fallback sentence when the model says nothing", async () => {
    const { model } = scriptedModel([finish("stop")]);
    const chunks = await chunksOf(await createChatHandler({ model, limiter: open() })(ask("hmm")));
    expect(textOf(chunks)).toBe(FALLBACK_TEXT);
  });

  it("rejects a tool input outside the enum and still ends on chips", async () => {
    const { model } = scriptedModel(
      [call("c1", "show_card", { card: "payroll" }), finish("tool-calls")],
      [...text("t1", "I can show failed runs or spend."), finish("stop")],
    );
    const chunks = await chunksOf(await createChatHandler({ model, limiter: open() })(ask("show payroll")));
    expect(chunks.filter((c) => c.type === "data-card")).toEqual([]);
    expect(chunks.filter((c) => c.type !== "finish").at(-1)?.type).toBe("data-suggestions");
  });

  it("replaces a model failure with the fallback reply, never an error", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error("gateway unavailable");
      },
    });
    const chunks = await chunksOf(await createChatHandler({ model, limiter: open() })(ask("anything")));
    expect(chunks.filter((c) => c.type === "error")).toEqual([]);
    expect(textOf(chunks)).toBe(FALLBACK_TEXT);
    expect(chunks.filter((c) => c.type !== "finish").at(-1)).toEqual(
      expect.objectContaining({ type: "data-suggestions", data: { items: READY_PROMPTS } }),
    );
  });

  it("sends the model the system prompt, at most 12 messages and the output cap", async () => {
    const { model, calls } = scriptedModel([...text("t1", "Ok."), finish("stop")]);
    const history = Array.from(
      { length: 20 },
      (_, i): GeneratedChatMessage =>
        i % 2 === 0
          ? { id: `u${i}`, role: "user", parts: [{ type: "text", text: `q${i}` }] }
          : { id: `a${i}`, role: "assistant", parts: [{ type: "text", text: `a${i}` }] },
    );
    await chunksOf(await createChatHandler({ model, limiter: open() })(ask("last", history)));
    const prompt = calls[0]!.prompt as { role: string }[];
    expect(prompt[0]!.role).toBe("system");
    expect(prompt.length - 1).toBeLessThanOrEqual(12);
    expect(calls[0]!.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
  });
});
