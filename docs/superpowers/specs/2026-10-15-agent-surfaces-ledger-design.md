# Agent surfaces: the ledger decides what Super-AI ships to consumer agents

**Date:** 2026-10-15 · **Owner:** Nick · **Status:** Draft, for Nick's review · **Baseline:** `main` at `f1861c4`
**Related:** [agentic contracts spec](2026-09-14-agentic-contracts-design.md) §6 and §10 · [Harness pages spec](2026-09-18-harness-architecture-pages-design.md), sub-project B (the audit loop the Harness page admits it lacks) · `CONTINUE.md` §7 · the field scan in design-system-rebuild, `research/style-teardowns/2026-09-05-agentic-ds-field-scan.md` on branch `claude/agentic-design-systems-research-f1d054` at `4dfea901`

**TL;DR.** A July 2026 survey of 20 open-source design systems shows the consumer kit has converged:
17 ship an MCP server, 17 an agent skill, 14 an llms.txt, 11 a registry, and 3 publish any
evaluation of whether those surfaces work. Super-AI ships the registry, the corpus and a
version-locked contract beside every installed component, and nothing a consumer agent meets
before it installs or while it writes. Every measured result since the survey points one way:
context the agent already has beats context it must fetch, and a check that runs beats a
sentence that asks. So this spec does not pick MCP against skill against CLI by argument. It
builds a serving-format ledger in a consumer cell, ships each surface as an arm of that ledger,
and keeps what wins. Two things are built before the first row because the ledger cannot run
without them: an installable `agent-kit` registry item carrying a generated instruction file,
the routing index and a `validate` script, and the harness itself. The MCP and CLI arms cost
configuration, not code, because shadcn's own CLI and MCP server already read any conforming
registry. An MCP server of our own stays out, as the contracts spec decided.

---

## 1. Decisions proposed (numbers become final when Nick approves)

### D27 · Measure before a surface ships

The ledger is the instrument. A consumer surface with no arm in the ledger has no claim on the
Harness page, and a surface that loses its arm is removed. **Why:** 3 of 20 systems measure
anything; this repository's stance since the project review is measured over asserted; and the
pegbo ledger that would have been the precedent has a design and zero rows. This repository can
have rows first because its consumer cell already exists: `consumer-test.sh` scaffolds a fresh
Base UI app and installs every item from a local registry build.

### D28 · Every consumer-facing instruction derives from the guidance modules

Extends D23. The instruction file, the index copy and anything else the kit installs are emitted
by `gen-registry.mts` from the same metas that produce `llms.txt`, and a drift test holds them to
their source. Nothing an agent reads in a consumer is hand-written. **Why:** the one hand-written
artifact in pegbo's chain went stale twice in one branch; code.org's design-system skill drifted
across 104 commits and pointed at deleted files.

### D29 · Enforcement is a command the agent runs, not a sentence it reads

`validate` is a script installed into the consumer. The instruction file's only job on the
subject is to say when to run it. **Why:** Polaris, Deslint, Mantine and shadcn's own
`@shadcn/lint` all moved the rule into the loop; shadcn reports near-zero violations after one
correction round over 150 runs. Here the 17 blocker rules fire on contributors only.

### D30 · No MCP server of our own

The `mcp` arm is `npx shadcn mcp init` pointed at this registry. The contracts spec's §10
deferral stands until a ledger row shows that a server of our own would change the result.
**Why:** Atlassian's CLI beat its own MCP on adoption by 60 percent, and Storybook removed the
MCP dependency from its skills after measuring that the skills work without it.

## 2. Measured state at baseline

Field counts are the scan's §6 table (kaelig survey, snapshot 2026-07-28). Local facts come from
`pnpm build:registry`, `content/system/facts.json` and `pnpm exec shadcn --help` at 4.11.0.

