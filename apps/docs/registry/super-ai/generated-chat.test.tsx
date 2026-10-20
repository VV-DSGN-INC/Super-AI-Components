import { readUIMessageStream, type UIMessageChunk } from "ai";
import { describe, expect, it } from "vitest";

import {
  createScriptedTransport,
  findTurn,
  hasScript,
  initialQuestionState,
  isQuestionLocked,
  lastUserText,
  normalise,
  questionId,
  questionReducer,
  questionStatusFor,
  type GeneratedChatMessage,
  type Turn,
} from "./generated-chat";

const fallback: Turn = { id: "fallback", match: [], parts: [{ type: "text", text: "Try one of these." }] };
const turns: Turn[] = [{ id: "failed", match: ["what failed overnight"], parts: [] }];

describe("turn matching", () => {
  it("normalises case, punctuation and whitespace", () => {
    expect(normalise("  What's my DAY?! ")).toBe("what s my day");
  });

  it("reaches a turn whatever the case or punctuation", () => {
    expect(findTurn("WHAT failed overnight", turns, fallback).id).toBe("failed");
    expect(findTurn("What failed, overnight?", turns, fallback).id).toBe("failed");
  });

  it("falls back on anything unscripted", () => {
    expect(findTurn("anything else", turns, fallback)).toBe(fallback);
    expect(hasScript("anything else", turns)).toBe(false);
    expect(hasScript("what failed overnight", turns)).toBe(true);
  });

  it("never matches into the fallback, even on empty input", () => {
    expect(findTurn("", [...turns, fallback], fallback)).toBe(fallback);
  });

  it("reads the text of the last user message", () => {
    const messages: GeneratedChatMessage[] = [
      { id: "m1", role: "user", parts: [{ type: "text", text: "first" }] },
      { id: "m2", role: "assistant", parts: [{ type: "text", text: "reply" }] },
      {
        id: "m3",
        role: "user",
        parts: [
          { type: "text", text: "What failed" },
          { type: "text", text: "overnight?" },
        ],
      },
    ];
    expect(lastUserText(messages)).toBe("What failed overnight?");
    expect(lastUserText([])).toBe("");
  });
});

const userAsks = (text: string): GeneratedChatMessage[] => [
  { id: "u1", role: "user", parts: [{ type: "text", text }] },
];

async function send(
  transport: ReturnType<typeof createScriptedTransport>,
  text: string,
  abortSignal?: AbortSignal,
) {
  return transport.sendMessages({
    trigger: "submit-message",
    chatId: "c1",
    messageId: undefined,
    messages: userAsks(text),
    abortSignal,
  });
}

async function collect(stream: ReadableStream<UIMessageChunk>) {
  const [forChunks, forMessage] = stream.tee();
  const chunks: UIMessageChunk[] = [];
  const reading = (async () => {
    const reader = forChunks.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      chunks.push(value);
    }
  })();
  let message: GeneratedChatMessage | undefined;
  for await (const m of readUIMessageStream<GeneratedChatMessage>({ stream: forMessage })) message = m;
  await reading;
  return { chunks, message: message! };
}

const scripted: Turn<{ viewBuilt: boolean }>[] = [
  {
    id: "two-parts",
    match: ["what failed overnight"],
    parts: [
      { type: "text", text: "3 of 26 runs failed overnight." },
      { type: "data-suggestions", data: { items: ["Track failed runs"] } },
    ],
    effects: [
      {
        type: "build-view",
        view: {
          id: "failed-runs",
          kind: "runs",
          title: "Failed runs this week",
          scope: "All projects",
          origin: "What failed overnight?",
          version: { label: "v1", mode: "table" },
        },
      },
    ],
  },
  {
    id: "context",
    match: ["make it a board"],
    parts: (ctx) => [{ type: "text", text: ctx.viewBuilt ? "Board it is." : "Track failed runs first." }],
  },
];
const scriptedFallback: Turn<{ viewBuilt: boolean }> = {
  id: "fallback",
  match: [],
  parts: [{ type: "text", text: "Try one of these." }],
};

