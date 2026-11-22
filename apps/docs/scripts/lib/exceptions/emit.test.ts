import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  buildIndex,
  type ExceptionsIndex,
  EXCEPTIONS_FILE,
  loadReasons,
  NO_PROVENANCE,
  reasonProblems,
  renderIndex,
} from "./build";
import { blameProvenance, provenanceFromCommitted } from "./provenance";
import { DECLINED, LEDGERS, MIGRATED_CEILING, MIGRATED_REASON, type LedgerSpec } from "./registry";

const REPO = resolve(__dirname, "../../../../..");
const EMIT = process.env.EXCEPTIONS_EMIT === "1";

const live = () => buildIndex(REPO, () => NO_PROVENANCE);

/** Git runs only when emitting. Gate mode reads the committed index, so a
 *  shallow clone in CI cannot break `pnpm test`. */
const committed = (): ExceptionsIndex =>
  JSON.parse(readFileSync(join(REPO, EXCEPTIONS_FILE), "utf8")) as ExceptionsIndex;
const withProvenance = () =>
  buildIndex(REPO, EMIT ? blameProvenance(REPO) : provenanceFromCommitted(committed()));

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

describe("emitted exceptions index", () => {
  it(EMIT ? "writes the exceptions index" : "matches the ledgers in the gate files", () => {
    const want = renderIndex(withProvenance());
    const abs = join(REPO, EXCEPTIONS_FILE);
    if (EMIT) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, want);
    }
    expect(existsSync(abs), `${EXCEPTIONS_FILE} missing. Run: cd apps/docs && pnpm exceptions:emit`).toBe(
      true,
    );
    expect(
      readFileSync(abs, "utf8"),
      `${EXCEPTIONS_FILE} is stale. Run: cd apps/docs && pnpm exceptions:emit`,
    ).toBe(want);
  });

  it("every entry carries provenance, and an A11Y_EXCLUSIONS entry has a commit and a PR", () => {
    const index = committed();
    const a11y = index.ledgers.find((l) => l.name === "A11Y_EXCLUSIONS")!;
    expect(a11y.entries.some((e) => /^[0-9a-f]{40}$/.test(e.commit ?? "") && e.pr !== null)).toBe(true);
    for (const l of index.ledgers) {
      for (const e of l.entries) expect(e.commit, `${l.name}#${e.key}`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("keys are unique within a ledger", () => {
    for (const l of live().ledgers) {
      const keys = l.entries.map((e) => e.key);
      expect(new Set(keys).size, `${l.name} repeats a key`).toBe(keys.length);
    }
  });

  it("every entry has a reason, and a non-migrated reason is a sentence", () => {
    expect(reasonProblems(live())).toEqual([]);
  });

  it("the migrated count never rises", () => {
    const migrated = live()
      .ledgers.flatMap((l) => l.entries)
      .filter((e) => e.reason === MIGRATED_REASON).length;
    expect(migrated).toBeLessThanOrEqual(MIGRATED_CEILING);
  });

  it("reasons.json carries no dead keys", () => {
    const produced = new Set(live().ledgers.flatMap((l) => l.entries.map((e) => `${l.name}#${e.key}`)));
    const dead = Object.keys(loadReasons()).filter((k) => !produced.has(k));
    expect(dead).toEqual([]);
  });

  it("indexes what the registry names, in the registry's order", () => {
    const index = live();
    expect(index.ledgers.map((l) => l.name)).toEqual(LEDGERS.map((l) => l.name));
    expect(index.ledgers.map((l) => l.name)).toEqual([
      "RULE_EXEMPT",
      "VENDORED_SCOPES",
      "A11Y_EXCLUSIONS",
      "CSSVARS_LIVENESS",
      "CONTRAST_EXEMPT_FILES",
      "UNGATED",
    ]);
    expect(index.declined).toEqual(DECLINED);
    expect(index.ledgers.reduce((n, l) => n + l.entries.length, 0)).toBe(29);
  });

  it("CONTROL: a new key with no reason fails", () => {
    const root = mkdtempSync(join(tmpdir(), "exceptions-"));
    roots.push(root);
    const fixture: LedgerSpec = {
      name: "FIXTURE",
      file: "x.json",
      gate: "x.test.ts",
      about: "planted",
      read: () => [{ key: "new-key", reason: null, needle: '"new-key"', occurrence: 1 }],
    };
    const index = buildIndex(root, () => NO_PROVENANCE, [fixture], {});
    expect(reasonProblems(index)).toEqual(["FIXTURE#new-key"]);
  });
});
