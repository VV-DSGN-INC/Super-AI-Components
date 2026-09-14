# Agentic contracts — design

**Written 2026-09-14, at commit `f6c0955`** (the merge of PR #54). Every count
below was measured in a worktree at that commit. Where a count contradicts a
doc, the doc is what is wrong.

**Status: approved in brainstorming, not yet implemented.** Plan:
`docs/superpowers/plans/2026-09-14-agentic-contracts.md`. Implementation is
intended for Opus; the mechanism lands in one plan, the remaining contracts
land in waves (§9).

---

## 1. Why this exists

An agent that installs a component from this registry today gets one `.tsx`
file and nothing that says when to use it, which variant to pick and why, or
what to reach for instead. It infers those judgments from the implementation,
and inference is where a kit gets misused: a chip used as a button, a variant
picked because it looked available rather than because it ranked the state
correctly.

The judgments are already written. Every shipped item has a guidance module
under `apps/docs/content/components/<name>.docs.tsx`, typed as
`ComponentDocs`, gate-required by `check-contract.mts`, and rendered on the
docs site. What it lacks is the machine half: no per-value variant intent, no
redirects, no file an agent can read from the installed tree, no published
corpus, nothing derived from it and nothing that fails when it goes stale.

The sibling `design-system-rebuild` has the machine half and its
`ARCHITECTURE.md` states the rule this design adopts: every surface is either
derived from the source by a script or checked against it by a test. This
design ports that half onto the guidance modules that already exist, rather
than writing a second copy of the prose beside them. `CLAUDE.md` already
forbids the second copy: "a second copy is how instructions drift".

A 2026-09-14 audit of the four sibling projects found this repo has adopted
the rules-as-records half (`packages/ds-rules`, the story-coverage ratchet,
the contract check) and none of the contract half. The Minimal Design System
approved the same port on 2026-09-05 (its PR #60) and has not executed it.
This design is written so that its mechanism can be carried there afterwards,
which is why §4 keeps the field names the rebuild uses where the meaning is
the same.

## 2. What was measured

| fact                                                   | value                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| shipped items in `catalog.manifest.ts`                 | 116                                                                                                    |
| guidance modules under `content/components/*.docs.tsx` | 116, one per shipped item                                                                              |
| fields the docs renderer reads                         | 9: `whatItIs` `whyItMatters` `evidence` `anatomy` `usage` `dos` `donts` `accessibility` `pitfalls`     |
| how `check-contract.mts` verifies a module             | text needles (`contract-rules.ts` lines 275 to 284); it never imports the module                       |
| modules whose prose mentions a variant                 | 34 of 116; none records per-value intent as data                                                       |
| files per registry item                                | 1 `.tsx`, `type: registry:component` or `registry:block`, target `components/super-ai/<name>.tsx`      |
| shadcn version, `registry:file` support                | `^4.11.0`; the schema accepts `registry:file` with a `target`                                          |
| what `consumer-test.sh` asserts about installed output | four greps against the consumer's `globals.css`; nothing about installed files beyond the install exit |
| story-coverage obligations                             | two kinds, `case` and `described`, both derived from the manifest; baseline is shrink-only             |
| `CLAUDE.md`                                            | 13,612 bytes, 11 headings, no gate on its size or on whether a rule names its enforcement              |
| vendored ladder                                        | `tools/ds-architecture`, stage 00 only, `check:ladder` informational; `ds-architecture` has 00, 01, 09 |
| production registry                                    | 97 of 135 items differ from `main`, one absent (`CONTINUE.md` §7)                                      |
| what a docs module imports                             | `@/lib/component-docs` (type only) and its sibling `.examples.tsx`, which imports registry components  |

Two consequences of the last row. First, a docs module is importable under
vitest today: the `@` alias, the React plugin and jsdom are already in
`apps/docs/vitest.config.ts`, and the examples create React elements at import
time without touching the DOM. Second, an emit step that imports the module is
a stronger check than the needle gate, because a module that fails to evaluate
fails the emit.

## 3. Decisions

### D23 · The guidance module is the contract; every other surface derives from it

`ComponentDocs` in `apps/docs/lib/component-docs.ts` is the one authored
source of a component's usage judgments. The shipped `<name>.meta.json`, the
routing table, the published corpus and the docs page all derive from it. No
second authored copy of any field exists anywhere in the repo.

Rejected: a fresh `.meta.json` as the source with the docs page rendering from
it (the rebuild's shape). Same end state, at the cost of migrating 116 TSX
modules into JSON and moving every live example into a side map. Rejected:
two sources cross-gated on shared fields, which is the drift arrangement the
contract gate exists to end.

### D24 · The contract ships beside the code, and the installed copy outranks the web

Every registry item carries its `<name>.meta.json` as a second file with
`type: "registry:file"` and target `components/super-ai/<name>.meta.json`, so
a consumer that installs `thread-list` has the contract next to the component
it describes, version-locked to the code it installed. The same content is
published on the docs site for agents that have not installed anything yet,
and the published page says the installed file wins on conflict.

Rejected: publish only, which lets an agent read a newer contract than the
code it holds. Rejected: ship one routing table on first install and keep the
per-item pages on the web, which puts the judgment where the version lock is
not.

### D25 · Silence is not a decision

A contract field that can legitimately be empty carries the reason instead.
`variants` is either a non-empty list or `{ none: "<why, at least 20 chars>" }`;
`insteadUse` likewise. An absent field is unwritten and sits in the coverage
baseline (§7.2); an empty array is a schema failure. This is the rebuild's
`focusable: false, why` shape applied to every field where "nothing" is a
possible answer, and it exists because the one thing a gate cannot tell from
oversight is silence.

## 4. The contract

Two fields join `ComponentDocs`. Nothing existing changes shape.

```ts
/** One value of one variant axis, with the judgment that picks it. */
export interface DocsVariantValue {
  value: string;
  /** When to pick this value: the decision, never the appearance. ≥ 20 chars. */
  intent: string;
}

export interface DocsVariant {
  /** The prop as a reader sees it, e.g. "variant", "density", "ToolHeader · state". */
  prop: string;
  /** Bare identifier the coverage gate matches on. Required when `prop` is not one. */
  propName?: string;
  default?: string;
  values: DocsVariantValue[]; // ≥ 1
}

/** A component to reach for instead, and the situation that makes it the right one. */
export interface DocsRedirect {
  /** Registry name. Must be a shipped manifest item. */
  component: string;
  /** ≥ 20 chars. */
  when: string;
}

export interface ComponentDocs {
  // …the nine existing fields, unchanged…
  variants: DocsVariant[] | { none: string };
  insteadUse: DocsRedirect[] | { none: string };
}
```

During the waves (§9) the two new fields are optional in the TypeScript type
so that unwritten modules still typecheck. When the coverage baseline reaches
zero they become required and the baseline file is deleted. That is the
ratchet's end state, and the plan writes the task that does it.

Not ported, deliberately: `tokens[].role` (this registry runs stock shadcn
tokens plus `--warning`, and the token gate already owns that contract),
`states[].recipe` (states are structural here, in the manifest, with a story
per state), structured keyboard rows (the `accessibility.keyboard` prose is
written for all 116 and a row schema would restate it), `responsive` (blocks
carry `regions` in the manifest, and D19 makes container queries the
default). Each is a candidate for a later ratchet, none is needed for an agent
to place a component correctly.

### 4.1 The derived meta

`apps/docs/registry/super-ai/<name>.meta.json`, committed, one per shipped
item, written only by the emit step:

```jsonc
{
  "generated": "by `pnpm contract:emit` from content/components/<name>.docs.tsx. Do not edit.",
  "name": "thread-list",
  "title": "Thread List",
  "layer": "component",
  "family": "B",
  "description": "…", // manifest
  "purpose": "…", // whatItIs
  "whyItMatters": "…",
  "usage": "…",
  "evidence": ["…"],
  "anatomy": [{ "slot": "…", "note": "…" }],
  "variants": [{ "prop": "…", "propName": "…", "default": "…", "values": [{ "value": "…", "intent": "…" }] }],
  "insteadUse": [{ "component": "date-section", "when": "…" }],
  "dos": ["…"], // text only; the live example stays on the docs page
  "donts": ["…"],
  "accessibility": { "keyboard": ["…"], "screenReader": ["…"], "focus": ["…"] },
  "pitfalls": ["…"],
  "states": ["pinned", "inline-rename", "…"], // manifest
  "regions": [], // manifest, blocks only
  "consumes": ["date-section"], // manifest
  "shadcn": ["button", "…"], // manifest
  "npm": ["lucide-react"], // manifest
  "source": "content/components/thread-list.docs.tsx",
  "docs": "https://super-ai-components.vercel.app/components/thread-list",
}
```

Manifest facts are merged in so the installed file is self-contained: an
agent reading it in a consumer tree has no manifest. The `dos` and `donts`
lose their `example` element and keep their `text`; the example is a React
element and belongs to the page.

## 5. Derivation and drift

One vitest file, `apps/docs/scripts/lib/contract-emit.test.ts`, does both jobs
the way `story-coverage` already does: with `CONTRACT_EMIT=1` it writes every
derived file; without the flag it regenerates in memory and fails on any byte
of difference. `pnpm contract:emit` is the script that sets the flag. The
pattern is the rebuild's `index:emit` and this repo's
`story-coverage:baseline`, chosen because the drift test and the writer then
share one code path and cannot disagree about what "stale" means.

Derived, in manifest order so that two worktrees regenerating in parallel
touch disjoint lines and merge cleanly:

| artifact                             | one entry per item is                                                                   | reader                               |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------ |
| `registry/super-ai/<name>.meta.json` | the whole file                                                                          | the consumer agent, via `shadcn add` |
| `index/components.toon`              | one line: name, layer, family, meta path, variant axes, redirects, purpose to 100 chars | the builder agent, from `CLAUDE.md`  |
| `public/llms.txt`                    | one link line                                                                           | any agent, from the web              |
| `public/llms-full.txt`               | one contiguous section                                                                  | any agent, one fetch                 |
| `public/llms/components/<name>.md`   | the whole file                                                                          | any agent, per component             |

`public/r/` stays gitignored because `shadcn build` produces it; the three
`llms` paths are committed. The emitted directories are added to
`.prettierignore` for the same reason the two `gen-wiring.mts` outputs are:
the writer, not prettier, owns their bytes.

The per-component page carries every field of the meta in prose order, then
the install command, then the line "the installed
`components/super-ai/<name>.meta.json` is version-locked to the code and
outranks this page". `llms.txt` opens with the registry's one paragraph, the
install shape, and that same retrieval order, then one line per component.

## 6. Shipping to the consumer

`gen-registry.mts` gains one entry per item:

```ts
{ path: `registry/super-ai/${name}.meta.json`, type: "registry:file", target: `components/super-ai/${name}.meta.json` }
```

and sets the item's `docs` string to "Read `<name>.meta.json` beside this
file before placing the component." The `registry:lib` items and the
`marketing` items ship no meta: they have no guidance module and are not
placed by judgment.

`consumer-test.sh` grows two assertions after the install: for at least one
component item, `components/super-ai/<name>.meta.json` exists beside
`<name>.tsx`, and `node -e` parses it and finds `name === "<name>"`. Green
means the contract travelled; a red here is a shipping bug on the same footing
as a missing `--warning`.

The orphan check in `check-contract.mts` (line 209 at the measured commit)
walks `registry/super-ai/` and must learn that `*.meta.json` is not an orphan
`.tsx`; `reconcile:deps` reads imports from `.tsx` only and is unaffected.

Production is 97 items stale and deploys are manual (`CONTINUE.md` §7). A
consumer sees any of this only after a deploy. The deploy is a dependency of
the outcome and is not a task in this design.

## 7. Gates

Every claim above has a test that fails when it stops being true. In CI order
(`ci.yml`, job `verify`), each lands in the step that already owns its kind:

### 7.1 Schema, in `test`

`contract-emit.test.ts` validates every shipped item's module with zod before
emitting: the nine existing fields keep their present needle rules, `variants`
and `insteadUse` follow §4, every `insteadUse[].component` is a shipped
manifest name that is not the item itself, every `propName` is a bare
identifier and is present whenever `prop` is not one, and no two values on
one axis repeat. A module that throws on import fails here with the import
error, which is the check the needle gate could never make.

### 7.2 Contract coverage, in `test`

`apps/docs/scripts/lib/contract-coverage.baseline.json` lists the shipped
items whose module lacks `variants` or `insteadUse`. The test fails if an item
outside the baseline lacks either, and fails if the baseline names an item
that now has both (a stale entry is as loud as a missing field). `pnpm
contract-coverage:baseline` regenerates it and refuses to grow it, the same
contract `story-coverage:baseline` keeps. It starts at 113 (everything but the
three controls of §9) and ends deleted.

### 7.3 Variant story obligations, in `test`

`story-coverage.ts` gains a third obligation kind, `variant`: for every
declared variant value, key `<item>:variant:<propName>=<value>`, met when any
story file for the item contains the needle `propName="value"` or
`propName: "value"`. A case story that exercises the value satisfies it; a
dedicated per-value story is not required and, per `story-conventions.md`, not
wanted. Obligations derive only from modules that declare `variants`, so
landing the mechanism adds three items' worth, each covered in the same task.
A wave (§9) may not grow the story-coverage baseline: an agent that declares a
value writes the story line that uses it.

### 7.4 Drift, in `test`

§5's test without the flag. Also asserts the derived set is exactly the
shipped set: a meta with no manifest item, or a shipped item with no meta,
fails.

### 7.5 Consumer, in the consumer install test

§6's two assertions.

### 7.6 The scaffolder, in `test`

`new-component.mts` seeds the two fields with reasons shorter than the
minimum, so a scaffolded item fails §7.1 until someone writes the judgment.
`new-component.test.ts` pins that the seed is red by construction, the way it
already pins that no state is named `default`.

## 8. The builder side

### 8.1 Two gates on `CLAUDE.md`, in `test`

`apps/docs/scripts/lib/claude-md.test.ts`, reading `../../CLAUDE.md`:

- **Size.** The file may not exceed a ceiling written as a constant in the
  test, set at 14,500 bytes on landing (measured 13,612, plus the bullet this
  design adds and the gate paths §8.1 makes the others name). The constant may
  only be lowered, and the test asserts the file is within 2,000 bytes of it,
  so the ceiling ratchets down as the file shrinks rather than sitting idle.
- **Stub provenance.** Every bullet under "Rules that are easy to break by
  accident" names at least one gate as a path that exists (`packages/…`,
  `apps/…/*.test.ts`, `scripts/…`, `.github/workflows/ci.yml`), or its
  leading bold phrase appears verbatim in `docs/design-system/UNGATED.md` with
  a reason. The plan rewrites the bullets that today point only at a doc.

This is the rebuild's `agents-size.test.ts` and
`agents-stub-provenance.test.ts`, adapted to a file that is a map by design.
`CLAUDE.md` gains one bullet for this design, pointing at §7.1 and §7.4.

### 8.2 The ladder

`tools/ds-architecture/` is refreshed from the local `ds-architecture` repo
(stages 00, 01 and 09 built there; the vendored copy has 00). `VENDOR.md`
takes the new stamp. `check:ladder` stays informational and out of CI; its
expected output after this design lands is `highestContiguous=01`, with
`01.4c` unchecked as that stage documents. Stages 02 to 08 are unbuilt
upstream and are not built here.

### 8.3 Skills and docs

`.claude/skills/build-component` adds the two fields to its checklist and
names `pnpm contract:emit` as the step after writing the docs module.
`story-conventions.md` records the `variant` obligation kind beside `case` and
`described`. `CONTINUE.md` §3 gains the six-file shape (the five it names plus
the emitted meta) and §8 gets a line per wave as they land.

## 9. Wave protocol

The plan lands the mechanism with three control contracts, one per layer:
`kbd` (A1, primitive), `thread-list` (B6, component, six states) and
`chat-shell` (family O, block, regions instead of states). Three is enough to prove the schema against the three shapes
and to make every gate above fail by hand before it is trusted.

The remaining 113 are authored in waves of about twelve, by parallel Sonnet
agents in their own worktrees per `CONTINUE.md` §3.4, each writing only its
own `<name>.docs.tsx` and the story lines §7.3 requires, then running `pnpm
contract:emit` and `pnpm test` in `apps/docs`. Each wave is reviewed by Opus
for judgment (an intent that describes appearance instead of a decision is
the expected rejection), integrated on one branch, and closed by regenerating
the baseline of §7.2. An agent commits its own meta and its own lines of the
shared derived files; the integrator re-runs emit once after the merge and
commits any residue. A wave that would grow either baseline does not merge.

At roughly ten waves this is the bulk of the cost, and the reason the
mechanism ships first: a mechanism with three contracts and a shrink-only
baseline cannot quietly stay at three.

## 10. Out of scope, deliberately

- Ladder stages 02 to 08. They belong to `ds-architecture`, which has no remote
  and last moved on 2026-08-22.
- Figma sync of any kind (D12, D13 govern what Figma is here).
- An MCP server over the corpus. `llms.txt` is the retrieval surface; a server
  is a second one to keep honest.
- SAI-02, the Base UI versus Radix consumer contract, and SAI-04, roving
  `tabIndex`. Both tracked in `CONTINUE.md` §5 and §8.
- Carrying the mechanism to the Minimal Design System. Its PR #60 plan is the
  place, and §1 says which names were kept to make that a copy rather than a
  redesign.
- The production deploy (§6).

## 11. Risks

- **A docs module that cannot be imported outside Next.** None of the 116
  imports `next/*`, and every `.examples.tsx` is a `"use client"` module of
  plain React. If one later does, the emit fails at import with the module's
  name, which is the right failure. The first plan task imports all 116 under
  vitest before anything else is built, so the risk is discharged before it
  can cost a wave.
- **Prettier reformatting emitted files.** Mitigated by `.prettierignore`
  (§5). The quirk `CLAUDE.md` records for `story-conventions.md` (three passes
  to converge) does not apply to ignored paths.
- **Two agents regenerating `llms-full.txt` in parallel.** Sections are
  contiguous and in manifest order, so git merges them; the integrator's final
  emit catches the case where it does not.
- **The `variant` obligation matching prose.** The needle is
  `propName="value"` in a story file, not a word in a sentence; a quoted JSX
  attribute is the only thing that matches. The rebuild ran 57 obligations
  into an unsatisfiable needle by deriving it from display prose, which is why
  `propName` exists and is required whenever `prop` is not an identifier.
- **Consumers with a non-default `components` alias.** `target` is resolved
  the same way the existing `.tsx` target is, so the meta lands wherever the
  component lands.
- **Publishing internal voice.** The docs modules were written as
  consumer-facing copy (each carries the "translate the spec's internal
  voice" instruction); the emit copies field text only, never comments. The
  `evidence` product names are already on the public docs site.

## 12. Acceptance

The mechanism is done when, at the plan's last commit:

1. `pnpm check:contract`, `pnpm test`, `pnpm build:registry`, `pnpm build`
   and the consumer install test are green from the repo root, and the
   Storybook gate is green in `./scripts/linux-gate.sh`.
2. Three `.meta.json` files exist, each derived; deleting one and running
   `pnpm test` fails §7.4; editing one by hand fails §7.4; blanking an
   `intent` fails §7.1; removing `variants` from a control module fails §7.2.
3. `public/r/thread-list.json` lists two files, and a fresh consumer install
   places `components/super-ai/thread-list.meta.json` beside the component.
4. `public/llms.txt` lists 116 components and the three written pages carry
   every field.
5. `CLAUDE.md` is under its ceiling and every rule bullet names a gate or an
   `UNGATED.md` reason; raising the ceiling constant is the only way to add
   bytes, and a review can see that diff.
6. `pnpm check:ladder` reports `highestContiguous=01`.
7. `contract-coverage.baseline.json` lists 113 items, and `pnpm
contract-coverage:baseline` refuses to grow it.

The program is done when that baseline is deleted and the two fields are
required in the type.
