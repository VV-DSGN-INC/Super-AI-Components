import "./no-devtools";

import { createParser } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";

import { addedResponse, BOARD, briefs, fallbackResponse, matchBrief, OWNERS, STATUSES } from "./fixtures";
import { openuiLibrary } from "./library";

describe("openui fixtures", () => {
  const parser = createParser(openuiLibrary.toJSONSchema());

  it.each(briefs.map((b) => [b.id, b.response(BOARD)] as const))(
    "%s parses with no errors",
    (_id, response) => {
      // ParseResult carries prop-validation errors under `meta.errors`.
      const result = parser.parse(response);
      expect(result.meta.errors).toEqual([]);
      expect(result.root).not.toBeNull();
    },
  );

  it("the added-task answer and the fallback parse too", () => {
    const task = { title: "Write the runbook", owner: OWNERS[0]!, status: STATUSES[0]! };
    expect(parser.parse(addedResponse(task, BOARD)).meta.errors).toEqual([]);
    expect(parser.parse(addedResponse({ ...task, owner: "Nobody" }, BOARD)).meta.errors).toEqual([]);
    expect(parser.parse(fallbackResponse()).meta.errors).toEqual([]);
  });

  it("escapes what the user typed, so a quote cannot break the program", () => {
    const result = parser.parse(
      addedResponse({ title: 'Say "hi"\nthen leave', owner: "Ada", status: "To do" }, BOARD),
    );
    expect(result.meta.errors).toEqual([]);
  });

  it("matches a brief by its prompt, case-insensitively, and returns nothing otherwise", () => {
    expect(matchBrief(briefs[0]!.prompt.toUpperCase())?.id).toBe(briefs[0]!.id);
    expect(matchBrief("something unrelated")).toBeUndefined();
  });

  it("reads the board from the data-views demo rather than typing it", () => {
    expect(BOARD.length).toBeGreaterThan(0);
    expect(STATUSES).toContain(BOARD[0]!.status);
  });
});