describe("createScriptedTransport", () => {
  it("streams a turn's parts in order as one assistant message", async () => {
    const transport = createScriptedTransport({ turns: scripted, fallback: scriptedFallback, stepMs: 0 });
    const { message } = await collect(await send(transport, "What failed overnight?"));
    expect(message.role).toBe("assistant");
    expect(message.parts.map((p) => p.type)).toEqual(["text", "data-suggestions"]);
    expect(message.parts[0]).toMatchObject({ type: "text", text: "3 of 26 runs failed overnight." });
  });

  it("sends effects as transient chunks after the parts and before finish", async () => {
    const transport = createScriptedTransport({ turns: scripted, fallback: scriptedFallback, stepMs: 0 });
    const { chunks, message } = await collect(await send(transport, "what failed overnight"));
    expect(message.parts.some((p) => p.type === "data-effect")).toBe(false);
    const types = chunks.map((c) => c.type);
    const effectAt = types.indexOf("data-effect");
    expect(effectAt).toBeGreaterThan(types.lastIndexOf("data-suggestions"));
    expect(effectAt).toBeLessThan(types.indexOf("finish"));
    expect(chunks[effectAt]).toMatchObject({
      type: "data-effect",
      transient: true,
      data: { type: "build-view" },
    });
  });

  it("hands a function turn the host's context", async () => {
    const transport = createScriptedTransport({
      turns: scripted,
      fallback: scriptedFallback,
      stepMs: 0,
      context: () => ({ viewBuilt: true }),
    });
    const { message } = await collect(await send(transport, "Make it a board"));
    expect(message.parts[0]).toMatchObject({ type: "text", text: "Board it is." });
  });

  it("plays the fallback for anything unscripted", async () => {
    const transport = createScriptedTransport({ turns: scripted, fallback: scriptedFallback, stepMs: 0 });
    const { message } = await collect(await send(transport, "write me a poem"));
    expect(message.parts[0]).toMatchObject({ type: "text", text: "Try one of these." });
  });

  it("stops at the abort and sends nothing after it", async () => {
    const transport = createScriptedTransport({ turns: scripted, fallback: scriptedFallback, stepMs: 20 });
    const controller = new AbortController();
    const stream = await send(transport, "what failed overnight", controller.signal);
    setTimeout(() => controller.abort(), 10);
    const { chunks, message } = await collect(stream);
    expect(message.parts.map((p) => p.type)).toEqual(["text"]);
    expect(chunks.some((c) => c.type === "data-suggestions" || c.type === "data-effect")).toBe(false);
    const countAtClose = chunks.length;
    await new Promise((r) => setTimeout(r, 100));
    expect(chunks.length).toBe(countAtClose);
  });

  it("has no stream to reconnect to", async () => {
    const transport = createScriptedTransport({ turns: scripted, fallback: scriptedFallback });
    await expect(transport.reconnectToStream({ chatId: "c1" })).resolves.toBeNull();
  });
});

describe("questionReducer", () => {
  const ask = (state: typeof initialQuestionState, id: string, cardKey: string) =>
    questionReducer(state, { type: "ask", id, cardKey });

  it("keeps one question open: a newer ask closes the open one as skipped", () => {
    const s = ask(ask(initialQuestionState, "q1", "m1:0"), "q2", "m2:0");
    expect(s.status.q1).toBe("skipped");
    expect(s.status.q2).toBe("requested");
    expect(s.openId).toBe("q2");
  });

  it("never runs an approved question twice", () => {
    const approved = questionReducer(ask(initialQuestionState, "q1", "m1:0"), {
      type: "answer",
      id: "q1",
      approved: true,
    });
    expect(approved.status.q1).toBe("approved");
    expect(ask(approved, "q1", "m3:0")).toBe(approved);
  });

  it("leaves an open question alone when it is asked again", () => {
    const open = ask(initialQuestionState, "q1", "m1:0");
    expect(ask(open, "q1", "m1:0")).toBe(open);
  });

  it("keeps an earlier card on the answer it got", () => {
    const skipped = questionReducer(ask(initialQuestionState, "q1", "A"), {
      type: "answer",
      id: "q1",
      approved: false,
    });
    const again = ask(skipped, "q1", "B");
    expect(questionStatusFor(again, "q1", "A")).toBe("skipped");
    expect(questionStatusFor(again, "q1", "B")).toBe("requested");
  });

  it("undoes only an approved question", () => {
    const open = ask(initialQuestionState, "q1", "m1:0");
    expect(questionReducer(open, { type: "undo", id: "q1" })).toBe(open);
    const skipped = questionReducer(open, { type: "answer", id: "q1", approved: false });
    expect(questionReducer(skipped, { type: "undo", id: "q1" })).toBe(skipped);
    const approved = questionReducer(open, { type: "answer", id: "q1", approved: true });
    expect(questionReducer(approved, { type: "undo", id: "q1" }).status.q1).toBe("undone");
  });

  it("ignores an answer to a question that is not open", () => {
    expect(questionReducer(initialQuestionState, { type: "answer", id: "nope", approved: true })).toBe(
      initialQuestionState,
    );
  });

  it("locks a question while it waits and once it is approved", () => {
    expect(isQuestionLocked("requested")).toBe(true);
    expect(isQuestionLocked("approved")).toBe(true);
    expect(isQuestionLocked("skipped")).toBe(false);
    expect(isQuestionLocked("undone")).toBe(false);
    expect(isQuestionLocked(undefined)).toBe(false);
  });

  it("derives a question id from everything it names", () => {
    expect(questionId("retry", "r2", "r1")).toBe(questionId("retry", "r2", "r1"));
    expect(questionId("retry", "r2", "r1")).not.toBe(questionId("retry", "r1"));
  });
});
