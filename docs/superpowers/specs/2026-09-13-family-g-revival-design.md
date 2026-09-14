# Super AI Components: family G revival design

Date: 13 September 2026. Status: **proposed, awaiting review; no code written**.

Baseline: `main` at `f6c0955d2fd15ac1e4ff8657c5b2ea2e70571b4f` (PR #54, 2026-09-13).
Reference implementations: `origin/wave-2-flow-foundation` at
`b414ac9f3a7f037f2dc68ca1b6253af8598332c8` (2026-06-11, 36 ahead of `main`, 482
behind) and `weeeha/FilmMaker` PR #6 "AI New" at `72c817e` (2026-09-13,
branch `design-system`). Neither is merged or copied; both are read.

Governing documents, in order: [`component-build-brief.md`](../../design-system/component-build-brief.md),
[`block-build-brief.md`](../../design-system/block-build-brief.md),
[`story-conventions.md`](../../design-system/story-conventions.md),
[`decisions.md`](../../design-system/decisions.md) D9 and D22,
[`catalog.md`](../../design-system/catalog.md) family G and O5 tables,
[`component-specs.md`](../../design-system/component-specs.md) G1 to G9.

## TL;DR

- D9 is reversed. Family G ships. A new record, **D23**, says so and says why.
- The registry grew from 99 to 116 items while G was cut and **absorbed six of
  G's items** along the way. Those six do not come back; they dissolve into the
  shipped components that now own their ground. A literal reversal would ship
  duplicates, which the block brief forbids.
- **23 new registry items plus two `registry:lib` contracts**, catalog **116 → 139**: a 6-item spine ported from
  the parked branch, a 5-item canvas surface built new, and 13 modality presets
  that are data records over one `modality-node` implementation.
- Three tiers with one dependency boundary: `@xyflow/react` lives only in
  `typed-handle`, `typed-edge` and `flow-canvas`. Everything else installs with
  no new dependency.
- Phase 1 (spine) lands first and proves the retrofit. Phases 2 (canvas) and 3
  (presets) depend only on phase 1 and run in parallel.
- Helen's FilmMaker work supplies the surface vocabulary: ten typed ports, the
  settings pill, the run-button width rule, the cost wording rule. The parked
  branch supplies the engine: the handle-id codec, `useFlowRunner`, the tests.

## Intended outcome

A consumer can `npx shadcn add` a typed node canvas, drop in any of thirteen
modality nodes, wire them by typed ports that refuse invalid connections, and
run the graph through a headless, executor-swappable runner. Every item passes
the twelve CI gates and the consumer install test. Nothing in the registry is
implemented twice.

## What this does not do

- It does not touch `weeeha/FilmMaker`. The playground-duplication finding in
  PR #6 is a separate task in that repo.
- It does not rebase `wave-2-flow-foundation`. The branch stays on the remote
  as a record; its files are ported one at a time into fresh scaffolds.
- It does not add a persistence layer, a backend executor, or model inference.
  `useFlowRunner` takes an executor; the registry ships none.
- It does not add a labels prop or any i18n surface (D22). Modality labels are
  English at the call site.
- It does not reopen the `@weeeha/ui` ownership question. Family G has no
  counterpart there.

## Context

### What D9 instructed

D9 (2026-07-31) cut G1 to G9, `useFlowRunner` and O5 `flow-shell`, taking the
catalog from 110 to 99. It kept the door open in one sentence:

> The unmerged `wave-2-flow-foundation` branch (10 flow components + the hook,
> ~4k lines with tests, built against the approved spec) stays parked, not
> merged. It remains on the remote as the reference implementation; reversing
> this decision starts there.

It also recorded (2026-08-14) that some G designs are Helene's and that their
existence "is not grounds to revive the family". This revival is triggered by a
product decision, on 2026-09-13, to ship the node builder. The provenance note
carries into D23 unchanged.

### What shipped in the meantime

D12 restored eight components from the gaps analysis and D16 added more. Six
of them occupy ground the G specs described:

