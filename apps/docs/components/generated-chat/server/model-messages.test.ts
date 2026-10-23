import { describe, expect, it } from "vitest";

import type { GeneratedChatMessage } from "@/registry/super-ai/generated-chat";

import { MAX_MESSAGE_CHARS, toModelMessages } from "./model-messages";

const user = (id: string, text: string): GeneratedChatMessage => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
});

describe("toModelMessages", () => {
  it("turns data parts into short text and drops chips and tool parts", () => {
    const messages: GeneratedChatMessage[] = [
      user("u1", "what failed?"),
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "text", text: "Three runs failed." },
          { type: "data-card", data: { type: "failed-runs" } },
          {
            type: "data-view",
            data: { viewId: "spend", title: "Spend by project this week", kind: "generated" },
          },
          { type: "data-question", data: { id: "q", title: "Retry 2 video runs?", summary: "s" } },
          {
            type: "data-widgets",
            data: {
              items: [
                { type: "credits", size: "small" },
                { type: "running", size: "medium" },
              ],
            },
          },
          { type: "data-suggestions", data: { items: ["What's my day?"] } },
        ],
      },
    ];
    expect(toModelMessages(messages)).toEqual([
      { role: "user", content: "what failed?" },
      {
        role: "assistant",
        content: [
          "Three runs failed.",
          "[Showed the failed-runs card]",
          "[Built the view Spend by project this week]",
          "[Asked: Retry 2 video runs?]",
          "[Showed widgets: credits, running]",
        ].join("\n"),
      },
    ]);
  });

  it("keeps the last 12 messages and starts with the person's message", () => {
    const messages = Array.from(
      { length: 20 },
      (_, i): GeneratedChatMessage =>
        i % 2 === 0
          ? user(`u${i}`, `q${i}`)
          : { id: `a${i}`, role: "assistant", parts: [{ type: "text", text: `a${i}` }] },
    );
    const out = toModelMessages(messages);
    expect(out.length).toBeLessThanOrEqual(12);
    expect(out[0]).toEqual({ role: "user", content: "q8" });
    expect(out.at(-1)).toEqual({ role: "assistant", content: "a19" });
  });

  it("drops a message left with nothing to say", () => {
    const messages: GeneratedChatMessage[] = [
      user("u1", "hi"),
      { id: "a1", role: "assistant", parts: [{ type: "data-suggestions", data: { items: ["x"] } }] },
    ];
    expect(toModelMessages(messages)).toEqual([{ role: "user", content: "hi" }]);
  });

  it("cuts a message longer than the cap", () => {
    const [only] = toModelMessages([user("u1", "x".repeat(MAX_MESSAGE_CHARS * 5))]);
    expect((only!.content as string).length).toBeLessThanOrEqual(MAX_MESSAGE_CHARS + 1);
  });
});
