import { describe, expect, it } from "vitest";

import { findUnpairedMotion } from "./motion-rules.mjs";

const wrap = (cls: string) => `export const X = () => <div className="${cls}" />;\n`;
const count = (cls: string) => findUnpairedMotion("x.tsx", wrap(cls)).length;

describe("findUnpairedMotion (MOT-3)", () => {
  it("flags an animation with no motion-reduce pair", () => {
    expect(count("animate-pulse")).toBe(1);
    expect(count("animate-pulse motion-reduce:animate-none")).toBe(0);
  });

  it("flags a transform transition with no pair", () => {
    expect(count("transition-transform duration-200")).toBe(1);
    expect(count("transition-transform duration-200 motion-reduce:transition-none")).toBe(0);
  });

  it("ignores colour fades, animate-none and progress spinners", () => {
    expect(count("transition-colors")).toBe(0);
    expect(count("animate-none")).toBe(0);
    expect(count("animate-spin")).toBe(0);
  });

  it("treats motion-safe: as already gated", () => {
    expect(count("motion-safe:animate-in")).toBe(0);
  });

  it("reports the line of the opening quote in the token-rules message format", () => {
    const src = 'const a = 1;\nconst b = 2;\nexport const X = () => <div className="data-open:animate-in" />;\n';
    const [msg] = findUnpairedMotion("x.tsx", src);
    expect(msg.startsWith("x.tsx:3 — ")).toBe(true);
  });
});