| G item                                 | shipped since D9                           | evidence                                                                                             |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `run-button` (parked, and Helen's)     | **E5 `run-button`**                        | states `idle · estimating · running · done · failed · insufficient-credits · locked`; cost via A2    |
| G4 `node-prompt`                       | **D1 `media-prompt-bar`**                  | presentation `node-embedded` in code (drops the negative prompt, takes A7 as a slot)                 |
| G6 `model-bar`                         | **A7 `gen-settings-bar`** + `model-picker` | A7 is `role="toolbar"` with items; `model-picker` has icon, description, `expanded-cards`            |
| G5 `node-result` / parked `media-slot` | **F1 `result-card`**                       | `image/video/audio/text/3D · idle · streaming · done · failed · locked`; the G5 spec said "wraps F1" |
| G9 `node-inspector`                    | **I2 `property-inspector`**                | grouped sections, per-element-type, reset, empty                                                     |
| Helen's `CostTooltip`                  | **A2 `cost-chip`**                         | same number, same source-of-truth rule                                                               |

The parked branch was built before all six existed. Its `run-button`,
`model-bar`, `node-prompt` and `media-slot` are therefore superseded, and its
`ai-node` must compose D1, A7, E5 and F1 instead of carrying its own versions.

### The two reference implementations

**Parked branch** (`b414ac9`): `ai-node`, `connection-hint`, `media-slot`,
`model-bar`, `node-prompt`, `node-status`, `port-chip`, `run-button`,
`typed-edge`, `typed-handle`, `use-flow-runner`, plus `flow-types.ts` and
`flow-tokens.css`. Twelve of the fifteen files have tests. Only `typed-edge`
and `typed-handle` import `@xyflow/react`; `useFlowRunner` does not. It
predates the ds-rules token gate, the case-story convention, the
story-coverage baseline, the a11y gate, the format gate, D20 and the RTL
sweep, so nothing in it passes today's CI as written.

**FilmMaker PR #6** (`72c817e`): `ai-node`, `node-menu`, `node-port`,
`run-button`, `run-menu`, `cost-tooltip`, thirteen per-modality node stories,
thirteen `*-node-spec.mdx` files, a `node-port-spec.mdx`. Reviewed on
2026-09-13: lint and build clean, every icon-only control named, the run
button holds 78×32 across all six states. Its port colours are Tailwind
palette classes (`bg-purple-100`), which the token gate bans here, and its
settings pill has no counterpart in A7. Both are absorbed as described below.

## Decision D23 (text for `decisions.md`)

> ### D23 · Family G revived, six items dissolved · 2026-09-13
>
> Reverses D9. The node builder ships. Starting point, as D9 instructed:
> `wave-2-flow-foundation` at `b414ac9`, ported file by file into fresh
> scaffolds, never rebased.
>
> Six G items do not return because shipped components now own their ground:
> `run-button` → E5, G4 `node-prompt` → D1 (`node-embedded`), G6 `model-bar` →
> A7 + `model-picker`, G5 `node-result` → F1, G9 `node-inspector` → I2, and the
> FilmMaker `CostTooltip` → A2. F3 (model-bar vs gen-settings-bar drift) is
> retired for good.
>
> The catalog's family G consolidation ("the spec's 10 modality node presets
> become demo recipes on G2, not registry items") is reversed. Thirteen
> modality presets ship as registry items, each a `ModalityDef` record over
> one `modality-node` implementation.
>
> `@xyflow/react` is confined to `typed-handle`, `typed-edge` and
> `flow-canvas`. No other registry item may import it.
>
> Catalog: 116 → 139 (12 primitives · 111 components · 14 blocks · 2 records), plus two lib contracts.
> The D9 tables are unmarked. Provenance from D9 stands: some G designs are
> Helene's; the FilmMaker PR #6 surface work is Helen's; the parked engine is
> this repo's own.

## Architecture

### Three tiers, one boundary

```
tier 3   flow-canvas · flow-shell (O5)                    @xyflow/react
tier 2   typed-handle · typed-edge                        @xyflow/react
tier 1   ai-node · node-status · connection-hint ·        no new dependency
         node-palette · canvas-toolbar · modality-node ·
         13 modality presets · useFlowRunner ·
         flow-types.ts · flow-tokens.css
```

Tier 1 is plain React. A consumer who installs a modality node without a
canvas pulls no react-flow. `useFlowRunner` staying in tier 1 is what keeps the
engine testable without a renderer, and it is already true of the parked code.

`flow-types` and `use-flow-runner` ship as `registry:lib` contracts
(`lib/lib.manifest.ts`, the mechanism `cost` uses); every flow component
declares `consumes: ["flow-types"]`. The token scale ships as manifest
`cssVars`, and the one keyframe as a manifest `css` block (`lib/flow-tokens.ts`).

### Contracts

**Statuses.** `FLOW_STATUSES = ["idle","queued","streaming","done","failed","locked"]`
from the parked `flow-types.ts`, unchanged. This is the master state
vocabulary for every node component; no item adds a status. F1
`result-card`'s states map onto it directly (`queued` renders as F1 `idle`
with a pending affordance).

