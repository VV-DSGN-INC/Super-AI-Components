import { describe, expect, it } from "vitest";

import {
  findTurn,
  hasScript,
  lastUserText,
  normalise,
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
