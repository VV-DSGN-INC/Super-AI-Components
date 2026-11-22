#!/usr/bin/env node
// Reports the allowances a PR adds or removes, by diffing the exceptions index
// against a base ref. A report, never a gate: it exits 0 whenever it can run.
//
//   node apps/docs/scripts/exceptions-delta.mjs <base-ref>     (from the repo root)
//
// Exit 0: report printed (additions included). Exit 2: no base argument, or the
// working-tree index is unreadable or invalid. A base ref with no index file
// reads as an empty index, because main has none until the index lands.
// Plain Node, no dependencies, so CI needs no install.

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const INDEX_PATH = "apps/docs/index/exceptions.json";
export const FLAG_AT = 3;

/** Keys per ledger name. Throws on a shape that is not an exceptions index. */
export function keysByLedger(index) {
  if (!index || typeof index !== "object" || !Array.isArray(index.ledgers)) {
    throw new Error("index has no ledgers array");
  }
  const out = new Map();
  for (const ledger of index.ledgers) {
    if (!ledger || typeof ledger.name !== "string" || !Array.isArray(ledger.entries)) {
      throw new Error("a ledger has no name or entries array");
    }
    out.set(
      ledger.name,
      ledger.entries.map((e) => {
        if (!e || typeof e.key !== "string")
          throw new Error(`ledger ${ledger.name} has an entry without a key`);
        return e.key;
      }),
    );
  }
  return out;
}

/** Per-ledger added and removed keys. A null base is an empty index. */
export function diffIndexes(base, head) {
  const before = base ? keysByLedger(base) : new Map();
  const after = keysByLedger(head);
  const names = [...new Set([...before.keys(), ...after.keys()])].sort();
  return names.map((name) => {
    const was = new Set(before.get(name) ?? []);
    const is = new Set(after.get(name) ?? []);
    return {
      name,
      added: [...is].filter((k) => !was.has(k)).sort(),
      removed: [...was].filter((k) => !is.has(k)).sort(),
    };
  });
}

export function totals(deltas) {
  return {
    added: deltas.reduce((n, d) => n + d.added.length, 0),
    removed: deltas.reduce((n, d) => n + d.removed.length, 0),
  };
}

export function flaggedLedgers(deltas, threshold = FLAG_AT) {
  return deltas.filter((d) => d.added.length >= threshold).map((d) => d.name);
}

/** Plain-text report. Ledgers with no change are left out. */
export function formatReport(deltas, threshold = FLAG_AT) {
  const changed = deltas.filter((d) => d.added.length || d.removed.length);
  const { added, removed } = totals(deltas);
  if (!changed.length) return "Exceptions delta: no change.\n";
  const lines = ["Exceptions delta"];
  for (const d of changed) {
    lines.push(`${d.name}${d.added.length >= threshold ? "  FLAG" : ""}`);
    for (const k of d.added) lines.push(`  + ${k}`);
    for (const k of d.removed) lines.push(`  - ${k}`);
  }
  lines.push(`Total: ${added} added, ${removed} removed`);
  const flagged = flaggedLedgers(deltas, threshold);
  if (flagged.length) {
    lines.push(
      `FLAG: ${flagged.join(", ")} gained ${threshold} or more allowances in this PR. Each needs a reason a reviewer accepts.`,
    );
  }
  return `${lines.join("\n")}\n`;
}

/** The same report as markdown, for the job summary. */
export function formatMarkdown(deltas, threshold = FLAG_AT) {
  const changed = deltas.filter((d) => d.added.length || d.removed.length);
  const { added, removed } = totals(deltas);
  if (!changed.length) return "### Exceptions delta\n\nNo change.\n";
  const lines = ["### Exceptions delta", ""];
  for (const d of changed) {
    lines.push(`**${d.name}**${d.added.length >= threshold ? " (flag)" : ""}`, "");
    for (const k of d.added) lines.push(`- added \`${k}\``);
    for (const k of d.removed) lines.push(`- removed \`${k}\``);
    lines.push("");
  }
  lines.push(`Total: ${added} added, ${removed} removed.`);
  const flagged = flaggedLedgers(deltas, threshold);
  if (flagged.length) {
    lines.push("", `Flag: ${flagged.join(", ")} gained ${threshold} or more allowances in this PR.`);
  }
  return `${lines.join("\n")}\n`;
}

function readBase(ref) {
  try {
    const text = execFileSync("git", ["show", `${ref}:${INDEX_PATH}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(text);
  } catch {
    return null; // no index at the base: read as empty
  }
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const ref = argv[0];
  if (!ref) {
    console.error("usage: node apps/docs/scripts/exceptions-delta.mjs <base-ref>");
    return 2;
  }
  let head;
  try {
    head = JSON.parse(readFileSync(resolve(INDEX_PATH), "utf8"));
    keysByLedger(head);
  } catch (error) {
    console.error(`cannot read ${INDEX_PATH}: ${error.message}`);
    return 2;
  }
  const deltas = diffIndexes(readBase(ref), head);
  process.stdout.write(formatReport(deltas));
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, formatMarkdown(deltas));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