**Handle types.** Ten, registered at module scope through the parked
`registerHandleType`:

| key           | colour token                | from      |
| ------------- | --------------------------- | --------- |
| `text`        | `--flow-text` (neutral)     | both      |
| `image`       | `--flow-image` (blue)       | both      |
| `video`       | `--flow-video` (blue)       | both      |
| `audio`       | `--flow-audio` (purple)     | both      |
| `speech`      | `--flow-speech` (purple)    | FilmMaker |
| `sound`       | `--flow-sound` (purple)     | FilmMaker |
| `3d`          | `--flow-3d` (tan)           | FilmMaker |
| `avatar`      | `--flow-avatar` (tan)       | FilmMaker |
| `start-frame` | `--flow-start-frame` (blue) | FilmMaker |
| `end-frame`   | `--flow-end-frame` (blue)   | FilmMaker |

Colour tokens are defined in `flow-tokens.css` in oklch against the existing
`--primary` / `--muted` scale and pass `check:tokens`. The FilmMaker palette
classes are not copied; only the grouping is (neutral for text, blue for visual
media, purple for anything audible, tan for identity and geometry).

**Handle id codec.** `{nodeId}:{dataType}:{in|out}`, unchanged.
`isValidFlowConnection` accepts an edge only when source is `out`, target is
`in`, and the two data types are equal. Neither `typed-handle` nor
`typed-edge` reads node state to decide validity.

**Node sizes.** `sm 280 · md 320 · lg 420`, unchanged. Every modality preset
declares one.

**`ModalityDef`.** New, in `modality-node.tsx`:

```ts
interface ModalityDef {
  kind: string; // "video-generation"
  label: string; // "Video Generation"
  icon: React.ComponentType<{ className?: string }>;
  inputs: HandleTypeKey[]; // rendered by typed-handle, side "in"
  outputs: HandleTypeKey[]; // side "out"
  result: "image" | "video" | "audio" | "text" | "3d" | "none"; // F1 kind
  settings: SettingsItem[]; // rendered into A7 gen-settings-bar
  actions: Array<"download" | "duplicate" | "delete" | "more">;
  size: NodeSize;
}

type SettingsItem =
  | { kind: "model"; label: string; models: ModelPickerModel[]; defaultValue: string }
  | { kind: "select"; label: string; options: string[]; defaultValue: string }
  | { kind: "toggle"; label: string; defaultValue: boolean };
```

Three settings kinds are enough for all thirteen FilmMaker menus (`model`,
`select`, `toggle`); nothing else is added until a preset needs it. A modality
registry (`registerModality` / `getModality`) mirrors `registerHandleType`, and
each preset file registers its def at module scope, then exports a thin
component:

```tsx
export const VideoGenerationNode = (props: ModalityNodeProps) => (
  <ModalityNode kind="video-generation" {...props} />
);
```

