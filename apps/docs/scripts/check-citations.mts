// Docs-citation gate: a claim-position prose field in a docs module may not
// cite a utility or slot/component name the component's reachable source does
// not carry. check-contract.mts asserts the docs *structure*; this asserts the
// citations inside it. Spec (scope, buckets, what is deliberately deferred):
// docs/superpowers/specs/2026-08-23-docs-citation-gate-design.md
//
// Runs as the second half of `pnpm check:contract`. Docs modules are plain
// data by convention (their headers say so) and are IMPORTED here — field
// walking over typed objects, never regex over prose position.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MANIFEST } from "../lib/catalog.manifest";
import { classifySpan, extractCitations, slotTargets } from "./lib/citation-scan";

function main() {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const errors: string[] = [];
  let modules = 0;
  let citations = 0;
  const catalogNames = new Set(MANIFEST.map((i) => i.name));

  const run = async () => {
    for (const item of MANIFEST) {
      if (item.status !== "shipped") continue;
      const docsPath = path.join(ROOT, "content/components", `${item.name}.docs.tsx`);
      if (!existsSync(docsPath)) continue;

      // A docs module that cannot load headless is a finding, not a skip —
      // could-not-tell must never collapse into clean (rulecheck's exit-2 rule).
      let docs: unknown;
      try {
        const mod = (await import(docsPath)) as Record<string, unknown>;
        docs = Object.values(mod).find((v) => v && typeof v === "object" && "whatItIs" in (v as object));
      } catch (e) {
        errors.push(`${item.name}: docs module failed to import — ${(e as Error).message}`);
        continue;
      }
      if (!docs) {
        errors.push(`${item.name}: docs module has no ComponentDocs export`);
        continue;
      }
      modules++;

      const reachFiles = [
        path.join(ROOT, "registry/super-ai", `${item.name}.tsx`),
        ...(item.files ?? []).map((f) => path.join(ROOT, f.path)),
        ...item.consumes.map((n) => path.join(ROOT, "registry/super-ai", `${n}.tsx`)),
        ...item.shadcn.map((n) => path.join(ROOT, "components/ui", `${n}.tsx`)),
      ].filter((p) => existsSync(p));
      const reach = reachFiles.map((p) => readFileSync(p, "utf8")).join("\n");
      const slots = slotTargets(reach);
      const composedNames = new Set([item.name, ...item.consumes, ...item.shadcn]);
      // Anatomy slots must exist in the composition graph. Prose names may
      // additionally cross-reference any catalog item ("compose with
      // `credits-indicator`") or the item's own declared states
      // (`with-icon`) — the first tree-wide run measured those two
      // vocabularies at 68 and 69 citations; zero needed other items' states.
      const ownStates = new Set(item.states ?? []);
      const reachableSlot = (span: string) => {
        const regionClaim = span.match(/^data-region="([a-z0-9-]+)"$/);
        if (regionClaim) return slots.regions.has(regionClaim[1]);
        return slots.literals.has(span) || slots.prefixes.some((p) => span.startsWith(p)) || composedNames.has(span);
      };
      const reachable = (span: string) => reachableSlot(span) || catalogNames.has(span) || ownStates.has(span);

      for (const { path: fieldPath, span } of extractCitations(docs)) {
        const kind = classifySpan(span);
        if (kind === "allowed" || kind === "ignored") continue;
        citations++;
        if (kind === "utility" && !reach.includes(span))
          errors.push(`${item.name} ${fieldPath}: \`${span}\` not in reachable source (own + ${reachFiles.length - 1} composed files)`);
        if (kind === "name" && !reachable(span))
          errors.push(`${item.name} ${fieldPath}: \`${span}\` matches no data-slot, slot prefix, or composed component`);
      }

      const anatomy = (docs as { anatomy?: { slot?: string }[] }).anatomy ?? [];
      anatomy.forEach((a, i) => {
        if (a.slot && !reachableSlot(a.slot))
          errors.push(`${item.name} anatomy[${i}].slot: "${a.slot}" matches no data-slot, slot prefix, or composed component`);
      });
    }

    if (errors.length) {
      console.error(`check-citations: ${errors.length} unreachable citation(s)\n`);
      for (const e of errors) console.error(`  ${e}`);
      process.exit(1);
    }
    console.log(`check-citations: ${modules} docs modules, ${citations} checkable citations, all reachable`);
  };

  void run();
}

// Guard: the vitest file imports the pure functions above; only a direct
// `tsx scripts/check-citations.mts` invocation runs the tree-wide gate.
if (process.argv[1]?.endsWith("check-citations.mts")) main();
