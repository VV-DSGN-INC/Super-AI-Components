import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readCiSteps } from "@/scripts/lib/ci-steps";
import { findLedgers } from "@/scripts/lib/system-facts";

import { GATE_ROWS, PLUMBING } from "./gates";

const REPO = resolve(__dirname, "../../../..");

/** The labels run-gates.sh gives its steps, in order: `run "<label>" <command>`. */
function localLabels(): string[] {
  const text = readFileSync(join(REPO, ".claude/skills/gate-run/run-gates.sh"), "utf8");
  return [...text.matchAll(/^run "([^"]+)"/gm)].map((match) => match[1]);
}

/** The scripts chained by the docs app's check:contract, repo-relative. */
function contractChain(): string[] {
  const pkg = JSON.parse(readFileSync(join(REPO, "apps/docs/package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  return [...pkg.scripts["check:contract"].matchAll(/scripts\/[\w-]+\.mts/g)].map(
    (match) => `apps/docs/${match[0]}`,
  );
}

describe("GATE_ROWS", () => {
  it("lists every gate step in ci.yml, in ci.yml's order", () => {
    const plumbing = new Set(PLUMBING.map((entry) => entry.ciStep));
    const ci = readCiSteps(REPO).filter((step) => !plumbing.has(step));
    expect(
      GATE_ROWS.map((row) => row.ciStep),
      "a ci.yml step is on neither list: add a GateRow, or a PLUMBING entry with a reason",
    ).toEqual(ci);
  });

  it("has no PLUMBING entry for a step ci.yml does not run", () => {
    const ci = readCiSteps(REPO);
    for (const entry of PLUMBING) expect(ci, entry.ciStep).toContain(entry.ciStep);
  });

  it("matches run-gates.sh, label for label, in order", () => {
    expect(GATE_ROWS.map((row) => row.localLabel)).toEqual(localLabels());
  });

  it("cites only files that exist", () => {
    for (const row of GATE_ROWS) {
      for (const path of [...row.checks.map((check) => check.file), ...(row.ledgers ?? [])]) {
        expect(existsSync(join(REPO, path)), `${row.ciStep} cites ${path}`).toBe(true);
      }
    }
  });

  it("gives every row a sentence and at least one check", () => {
    for (const row of GATE_ROWS) {
      expect(row.protects.length, row.ciStep).toBeGreaterThan(20);
      expect(row.checks.length, row.ciStep).toBeGreaterThan(0);
    }
  });

  it("lists every script in the docs app's check:contract chain", () => {
    const row = GATE_ROWS.find((candidate) => candidate.ciStep === "pnpm check:contract");
    const cited = row?.checks.map((check) => check.file) ?? [];
    for (const script of contractChain()) expect(cited, script).toContain(script);
  });

  it("places every shrink-only ledger on a row, and claims none that is not there", () => {
    const claimed = GATE_ROWS.flatMap((row) => row.ledgers ?? []).sort();
    expect(claimed).toEqual(findLedgers(REPO));
  });
});
