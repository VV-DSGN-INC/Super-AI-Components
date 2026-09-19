import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCiSteps, readCiSteps } from "./ci-steps";

const REPO = resolve(__dirname, "../../../..");

const TWO_JOBS = `
name: CI
on:
  pull_request:
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
  product:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - name: Playwright smoke
        run: |
          pnpm exec playwright install chromium
          pnpm exec playwright test
`;

describe("parseCiSteps", () => {
  it("keeps run steps in document order and keys a named step by its name", () => {
    expect(parseCiSteps(TWO_JOBS)).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm lint",
      "Playwright smoke",
    ]);
  });

  it("skips uses steps", () => {
    expect(parseCiSteps(TWO_JOBS).join(" ")).not.toContain("actions/checkout");
  });

  it("counts a step repeated in a later job once", () => {
    const installs = parseCiSteps(TWO_JOBS).filter((step) => step === "pnpm install --frozen-lockfile");
    expect(installs).toHaveLength(1);
  });

  it("throws when the workflow has no jobs map", () => {
    expect(() => parseCiSteps("name: CI\n")).toThrow("workflow has no jobs map");
  });
});

describe("readCiSteps on this repo", () => {
  it("finds the gate steps the workflow runs", () => {
    const steps = readCiSteps(REPO);
    expect(steps).toContain("pnpm check:tokens");
    expect(steps).toContain("Consumer install test");
    expect(steps[0]).toBe("pnpm install --frozen-lockfile");
  });
});
