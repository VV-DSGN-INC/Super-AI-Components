// The contract gate. For every "shipped" manifest item, enforces that its five
// surfaces (component/test/demo/docs/story) exist, its story covers every
// declared state, its docs module carries real guidance, its `consumes` graph
// resolves to other shipped items, and its registry-derivable fields
// (registryDependencies/dependencies) are what registry-extras.ts's
// deriveExtras() — the same function gen-registry.mts calls — actually
// produces for it. "building" items get exactly one assertion: they may not
// be shadowed by an orphan file under a name absent from the manifest.
//
// contractExempt (the 14 pre-Wave-1.5 components) skips only the story-state
// and docs-module assertions — everything else (files, consumes) still
// applies, and the exemption is always printed, never silent.
import { execFileSync } from "node:child_process";
// readdirSync rather than fs.globSync: globSync exists at runtime on Node 22+
// but is absent from @types/node@20, so it typechecks in an untyped .mjs gate
// (check-tokens.mjs) and fails in this typed .mts one.
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { MANIFEST } from "../lib/catalog.manifest";
import { LIB_MANIFEST } from "../lib/lib.manifest";
import {
  compareExemptionLists,
  findReservedStateNames,
  findSlotErasures,
  parseStorybookExclusions,
} from "./lib/contract-rules";
import { deriveExtras } from "./lib/registry-extras";
import { pascal, statePascal } from "./lib/scaffold-templates";
import { CONTRAST_EXEMPT_FILES } from "./lib/token-rules.mjs";

const manifest = MANIFEST;
const errors: string[] = [];
let checked = 0;
let exempt = 0;

const fileFor: Record<string, (n: string) => string> = {
  component: (n) => `registry/super-ai/${n}.tsx`,
  test: (n) => `registry/super-ai/${n}.test.tsx`,
  demo: (n) => `components/demos/${n}-demo.tsx`,
  docs: (n) => `content/components/${n}.docs.tsx`,
};

// Filename Pascal (imported above as `pascal`) — for registry names, which
// are always plain kebab-case (no spaces, no leading digits), this is safe.
// `states`, by contrast, are free text from catalog.md and need
// scaffold-templates.ts's statePascal (also imported above) to land on the
// same identifier the scaffold generated.
const storyFor = (n: string) => `../storybook/src/stories/super-ai/${pascal(n)}.stories.tsx`;

// Lib items (registry:lib contracts, e.g. cost.tsx) live in the same directory
// and are installable the same way, so they count for orphan detection and are
// legal `consumes` targets — but they have no demo, docs page, story or family,
// so none of the surface or count assertions below apply to them.
const names = new Set([...manifest.map((i) => i.name), ...LIB_MANIFEST.map((i) => i.name)]);
const libByName = new Map(LIB_MANIFEST.map((i) => [i.name, i]));
const byName = new Map(manifest.map((i) => [i.name, i]));

for (const item of LIB_MANIFEST) {
  if (item.status !== "shipped") continue;
  for (const path of [`registry/super-ai/${item.name}.tsx`, `registry/super-ai/${item.name}.test.tsx`]) {
    if (!existsSync(path)) errors.push(`${item.name} (lib): missing ${path}`);
  }
}

// Same self() shape gen-registry.mts builds — the actual URL value is
// irrelevant here, only that deriveExtras resolves one entry per consumed
// dependency.
const REGISTRY_URL = "https://super-ai-components.vercel.app";
const self = (name: string) => `${REGISTRY_URL}/r/${name}.json`;
const extras = deriveExtras(manifest, self);

