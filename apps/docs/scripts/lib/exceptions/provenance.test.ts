import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ n: 0 }));
vi.mock("node:child_process", async (orig) => {
  const real = await orig<typeof import("node:child_process")>();
  const wrap =
    <F extends (...a: never[]) => unknown>(f: F) =>
    (...a: Parameters<F>) => {
      calls.n++;
      return f(...a);
    };
  return {
    ...real,
    spawnSync: wrap(real.spawnSync),
    execFileSync: wrap(real.execFileSync),
    execSync: wrap(real.execSync),
  };
});

import { buildIndex } from "./build";
import { blameProvenance, provenanceFromCommitted } from "./provenance";
import type { LedgerSpec, RawEntry } from "./registry";

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "Tester",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "Tester",
  GIT_COMMITTER_EMAIL: "t@example.com",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

function repo() {
  const root = mkdtempSync(join(tmpdir(), "prov-"));
  roots.push(root);
  const g = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, env: ENV, encoding: "utf8" }).trim();
  g("init", "-q", "-b", "main");
  const write = (text: string) => writeFileSync(join(root, "f.txt"), text);
  const commit = (msg: string) => {
    g("add", "-A");
    g("commit", "-q", "-m", msg);
    return g("rev-parse", "HEAD");
  };
  return { root, g, write, commit };
}

const spec: LedgerSpec = { name: "FIX", file: "f.txt", gate: "x", about: "x", read: () => [] };
const entry = (needle: string, occurrence = 1): RawEntry => ({
  key: needle,
  reason: null,
  needle,
  occurrence,
});

describe("CONTROL: provenance walks the base branch, not HEAD", () => {
  it("a squash commit on the base gives the (#N) pr", () => {
    const r = repo();
    r.write("one\n");
    r.commit("init");
    r.write("one\ntarget\n");
    const sha = r.commit("add target (#12)");
    expect(blameProvenance(r.root)(spec, entry("target"))).toMatchObject({
      commit: sha,
      pr: 12,
      by: "Tester",
    });
  });

  it("a commit reached through a merge commit gives the merge's pr", () => {
    const r = repo();
    r.write("one\n");
    r.commit("init");
    r.g("checkout", "-q", "-b", "side");
    r.write("one\ntarget\n");
    const sha = r.commit("add target");
    r.g("checkout", "-q", "main");
    r.g("merge", "--no-ff", "-q", "side", "-m", "Merge pull request #34 from x/side");
    expect(blameProvenance(r.root)(spec, entry("target"))).toMatchObject({ commit: sha, pr: 34 });
  });

  it("a commit only on a side branch has a commit but no pr", () => {
    const r = repo();
    r.write("one\n");
    r.commit("init");
    r.g("checkout", "-q", "-b", "side");
    r.write("one\ntarget\n");
    const sha = r.commit("add target (#99)");
    const got = blameProvenance(r.root)(spec, entry("target"));
    expect(got.commit).toBe(sha);
    expect(got.pr).toBeNull();
  });

  it("walks the base, not HEAD: a line changed only on HEAD gets pr null", () => {
    const r = repo();
    r.write("one\n");
    r.commit("init (#1)");
    r.g("checkout", "-q", "-b", "feature");
    r.write("one\nfeature-line\n");
    r.commit("feature work (#77)");
    const got = blameProvenance(r.root)(spec, entry("feature-line"));
    expect(got.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(got.pr).toBeNull();
    expect(blameProvenance(r.root)(spec, entry("one"))).toMatchObject({ pr: 1 });
  });

  it("with no origin/main the fallback is main", () => {
    const r = repo();
    r.write("one\n");
    r.commit("init");
    r.g("checkout", "-q", "-b", "feature");
    r.write("one\ntarget\n");
    r.commit("feature (#5)");
    r.g("checkout", "-q", "main");
    r.write("one\ntarget\nmore\n");
    r.commit("main work (#6)");
    r.g("checkout", "-q", "feature");
    expect(() => r.g("rev-parse", "--verify", "origin/main")).toThrow();
    expect(blameProvenance(r.root)(spec, entry("target"))).toMatchObject({ pr: null });
    expect(blameProvenance(r.root)(spec, entry("one"))).toMatchObject({ pr: null });
    // HEAD fallback would have walked the feature branch and found (#5) for "target".
  });
});

describe("provenance behaviour", () => {
  it("gate mode never calls git", () => {
    const r = repo();
    const fixture: LedgerSpec = {
      ...spec,
      read: () => [entry("a")],
    };
    const committed = {
      generatedBy: "x",
      declined: [],
      ledgers: [
        {
          name: "FIX",
          file: "f.txt",
          gate: "x",
          about: "x",
          entries: [{ key: "a", reason: "r", commit: "c".repeat(40), by: "T", on: "2026-01-01", pr: 3 }],
        },
      ],
    };
    const before = calls.n;
    const index = buildIndex(r.root, provenanceFromCommitted(committed), [fixture], { "FIX#a": "r" });
    expect(calls.n).toBe(before);
    expect(index.ledgers[0].entries[0]).toMatchObject({ commit: "c".repeat(40), pr: 3 });
  });

  it("two occurrences of one needle blame two lines", () => {
    const r = repo();
    r.write("a\nb\nlit\nc\nd\ne\nf\n");
    r.commit("first");
    r.write("a\nb\nlit\nc\nd\ne\nf\nlit\n");
    const second = r.commit("second");
    const p = blameProvenance(r.root);
    const first = p(spec, entry("lit", 1));
    const later = p(spec, entry("lit", 2));
    expect(later.commit).toBe(second);
    expect(first.commit).not.toBe(second);
    expect(first.commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
