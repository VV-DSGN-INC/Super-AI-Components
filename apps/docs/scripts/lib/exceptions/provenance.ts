import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NO_PROVENANCE, type ExceptionsIndex, type Provenance } from "./build";
import type { LedgerSpec, RawEntry } from "./registry";

export type { Provenance };

const BASE_REFS = ["origin/main", "main", "HEAD"];
const ZERO_SHA = /^0{40}$/;

function git(root: string, args: string[]): string | null {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

/** First of origin/main, main, HEAD that resolves. Provenance walks the base
 *  branch so a PR number is the one that landed the line, not HEAD's. */
function baseRef(root: string): string {
  for (const ref of BASE_REFS) {
    if (git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]) !== null) return ref;
  }
  return "HEAD";
}

/** PR number from a base-branch subject: a merge commit or a squash suffix. */
export function prFromSubject(subject: string): number | null {
  const merge = /^Merge pull request #(\d+)\b/.exec(subject);
  if (merge) return Number(merge[1]);
  const squash = /\(#(\d+)\)\s*$/.exec(subject);
  return squash ? Number(squash[1]) : null;
}

/** 1-based line number of the `occurrence`-th line of `file` containing `needle`. */
function lineOf(root: string, file: string, needle: string, occurrence: number): number | null {
  const lines = readFileSync(join(root, file), "utf8").split("\n");
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle) && ++seen === occurrence) return i + 1;
  }
  return null;
}

export function blameProvenance(root: string): (l: LedgerSpec, e: RawEntry) => Provenance {
  const base = baseRef(root);
  const subjects = new Map<string, string>();
  for (const row of (git(root, ["log", "--first-parent", "--format=%H%x09%s", base]) ?? "").split("\n")) {
    const tab = row.indexOf("\t");
    if (tab > 0) subjects.set(row.slice(0, tab), row.slice(tab + 1));
  }

  const prFor = (commit: string): number | null => {
    const own = subjects.get(commit);
    if (own !== undefined) return prFromSubject(own);
    // Not on the first-parent chain: it reached the base through a merge,
    // the oldest first-parent commit on the ancestry path to it. (git prints
    // nothing for --first-parent with --ancestry-path, so filter by hand.)
    const path = git(root, ["rev-list", "--ancestry-path", `${commit}..${base}`]);
    const onChain = path
      ?.trim()
      .split("\n")
      .filter((h) => subjects.has(h));
    const subject = onChain?.length ? subjects.get(onChain[onChain.length - 1]) : undefined;
    return subject === undefined ? null : prFromSubject(subject);
  };

  return (l, e) => {
    const file = e.file ?? l.file;
    const line = lineOf(root, file, e.needle, e.occurrence);
    if (line === null) return NO_PROVENANCE;
    const out = git(root, ["blame", "--line-porcelain", "-L", `${line},${line}`, "--", file]);
    if (out === null) return NO_PROVENANCE;
    const commit = out.split(/\s/, 1)[0];
    if (!/^[0-9a-f]{40}$/.test(commit) || ZERO_SHA.test(commit)) return NO_PROVENANCE;
    const by = /^author (.*)$/m.exec(out)?.[1] ?? null;
    const time = /^author-time (\d+)$/m.exec(out)?.[1];
    const on = time ? new Date(Number(time) * 1000).toISOString().slice(0, 10) : null;
    return { commit, by, on, pr: prFor(commit) };
  };
}

/** Gate mode: reads the committed index, never runs git. */
export function provenanceFromCommitted(index: ExceptionsIndex): (l: LedgerSpec, e: RawEntry) => Provenance {
  const byKey = new Map<string, Provenance>();
  for (const l of index.ledgers) {
    for (const e of l.entries) {
      byKey.set(`${l.name}#${e.key}`, { commit: e.commit, by: e.by, on: e.on, pr: e.pr });
    }
  }
  return (l, e) => byKey.get(`${l.name}#${e.key}`) ?? NO_PROVENANCE;
}