for (const item of manifest) {
  if (item.status === "building") {
    // Only orphan detection applies to work in progress.
    continue;
  }
  if (item.status !== "shipped") continue;

  // consumes must resolve to real, shipped manifest entries — this is what
  // makes `npx shadcn add <item>` safe: every registryDependency it pulls in
  // is itself installable.
  for (const dep of item.consumes) {
    const depItem = byName.get(dep) ?? libByName.get(dep);
    if (!depItem) errors.push(`${item.name}: consumes "${dep}", which is not in the manifest`);
    else if (depItem.status !== "shipped")
      errors.push(`${item.name}: consumes "${dep}", which is not shipped`);
  }

  // gen-registry.mts builds registryDependencies/dependencies by spreading
  // deriveExtras(MANIFEST, self)[item.name] straight into the registry item —
  // so that call *is* "what gen-registry emits". Checking it here, through
  // the same shared function, means the two can never mechanically drift:
  // any change to how consumes/npm get derived shows up in both places at
  // once instead of only in registry.json at build time.
  const entry = extras[item.name];
  const expectedDeps = item.shadcn.length + (item.external?.length ?? 0) + item.consumes.length;
  const actualDeps = entry?.registryDependencies?.length ?? 0;
  if (actualDeps !== expectedDeps) {
    errors.push(
      `${item.name}: gen-registry would emit ${actualDeps} registryDependencies, expected ${expectedDeps} (shadcn: ${item.shadcn.length}, external: ${item.external?.length ?? 0}, consumes: ${item.consumes.length})`,
    );
  }
  const actualNpm = entry?.dependencies ?? [];
  if (JSON.stringify(actualNpm) !== JSON.stringify(item.npm)) {
    errors.push(
      `${item.name}: gen-registry would emit dependencies ${JSON.stringify(actualNpm)}, manifest npm is ${JSON.stringify(item.npm)}`,
    );
  }

  for (const [kind, path] of Object.entries(fileFor)) {
    if (kind === "docs" && item.contractExempt) continue;
    if (!existsSync(path(item.name))) errors.push(`${item.name}: missing ${kind} file ${path(item.name)}`);
  }

  // G4 — a state whose Pascal form collides with the story file's own imports.
  errors.push(...findReservedStateNames(item.name, item.states));

  if (item.contractExempt) {
    exempt++;
    continue;
  }

  if (item.layer === "block") {
    checked++;

    // A block that composes nothing is a block that reimplemented its parts.
    // This is the assertion that catches a shell agent writing its own
    // inspector markup instead of composing property-inspector.
    if (item.consumes.length === 0) {
      errors.push(`${item.name}: blocks must declare a non-empty consumes list`);
    }

    const blockPath = fileFor.component(item.name);
    const source = existsSync(blockPath) ? readFileSync(blockPath, "utf8") : "";
    for (const region of item.regions ?? []) {
      if (!source.includes(`data-region="${region}"`)) {
        errors.push(
          `${item.name}: block does not render declared region "${region}" (expected data-region="${region}")`,
        );
      }
    }
    if (!(item.regions ?? []).length) {
      errors.push(`${item.name}: blocks must declare a non-empty regions list`);
    }

    const blockStoryPath = storyFor(item.name);
    if (!existsSync(blockStoryPath)) {
      errors.push(`${item.name}: missing story file ${blockStoryPath}`);
    } else {
      const blockStory = readFileSync(blockStoryPath, "utf8");
      // Empty is mandatory because F4, O1 and O3 all independently say the
      // empty state is the view most users actually see. Responsive is
      // mandatory because a shell is a layout and layout is what breaks.
      for (const required of ["Empty", "Responsive"]) {
        if (!new RegExp(`export const ${required}\\s*[:=]`).test(blockStory)) {
          errors.push(`${item.name}: block story is missing the mandatory "${required}" export`);
        }
      }
    }

    continue; // blocks have no `states`; per-state coverage does not apply
  }

  checked++;

  const storyPath = storyFor(item.name);
  if (!existsSync(storyPath)) {
    errors.push(`${item.name}: missing story file ${storyPath}`);
  } else {
    const story = readFileSync(storyPath, "utf8");
    for (const state of item.states) {
      const exportName = statePascal(state);
      // Match the identifier exactly, not as a prefix — `story.includes("export
      // const CountBadge")` would false-positive on a renamed
      // "CountBadgeRenamed" export, silently passing the exact drift this
      // assertion exists to catch. Require the name be followed by whitespace
      // then `:` or `=`, which is what every generated/hand-written story
      // export looks like (`export const Foo: Story = {`).
      const exportRe = new RegExp(`export const ${exportName}\\s*[:=]`);
      if (!exportRe.test(story))
        errors.push(`${item.name}: story file has no export for state "${state}" (expected "${exportName}")`);
    }
  }

  const docsPath = fileFor.docs(item.name);
  if (existsSync(docsPath)) {
    const docs = readFileSync(docsPath, "utf8");
    // `(?:[^"\\]|\\.)` rather than `[^"]` so an escaped quote inside the prose
    // doesn't terminate the match early. Guidance is prose and routinely
    // quotes things; the naive form rejected a fully-written whatItIs whose
    // only sin was containing \"Recommended for you\".
    //
    // Both quote styles are accepted for the same reason, one level up:
    // Prettier picks whichever delimiter needs fewer escapes, so a guidance
    // string that itself contains a straight double quote comes out
    // single-quoted. Matching only `"…"` failed N5 run-inspector's whatItIs —
    // fully written, correctly formatted, and rejected purely for quoting
    // `"the run failed"` inside itself.
    const quoted = (field: string) =>
      new RegExp(`${field}:\\s*(?:"(?:[^"\\\\]|\\\\.){10,}"|'(?:[^'\\\\]|\\\\.){10,}')`);
    const required: [RegExp, string][] = [
      [quoted("whatItIs"), "whatItIs"],
      [quoted("whyItMatters"), "whyItMatters"],
      [/dos:\s*\[\s*\{/, "at least one do"],
      [/donts:\s*\[\s*\{/, "at least one don't"],
      [/pitfalls:\s*\[\s*["']/, "at least one pitfall"],
    ];
    for (const [re, label] of required)
      if (!re.test(docs)) errors.push(`${item.name}: docs module is missing ${label}`);
  }
}

// Orphan detection across every registry component file — catches a stray
// file (or a "building" item's file scaffolded under the wrong name) that
// has no corresponding manifest entry at all, of any status.
for (const file of readdirSync("registry/super-ai").filter((f) => f.endsWith(".tsx"))) {
  const name = file
    .split("/")
    .pop()!
    .replace(/\.test\.tsx$|\.tsx$/, "");
  if (!names.has(name)) errors.push(`orphan: ${file} has no manifest entry`);
}

// G2 — a data-slot passed to a registry component erases that component's own.
const registryComponents = new Set(manifest.map((i) => pascal(i.name)));
for (const item of manifest) {
  if (item.status !== "shipped") continue;
  const path = fileFor.component(item.name);
  if (!existsSync(path)) continue;
  errors.push(...findSlotErasures(path, readFileSync(path, "utf8"), registryComponents));
}

// G3 — the contrast exemption list and the a11y exclusion list must agree.
const storybookConfig = readFileSync("../storybook/vitest.config.ts", "utf8");
errors.push(
  ...compareExemptionLists(CONTRAST_EXEMPT_FILES, parseStorybookExclusions(storybookConfig)),
);

// Per-family manifest counts must match catalog.md's Totals table — this is
// the one hand-maintained summary in the whole pipeline that nothing
// regenerates, so it's the one most likely to silently drift.
{
  const catalogPath = "../../docs/design-system/catalog.md";
  const catalogSource = readFileSync(catalogPath, "utf8");
  const totalsSection = catalogSource.split(/^## Totals$/m)[1];
  if (!totalsSection) {
    errors.push(`${catalogPath}: no "## Totals" section found`);
  } else {
    const rows = totalsSection
      .split("\n")
      .filter((l) => l.trim().startsWith("|"))
      .map((l) =>
        l
          .split("|")
          .map((c) => c.trim())
          .filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === "")),
      )
      .filter((cells) => cells.length >= 2 && !/^-+$/.test(cells[0]) && cells[0] !== "Family");

    // Strip strikethrough (historical values kept as record) and bold markers,
    // then take the first integer that remains as the current count.
    const firstInt = (cell: string): number | null => {
      const stripped = cell.replace(/~~[^~]*~~/g, "").replace(/\*\*/g, "");
      const m = stripped.match(/\d+/);
      return m ? Number(m[0]) : null;
    };

    const familyCounts = new Map<string, number>();
    for (const i of manifest) {
      if (i.status === "cut") continue;
      familyCounts.set(i.family, (familyCounts.get(i.family) ?? 0) + 1);
    }

    let tableSubtotal: number | null = null;
    let tableTotal: number | null = null;
    const tableFamilies = new Set<string>();

    for (const [label, valueCell] of rows) {
      const familyMatch = label.match(/^([A-Z])\s*(?:—|–|-)/);
      if (familyMatch) {
        const family = familyMatch[1];
        tableFamilies.add(family);
        const tableCount = firstInt(valueCell);
        const manifestCount = familyCounts.get(family) ?? 0;
        if (tableCount === null) {
          errors.push(`${catalogPath}: could not parse count for family ${family} row ("${valueCell}")`);
        } else if (tableCount !== manifestCount) {
          errors.push(
            `${catalogPath}: family ${family} totals table says ${tableCount}, manifest (non-cut) has ${manifestCount}`,
          );
        }
        continue;
      }
      if (label.toLowerCase().includes("subtotal")) tableSubtotal = firstInt(valueCell);
      else if (label.toLowerCase().includes("total registry items")) tableTotal = firstInt(valueCell);
    }

    for (const family of familyCounts.keys()) {
      if (!tableFamilies.has(family)) {
        errors.push(`${catalogPath}: family ${family} has manifest items but no row in the totals table`);
      }
    }

    const bToN = [...familyCounts.entries()]
      .filter(([f]) => f >= "B" && f <= "N")
      .reduce((sum, [, c]) => sum + c, 0);
    const total = [...familyCounts.values()].reduce((sum, c) => sum + c, 0);

    if (tableSubtotal === null) errors.push(`${catalogPath}: could not parse the B–N subtotal row`);
    else if (tableSubtotal !== bToN)
      errors.push(`${catalogPath}: B–N subtotal says ${tableSubtotal}, manifest (non-cut) has ${bToN}`);

    if (tableTotal === null) errors.push(`${catalogPath}: could not parse the Total registry items row`);
    else if (tableTotal !== total)
      errors.push(`${catalogPath}: total registry items says ${tableTotal}, manifest (non-cut) has ${total}`);
  }
}

// Generated wiring must be current.
try {
  execFileSync("npx", ["tsx", "scripts/gen-wiring.mts", "--check"], { stdio: "inherit" });
} catch {
  errors.push("generated wiring is stale — run pnpm gen:wiring");
}

if (errors.length) {
  for (const e of errors) console.error(`check:contract — ${e}`);
  console.error(`\ncheck:contract — ${errors.length} violation(s).`);
  process.exit(1);
}
console.log(`check:contract — ${checked} item(s) checked, ${exempt} legacy item(s) exempt.`);
