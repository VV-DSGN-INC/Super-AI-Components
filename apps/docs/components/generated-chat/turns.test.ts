import { describe, expect, it } from "vitest";

import { findTurn, normalise, type TurnPart } from "@/registry/super-ai/generated-chat";

import { FALLBACK, READY_PROMPTS, RETRY_AFTER, TURNS, type DemoContext } from "./turns";

const contexts: DemoContext[] = [
  { viewBuilt: false, spendBuilt: false },
  { viewBuilt: true, spendBuilt: true },
];
const partsOf = (parts: TurnPart[] | ((ctx: DemoContext) => TurnPart[])) =>
  typeof parts === "function" ? contexts.flatMap((ctx) => parts(ctx)) : parts;
const chipsIn = (parts: TurnPart[]) =>
  parts.flatMap((p) => (p.type === "data-suggestions" ? p.data.items : []));

describe("generated chat turns", () => {
  it("answers every ready prompt with a scripted turn", () => {
    for (const prompt of READY_PROMPTS) expect(findTurn(prompt, TURNS, FALLBACK)).not.toBe(FALLBACK);
  });

  it("answers every chip any reply offers, including the retry receipt", () => {
    const chips = [
      ...TURNS.flatMap((t) => chipsIn(partsOf(t.parts))),
      ...chipsIn(RETRY_AFTER),
      ...chipsIn(partsOf(FALLBACK.parts)),
    ];
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) expect(findTurn(chip, TURNS, FALLBACK), chip).not.toBe(FALLBACK);
  });

  it("never lists one phrasing under two turns, and lists every phrasing normalised", () => {
    const all = TURNS.flatMap((t) => t.match);
    expect(new Set(all).size).toBe(all.length);
    for (const m of all) expect(normalise(m)).toBe(m);
  });

  it("only edits the view once it exists", () => {
    const board = findTurn("Make it a board", TURNS, FALLBACK);
    const effects = (ctx: DemoContext) =>
      typeof board.effects === "function" ? board.effects(ctx) : (board.effects ?? []);
    expect(effects({ viewBuilt: false, spendBuilt: false })).toEqual([]);
    expect(effects({ viewBuilt: true, spendBuilt: false })).toEqual([
      { type: "edit-view", id: "failed-runs", version: { label: "v2 · board", mode: "board" } },
    ]);
  });

  it("builds the view without showing it", () => {
    const track = findTurn("Track failed runs", TURNS, FALLBACK);
    const effects =
      typeof track.effects === "function"
        ? track.effects({ viewBuilt: false, spendBuilt: false })
        : track.effects;
    expect(effects?.map((e) => e.type)).toEqual(["build-view"]);
  });

  it("edits the generated view only once it exists, and to the right program", () => {
    const effectsOf = (prompt: string, ctx: DemoContext) => {
      const turn = findTurn(prompt, TURNS, FALLBACK);
      return typeof turn.effects === "function" ? turn.effects(ctx) : (turn.effects ?? []);
    };
    const built = { viewBuilt: false, spendBuilt: true };
    expect(effectsOf("Add a daily trend", { viewBuilt: false, spendBuilt: false })).toEqual([]);
    expect(effectsOf("Add a daily trend", built)).toEqual([
      {
        type: "edit-view",
        id: "spend",
        version: { label: "v2 · generated", mode: "generated", variant: "spend-v2-chart" },
      },
    ]);
    expect(effectsOf("Show the daily trend as a table", built)).toEqual([
      {
        type: "edit-view",
        id: "spend",
        version: { label: "v3 · generated", mode: "generated", variant: "spend-v3-table" },
      },
    ]);
    expect(effectsOf("Show spend by project", built).map((e) => e.type)).toEqual(["build-view"]);
  });
});
