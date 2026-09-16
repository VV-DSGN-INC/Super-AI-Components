// D26 as code (spec 2026-09-15 §3). Pure: the emit gate, check-contract and
// the tests all run this one function, so "valid" means one thing.
import type { PatternDocs } from "@/lib/pattern-docs";
import { SLUG_RE, STAGES } from "@/lib/pattern-docs";

import { MIN_REASON } from "./contract-schema";

export { SLUG_RE };

const STAGE_IDS: readonly string[] = STAGES.map((s) => s.id);
const clearsFloor = (s: unknown) => typeof s === "string" && s.trim().length >= MIN_REASON;
// A title is a behaviour, not a component under another spelling. Kebabbing it
// is how that comparison is made against the registry's own names.
const kebab = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function validatePattern(
  slug: string,
  docs: PatternDocs,
  shipped: ReadonlySet<string>,
  hasDemo: boolean,
): string[] {
  const errors: string[] = [];
  const demoPath = `components/demos/patterns/${slug}-demo.tsx`;

  if (!SLUG_RE.test(slug)) errors.push(`${slug}: slug must match ${SLUG_RE}`);
  if (!docs.title?.trim()) errors.push(`${slug}: title is required`);
  else if (shipped.has(kebab(docs.title))) {
    errors.push(
      `${slug}: title "${docs.title}" is the registry item ${kebab(docs.title)}; a pattern names a behaviour, not a component (D26)`,
    );
  }
  if (!STAGE_IDS.includes(docs.stage)) {
    errors.push(`${slug}: stage "${docs.stage}" is not one of ${STAGE_IDS.join(", ")}`);
  }
  if (!clearsFloor(docs.definition))
    errors.push(`${slug}: definition needs at least ${MIN_REASON} characters`);
  if (!clearsFloor(docs.whyItMatters))
    errors.push(`${slug}: whyItMatters needs at least ${MIN_REASON} characters`);
  if (!Array.isArray(docs.anatomy) || docs.anatomy.length === 0)
    errors.push(`${slug}: anatomy names at least one slot`);

  docs.components.forEach((name, i) => {
    if (!shipped.has(name)) errors.push(`${slug}: components[${i}] "${name}" is not a shipped manifest item`);
  });

  if (docs.status === "shipped") {
    if (docs.components.length === 0)
      errors.push(`${slug}: a shipped pattern composes at least one component`);
    if (!hasDemo) errors.push(`${slug}: a shipped pattern has a composition at ${demoPath}`);
  } else if (docs.status === "unfilled") {
    if (docs.components.length > 0) errors.push(`${slug}: an unfilled pattern has components: []`);
    if (hasDemo)
      errors.push(`${slug}: an unfilled pattern has no composition; delete ${demoPath} or ship it`);
    if (!docs.evidence || docs.evidence.length === 0) {
      errors.push(`${slug}: an unfilled pattern names at least one product in evidence`);
    }
    if (!clearsFloor(docs.unfilledBecause)) {
      errors.push(`${slug}: unfilledBecause needs a reason of at least ${MIN_REASON} characters`);
    }
  } else {
    errors.push(`${slug}: status must be "shipped" or "unfilled"`);
  }
  return errors;
}
