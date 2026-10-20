import "@/components/openui/no-devtools";

import { createParser } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";

import { openuiLibrary } from "@/components/openui/library";

import { PROGRAMS } from "./programs";

describe("generated view programs", () => {
  const parser = createParser(openuiLibrary.toJSONSchema());

  it.each(["spend-v1", "spend-v3-table"] as const)("%s parses cleanly against the /openui catalog", (id) => {
    const result = parser.parse(PROGRAMS[id]);
    expect(result.meta.errors).toEqual([]);
    expect(result.meta.unresolved).toEqual([]);
    expect(result.root).toBeTruthy();
  });

  it("spend-v2-chart names a component the catalog does not expose", () => {
    const result = parser.parse(PROGRAMS["spend-v2-chart"]);
    expect(result.meta.errors.map((e) => e.code)).toContain("unknown-component");
  });

  it("states the figures the rest of the page states", () => {
    expect(PROGRAMS["spend-v1"]).toContain('Stat("Total", "610 credits")');
    expect(PROGRAMS["spend-v1"]).toContain('["Onboarding video", "400"]');
    expect(PROGRAMS["spend-v3-table"]).toContain('["Mon 19 Oct", "378"]');
  });
});