**Controlled throughout.** Every node component renders the state it is
given. `ai-node` takes `status: FlowStatus` and `selected: boolean`.
`modality-node` takes prompt, settings values, and result as props. `useFlowRunner`
takes the graph, emits per-node status, and owns nothing else. Node data lives
in the consumer's store, or in react-flow's node array when a canvas is used.
This is E5's convention already; writing it down keeps thirteen presets from
each inventing local state.

### Data flow

```
consumer store ──nodes, edges──▶ useFlowRunner ──status per node──▶ ai-node
                                     │                                  │
                              executor(def, inputs)               D1 · A7 · E5 · F1
                                     │
                              content-hash cache · abort · cycle guard
```

`useFlowRunner` orders nodes topologically from the typed edges, runs the
executor per node, caches by content hash so an unchanged upstream does not
re-run, aborts cleanly on cancel, and refuses a cyclic graph before running
anything. All four behaviours have tests in the parked branch that port over.

## Inventory

### Phase 1: spine, 6 items, ported

| item              | catalog | ported from                                 | notes                                                                                                                |
| ----------------- | ------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ai-node`         | G2      | parked `ai-node.tsx`                        | header · body slot · footer; composes D1 (`node-embedded`), A7, E5, F1; declares `menuPlacement: docked \| floating` |
| `typed-handle`    | G3      | parked `typed-handle.tsx` + `port-chip.tsx` | ships alone; `PortChips` lives in `connection-hint` so chips never pull react-flow                                   |
| `typed-edge`      | G3      | parked `typed-edge.tsx`                     | valid · invalid · dangling · selected · animated-while-running · type-coloured                                       |
| `node-status`     | new     | parked `node-status.tsx`                    | renders `FlowStatus`; the only place a status becomes a glyph                                                        |
| `connection-hint` | new     | parked `connection-hint.tsx`                | the hint while a connection is being dragged, plus `PortChips`                                                       |
| `useFlowRunner`   | lib     | parked `use-flow-runner.ts`                 | executor-swappable; no UI                                                                                            |

Not ported: `media-slot`, `model-bar`, `node-prompt`, `run-button` (dissolved,
see D23).

### Phase 2: canvas surface, 5 items, built new

| item             | catalog | base             | notes                                                                                                                                                                                                                                                                                            |
| ---------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modality-node`  | new     | `ai-node`        | the one implementation the thirteen presets render through                                                                                                                                                                                                                                       |
| `flow-canvas`    | G1      | `@xyflow/react`  | a thin adapter: registers our node and edge types, applies flow tokens, no state of its own                                                                                                                                                                                                      |
| `node-palette`   | G7      | Command, Popover | grouped · searchable · popover vs docked rail · drag-to-canvas · insert-on-edge; reads the modality registry. Controlled: emits `onAdd(kind, position?)`; the canvas adapter does the drop. No react-flow import                                                                                 |
| `canvas-toolbar` | G8      | Button-group     | select/pan/comment · add-by-type · zoom · fit · undo/redo. Controlled: zoom, fit and undo are callbacks; no react-flow import. **Composition check first** against shipped `context-toolbar` and `selection-toolbar`; if either covers it, G8 becomes a labelled sibling and the gap is reported |
| `flow-shell`     | O5      | block            | composes `flow-canvas` + `node-palette` + I2 `property-inspector` + `canvas-toolbar`; exports `Empty` and `Responsive`                                                                                                                                                                           |

### Phase 3: modality presets, 13 items, records

Ports are Helen's, from the FilmMaker `*-node-spec.mdx` files. Actions are as
rendered in her `AI New/Node Menu/By Node` stories. Registry names take a
`-node` suffix so `text` and `music` do not collide with anything.

