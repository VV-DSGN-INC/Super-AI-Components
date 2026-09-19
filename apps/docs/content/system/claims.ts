import type { FactKey } from "@/lib/system-page";

/**
 * Counts typed into prose elsewhere in the repo, each pinned to a fact.
 *
 * The ledger does not discover new claims. It stops the known ones from
 * drifting. A pattern that matches nothing fails, so an entry cannot go dead
 * quietly. Capture group 1 is the number, as digits or as a number word.
 */
export interface Claim {
  /** Repo-relative file that holds the claim. */
  file: string;
  pattern: RegExp;
  fact: FactKey;
  note: string;
}

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

/** Digits or a number word up to twenty. Returns -1 for anything else. */
export function claimedNumber(raw: string): number {
  return /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS.indexOf(raw.toLowerCase());
}

export const CLAIMS: Claim[] = [
  {
    file: "CLAUDE.md",
    pattern: /^(\w+) steps\. The last three/m,
    fact: "ciSteps",
    note: "the CI section's step count",
  },
  {
    file: "CLAUDE.md",
    pattern: /Catalog status: (\d+) of \d+ shipped/,
    fact: "shipped",
    note: "the catalog status line",
  },
  {
    file: ".claude/skills/gate-run/SKILL.md",
    pattern: /^(\w+) steps, in/m,
    fact: "ciSteps",
    note: "the gate-run skill's step count",
  },
];
