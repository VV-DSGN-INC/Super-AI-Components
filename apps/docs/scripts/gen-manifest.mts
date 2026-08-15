/**
 * ONE-SHOT BOOTSTRAP.
 *
 * This script generates lib/catalog.manifest.ts from docs/design-system/catalog.md
 * exactly once. After that first run, catalog.manifest.ts is the source of truth
 * and is edited by hand (and later by scripts/new-component.mts) — nobody re-runs
 * this script. Re-running it today would regenerate every field straight from
 * catalog.md and silently discard any hand edits made since bootstrap — in
 * particular the shipped-item `description` overrides recorded in
 * catalog.manifest.ts's own header comment. Don't run this unless you intend to
 * blow those away.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCatalogTables } from "./lib/parse-catalog";
import type { FamilyId, ManifestItem, ManifestStatus } from "../lib/manifest-types";

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_MD = join(here, "../../../docs/design-system/catalog.md");
const OUT = join(here, "../lib/catalog.manifest.ts");

/**
 * Cut records that are not a whole family. O5 `flow-shell` was cut by D9 and is
 * struck through in catalog.md (`~~`flow-shell`~~`); the parser reads the name
 * out of the backticks and cannot see the strikethrough, so it is named here.
 */
const CUT_IDS = new Set(["O5"]);

/**
 * Wave assignment per decisions.md §5 ("Revised sequencing proposal"). Each wave
 * ships a family's components plus the one block that proves them, so a block's
 * wave is almost never its family's wave — see WAVE_BY_ID below, which §5 assigns
 * individually and which wins when both apply. G is cut, so it has no wave. O
 * carries no meaningful family-level default: §5 places every block by id, so 0
 * here only fires if a future O row ships without an explicit WAVE_BY_ID entry.
 */
const WAVE_BY_FAMILY: Record<FamilyId, number> = {
  A: 1,
  B: 2,
  C: 2,
  D: 3,
  E: 4,
  F: 4,
  G: 0,
  H: 6,
  I: 6,
  J: 7,
  K: 8,
  L: 9,
  M: 10,
  N: 11,
  O: 0,
  // P postdates §5's sequencing entirely — it is the second board's family
  // (D18), not a wave of the first board's build. Wave 8 groups it as one
  // shipment rather than implying a place in the original order.
  P: 8,
};

/**
 * Per-item wave overrides from decisions.md §5, where a block or a family-N item
 * is assigned to a specific wave rather than its family's. Consulted before
 * WAVE_BY_FAMILY.
 *
 * Blocks: each of the 13 active blocks proves one wave's components, per §5's
 * table (home-shell → wave 2, chat-shell → wave 3, generation-shell → wave 4,
 * studio-shell/timeline-shell → wave 6, library-shell/explore-shell/artifact-shell
 * → wave 7, docs-shell/notebook-shell → wave 8, settings-shell → wave 10,
 * records-shell → wave 11, auth-shell → wave 12). O5 `flow-shell` is cut and
 * forced to wave 0 below regardless of this table.
 *
 * Family N: §5 explicitly names N1 `feedback` and N3 `disclaimer-note` in wave 3
 * (with D, for `chat-shell`), and N4–N6 in wave 11 (with `records-shell`) — N4–N6
 * happen to already match the family-N default (11), so they're omitted here, but
 * they are confirmed, not coincidental. §5 never mentions N2 `trust-dialog`, N7
 * `env-status`, or N8 `permission-prompt` — they fall through to the family
 * default below because the sequencing table is silent on them, not because
 * their wave-11 placement has been reviewed.
 */
const WAVE_BY_ID: Record<string, number> = {
  N1: 3, // feedback
  N3: 3, // disclaimer-note
  O1: 2, // home-shell
  O2: 3, // chat-shell
  O3: 6, // studio-shell
  O4: 6, // timeline-shell
  O6: 4, // generation-shell
  O7: 7, // library-shell
  O8: 7, // explore-shell
  O9: 7, // artifact-shell
  O10: 11, // records-shell
  O11: 8, // docs-shell
  O12: 10, // settings-shell
  O13: 8, // notebook-shell
  O14: 12, // auth-shell
};