| registry name           | inputs                     | outputs | result | actions                                                 |
| ----------------------- | -------------------------- | ------- | ------ | ------------------------------------------------------- |
| `video-generation-node` | speech, audio, image, text | video   | video  | download · delete · more                                |
| `image-generation-node` | image, text                | image   | image  | download · delete · more                                |
| `llm-node`              | text                       | text    | text   | duplicate · delete · more                               |
| `text-node`             | (none)                     | text    | text   | duplicate · delete · more                               |
| `avatar-node`           | text                       | avatar  | image  | download · delete · more                                |
| `lip-sync-node`         | avatar, audio, text        | video   | video  | download · delete · more                                |
| `text-to-speech-node`   | text                       | audio   | audio  | delete · more (**confirm**: download omitted in source) |
| `music-node`            | audio, text, text          | audio   | audio  | delete · more (**confirm**: download omitted in source) |
| `sound-effects-node`    | text                       | audio   | audio  | download · delete · more                                |
| `voice-changer-node`    | audio                      | audio   | audio  | download · delete · more                                |
| `voice-isolator-node`   | audio                      | audio   | audio  | download · delete · more                                |
| `dubbing-node`          | video                      | video   | video  | download · delete · more                                |
| `composition-node`      | video, audio               | video   | video  | download · delete · more                                |

The two **confirm** rows carry an explicit `download={false}` in the FilmMaker
source. Every other audio-producing node has download. The phase 3 builder
asks before matching either way; the def makes the answer one line.

Settings per preset are transcribed from `menus.tsx` in the FilmMaker branch
during phase 3, into the three `SettingsItem` kinds. Model lists are content,
not contract, and are expected to change.

### Changes to shipped items

Each is a scoped, additive change to an item that already exists; none forks.

