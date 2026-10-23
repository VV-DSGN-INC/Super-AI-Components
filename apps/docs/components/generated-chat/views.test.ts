import { describe, expect, it } from "vitest";

import { hasScript, type TurnPart } from "@/registry/super-ai/generated-chat";

import { RETRY_PROMPTS } from "./programs";
import { FALLBACK, RETRY_AFTER, TURNS, type DemoContext } from "./turns";
import { buildFailedRunsView, buildSpendView, CHIPS, READY_PROMPTS, SPEND_VIEW, VIEW } from "./views";

const contexts: DemoContext[] = [
  { viewBuilt: false, spendBuilt: false },
  { viewBuilt: true, spendBuilt: true },
];
const partsOf = (parts: TurnPart[] | ((ctx: DemoContext) => TurnPart[])) =>
  typeof parts === "function" ? contexts.flatMap((ctx) => parts(ctx)) : parts;
const chipsIn = (parts: TurnPart[]) =>
  parts.flatMap((p) => (p.type === "data-suggestions" ? p.data.items : []));

describe("views", () => {
  it("lists every chip a scripted reply offers, and the ready prompts", () => {
    const offered = new Set([
      ...[...TURNS, FALLBACK].flatMap((turn) => chipsIn(partsOf(turn.parts))),
      ...chipsIn(RETRY_AFTER),
      ...Object.values(RETRY_PROMPTS),
      ...READY_PROMPTS,
    ]);
    expect([...offered].sort()).toEqual([...CHIPS].sort());
  });

  it("gives every chip a scripted turn, so a chip the model suggests always resolves", () => {
    for (const chip of CHIPS) expect(hasScript(chip, TURNS), chip).toBe(true);
  });

  it("builds the same view inputs the scripted turns build, with the origin it is given", () => {
    const scripted = TURNS.flatMap((turn) =>
      typeof turn.effects === "function"
        ? contexts.flatMap((ctx) => (turn.effects as (c: DemoContext) => never[])(ctx))
        : (turn.effects ?? []),
    ).flatMap((effect) => (effect.type === "build-view" ? [effect.view] : []));
    expect(scripted).toContainEqual(buildFailedRunsView("Track failed runs"));
    expect(scripted).toContainEqual(buildSpendView("Show spend by project"));
    expect(buildSpendView("how is spend split").origin).toBe("how is spend split");
    expect(buildFailedRunsView("x").id).toBe(VIEW.id);
    expect(buildSpendView("x").id).toBe(SPEND_VIEW.id);
  });
});
