import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadRules, scan } from "../rulecheck.mjs";

const CLI = fileURLToPath(new URL("../rulecheck.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const FIXTURES = "packages/ds-rules/__fixtures__";

/** Runs every grep/heuristic rule against its own fixtures by rescoping the
 *  record at the fixture directory — the pattern/method under test is real,
 *  only `scope` is redirected. */
describe("every rule against its fixtures", () => {
  const rules = loadRules().filter((r) => r.detect.method !== "rendered" && r.detect.method !== "judgment");

  for (const rule of rules) {
    const at = (kind: string) => ({ ...rule, detect: { ...rule.detect, scope: [`${FIXTURES}/${rule.id}/${kind}`] } });

    it(`${rule.id} fires on its known-bad fixture`, () => {
      const files = [`${FIXTURES}/${rule.id}/bad/case.tsx`];
      const report = scan([at("bad")], files, REPO_ROOT);
      expect(report.violations.length, `${rule.id} stayed silent on known-bad`).toBeGreaterThan(0);
      expect(report.violations[0].id).toBe(rule.id);
    });

    it(`${rule.id} stays quiet on its known-good fixture`, () => {
      const files = [`${FIXTURES}/${rule.id}/good/case.tsx`];
      const report = scan([at("good")], files, REPO_ROOT);
      expect(report.violations, `${rule.id} false-positived on known-good`).toEqual([]);
    });
  }
});

describe("CLI contract", () => {
  it("TOK-6 lands in unchecked on every run, naming its discharge", () => {
    const out = spawnSync("node", [CLI, "--json"], { encoding: "utf8" });
    const report = JSON.parse(out.stdout);
    const tok6 = report.unchecked.find((u: { id: string }) => u.id === "TOK-6");
    expect(tok6?.reason).toBe("rendered");
    expect(tok6?.how).toContain("test:stories");
  });

  it("exit 0 and zero blockers on the current tree (the tree-clean gate)", () => {
    const out = spawnSync("node", [CLI, "--severity", "blocker", "--json"], { encoding: "utf8" });
    expect(out.status, out.stdout + out.stderr).toBe(0);
    expect(JSON.parse(out.stdout).summary.blocker).toBe(0);
  });

  it("exit 1 when blockers exist (control test: the gate CAN fail)", () => {
    // The live tree is clean, so failability is proven by re-emitting the
    // real rules with scopes redirected at the fixture corpus and pointing
    // the CLI at that one-off rules dir via the DS_RULES_DIR test seam.
    const dir = fileURLToPath(new URL("./__control__/", import.meta.url));
    const rules = loadRules().map((r) =>
      r.detect.method === "rendered" || r.detect.method === "judgment"
        ? r
        : { ...r, detect: { ...r.detect, scope: [FIXTURES] } },
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "control.json"), JSON.stringify({ version: 1, rules }, null, 2));
    const out = spawnSync("node", [CLI, "--severity", "blocker"], {
      encoding: "utf8",
      env: { ...process.env, DS_RULES_DIR: dir },
    });
    expect(out.status, out.stdout + out.stderr).toBe(1);
  });

  it("exit 2 when the rules dir is missing — could-not-tell never collapses into clean", () => {
    const out = spawnSync("node", [CLI], {
      encoding: "utf8",
      env: { ...process.env, DS_RULES_DIR: "/nonexistent-ds-rules" },
    });
    expect(out.status).toBe(2);
  });
});
