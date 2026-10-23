import type { UIMessageChunk } from "ai";
import { describe, expect, it, vi } from "vitest";

import { createScriptedTransport, type GeneratedChatMessage } from "@/registry/super-ai/generated-chat";

import { createModelTransport } from "./model-transport";
import { FALLBACK, TURNS, type DemoContext } from "./turns";
import { FALLBACK_TEXT, READY_PROMPTS } from "./views";

type Chunk = UIMessageChunk & Record<string, unknown>;

const scripted = createScriptedTransport<DemoContext>({
  turns: TURNS,
  fallback: FALLBACK,
  stepMs: 0,
  context: () => ({ viewBuilt: false, spendBuilt: false }),
});

const sse = (chunks: object[], status = 200) =>
  new Response(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join(""), {
    status,
    headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
  });

async function send(
  transport: ReturnType<typeof createModelTransport>,
  text: string,
  abortSignal?: AbortSignal,
): Promise<Chunk[]> {
  const messages: GeneratedChatMessage[] = [{ id: "u1", role: "user", parts: [{ type: "text", text }] }];
  const stream = await transport.sendMessages({
    chatId: "c",
    messages,
    abortSignal,
    trigger: "submit-message",
    messageId: undefined,
  });
  const out: Chunk[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return out;
    out.push(value as Chunk);
  }
}
const textOf = (chunks: Chunk[]) =>
  chunks
    .filter((c) => c.type === "text-delta")
    .map((c) => c.delta as string)
    .join("");
const chipsOf = (chunks: Chunk[]) =>
  chunks.filter((c) => c.type === "data-suggestions").map((c) => (c.data as { items: string[] }).items);

describe("createModelTransport", () => {
  it("plays a scripted phrase without calling the route", async () => {
    const fetch = vi.fn();
    const chunks = await send(
      createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
      "What's my day?",
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(textOf(chunks)).toBe("Here is today at a glance.");
  });

  it("sends free text to the route and streams its parts", async () => {
    const fetch = vi.fn(async () =>
      sse([
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "Video took most of it." },
        { type: "text-end", id: "t" },
        { type: "data-suggestions", data: { items: ["Show spend by project"] } },
        { type: "finish" },
      ]),
    );
    const chunks = await send(
      createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
      "where did credits go",
    );
    expect(fetch).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
    expect(textOf(chunks)).toBe("Video took most of it.");
    expect(chipsOf(chunks)).toEqual([["Show spend by project"]]);
  });

  it("plays the fallback reply when the route refuses or cannot be reached", async () => {
    for (const fetch of [
      vi.fn(async () => Response.json({ error: "off" }, { status: 503 })),
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
    ]) {
      const chunks = await send(
        createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
        "where did credits go",
      );
      expect(textOf(chunks)).toBe(FALLBACK_TEXT);
      expect(chipsOf(chunks)).toEqual([READY_PROMPTS]);
    }
  });

  it("keeps what arrived and appends the fallback when the stream breaks halfway", async () => {
    const fetch = vi.fn(async () =>
      sse([
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "Video took " },
        { type: "error", errorText: "lost" },
      ]),
    );
    const chunks = await send(
      createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
      "where did credits go",
    );
    expect(chunks.filter((c) => c.type === "start")).toHaveLength(1);
    expect(chunks.filter((c) => c.type === "error")).toEqual([]);
    expect(textOf(chunks)).toBe(`Video took ${FALLBACK_TEXT}`);
    expect(chipsOf(chunks)).toEqual([READY_PROMPTS]);
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("treats a stream that ends without finishing as broken", async () => {
    const fetch = vi.fn(async () =>
      sse([
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "Video took " },
      ]),
    );
    const chunks = await send(
      createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
      "where did credits go",
    );
    expect(chunks.filter((c) => c.type === "text-end").map((c) => c.id)).toContain("t");
    expect(textOf(chunks)).toBe(`Video took ${FALLBACK_TEXT}`);
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("adds nothing after the reader stops a model reply", async () => {
    const stop = new AbortController();
    const fetch = vi.fn(async () => {
      stop.abort();
      return sse([
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "Video took " },
      ]);
    });
    const chunks = await send(
      createModelTransport({ api: "/api/chat", scripted, turns: TURNS, fetch }),
      "where did credits go",
      stop.signal,
    );
    expect(textOf(chunks)).not.toContain(FALLBACK_TEXT);
  });
});