| Surface                     | Field, of 20             | Here, at `f1861c4`                                                                                  | Note                                                            |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Registry                    | 11                       | 137 items at `/r/<name>.json`: 118 catalog, 15 marketing, 4 lib                                     | shadcn 4.11 `view`, `search` and `mcp` read it as `@super-ai/…` |
| Installed contract          | recommended, few ship    | `.meta.json` beside every catalog item, `docs` string shown on install                              | version-locked by construction, D24                             |
| llms.txt corpus             | 14                       | `llms.txt`, `llms-full.txt`, `/llms/components/*.md`, generated and gated                           | production 404s all three, last deploy 2026-09-13               |
| Routing index               | registries, MCP indexes  | `index/components.toon`                                                                             | never reaches the consumer                                      |
| Agent skill                 | 17                       | none for consumers; 4 in-repo skills for contributors                                               |                                                                 |
| MCP                         | 17 official              | none of ours                                                                                        | shadcn's MCP works here with one `registries` entry             |
| CLI read surface            | Atlassian, Astryx        | none of ours; shadcn `view` and `search` read the registry                                          |                                                                 |
| Generation-time enforcement | Polaris, Deslint, shadcn | 20 rules, 17 blockers, in `check:tokens` on this repository only                                    | nothing runs inside a consumer                                  |
| Published evals             | 3                        | none; `consumer-test.sh` proves install, not use                                                    |                                                                 |
| Audit loop                  | Astryx nightly ledger    | none; the Harness page says so in its own prose                                                     | sub-project B of the Harness initiative                         |
| DTCG, DESIGN.md             | Primer, Atlassian        | not applicable: this registry owns no tokens, it consumes shadcn's and `check:tokens` enforces that |                                                                 |

What the consumer meets today, in retrieval order, is the Harness page's `consumer-surfaces`
figure: the installed contract, then the component's page via `llms.txt`, then the full corpus.
All three arrive after the agent has already decided to install something, or after it has
found the docs site on its own.

## 3. Scope

### 3.1 The cell

A fresh shadcn app on Base UI, style `base-nova`, exactly what `consumer-test.sh` scaffolds, with
the registry served from a local build at a pinned SHA on the port the script already uses. Rows
never depend on production being deployed. The pin is the registry build's commit; both sides of
every row are named by full SHA so two rows can never measure different software under one label.

### 3.2 Arms

Slice 1 has three arms. They differ only in the files the builder can see; everything else
(brief, model, turn budget, seed, scoring) is identical.

- `none`: `components.json` carries the `@super-ai` registry entry and nothing else. The builder
  knows a registry exists and must find its own way to the items.
- `today`: what a consumer gets now. The `docs` string on install and the `.meta.json` beside
  each installed file. Nothing before install.
- `kit`: `today` plus the `agent-kit` item (§3.5) installed before the builder starts.

Blindness is by removal, the pegbo ledger's rule: an arm that must not see a file has it
deleted from the cell. A prohibition is a request, and one builder that reads the file anyway
invalidates the row with nobody noticing.