- **A7 `gen-settings-bar`** gains `GenSettingsSelect` (a pill with a dropdown,
  Helen's `NodeMenuSelect`) and `GenSettingsSeparator`. A7 keeps
  `role="toolbar"`; the select trigger is a `button` with
  `aria-haspopup="listbox"` inside it. Its existing roving-tabIndex TODO is
  unchanged by this.
- **E5 `run-button`** gains width stability in `running`: the label is
  visually hidden rather than swapped, and the spinner overlays it, so the
  control does not jump when "Run" becomes "Generating…". The separate cancel
  button and the `aria-live` status stay. E5 has no compact size; whether it
  fits a 280px node is **measured in phase 1** and, if it does not, reported
  under `CONTINUE.md` §8 rather than solved by a second run button.
- **A2 `cost-chip`** guidance gains the FilmMaker wording rule: state the
  number, group thousands, singular at one, never replace it with "free" or
  "cheap". A tooltip recipe on A2 covers the hover case.
- **F1 `result-card`** and **D1 `media-prompt-bar`** are used as-is. D1's
  `node-embedded` presentation already takes A7 as a slot, which is how the
  settings bar reaches the node body.

## Tokens

All flow colour lives in `flow-tokens.css` as `--flow-*` custom properties in
oklch. No item may use a palette class, a raw hex, or a raw `oklch()` in a
class string; `check:tokens` enforces it. Where a node paints a surface
(`ai-node` body, `flow-shell` rails), muted text inside it is handled by
rebinding `--muted-foreground` at the surface, per `a11y-baseline.md`, never by
restyling slots. Thirteen presets painting the same surface is exactly the
cross-component contrast shape the token gate cannot see; `pnpm test:stories`
is the gate that catches it.

## Accessibility

- Every icon-only control has an accessible name (FilmMaker had zero unnamed;
  this repo's a11y gate keeps it that way).
- `typed-handle` is a `button` with `aria-label="{Type} {input|output}"`;
  connection validity is announced through `connection-hint`'s `role="status"`.
- `ai-node` is a `group` labelled by its header; `selected` is
  `aria-selected` on the group when inside a canvas.
- E5's `aria-busy` / `aria-live` behaviour is inherited, not reimplemented.
- `flow-canvas` inherits react-flow's keyboard model; the adapter does not
  remove it. `flow-shell`'s `Responsive` story is where the mobile layout is
  proven, not assumed.
- The a11y exclusion list does not grow for any of the 24 items.

## Testing and gates

Per item: the five scaffolded files, co-located vitest, one story per declared
state, no state named `default`, a case story per real situation. Blocks export
`Empty` and `Responsive`.

The gate list, in `ci.yml` order, is the only definition of green:
`install --frozen-lockfile → lint → format:check → typecheck → check:tokens →
check:contract → test → build:registry → build → Playwright smoke → Storybook
a11y + interaction → consumer install test`. The last one is the one that
proves a tier-1 item installs without react-flow.

Phase 1 ports the parked test suites, including the `useFlowRunner` abort
hygiene, content-hash cache, cycle detection and reset cases. `flow-types`'
codec tests port unchanged. New in phase 1: a test that `ai-node` does not
import `@xyflow/react`, and a consumer-install run with only tier-1 items.

Phase 3's shared risk is contrast across thirteen presets; the Storybook a11y
gate runs on every preset story.

## Phasing and execution

```
phase 1  spine (6)            one PR, gates green, D23 lands here
            │
            ├── phase 2  canvas surface (5)    one PR
            └── phase 3  modality presets (13) one PR
```

Phases 2 and 3 depend on phase 1 only. Their manifest edits are append-only
and merge trivially; both PRs base on `main` after phase 1 merges.

Agent policy is unchanged from `CLAUDE.md`: one agent per item, own worktree,
own port, fast-forward the integration branch before reading anything,
never write the manifest. The integrator (the session model) reconciles
`consumes` / `shadcn` / `npm` from real imports. Before any wave launches,
the agent count, tier split and rough cost are stated and confirmed by
number; phase 3 at 13 items is over the ten-agent line and needs an explicit
yes.

Implementation planning is the next document, via the writing-plans skill,
after this spec is approved.

## Risks and open questions

1. **E5 compact fit.** A 280px node with E5 at full width plus a cost chip
   may not fit. Measured in phase 1; if it does not fit, it is a §8 gap on E5,
   and `ai-node` docks E5 in the footer at `md` and above only until it is
   resolved.
2. **`canvas-toolbar` redundancy** against `context-toolbar` and
   `selection-toolbar`. Composition check is the first task of phase 2.
3. **react-flow version.** The parked branch pinned `^12.11.0`. The version is
   re-resolved at phase 1 against what `@xyflow/react` ships on that day; the
   adapter surface (`typed-handle`, `typed-edge`, `flow-canvas`) is small
   enough that a 12.x bump is absorbed there.
4. **Two presets without download.** Flagged in the inventory; a one-line
   answer either way.
5. **Story count.** Thirteen presets × six statuses × selected/unselected is
   156 declared-state stories before case stories. The state matrix is
   generated from `FLOW_STATUSES` in a shared story helper so the count is a
   loop, not 156 hand-written exports; the helper is written in phase 1 for
   `ai-node` and reused.
6. **`speech` versus `audio`.** The FilmMaker specs emit `audio` from
   text-to-speech, voice-changer and voice-isolator, but `video-generation`
   accepts `speech` as a distinct input and `lip-sync` accepts `audio`. Under
   the codec's strict type equality a text-to-speech output would not connect
   to a video-generation speech input. Two resolutions, decided in phase 3
   before any preset def is written: (a) the three voice nodes output `speech`
   and `lip-sync` accepts `speech`, codec stays strict; or (b) the codec gains a
   one-way compatibility map (`speech` connects to `audio`, not the reverse).
   Recommendation: (a). It keeps the codec a pure string compare, which is what
   makes it testable in one file, and it matches what the ten-type vocabulary
   already implies.

## Provenance

- The engine (`flow-types.ts`, `useFlowRunner`, the codec, the tests) is this
  repo's own work from wave 2, June 2026.
- Some family G designs on the Figma boards are Helene's, as D9 spells it
  (2026-08-14).
- The port vocabulary, the settings pill, the per-modality menus, the run-button
  width rule and the cost wording rule are Helen's, from `weeeha/FilmMaker`
  PR #6, September 2026, reviewed and adapted here rather than copied.

## Follow-ups outside this spec

- `weeeha/FilmMaker`: `film-planner/src/app/playground/nodes/page.tsx`
  re-implements the design-system node UI locally and adds a second copy of
  the shadcn primitives. Separate task, separate repo.
- `weeeha/FilmMaker`: the `deploy` workflow fails at `configure-pages` because
  Pages is not enabled and the token cannot create the site. Settings fix.
