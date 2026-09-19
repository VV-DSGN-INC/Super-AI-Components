import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { FACT_KEYS, factKeysIn, pageStrings } from "@/lib/system-page";

import { architecturePage } from "./architecture.page";
import { DERIVED_ROWS } from "./derived";
import { figureStrings } from "./figures";
import { GATE_ROWS } from "./gates";
import { harnessPage } from "./harness.page";

const REPO = resolve(__dirname, "../../../..");
const DOCS = join(REPO, "apps/docs");

const rosterStrings = GATE_ROWS.flatMap((row) => [
  row.title,
  row.protects,
  row.blindSpot ?? "",
  ...row.checks.map((check) => check.protects),
]);

/** Every public prose string, with where it lives. */
const PROSE: { where: string; text: string }[] = [
  ...pageStrings(harnessPage).map((text) => ({ where: "harness.page.ts", text })),
  ...pageStrings(architecturePage).map((text) => ({ where: "architecture.page.ts", text })),
  ...figureStrings().map((text) => ({ where: "figures.ts", text })),
  ...rosterStrings.map((text) => ({ where: "gates.ts", text })),
  ...DERIVED_ROWS.map((row) => ({ where: "derived.ts", text: row.note })),
].filter((entry) => entry.text !== "");

/** Exact strings allowed to hold a digit outside backticks, each with a reason. */
const DIGIT_ALLOWLIST: { text: string; reason: string }[] = [];

/** Backticked paths a fresh checkout does not have, each with a reason. */
const GENERATED_PATHS: { path: string; reason: string }[] = [];

const BANNED_WORDS = [
  "tapestry",
  "landscape",
  "delve",
  "elevate",
  "seamless",
  "effortless",
  "unlock",
  "robust",
  "journey",
  "load-bearing",
];
const BANNED_PHRASES = ["here's the kicker", "what people miss", "that distinction matters"];

/** The text with code and fact placeholders removed: what the prose rules read. */
const bare = (text: string) => text.replace(/`[^`]*`/g, "").replace(/\{facts\.[A-Za-z]+\}/g, "");
const backticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
const looksLikeRepoPath = (token: string) =>
  token.includes("/") && !/[\s*{<[]/.test(token) && !/^(\/|@|[a-z]+:\/\/)/.test(token);

describe("facts on the pages", () => {
  it("uses only placeholders that name a real fact", () => {
    for (const { where, text } of PROSE) {
      for (const key of factKeysIn(text)) expect(FACT_KEYS, `${where}: {facts.${key}}`).toContain(key);
    }
  });

  it("uses every fact. A key nothing prints is removed from the deriver", () => {
    const used = new Set(PROSE.flatMap(({ text }) => factKeysIn(text)));
    expect([...used].sort()).toEqual([...FACT_KEYS]);
  });

  it("types no digit into prose", () => {
    const allowed = new Set(DIGIT_ALLOWLIST.map((entry) => entry.text));
    for (const { where, text } of PROSE) {
      if (allowed.has(text)) continue;
      expect(bare(text), `${where}: "${text}"`).not.toMatch(/\d/);
    }
  });

  it("keeps no dead allowlist entry", () => {
    const all = new Set(PROSE.map((entry) => entry.text));
    for (const entry of DIGIT_ALLOWLIST) expect(all.has(entry.text), entry.text).toBe(true);
    const cited = new Set(PROSE.flatMap(({ text }) => backticked(text)));
    for (const entry of GENERATED_PATHS) expect(cited.has(entry.path), entry.path).toBe(true);
  });
});

describe("citations on the pages", () => {
  it("cites only repo paths that exist", () => {
    const generated = new Set(GENERATED_PATHS.map((entry) => entry.path));
    for (const { where, text } of PROSE) {
      for (const token of backticked(text).filter(looksLikeRepoPath)) {
        if (generated.has(token)) continue;
        const found = existsSync(join(REPO, token)) || existsSync(join(DOCS, token));
        expect(found, `${where} cites \`${token}\`, which does not exist`).toBe(true);
      }
    }
  });
});

describe("writing rules", () => {
  it("has no em dash and no exclamation mark", () => {
    for (const { where, text } of PROSE) {
      expect(text, `${where}: "${text}"`).not.toContain("—");
      expect(bare(text), `${where}: "${text}"`).not.toContain("!");
    }
  });

  it("uses none of the banned words or phrases", () => {
    for (const { where, text } of PROSE) {
      const lower = bare(text).toLowerCase();
      for (const word of BANNED_WORDS) {
        expect(new RegExp(`\\b${word}\\b`).test(lower), `${where}: "${word}" in "${text}"`).toBe(false);
      }
      for (const phrase of BANNED_PHRASES) expect(lower, `${where}: "${text}"`).not.toContain(phrase);
    }
  });
});
