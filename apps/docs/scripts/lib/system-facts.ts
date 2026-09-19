import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { MANIFEST } from "../../lib/catalog.manifest";
import type { ManifestItem } from "../../lib/manifest-types";
import { FACT_KEYS, type FactKey, type SystemFacts } from "../../lib/system-page";
import { CI_WORKFLOW, readCiSteps } from "./ci-steps";

export const FACTS_FILE = "apps/docs/content/system/facts.json";
export const FACTS_BANNER = "Derived by `cd apps/docs && pnpm facts:emit`. Do not edit by hand.";

const MANIFEST_FILE = "apps/docs/lib/catalog.manifest.ts";
const CONTRACTS_DIR = "apps/docs/registry/super-ai";
const STORIES_DIR = "apps/storybook/src/stories/super-ai";
const PROSE_DIR = "apps/storybook/src";
const RULES_DIR = "packages/ds-rules/rules";
const LEDGERS_DIR = "apps";
const SKILLS_DIR = ".claude/skills";

/** Where each fact comes from. Used in error messages. */
export const FACT_SOURCES: Record<FactKey, string> = {
  ciSteps: CI_WORKFLOW,
  contracts: CONTRACTS_DIR,
  ledgers: LEDGERS_DIR,
  prosePages: PROSE_DIR,
  ruleBlockers: RULES_DIR,
  rules: RULES_DIR,
  rulesJudgment: RULES_DIR,
  rulesRendered: RULES_DIR,
  rulesStatic: RULES_DIR,
  shipped: MANIFEST_FILE,
  shippedBlocks: MANIFEST_FILE,
  shippedComponents: MANIFEST_FILE,
  shippedPrimitives: MANIFEST_FILE,
  skills: SKILLS_DIR,
  storyFiles: STORIES_DIR,
};

/** "Could not check" is its own error. It must never look like a clean count. */
export class FactsInputError extends Error {
  constructor(
    readonly key: FactKey,
    readonly source: string,
    detail: string,
  ) {
    super(`facts: cannot derive "${key}" from ${source}: ${detail}`);
    this.name = "FactsInputError";
  }
}

type ManifestSlice = ReadonlyArray<Pick<ManifestItem, "status" | "layer">>;

interface RuleRecord {
  severity: string;
  detect: { method: string };
}

/** Repo-relative paths of the files under `rel` that `keep` accepts, sorted.
 *  Skips node_modules and dot directories. */
function filesUnder(repoRoot: string, rel: string, keep: (name: string) => boolean, key: FactKey): string[] {
  if (!existsSync(join(repoRoot, rel))) throw new FactsInputError(key, rel, "path does not exist");
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const child = `${dir}/${entry.name}`;
      if (entry.isDirectory()) visit(child);
      else if (keep(entry.name)) out.push(child);
    }
  };
  visit(rel);
  return out.sort();
}

/** Every shrink-only ledger, repo-relative. The roster test compares this set
 *  with the ledgers the roster claims. */
export function findLedgers(repoRoot: string): string[] {
  return filesUnder(repoRoot, LEDGERS_DIR, (name) => name.endsWith(".baseline.json"), "ledgers");
}

function readRules(repoRoot: string): RuleRecord[] {
  const files = filesUnder(repoRoot, RULES_DIR, (name) => name.endsWith(".json"), "rules");
  return files.flatMap((file) => {
    let doc: { rules?: unknown };
    try {
      doc = JSON.parse(readFileSync(join(repoRoot, file), "utf8")) as { rules?: unknown };
    } catch (error) {
      throw new FactsInputError("rules", file, `unparseable: ${(error as Error).message}`);
    }
    if (!Array.isArray(doc.rules)) throw new FactsInputError("rules", file, "no rules array");
    return doc.rules as RuleRecord[];
  });
}

function countSkills(repoRoot: string): number {
  const abs = join(repoRoot, SKILLS_DIR);
  if (!existsSync(abs)) throw new FactsInputError("skills", SKILLS_DIR, "path does not exist");
  return readdirSync(abs, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

function countCiSteps(repoRoot: string): number {
  try {
    return readCiSteps(repoRoot).length;
  } catch (error) {
    throw new FactsInputError("ciSteps", CI_WORKFLOW, (error as Error).message);
  }
}

export function deriveFacts(repoRoot: string, manifest: ManifestSlice = MANIFEST): SystemFacts {
  const shipped = manifest.filter((item) => item.status === "shipped");
  const inLayer = (layer: ManifestItem["layer"]) => shipped.filter((item) => item.layer === layer).length;
  const rules = readRules(repoRoot);
  const byMethod = (...methods: string[]) =>
    rules.filter((rule) => methods.includes(rule.detect.method)).length;

  const facts: SystemFacts = {
    ciSteps: countCiSteps(repoRoot),
    contracts: filesUnder(repoRoot, CONTRACTS_DIR, (name) => name.endsWith(".meta.json"), "contracts").length,
    ledgers: findLedgers(repoRoot).length,
    prosePages: filesUnder(repoRoot, PROSE_DIR, (name) => name.endsWith(".mdx"), "prosePages").length,
    ruleBlockers: rules.filter((rule) => rule.severity === "blocker").length,
    rules: rules.length,
    rulesJudgment: byMethod("judgment"),
    rulesRendered: byMethod("rendered"),
    rulesStatic: byMethod("grep", "heuristic"),
    shipped: shipped.length,
    shippedBlocks: inLayer("block"),
    shippedComponents: inLayer("component"),
    shippedPrimitives: inLayer("primitive"),
    skills: countSkills(repoRoot),
    storyFiles: filesUnder(repoRoot, STORIES_DIR, (name) => name.endsWith(".stories.tsx"), "storyFiles")
      .length,
  };

  for (const key of FACT_KEYS) {
    if (!(facts[key] > 0)) throw new FactsInputError(key, FACT_SOURCES[key], "count is zero");
  }
  return facts;
}

/** The emitted file: a banner, then the keys in alphabetical order. This is
 *  exactly what JSON.stringify prints, so prettier has nothing to change. */
export function renderFactsFile(facts: SystemFacts): string {
  const sorted = Object.fromEntries([...FACT_KEYS].sort().map((key) => [key, facts[key]]));
  return `${JSON.stringify({ generated: FACTS_BANNER, ...sorted }, null, 2)}\n`;
}
