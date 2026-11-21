import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import * as delta from "../exceptions-delta.mjs";

const SCRIPT = resolve(__dirname, "../exceptions-delta.mjs");
const INDEX = "apps/docs/index/exceptions.json";

type Ix = { ledgers: { name: string; entries: { key: string }[] }[] };
const ix = (spec: Record<string, string[]>): Ix => ({
  ledgers: Object.entries(spec).map(([name, keys]) => ({ name, entries: keys.map((key) => ({ key })) })),
});

describe("diffIndexes", () => {
  it("reports an added key", () => {
    const d = delta.diffIndexes(ix({ A: ["x"] }), ix({ A: ["x", "y"] }));
    expect(d).toEqual([{ name: "A", added: ["y"], removed: [] }]);
  });

  it("reports a removed key", () => {
    const d = delta.diffIndexes(ix({ A: ["x", "y"] }), ix({ A: ["x"] }));
    expect(d).toEqual([{ name: "A", added: [], removed: ["y"] }]);
  });

  it("reports nothing for an unchanged ledger", () => {
    const d = delta.diffIndexes(ix({ A: ["x"] }), ix({ A: ["x"] }));
    expect(delta.totals(d)).toEqual({ added: 0, removed: 0 });
  });

  it("a swapped entry shows as one added and one removed, not a net zero", () => {
    const d = delta.diffIndexes(ix({ A: ["old"] }), ix({ A: ["new"] }));
    expect(d[0]).toEqual({ name: "A", added: ["new"], removed: ["old"] });
    expect(delta.totals(d)).toEqual({ added: 1, removed: 1 });
  });

  it("treats a ledger new in head as all added", () => {
    const d = delta.diffIndexes(ix({}), ix({ B: ["p", "q"] }));
    expect(d).toEqual([{ name: "B", added: ["p", "q"], removed: [] }]);
  });

  it("treats a ledger gone from head as all removed", () => {
    const d = delta.diffIndexes(ix({ B: ["p"] }), ix({}));
    expect(d).toEqual([{ name: "B", added: [], removed: ["p"] }]);
  });

  it("reads a null base as an empty index", () => {
    const d = delta.diffIndexes(null, ix({ A: ["x"], B: ["y"] }));
    expect(delta.totals(d)).toEqual({ added: 2, removed: 0 });
  });

  it("throws on a head that is not an index", () => {
    expect(() => delta.diffIndexes(null, { nope: 1 })).toThrow("no ledgers array");
    expect(() => delta.diffIndexes(null, { ledgers: [{ name: "A", entries: [{}] }] })).toThrow(
      "without a key",
    );
  });
});

describe("flags and formatting", () => {
  const three = delta.diffIndexes(ix({ A: [] }), ix({ A: ["1", "2", "3"], B: ["1", "2"] }));

  it("flags a ledger with three additions", () => {
    expect(delta.flaggedLedgers(three)).toEqual(["A"]);
  });

  it("does not flag two additions", () => {
    expect(delta.flaggedLedgers(delta.diffIndexes(null, ix({ B: ["1", "2"] })))).toEqual([]);
  });

  it("flags per ledger, not on the total", () => {
    const d = delta.diffIndexes(null, ix({ A: ["1", "2"], B: ["1", "2"] }));
    expect(delta.totals(d).added).toBe(4);
    expect(delta.flaggedLedgers(d)).toEqual([]);
  });

  it("does not count removals toward the flag", () => {
    const d = delta.diffIndexes(ix({ A: ["1", "2", "3", "4"] }), ix({ A: [] }));
    expect(delta.flaggedLedgers(d)).toEqual([]);
  });

  it("prints keys, a total and the flag line", () => {
    const text = delta.formatReport(three);
    expect(text).toContain("A  FLAG");
    expect(text).toContain("  + 1");
    expect(text).toContain("Total: 5 added, 0 removed");
    expect(text).toContain("FLAG: A gained 3 or more");
  });

  it("says no change when nothing differs", () => {
    expect(delta.formatReport(delta.diffIndexes(ix({ A: ["x"] }), ix({ A: ["x"] })))).toBe(
      "Exceptions delta: no change.\n",
    );
  });

  it("renders markdown for the job summary", () => {
    const md = delta.formatMarkdown(delta.diffIndexes(ix({ A: ["gone"] }), ix({ A: ["new"] })));
    expect(md).toContain("### Exceptions delta");
    expect(md).toContain("- added `new`");
    expect(md).toContain("- removed `gone`");
    expect(md).toContain("Total: 1 added, 1 removed.");
  });
});

describe("CLI", () => {
  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "user.email=t@t.t", "-c", "user.name=t", ...args], { cwd, stdio: "pipe" });

  function repo(base: Ix | null, head: string | Ix): string {
    const dir = mkdtempSync(join(tmpdir(), "exc-delta-"));
    dirs.push(dir);
    git(dir, "init", "-q", "-b", "main");
    mkdirSync(join(dir, "apps/docs/index"), { recursive: true });
    writeFileSync(join(dir, "README"), "x");
    if (base) writeFileSync(join(dir, INDEX), JSON.stringify(base));
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "base");
    writeFileSync(join(dir, INDEX), typeof head === "string" ? head : JSON.stringify(head));
    return dir;
  }

  const run = (cwd: string, args: string[], env: Record<string, string> = {}) =>
    spawnSync("node", [SCRIPT, ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GITHUB_STEP_SUMMARY: "", ...env },
    });

  it("exits 2 with no base argument", () => {
    const r = run(repo(ix({ A: [] }), ix({ A: [] })), []);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("usage");
  });

  it("a base ref with no index file reads as empty: every head entry is added, exit 0", () => {
    const r = run(repo(null, ix({ A: ["1", "2", "3"], B: ["1"] })), ["main"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Total: 4 added, 0 removed");
  });

  it("exits 2 when the working-tree index is corrupt", () => {
    const r = run(repo(ix({ A: [] }), "{not json"), ["main"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("cannot read");
  });

  it("exits 0 and reports a swap against a real base", () => {
    const r = run(repo(ix({ A: ["old"] }), ix({ A: ["new"] })), ["main"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("+ new");
    expect(r.stdout).toContain("- old");
  });

  it("appends markdown to GITHUB_STEP_SUMMARY when set", () => {
    const dir = repo(ix({ A: [] }), ix({ A: ["k"] }));
    const summary = join(dir, "summary.md");
    const r = run(dir, ["main"], { GITHUB_STEP_SUMMARY: summary });
    expect(r.status).toBe(0);
    expect(readFileSync(summary, "utf8")).toContain("- added `k`");
  });
});