Slice 2 adds `skill` (the kit's text as a `SKILL.md` under `.claude/skills/` instead of an
always-loaded file, which tests the on-demand finding directly), `mcp` (shadcn's MCP configured),
`cli` (the instruction names `shadcn view` and `shadcn search`) and `llms` (the `llms.txt` URL
and nothing local).

### 3.3 Briefs

Six briefs, frozen before the first row, one per family that has a block:

| Brief | Screen                                              | Expected items, the minimum a correct build installs                  |
| ----- | --------------------------------------------------- | --------------------------------------------------------------------- |
| B1    | a chat with a thread list and keyboard shortcuts    | `chat-shell` or `thread-list` + `shortcuts-sheet`                     |
| B2    | an image generation panel with model and cost       | `generation-panel`, `model-picker`, `parameter-panel`, `cost-chip`    |
| B3    | account settings with a usage quota and plans       | `settings-shell` or `settings-dialog`, `quota-meter`, `pricing-table` |
| B4    | a tool run that needs permission and can be blocked | `permission-prompt`, `safety-block`, `approval-card`                  |
| B5    | an agent trace with a run inspector                 | `trace-timeline`, `run-inspector`                                     |
| B6    | a home with recents and a prompt box                | `home-shell` or `hero-omnibox` + `recent-grid`                        |

Each brief is a prompt plus an expectation, the shape of shadcn's `evals.json`: the items a
correct build installs, and the items it must not rebuild by hand. The names above are a
proposal; the final list is Nick's (open question 5).

### 3.4 Scoring, from things that exist

Per row: `install` (items added against the expectation, and hallucinated imports, meaning an
import no registry item or declared dependency provides, found by grep over the diff),
`validate` (counts from the installed script: raw colour, palette class, banned motion utility),
`types` (the consumer app's typecheck exit code), `turns`, `tokens` (input, output, cache read,
cache write from the builder's final event) and `wallMs`. No vision judge in slice 1. The
Harness4GenUI paper's two graded metrics, catalog-hallucination rate and binding resolution, are
the model for `install`; the graded conformance score is a research direction, not a column.

### 3.5 The `agent-kit` item

One registry item of `registry:file` entries, installed with
`npx shadcn add @super-ai/agent-kit`:

- `AGENTS.super-ai.md` at the project root (shadcn's `~/` target): the install shape, the
  retrieval order from the `consumer-surfaces` figure, the routing index compressed to under 8 KB,
  and when to run `validate`. Generated from the metas.
- `components/super-ai/index.toon`: a copy of `index/components.toon`.
- `scripts/super-ai-validate.mjs`: stdlib-only, the blocker subset of `packages/ds-rules`, run on
  the paths it is given, exit 1 on any blocker.

`gen-registry.mts` emits all three beside `llms.txt`; a drift test holds them to the metas and
the rules; `consumer-test.sh` asserts the item installs and that `validate` exits 0 on the
installed tree and 1 on a planted raw colour. Task 1 of the plan verifies that a `registry:file`
can target the project root and that the index fits the size cap; if either fails, the kit
installs under `components/super-ai/` and the instruction file says so.

### 3.6 The ledger

`apps/docs/research/ledger/`:

- `arms/<arm>/`: a `strip.json` of paths removed from the cell and any files the arm adds.
- `briefs/<id>.md` with `expect.json` beside each.
- `harness/`: `config.ts` (pins, arms, model, turn budget), `run-once.ts` (scaffold the cell at
  the pin, apply the arm, run one builder round, score, write the row), `derive.ts` (rows to
  `ledger.json` and `LEDGER.md`), `pins.test.ts` (derive reproduces the committed table byte for
  byte and fails on a planted row).
- `rows/<date>-<arm>-<brief>-s<seed>/`: `builder.jsonl`, `diff.patch`, `install.json`,
  `validate.json`, `typecheck.log`, `row.json`. Rows stay in when they lose. A row without its
  artifacts is not a row.
- `LEDGER.md` and `ledger.json`, derived, never hand-edited.

The builder is Claude Code headless (`claude -p`) on Sonnet at medium effort with a fixed turn
budget. One model per series; a model change starts a new series. The pins test runs inside
`pnpm test`; the rows themselves run by hand.

### 3.7 Publishing

`LEDGER.md` renders on the docs site under `/harness` once six rows exist, as a section titled
by what it measures. `facts.json` gains `ledgerRows`. The Harness page's sentence "There is no
audit loop yet" changes only when slice 2's schedule exists, and the schedule runs in a
non-prompting permission mode with every command allowlisted, per Nick's standing rule.

## 4. Alternatives considered

- **Ship an MCP server and a skill now, measure later.** The field's path. Rejected: 17 of 20
  did this and 3 can say whether it helped; the vendor that measured, Storybook, dropped its own
  MCP dependency afterwards.
- **An MCP server of ours over the corpus.** Rejected, D30. The contracts spec deferred it, the
  shadcn MCP exists, and the one measured CLI-against-MCP comparison went to the CLI.
- **Port the pegbo ledger's code.** Rejected. Private repository, an npm-package cell, different
  briefs. The design ports: arms by removal, rows kept, a derived table, a pins test. The harness
  is written here against `consumer-test.sh`.
- **A hand-written consumer skill first.** Rejected, D28.
- **Nightly automation from day one.** Rejected on budget and on the scheduled-task rule; by hand
  until the pilot has shown the cost per row.

## 5. Constraints

- **Nick's usage limits.** Builder and scoring on Sonnet medium. Three rows a week by hand in
  slice 1. No automation until slice 2, and then only allowlisted.
- **Consumers are Base UI only** (README). The cell is `base-nova`.
- **`CLAUDE.md` has a 14,500-byte ceiling** (`claude-md.test.ts`). The kit's text is its own file
  and is never appended to this repository's `CLAUDE.md`.
- **Production lags `main`** (`CONTINUE.md` §7). Rows use the local registry build at the pin and
  carry its SHA.
- **No product screenshots in the public tree.** Rows hold diffs and logs. A slice 3 vision judge
  keeps its screens outside the repository, the way `studio-slice` does.
- **Gates run from the repository root** (CI includes root lint and typecheck). The harness code
  passes them like any other file under `apps/docs`.

## 6. Success criteria

- `agent-kit` installs inside `consumer-test.sh` and `validate` runs there, both directions
  control-tested.
- Six rows exist, two briefs across three arms, each with its artifacts; `LEDGER.md` derives
  from them and the pins test holds it.
- A written verdict on one question: does `kit` beat `today` on install correctness and token
  spend? Either answer is a result and goes on the Harness page.
- `facts.json` carries `ledgerRows` and the Harness page prints it.

## 7. Build order and checkpoints

1. **Briefs and expectations.** Docs only. Checkpoint: Nick approves the six briefs.
2. **The kit emitter**, drift test and the `consumer-test.sh` assertions.
3. **`validate`**, the blocker subset, with its control test (a planted raw colour exits 1).
4. **The harness**: cell, arms, `run-once`, scoring, row writer, `derive`, pins test.
5. **Pilot**: one brief, three arms, seed 1. Checkpoint: Nick sees three rows and their cost
   before anything else runs.
6. **The second brief**, `LEDGER.md`, the Harness page section and `ledgerRows`.

Slice 2: the `skill`, `mcp`, `cli` and `llms` arms, then the schedule. Slice 3: a vision judge.

## 8. Out of scope

- An MCP server of ours (D30).
- DTCG and DESIGN.md emitters: this registry owns no tokens.
- The elicitation state and component drafted in the pegbo research
  (`research/specs/2026-10-11-elicitation-component.md`): a catalog candidate for `gaps.md` §5,
  decided separately.
- The Storybook MCP addon: Storybook stays local here, per the Harness spec.
- Carrying any of this to the Minimal Design System.
- The production deploy (`CONTINUE.md` §7). Rows do not need it; consumers do.

## 9. Open questions

1. **Slice 1 arms.** `none`, `today`, `kit` as proposed, or swap `none` for `llms` so the first
   rows compare what exists against what is new?
2. **The kit's instruction file.** An always-loaded `AGENTS.super-ai.md` (Vercel's index scored
   100 percent where skills scored 53) or a `SKILL.md`? Proposed: the file first, the skill as a
   slice 2 arm.
3. **Budget.** Three rows a week on Sonnet medium, by hand. Yes, or a smaller pilot of one brief
   and two arms?
4. **Where rows live.** In this public repository, diffs and logs only, or beside `studio-slice`
   in Super-AI-Components-research? Proposed: here, because the ledger is a claim the Harness
   page makes and the pins test has to see the rows.
5. **The briefs.** The six in §3.3, or yours? They define what a correct build is.
6. **The builder.** `claude -p` with a pinned model for the pilot, or the Agent SDK from the
   start? Proposed: `claude -p`.

## 10. Handoff pointers

- The source: the field scan's §3 (where pegbo sits), §4 (ideas ranked), §9.1 and §10.1 (the
  measured results), at the path and commit in the header.
- The cell: `apps/docs/scripts/consumer-test.sh`. The emitter: `apps/docs/scripts/gen-registry.mts`.
  The rules: `packages/ds-rules/rulecheck.mjs` and `token-rules.mjs`. The retrieval order:
  `apps/docs/content/system/figures.ts`, `CONSUMER_SURFACES`. The sentence to retire:
  `harness.page.ts`, "There is no audit loop yet".
- The precedent, design only: design-system-rebuild
  `research/specs/2026-09-05-serving-format-ledger.md` and the study directory beside it.
- Next step after approval: `superpowers:writing-plans`, one plan for slice 1.

## Changelog

- 2026-10-15: first draft, from the field scan's verdicts measured against `main` at `f1861c4`.
