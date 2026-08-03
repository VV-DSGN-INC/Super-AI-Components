# Wave 1.5 — the component pipeline — Design Specification

**Date:** 2026-08-03
**Status:** Proposed — awaiting approval
**Wave:** 1.5 (between the primitive layer and Wave 2's B + C components)
**Covers:** the manifest, the scaffold, the Storybook contract, the contract gate, the fan-out and
review model, the roadmap surface, and a three-component pilot

---

## 1. Problem

Fourteen of the catalog's 107 items are built. The remaining 93 are specified — `component-specs.md`
carries per-item requirements for all of families A–N — but the _production_ of a component is
hand-wired across six files and two apps, and three separate audits (D11, D13, and the A6 finding
inside D13) have now shown that hand-maintained cross-references in this repo drift silently.

The evidence is unambiguous. D13 audited four primitive fan-out rows and found **three of four
wrong**, in three distinct ways: wrong membership, a cut family still listed, and one row missing
entirely. The same audit found A6 `field-row` had shipped in Wave 0 without the reset slot its own
spec required. None of these were caught by review. All of them were caught by someone sitting down
and checking one table against another by hand.

Wave 1 built four primitives sequentially, and each task in its plan carried an explicit _"sync the
Storybook copy"_ step. That discipline has held so far — all 14 components are currently byte-identical
between `apps/docs/registry/super-ai/` and `apps/storybook/src/components/super-ai/`. It will not
hold for 93 more.

**This wave builds the machinery that makes the remaining 93 producible, and proves it on three of
them.** It is deliberately sequenced before Wave 2 rather than inside it: the cost of the machinery
is fixed, and it is paid back across ten waves.

## 2. Goals and non-goals

**Goals**

1. One machine-readable source of truth for the catalog, from which the site, the build and the
   gates all derive.
2. A scaffold that emits every wired file for a new component, so producing one is a design problem
   rather than a plumbing problem.
3. Storybook that earns its keep — per-state stories, controls, a11y — without doubling authoring cost.
4. A mechanical gate that fails CI on the omission class D13 documented.
5. A public roadmap surface, so 14-of-107 reads as progress rather than absence.
6. Three real components produced through the whole loop.

**Non-goals**

- The API-level design for the other ten B and C items. Wave 2 gets its own brainstorm and spec.
- Retrofitting the existing 14 components to the new story contract. It is a follow-on task; the
  a11y addon will surface findings and they must not block the pipeline landing.
- Re-sampling families J, K and N (D12's open work).
- Reviving family G. D9 stands.

## 3. The manifest

`apps/docs/lib/catalog.manifest.ts` — one entry per catalog item, all 107.

```ts
export type ManifestItem = {
  id: string; // "B2" — the join key to catalog.md and component-specs.md
  name: string; // "workspace-switcher" — the registry name
  title: string; // "Workspace Switcher"
  description: string;
  family: FamilyId; // "A" through "O"; "G" retained as a cut record
  layer: "primitive" | "component" | "block";
  status: "planned" | "building" | "shipped" | "cut";
  wave: number;
  base: string[]; // shadcn bases, from catalog.md ("dropdown-menu", "avatar")
  states: string[]; // the states the story file must export
  consumes: string[]; // registry dependencies this item declares
  npm?: string[]; // npm dependencies
  specAnchor: string; // "component-specs.md#b2-workspace-switcher"
};
```

### 3.1 What derives from it

| Consumer                 | Derivation                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `lib/catalog.ts`         | `CATALOG_ITEMS = MANIFEST.filter(i => i.status === "shipped")`                          |
| `gen-registry.mts`       | the `extras` record — `dependencies` from `npm`, `registryDependencies` from `consumes` |
| `lib/demos.generated.ts` | the demo import barrel and `Record<CatalogName, ComponentType>` map                     |
| `/roadmap`               | every item, grouped by family, with computed progress                                   |
| `check:contract`         | the assertions in §6                                                                    |

Three hand-maintained structures disappear into it: the `extras` record in `gen-registry.mts`, the
demo import barrel in `app/components/[name]/page.tsx`, and the shipped-item list in `catalog.ts`.

### 3.2 What it deliberately does not store

**No reverse fan-out table.** D13's conclusion was that the fan-out table in `concept-model.md` is a
derived summary and not a source of truth, and that the per-component entries are authoritative.
The manifest follows that direction: `consumes` is declared by the item that owns the dependency.
The reverse view — "who uses `entity-row`?" — is computed on demand and never stored.

### 3.3 Bootstrapping

The first draft of all 107 entries is **generated** by parsing the family tables in `catalog.md`,
not transcribed by hand. Hand-transcription of 107 rows is the same error class this wave exists to
eliminate. The generator is a one-shot script; its output is committed and thereafter hand-edited.
`check:contract` then asserts that the manifest's per-family counts match `catalog.md`'s totals
table, so the two cannot silently diverge afterwards.

The marketing tier (15 items) stays in `marketing-catalog.ts` and is out of scope for the manifest —
it is a separate registry tier with its own CSS-slicing pipeline, and it has no design-system
catalog IDs.

### 3.4 The status lifecycle

`planned → building → shipped`, plus `cut` as a terminal record (family G, O5).

`CATALOG_ITEMS` derives from `shipped` alone. A component under construction therefore never appears
on the site, never enters the registry build, and never reaches the smoke tests — which means a
half-built component can sit on a branch with green CI. Without `building`, the gate would have to
be skippable, and a skippable gate is not a gate.

The flip to `shipped` is the last step of a component task and is performed by the integrating
session, never by a fan-out agent (§7).

## 4. The scaffold

`pnpm new:component <name>` — a `tsx` script at `apps/docs/scripts/new-component.mts`. It reads the
manifest entry by name and refuses to run if the name is absent, `cut`, or already `shipped`.

### 4.1 Emitted files

| File                                                     | Contents                                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `registry/super-ai/<name>.tsx`                           | Stub in the `preview-tile` conventions: `data-slot` attributes, `cn()` from `@/lib/utils`, semantic shadcn variables only, named export, props derived from `states`, JSDoc linking `specAnchor` |
| `registry/super-ai/<name>.test.tsx`                      | One **failing** test per declared state, plus the convention assertions: `className` passthrough, prop passthrough, and button-semantics-only-when-interactive                                   |
| `components/demos/<name>-demo.tsx`                       | Demo exercising every declared state                                                                                                                                                             |
| `apps/storybook/src/stories/super-ai/<Name>.stories.tsx` | `meta`, `argTypes`, one export per declared state                                                                                                                                                |

### 4.2 Regenerated files

| File                     | Note                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| `lib/demos.generated.ts` | Replaces the hand-maintained import barrel; `page.tsx` imports the map from here |
| —                        | `gen-registry.mts` reads the manifest directly, so nothing is written for it     |

### 4.3 Why the tests start red

The house process is TDD. A scaffold that emitted passing stubs would quietly invert it, because a
fan-out agent handed a green suite has no forcing function to write the assertions first. Emitting
the suite red makes "turn your own suite green" the agent's literal brief, and makes a skipped test
visible as a failure rather than as an absence.

The generated tests assert _states declared in the manifest_, which are transcribed from
`component-specs.md`. They are a floor, not a ceiling; agents add the behavioural assertions their
spec section implies.

## 5. Storybook

### 5.1 What it is today

119 stories: 60 `ui`, 30 `ai-elements`, 15 marketing, 14 super-ai. The app is not a duplicate of the
docs site — but the 14 super-ai stories are. Each is a bare `export const Default: Story = {}`
rendering the same demo component the docs preview already renders, with no `argTypes`, no per-state
stories, and no interaction tests. Each costs three copied files.

### 5.2 De-duplication

The copies exist for a module-resolution reason, not a design one: Storybook's Vite and tsconfig map
`@/*` to `./src/*`, so a registry component's `@/lib/utils` import only resolves if the file
physically lives under `apps/storybook/src`.

Order-sensitive regex aliases dissolve that, most specific first:

```ts
resolve: {
  alias: [
    { find: /^@\/registry\/(.*)/, replacement: resolve(__dirname, "../docs/registry/$1") },
    { find: /^@\/components\/demos\/(.*)/, replacement: resolve(__dirname, "../docs/components/demos/$1") },
    { find: /^@\//, replacement: resolve(__dirname, "./src/") },
  ];
}
```

with mirrored `paths` in `apps/storybook/tsconfig.json`. Vite resolves aliases from the _importing_
config, so a registry file compiled inside Storybook keeps resolving `@/lib/utils` and
`@/components/ui/*` against Storybook's own 60-component `ui` set. `gen-registry.mts` is untouched,
so install targets do not move.

**Deleted:** the 14 component copies under `apps/storybook/src/components/super-ai/` and the 14 demo
copies under `apps/storybook/src/components/super-ai/demos/`. Stories import through the aliases
instead.

### 5.3 The story contract

Every `shipped` super-ai component must have a story file exporting:

- one story per state declared in the manifest — not a single `Default`
- `argTypes` covering the component's real props
- a `play` function for any component with interactive behaviour
- a clean `@storybook/addon-a11y` pass

`@storybook/addon-a11y` and `@storybook/addon-vitest` are added to `apps/storybook`. Storybook 9's
test addon runs through a Playwright browser provider; CI already installs Chromium for the docs e2e
suite, so the dependency exists. It runs as its **own CI step**, not folded into `pnpm test`, so a
flaky browser setup cannot block component work.

## 6. The contract gate

`apps/docs/scripts/check-contract.mjs`, wired as `pnpm check:contract` in the same style as the
existing `check:tokens`, and added to `ci.yml` after `check:tokens`.

For every item with `status: "shipped"`:

| Assertion                                                             | Failure it catches                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| component, test, demo and story files all exist                       | a component wired into the catalog with a missing surface                             |
| the story file exports one entry per declared `state`                 | the bare-`Default` story the contract exists to eliminate                             |
| every `consumes` entry exists in the manifest and is itself `shipped` | a registry item whose `npx shadcn add` resolves a dependency that was never published |
| `consumes`/`npm` match what `gen-registry` emits                      | the D13 drift class, mechanically                                                     |
| regenerating `demos.generated.ts` produces no diff (`--check`)        | stale generated wiring committed by hand                                              |
| per-family manifest counts match `catalog.md`'s totals table          | the catalog and the manifest disagreeing about what exists                            |

For every item with `status: "building"`, one assertion only: no file may exist under a name absent
from the manifest. That catches a typo'd component name before it becomes a phantom.

The gate checks that files and states **exist**. It never checks what shape a component takes.

## 7. Fan-out and review

Per component:

1. **Scaffold** — four files emitted, suite red, status `building`.
2. **Build agent** — receives the manifest entry, its `component-specs.md` section, its own failing
   suite, and the house conventions as they already exist in writing: §3 of
   [`2026-08-02-wave-1-primitives-design.md`](2026-08-02-wave-1-primitives-design.md) and
   [`2026-08-02-preview-tile-design.md`](2026-08-02-preview-tile-design.md), which the scaffold's
   stubs also encode. Brief: turn the suite green and satisfy the spec.
3. **Review agent** — verifies the result against the spec section, a11y, and the tests, and reports
   findings. Adversarial: its job is to find what is missing, not to confirm the work.
4. **Integration** — the main session reads the diff, runs `check:contract`, flips status to
   `shipped`, commits.
5. **Human review** — Nick reviews the batch on a deployed preview once the first version is up.

### 7.1 The no-shared-writes rule

**Fan-out agents write only their own four files.** Not the manifest, not `catalog.md`, not generated
wiring, not `gen-registry.mts`.

This is what makes concurrency safe without git worktrees: with no shared-file writes there is
nothing to conflict on, so N agents can run against one working tree. It is also why the status flip
belongs to the integrating session — it is a write to the manifest, and it is the one action that
must happen _after_ review rather than during construction.

Pilot concurrency is 3, which is also the number of independent components in the pilot.

## 8. The roadmap surface

`/roadmap`, rendered from the manifest:

- per-family progress (shipped / total)
- the wave table from `decisions.md` §5, with each wave's items and their statuses
- every item as a row: id, name, description, base, states, status

Shipped items link to their component page. Planned items do not link anywhere — no dead entries,
no fake pages. The homepage gains a single line — **"N of 107 shipped →"** — with N computed from
the manifest, never typed.

The sidebar continues to list only installable components. Everything the sidebar shows must be
something `npx shadcn add` can actually install.

## 9. The pilot

Three family-B components, each stressing a different part of the contract:

| Item                    | Why this one                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| B2 `workspace-switcher` | A confirmed `entity-row` consumer (D13's corrected fan-out). Exercises the `consumes` gate: omitting the declaration must fail CI. |
| B5 `promo-card`         | Four flavours, dismissible with persisted dismissal. Exercises `play` functions, a real state matrix, and a11y.                    |
| B3 `sidebar-nav`        | Five trailing-slot variants and a `section-header` dependency. Exercises state breadth and a second `consumes` edge.               |

They are mutually independent — none consumes another — which is the property that makes them a
valid concurrency test as well as a valid contract test.

B1 `app-sidebar` is deliberately excluded: it _arranges_ B2, B3 and B5, so building it first would
couple the pilot components to each other and destroy the independence the pilot is meant to prove.

## 10. Testing

Unchanged where it already works:

- **vitest**, co-located, red-first — now scaffolded rather than hand-started
- **Playwright smoke** — `e2e/smoke.spec.ts` iterates `CATALOG_ITEMS`, so every newly-shipped
  component automatically gets a renders-without-console-errors test
- **`check:tokens`** — globs the registry directory, so new files are covered without registration
- **consumer install test** — `scripts/consumer-test.sh` runs a real `shadcn add` in CI

Added:

- **Storybook interaction tests** (`play`) and **a11y**, as their own CI step
- **`check:contract`**, after `check:tokens`

## 11. Risks

| Risk                                                                           | Mitigation                                                                                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Storybook a11y/vitest wiring consumes disproportionate time                    | Isolated CI step; if it proves unstable it can be marked non-blocking without touching the rest of the wave                               |
| Manifest bootstrapping introduces transcription errors across 107 rows         | Generated from `catalog.md` by script, then CI-checked against the totals table — reproducible mistakes beat hand-made ones               |
| Fan-out agents produce plausible components that miss spec nuance              | Red tests as a floor, adversarial review agent, mechanical gate, and a human pass on the preview                                          |
| The scaffold's stub fights components that don't fit its shape                 | The gate asserts existence, never shape. A stub that fights a spec is a scaffold bug, and the scaffold is expected to evolve across waves |
| Deleting the Storybook copies breaks the deployed `super-ai-storybook` project | The alias is verified by a local `storybook build` before the copies are deleted                                                          |

## 12. Done

- `pnpm lint`, `typecheck`, `check:tokens`, `check:contract`, `test`, `build:registry`, `build`,
  Playwright smoke, Storybook a11y/interaction, and the consumer install test all green in CI
- `workspace-switcher`, `promo-card` and `sidebar-nav` installable from the registry
- `/roadmap` live, homepage showing 17 of 107
- Storybook building from aliased sources with zero copied component files
- A deployed preview link for human review

---

## References

- [`docs/design-system/catalog.md`](../../design-system/catalog.md) — the 107 items
- [`docs/design-system/component-specs.md`](../../design-system/component-specs.md) — per-item requirements; authoritative per D13
- [`docs/design-system/decisions.md`](../../design-system/decisions.md) — D9 (family G cut), D11, D12 (scope), D13 (derived tables drift), §5 (wave sequencing)
- [`2026-08-02-wave-1-primitives-design.md`](2026-08-02-wave-1-primitives-design.md) — the conventions this scaffold encodes