/**
 * The 14 items already in the registry, and the deps their code actually
 * imports. Cross-checked entry by entry against the hand-written `extras`
 * record in scripts/gen-registry.mts (lines ~30-47 as of this writing) — every
 * shadcn/consumes/npm value here reproduces what that record's
 * registryDependencies/dependencies actually declare, just split by kind
 * (`self(...)` registry-internal refs become `consumes`, plain shadcn names
 * become `shadcn`, npm package names become `npm`).
 */
const SHIPPED: Record<string, { shadcn?: string[]; consumes?: string[]; npm?: string[] }> = {
  kbd: {},
  "cost-chip": { npm: ["lucide-react"] },
  "date-section": {},
  "choice-chips": {},
  "filter-bar": { npm: ["lucide-react"] },
  "field-row": { consumes: ["reset-affordance"] },
  "gen-settings-bar": {},
  "preview-tile": {},
  "entity-row": {},
  "section-header": {},
  "reset-affordance": {},
  "stat-readout": {},
  "shortcuts-sheet": { shadcn: ["dialog"], consumes: ["kbd"] },
  "thread-list": {
    shadcn: ["button", "input", "dropdown-menu", "alert-dialog"],
    consumes: ["date-section"],
    npm: ["lucide-react"],
  },
};

const titleCase = (name: string) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const isFamilyId = (family: string): family is FamilyId => /^[A-O]$/.test(family);

const rows = parseCatalogTables(readFileSync(CATALOG_MD, "utf8"));

const items: ManifestItem[] = rows.map((row) => {
  if (!isFamilyId(row.family)) {
    throw new Error(`gen:manifest — unrecognized family "${row.family}" on row ${row.id}`);
  }
  const family = row.family;

  const shipped = SHIPPED[row.name];
  const layer: ManifestItem["layer"] = family === "A" ? "primitive" : family === "O" ? "block" : "component";
  const status: ManifestStatus =
    family === "G" || CUT_IDS.has(row.id) ? "cut" : shipped ? "shipped" : "planned";
  // Cut items carry no wave, full stop — never fall through to a per-item or
  // per-family value, even if one happens to exist for that id/family.
  const wave = status === "cut" ? 0 : (WAVE_BY_ID[row.id] ?? WAVE_BY_FAMILY[family] ?? 0);

  return {
    id: row.id,
    name: row.name,
    title: titleCase(row.name),
    description: row.description,
    family,
    layer,
    status,
    wave,
    base: row.base,
    shadcn: shipped?.shadcn ?? [],
    consumes: shipped?.consumes ?? [],
    npm: shipped?.npm ?? [],
    states: row.states,
    specAnchor: `${layer === "block" ? "block-specs.md" : "component-specs.md"}#${row.id.toLowerCase()}-${row.name.toLowerCase()}`,
    // No `contractExempt`. This used to emit `contractExempt: true` for every
    // shipped item; wave 0 drove the flag to zero across the manifest and
    // `check:contract` now ratchets it there. Re-running the generator with the
    // old line would re-exempt all 116 items in one write — the ratchet would
    // catch the flags, but the state normalizations done in the same wave are
    // regenerated from catalog.md's free text and would revert silently. Do not
    // reintroduce it.
  };
});

const body = `// GENERATED by scripts/gen-manifest.mts from docs/design-system/catalog.md,
// THEN HAND-EDITED: the 14 shipped items' \`description\` fields were restored to
// the original hand-written consumer copy that catalog.ts used to carry (see git
// history prior to the catalog.ts → manifest refactor), because catalog.md's
// Purpose column is terser internal shorthand, not consumer-facing copy. Every
// other field, and every planned/cut item's description, is still raw generator
// output.
//
// Bootstrap only — re-running scripts/gen-manifest.mts overwrites this entire
// file from catalog.md and DISCARDS the description hand edits above along with
// any other hand edits. After the first run this file is edited by hand and by
// scripts/new-component.mts; nobody re-runs the generator.
import type { ManifestItem } from "./manifest-types";

export const MANIFEST: ManifestItem[] = ${JSON.stringify(items, null, 2)};
`;

writeFileSync(OUT, body);
console.log(`gen:manifest — wrote ${items.length} items to lib/catalog.manifest.ts`);
