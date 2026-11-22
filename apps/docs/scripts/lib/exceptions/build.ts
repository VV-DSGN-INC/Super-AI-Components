import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DECLINED, LEDGERS, MIGRATED_REASON, type LedgerSpec, type RawEntry } from "./registry";

export type Provenance = {
  commit: string | null;
  by: string | null;
  on: string | null;
  pr: number | null;
};

export type IndexedEntry = { key: string; reason: string | null } & Provenance;

export type ExceptionsIndex = {
  generatedBy: string;
  ledgers: { name: string; file: string; gate: string; about: string; entries: IndexedEntry[] }[];
  declined: { name: string; file: string; why: string }[];
};

export const EXCEPTIONS_FILE = "apps/docs/index/exceptions.json";
export const REASONS_FILE = join(__dirname, "reasons.json");

export const GENERATED_BY =
  "pnpm exceptions:emit (apps/docs/scripts/lib/exceptions/emit.test.ts reads the ledgers apps/docs/scripts/lib/exceptions/registry.ts names); never edit by hand";

export const NO_PROVENANCE: Provenance = { commit: null, by: null, on: null, pr: null };

export function loadReasons(): Record<string, string> {
  return JSON.parse(readFileSync(REASONS_FILE, "utf8")) as Record<string, string>;
}

/** Reason for an entry: its own (UNGATED), else reasons.json under "<LEDGER>#<key>". */
export function reasonFor(ledger: string, e: RawEntry, reasons: Record<string, string>): string | null {
  return e.reason ?? reasons[`${ledger}#${e.key}`] ?? null;
}

export function buildIndex(
  root: string,
  provenance: (l: LedgerSpec, e: RawEntry) => Provenance | null,
  ledgers: LedgerSpec[] = LEDGERS,
  reasons: Record<string, string> = loadReasons(),
): ExceptionsIndex {
  return {
    generatedBy: GENERATED_BY,
    ledgers: ledgers.map((l) => ({
      name: l.name,
      file: l.file,
      gate: l.gate,
      about: l.about,
      entries: l.read(root).map((e) => ({
        key: e.key,
        reason: reasonFor(l.name, e, reasons),
        ...(provenance(l, e) ?? NO_PROVENANCE),
      })),
    })),
    declined: DECLINED,
  };
}

export function renderIndex(index: ExceptionsIndex): string {
  return `${JSON.stringify(index, null, 2)}\n`;
}

const PLACEHOLDER = /^(n\/a|na|tbd|todo|none|-{1,2}|\.)$/i;

/** Keys whose reason is missing, a placeholder, or neither migrated nor a sentence. */
export function reasonProblems(index: ExceptionsIndex): string[] {
  const bad: string[] = [];
  for (const l of index.ledgers) {
    for (const e of l.entries) {
      const r = e.reason;
      const ok = r !== null && (r === MIGRATED_REASON || (r.length >= 40 && !PLACEHOLDER.test(r.trim())));
      if (!ok) bad.push(`${l.name}#${e.key}`);
    }
  }
  return bad;
}
