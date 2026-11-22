import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONTRAST_EXEMPT_FILES } from "ds-rules/token-rules";

import { CORE_RULES } from "../../../../../packages/ds-rules/src/core";
import { LOCAL_RULES, VENDORED_SCOPES } from "../../../../../packages/ds-rules/src/local";
import { readUngated } from "../agents-stubs";

/** One allowance entry as a gate file carries it. `needle` is the literal text
 *  to find on the entry's own line, `occurrence` (1-based) says which match
 *  when the needle repeats. `file` names the carrying file when it differs
 *  from the ledger's (RULE_EXEMPT spans core.ts and local.ts). */
export type RawEntry = {
  key: string;
  reason: string | null;
  needle: string;
  occurrence: number;
  file?: string;
};

export type LedgerSpec = {
  name: string;
  file: string;
  gate: string;
  about: string;
  read: (root: string) => RawEntry[];
};

export const MIGRATED_REASON = "migrated 2026-10";
/** Entries whose reason is still the migration placeholder. It only falls. */
export const MIGRATED_CEILING = 25;

export const DECLINED: { name: string; file: string; why: string }[] = [
  {
    name: ".test. exempt entries",
    file: "packages/ds-rules/src/local.ts",
    why: "a population exclusion, not an allowance",
  },
  {
    name: "story-coverage.baseline.json",
    file: "apps/docs/scripts/lib/story-coverage.baseline.json",
    why: "a coverage work list: it may only shrink, and an entry is owed work, not an allowance",
  },
  {
    name: "contract-coverage.baseline.json",
    file: "apps/docs/scripts/lib/contract-coverage.baseline.json",
    why: "a coverage work list: it may only shrink, and an entry is owed work, not an allowance",
  },
];

/** 1-based count of `needle` in `text` up to and including the match at `at`. */
function occurrenceAt(text: string, needle: string, at: number): number {
  let n = 0;
  for (let i = text.indexOf(needle); i !== -1 && i <= at; i = text.indexOf(needle, i + 1)) n++;
  return n;
}

function readText(root: string, rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

/** Entries of a JSON array of strings, each located by its quoted literal. */
function readJsonStrings(root: string, rel: string): RawEntry[] {
  const text = readText(root, rel);
  const list = JSON.parse(text) as string[];
  return list.map((key) => {
    const needle = JSON.stringify(key);
    return { key, reason: null, needle, occurrence: occurrenceAt(text, needle, text.indexOf(needle)) };
  });
}

/** Locates `literal` after `from` and returns its needle and occurrence. */
function locate(text: string, literal: string, from: number): { needle: string; occurrence: number } {
  const needle = JSON.stringify(literal);
  const at = text.indexOf(needle, from);
  if (at === -1) throw new Error(`${needle} not found after offset ${from}`);
  return { needle, occurrence: occurrenceAt(text, needle, at) };
}

function readRuleExempt(root: string): RawEntry[] {
  const out: RawEntry[] = [];
  const sources: [string, typeof CORE_RULES][] = [
    ["packages/ds-rules/src/core.ts", CORE_RULES],
    ["packages/ds-rules/src/local.ts", LOCAL_RULES],
  ];
  for (const [file, rules] of sources) {
    const text = readText(root, file);
    for (const rule of rules) {
      if (rule.detect.method !== "grep" && rule.detect.method !== "heuristic") continue;
      const idAt = text.indexOf(`id: ${JSON.stringify(rule.id)}`);
      const exemptAt = text.indexOf("exempt:", idAt);
      for (const path of rule.detect.exempt) {
        if (path.includes(".test.")) continue;
        out.push({
          key: `${rule.id}:${path}`,
          reason: null,
          ...locate(text, path, exemptAt),
          file,
        });
      }
    }
  }
  return out;
}

function readVendored(root: string): RawEntry[] {
  const text = readText(root, "packages/ds-rules/src/local.ts");
  const from = text.indexOf("export const VENDORED_SCOPES");
  return VENDORED_SCOPES.map((scope) => ({ key: scope, reason: null, ...locate(text, scope, from) }));
}

function readContrastExempt(root: string): RawEntry[] {
  const text = readText(root, "packages/ds-rules/src/token-rules.mjs");
  const from = text.indexOf("export const CONTRAST_EXEMPT_FILES");
  return CONTRAST_EXEMPT_FILES.map((name) => ({ key: name, reason: null, ...locate(text, name, from) }));
}

function readUngatedLedger(root: string): RawEntry[] {
  const text = readText(root, "docs/design-system/UNGATED.md");
  return [...readUngated(text)].map(([key, reason]) => {
    const needle = `\`${key}\``;
    return { key, reason, needle, occurrence: occurrenceAt(text, needle, text.indexOf(needle)) };
  });
}

export const LEDGERS: LedgerSpec[] = [
  {
    name: "RULE_EXEMPT",
    file: "packages/ds-rules/src/{core,local}.ts",
    gate: "packages/ds-rules/rulecheck.mjs",
    about: "Per-rule files the token and slop detector skips entirely, whole-file.",
    read: readRuleExempt,
  },
  {
    name: "VENDORED_SCOPES",
    file: "packages/ds-rules/src/local.ts",
    gate: "packages/ds-rules/rulecheck.mjs",
    about: "Vendored upstream trees whose hits are demoted below blocker.",
    read: readVendored,
  },
  {
    name: "A11Y_EXCLUSIONS",
    file: "apps/storybook/a11y-exclusions.baseline.json",
    gate: "apps/docs/scripts/lib/a11y-ratchet.test.ts",
    about: "Story globs the axe gate does not run. The list may only shrink.",
    read: (root) => readJsonStrings(root, "apps/storybook/a11y-exclusions.baseline.json"),
  },
  {
    name: "CSSVARS_LIVENESS",
    file: "apps/docs/cssvars-liveness.baseline.json",
    gate: "apps/docs/scripts/lib/cssvars-liveness.test.ts",
    about: "CSS variables a component reads or declares that nothing resolves or reads.",
    read: (root) => readJsonStrings(root, "apps/docs/cssvars-liveness.baseline.json"),
  },
  {
    name: "CONTRAST_EXEMPT_FILES",
    file: "packages/ds-rules/src/token-rules.mjs",
    gate: "apps/docs/scripts/check-contract.mts",
    about: "Files the single-element contrast rule skips.",
    read: readContrastExempt,
  },
  {
    name: "UNGATED",
    file: "docs/design-system/UNGATED.md",
    gate: "apps/docs/scripts/lib/agents-provenance.test.ts",
    about: "Agent rules with no gate, each with the reason nothing enforces it.",
    read: readUngatedLedger,
  },
];
