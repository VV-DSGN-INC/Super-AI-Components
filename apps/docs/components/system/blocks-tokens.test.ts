import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../../..");
const SYSTEM_DIR = "apps/docs/components/system";
const RULES_DIR = "packages/ds-rules/rules";
const RULECHECK = join(REPO, "packages/ds-rules/rulecheck.mjs");

interface Rule {
  id: string;
  severity: string;
  detect: { method: string; scope?: string[]; include?: string[] };
}

const tmp = mkdtempSync(join(tmpdir(), "system-rules-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

/** Copies every rule file with each rule's scope pointed at the system blocks. */
function rescopedRules(): Rule[] {
  const all: Rule[] = [];
  for (const file of readdirSync(join(REPO, RULES_DIR)).filter((name) => name.endsWith(".json"))) {
    const doc = JSON.parse(readFileSync(join(REPO, RULES_DIR, file), "utf8")) as { rules: Rule[] };
    for (const rule of doc.rules) if (Array.isArray(rule.detect.scope)) rule.detect.scope = [SYSTEM_DIR];
    writeFileSync(join(tmp, file), JSON.stringify(doc));
    all.push(...doc.rules);
  }
  return all;
}

describe("the system blocks obey the token contract", () => {
  it("has zero blocker violations, and the scan really read the files", () => {
    const rules = rescopedRules();
    const files = readdirSync(join(REPO, SYSTEM_DIR))
      .filter((name) => name.endsWith(".tsx") && !name.endsWith(".test.tsx"))
      .map((name) => `${SYSTEM_DIR}/${name}`);
    expect(files.length).toBeGreaterThan(0);

    const run = spawnSync(
      process.execPath,
      [RULECHECK, "--severity", "blocker", "--json", "--files", ...files],
      {
        env: { ...process.env, DS_RULES_DIR: tmp },
        encoding: "utf8",
      },
    );
    expect(run.status, `rulecheck could not run: ${run.stderr}`).not.toBe(2);

    const report = JSON.parse(run.stdout) as {
      violations: { id: string; file: string; line: number; snippet: string }[];
      unchecked: { id: string; reason: string }[];
      summary: { filesScanned: number };
    };

    // A scan that read nothing and a scan that found nothing print the same
    // result. These two assertions tell them apart.
    expect(report.summary.filesScanned).toBe(files.length);
    const tsxBlockers = rules
      .filter((rule) => rule.severity === "blocker" && rule.detect.include?.includes(".tsx"))
      .map((rule) => rule.id);
    expect(tsxBlockers.length).toBeGreaterThan(0);
    const skipped = report.unchecked
      .filter((entry) => entry.reason === "out-of-scope")
      .map((entry) => entry.id);
    expect(skipped.filter((id) => tsxBlockers.includes(id))).toEqual([]);

    expect(report.violations).toEqual([]);
  });
});
