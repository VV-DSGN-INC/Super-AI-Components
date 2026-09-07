// Report-only view of story coverage: the unmet obligations for one item,
// several, or the whole tree. This is the "report-only form" the
// story-guarantees spec (§6) asked for before the family waves ran — it reads
// the manifest and the story files, writes nothing, and never consults the
// baseline. So a wave agent can check its own item inside its worktree without
// touching the shared ratchet file, which only the integrator regenerates
// (`pnpm story-coverage:baseline`).
//
//   pnpm story-coverage:report                 every shipped item with debt
//   pnpm story-coverage:report run-button …    the named items, exit 1 if any
//                                              obligation is still unmet
//
// Same code path as the ratchet test and the regenerate script
// (scripts/lib/story-coverage.ts), so the three cannot disagree about "unmet".
import { existsSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";
import { pascal } from "./lib/scaffold-templates";
import { collectUnmet, deriveObligations, type Obligation } from "./lib/story-coverage";

const storyFor = (name: string) => `../storybook/src/stories/super-ai/${pascal(name)}.stories.tsx`;

const wanted = process.argv.slice(2);
const shipped = MANIFEST.filter((i) => i.status === "shipped");
const unknown = wanted.filter((w) => !shipped.some((i) => i.name === w));
if (unknown.length > 0) {
  console.error(`story-coverage:report — not a shipped item: ${unknown.join(", ")}`);
  process.exit(2);
}
const items = wanted.length > 0 ? shipped.filter((i) => wanted.includes(i.name)) : shipped;

const unmet = collectUnmet(deriveObligations(items), (name) =>
  existsSync(storyFor(name)) ? readFileSync(storyFor(name), "utf8") : null,
);

const byItem = new Map<string, Obligation[]>();
for (const o of unmet) byItem.set(o.item, [...(byItem.get(o.item) ?? []), o]);

for (const item of items) {
  const group = byItem.get(item.name) ?? [];
  if (group.length === 0 && wanted.length === 0) continue;
  console.log(
    `${item.name} — ${group.length} unmet${existsSync(storyFor(item.name)) ? "" : " (no story file)"}`,
  );
  for (const o of group) console.log(`  ${`${o.kind}:${o.target}`.padEnd(28)} ${o.why}`);
}
const cases = unmet.filter((o) => o.kind === "case").length;
console.log(
  `story-coverage:report — ${items.length} item(s), ${unmet.length} unmet obligation(s): ${cases} case, ${unmet.length - cases} described.`,
);
if (wanted.length > 0 && unmet.length > 0) process.exit(1);
