import { readFileSync } from "node:fs";
import { join } from "node:path";

import { load } from "js-yaml";

export const CI_WORKFLOW = ".github/workflows/ci.yml";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The gate steps of a workflow, in document order across every job.
 *
 * A step counts when it has a `run:` key. It is keyed by its `name:` when it
 * has one and by its trimmed `run:` string otherwise. A key already seen is
 * dropped, so two jobs that both install count the install once. That is the
 * counting rule CLAUDE.md uses for its step count.
 */
export function parseCiSteps(yamlText: string): string[] {
  const doc = load(yamlText);
  if (!isRecord(doc) || !isRecord(doc.jobs)) throw new Error("workflow has no jobs map");

  const seen = new Set<string>();
  const keys: string[] = [];
  for (const job of Object.values(doc.jobs)) {
    if (!isRecord(job) || !Array.isArray(job.steps)) continue;
    for (const step of job.steps) {
      if (!isRecord(step) || typeof step.run !== "string") continue;
      const key = typeof step.name === "string" ? step.name : step.run.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export function readCiSteps(repoRoot: string): string[] {
  return parseCiSteps(readFileSync(join(repoRoot, CI_WORKFLOW), "utf8"));
}
