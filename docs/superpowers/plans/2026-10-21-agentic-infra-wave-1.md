# Agentic infra, wave 1 (Super-AI-Components) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `CLAUDE.md` into an `AGENTS.md` map of one-line stubs over one costed body per rule, and give the repo an indexed exceptions ledger with a per-PR delta.

**Architecture:**
- `AGENTS.md` keeps the map prose (overview, commands, CI list) plus one stub per rule. Each stub points at a thin body in `docs/agent-rules/`, which links to the long account that already exists elsewhere in `docs/`. `CLAUDE.md` becomes `@AGENTS.md`.
- Size and provenance tests replace `claude-md.test.ts`.
- Every allowance list stays where its gate reads it. A registry names each list, an emit test derives `apps/docs/index/exceptions.json` with reason, commit and PR per entry, and a never-failing CI job diffs it against the PR base.

**Tech Stack:** pnpm 11, turbo, Node 24, TypeScript, Vitest (`apps/docs`, jsdom), tsx, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-20-agentic-infra-port-design.md` in the Minimal Design System repo, on branch `claude/agentic-infra-port`, sections P3, P4 and P6, 3a and 3b. Read it with `git -C "/Users/nickv/ClaudeCode Projects/Minimal Design System" show claude/agentic-infra-port:docs/superpowers/specs/2026-10-20-agentic-infra-port-design.md`.

**Port sources:**
- "REBUILD" means `/Users/nickv/ClaudeCode Projects/design-system-rebuild` at `origin/main` `e3c031ae`. Read it with `git -C <rebuild> show e3c031ae:<path>`.
- "MDS" means `/Users/nickv/ClaudeCode Projects/Minimal Design System` at `origin/main` `1bd692d`.
- Every PR body names the paths and commits it ported from, the client scrub it applied, and that it assumes the Super-AI rule schema (`packages/ds-rules/src/schema.ts`).

## Global Constraints

- Work only in this worktree (`.claude/worktrees/agentic-infra-port`, branch `claude/agentic-infra-port`). Never switch the shared checkout's branch.
- The remote is `VV-DSGN-INC/Super-AI-Components`, not `weeeha`. Say the target out loud before pushing.
- pnpm, not npm. The worktree has no `node_modules` at first: run `pnpm install --offline --frozen-lockfile` from the root.
- New tests go under `apps/docs/scripts/lib/`. A test at the repo-root `scripts/` is never run (the `apps/docs/vitest.config.ts` include).
- Tests that read root files (`AGENTS.md`, `docs/**`, `.github/**`) are invisible to turbo's cache key. Run them with `pnpm turbo run test --force`, or `cd apps/docs && pnpm exec vitest run <file>`, never a cached `pnpm test`.
- Run gates from the repo root with `.claude/skills/gate-run/run-gates.sh`. If port 3100 is taken, use `SMOKE_PORT=3101`.
- Prose in `apps/docs/content/system/*.ts` must satisfy `pages.test.ts`:
  - no digits outside backticks;
  - no em dash and no `!`;
  - no banned words;
  - every backticked path exists.
- `format:check` covers `AGENTS.md` and `docs/agent-rules/*.md`.
- Emitted JSON goes in `.prettierignore` with a comment, following the existing pattern.
- A new `run:` step in `ci.yml` needs four follow-ups:
  - a `GATE_ROWS` row or a `PLUMBING` entry in `apps/docs/content/system/gates.ts`;
  - a matching `run "<label>"` line in `.claude/skills/gate-run/run-gates.sh`, unless it is `PLUMBING`;
  - `pnpm --filter docs facts:emit`;
  - the step-count word in the two claim sentences that `apps/docs/content/system/claims.ts` pins.
- Migrated ledger entries carry the reason `migrated 2026-10`, exactly.
- No client name, client data, runner label or non-English copy from REBUILD.
- `pnpm check:ladder` gives the same result before and after (it is not in CI, but stages 00 and 09 read `AGENTS.md` once it exists).

## Review Focus

1. **The ladder probes.** Once `AGENTS.md` exists, `tools/ds-architecture` stages 00 and 09 read it instead of `CLAUDE.md`. It must still carry these, or `check:ladder` regresses quietly:
   - a backticked pnpm command;
   - the words `specs/` and `plans/`;
   - a "round 3" or "rounds 1-2" phrase together with "blocker";
   - "worktree" and "install".

   Pinned in Task 2.
2. **The claims that pin `CLAUDE.md` text.** `claims.ts` matches "Twelve steps. The last three" and "Catalog status: N of N shipped" in `CLAUDE.md`. Both move to `AGENTS.md`, and the step word changes to Thirteen in Task 7. Pinned in Tasks 2 and 7.
3. **A rule bullet with `*` in its bold text** (`llms*`). The old bold-text regex skipped it. The new parser must find it by its body path. Pinned in Task 1.
4. **A swapped allowance** (one glob out, another in, the same count). The delta must show one added and one removed, never a net zero. Pinned in Task 7.
5. **A shallow clone.** The gate run never calls `git`; only `EXCEPTIONS_EMIT=1` blames. Pinned in Task 6.

---

### Task 1: The stub parser and the two tests

**Files:**
- Create: `apps/docs/scripts/lib/agents-stubs.ts`, `apps/docs/scripts/lib/agents-size.test.ts`, `apps/docs/scripts/lib/agents-provenance.test.ts`

**Interfaces:**
- Produces:
  - `type AgentStub = { body: string; gates: string[]; line: number }`
  - `parseAgentStubs(text: string): AgentStub[]`
  - `UNGATED_MD = "docs/design-system/UNGATED.md"`
  - `readUngated(text: string): Map<string, string>`, which maps a body path to a reason

Port MDS `scripts/agents-stubs.mjs` to TS unchanged. A body is the backticked `` `docs/agent-rules/<name>.md` `` on a stub line, and gates are the backticked items after `Gate:` on the same line. Gate paths are repo-relative.

Port MDS `scripts/agents-size.test.ts` and `scripts/agents-provenance.test.ts`, keeping SAC's two size checks:
- `CEILING` and `HEADROOM = 2_000`. The size must be at or under `CEILING` and above `CEILING - HEADROOM`.
- `PRE_SPLIT_BYTES = 14_499`, with a CONTROL that it would fail the new ceiling.
- Provenance has no `UNGATED` constant. It reads the table in `UNGATED.md`, which Task 3 rekeys by body path.
- Provenance also adds `it("a stub whose bold text contains * still resolves its body")`, using a fixture line modelled on the `llms*` bullet.

- [ ] **Step 1: Write the three files, with `CEILING = 14_500` for now.** Run `cd apps/docs && pnpm exec vitest run scripts/lib/agents-size.test.ts scripts/agents-provenance.test.ts`. FAIL, since `AGENTS.md` does not exist.
- [ ] **Step 2: Commit the failing tests on their own,** with a `.skip` on the two `describe` blocks and a comment naming Task 2. `test(agents): stub parser, size and provenance tests for AGENTS.md`

### Task 2: AGENTS.md map and stubs, CLAUDE.md as an import

**Files:**
- Create: `AGENTS.md`
- Modify:
  - `CLAUDE.md` (the single line `@AGENTS.md`)
  - `apps/docs/content/system/claims.ts` (both `CLAUDE.md` entries become `AGENTS.md`)
  - `apps/docs/content/system/gates.ts` (repoint the `claude-md.test.ts` citation)
  - prose that means "the rules file" in `apps/docs/content/system/{harness.page.ts,figures.ts,architecture.page.ts}`, `docs/design-system/review-rounds.md`, `tools/ds-architecture/VENDOR.md`, `README.md`, `apps/storybook/src/stories/guides/contributing.mdx`, and the message in `apps/docs/scripts/lib/a11y-ratchet.test.ts`
- Delete: `apps/docs/scripts/lib/claude-md.test.ts`

`AGENTS.md` holds, in this order:
- the map prose from today's `CLAUDE.md`, made true. The production line says production deploys from `main` after CI through `.github/workflows/deploy.yml`, which needs the `VERCEL_TOKEN` secret. The four ladder strings from Review Focus 1 stay.
- one `### <topic>` heading per group of stubs, with one stub per body from Task 3. Stub shape: `- **<trigger>** Read \`docs/agent-rules/<name>.md\`. Gate: \`<path>\`.`, and no `Gate:` clause for the three UNGATED rules.

The token gate section and the "Parallel builds" section become bodies (Task 3) with stubs. The commands table, the CI job list, the conventions and the open decision stay as map prose.

- [ ] **Step 1: Run `pnpm check:ladder` and save its output to the scratchpad.**
- [ ] **Step 2: Write `AGENTS.md`, set `CLAUDE.md` to `@AGENTS.md`, delete `claude-md.test.ts`, and fix the citing prose.** Retarget `claims.ts`. Lift the `.skip` from Task 1.
- [ ] **Step 3: Measure, then set `CEILING`.** Round the new byte count up to the next 500. Leave `HEADROOM` at 2,000.
- [ ] **Step 4: Run.** `cd apps/docs && pnpm exec vitest run scripts/lib/agents-size.test.ts scripts/lib/agents-provenance.test.ts content/system`, then `pnpm check:ladder`. Expect provenance to FAIL on the missing bodies (Task 3), and size, claims, gates and pages to PASS. `check:ladder` must match Step 1.
- [ ] **Step 5: Commit.** `docs: AGENTS.md is the map, CLAUDE.md imports it`

### Task 3: One costed body per rule

**Files:**
- Create: the 13 files under `docs/agent-rules/` listed below
- Modify: `docs/design-system/UNGATED.md` (the table key column becomes the body path)

Each body is shaped like this:
- `# <Title>`;
- one sentence starting "This rule protects";
- the rule in a short paragraph;
- "The full account:" followed by the existing doc and section;
- `## What it costs`, two to five sentences on what the rule prevents and what following it costs an author.

Write the bodies from the existing docs. Do not invent incidents.

| body | from | gate (or UNGATED) |
|---|---|---|
| `catalog-manifest.md` | `CONTINUE.md` §3.2 | `apps/docs/lib/catalog.manifest.test.ts` |
| `reconcile-deps.md` | `CONTINUE.md` §3.5 | `apps/docs/scripts/reconcile-deps.mts` |
| `gate-list-mirrors-ci.md` | `CONTINUE.md` §1, gate-run `SKILL.md` | UNGATED |
| `green-proves-nothing.md` | `CONTINUE.md` (the build-before-smoke passage), gate-run `SKILL.md` | UNGATED |
| `storybook-compiles-docs.md` | `CONTINUE.md` §4 | `apps/docs/scripts/turbo-inputs.test.ts` |
| `ratchets-only-shrink.md` | `a11y-baseline.md`, `story-conventions.md` | `apps/docs/scripts/lib/a11y-ratchet.test.ts`, `apps/docs/scripts/lib/story-coverage.test.ts` |
| `muted-on-muted.md` | `a11y-baseline.md` | `packages/ds-rules/rulecheck.mjs` |
| `blocks-compose.md` | `block-build-brief.md` | UNGATED |
| `no-default-state.md` | `CONTINUE.md` §3.2 | `apps/docs/scripts/new-component.test.ts` |
| `family-g-cut.md` | `decisions.md` D9 | `apps/docs/lib/catalog.manifest.test.ts` |
| `contracts-derive.md` | `2026-09-14-agentic-contracts-design.md` | `apps/docs/scripts/lib/contract-emit.test.ts` |
| `token-gate.md` | the `CLAUDE.md` token gate section, including both documented limitations and the MDS schema note | `packages/ds-rules/rulecheck.mjs` |
| `parallel-builds.md` | the `CLAUDE.md` "Parallel builds" section, `CONTINUE.md` §3.4 | UNGATED |

`UNGATED.md` then has four rows, keyed `docs/agent-rules/gate-list-mirrors-ci.md`, `green-proves-nothing.md`, `blocks-compose.md` and `parallel-builds.md`, each keeping or writing its "why nothing enforces it".

- [ ] **Step 1: Add the cost check to `agents-provenance.test.ts`.** Port REBUILD's `costViolations` (`MIN_COST_PROSE_CHARS = 40`, `COST_HEADING = "## What it costs"`, bodies from `readdirSync("docs/agent-rules")`), with its main `it` and three CONTROLs. Run it and expect FAIL.
- [ ] **Step 2: Write the 13 bodies and rekey `UNGATED.md`.**
- [ ] **Step 3: Run.** `cd apps/docs && pnpm exec vitest run scripts/lib/agents-provenance.test.ts scripts/lib/agents-size.test.ts && cd ../.. && pnpm format:check`. PASS.
- [ ] **Step 4: Commit.** `docs(agent-rules): one costed body per rule`

### Task 4: Gate the new tests on the System page

**Files:**
- Modify: `apps/docs/content/system/gates.ts` (the `pnpm test` row's `checks[]` gains `agents-size.test.ts` and `agents-provenance.test.ts`, each with its `protects` sentence)

- [ ] **Step 1: Edit, then run.** `cd apps/docs && pnpm exec vitest run content/system`. PASS: the roster, "cites only files that exist" and the prose rules all pass.
- [ ] **Step 2: Run the full gate list.** `.claude/skills/gate-run/run-gates.sh`. All 12 green.
- [ ] **Step 3: Commit.** `docs(system): the gates page names the AGENTS.md tests`

### Task 5: Ledger registry and the emitted index

**Files:**
- Create: `apps/docs/scripts/lib/exceptions/registry.ts`, `apps/docs/scripts/lib/exceptions/build.ts`, `apps/docs/scripts/lib/exceptions/reasons.json`, `apps/docs/scripts/lib/exceptions/emit.test.ts`, `apps/docs/index/exceptions.json`
- Modify: `apps/docs/package.json` (script `"exceptions:emit": "EXCEPTIONS_EMIT=1 vitest run scripts/lib/exceptions/emit.test.ts"`), `.prettierignore`

**Interfaces:**
- Produces the same types and names as the MDS wave-1 plan's Task 1, so the two copies read alike:
  - `RawEntry { key; reason; needle; occurrence }`
  - `LedgerSpec { name; file; gate; about; read(root) }`
  - `LEDGERS`, `DECLINED`
  - `MIGRATED_REASON = "migrated 2026-10"`, `MIGRATED_CEILING`
  - `IndexedEntry`, `ExceptionsIndex`
  - `buildIndex(root, provenance)`

The ledgers, in this order:

| name | file | gate | key | entries today |
|---|---|---|---|---|
| `RULE_EXEMPT` | `packages/ds-rules/src/{core,local}.ts` | `packages/ds-rules/rulecheck.mjs` | `<ruleId>:<path>` | 9 |
| `VENDORED_SCOPES` | `packages/ds-rules/src/local.ts` | `packages/ds-rules/rulecheck.mjs` | the scope glob | 2 |
| `A11Y_EXCLUSIONS` | `apps/storybook/a11y-exclusions.baseline.json` | `apps/docs/scripts/lib/a11y-ratchet.test.ts` | the glob | 5 |
| `CSSVARS_LIVENESS` | `apps/docs/cssvars-liveness.baseline.json` | `apps/docs/scripts/lib/cssvars-liveness.test.ts` | the string | 9 |
| `CONTRAST_EXEMPT_FILES` | `packages/ds-rules/src/token-rules.mjs` | `apps/docs/scripts/check-contract.mts` | path | 0 |
| `UNGATED` | `docs/design-system/UNGATED.md` | `apps/docs/scripts/lib/agents-provenance.test.ts` | body path | 4 |

Reasons:
- `UNGATED` carries its own reason column.
- All other ledgers take their reason from `reasons.json` (`"<LEDGER>#<key>"` mapped to a reason), seeded with `MIGRATED_REASON` for every entry today.

`DECLINED` lists:
- the `.test.` population scope, with the why "a population exclusion, not an allowance";
- `story-coverage.baseline.json` and `contract-coverage.baseline.json`, with the why "a coverage work list: it may only shrink, and an entry is owed work, not an allowance".

The gate paths above must be checked against the tree. If a cited test sits elsewhere, use its real path.

- [ ] **Step 1: Write the tests.** Write the same seven `it`s as MDS Task 1, ported with SAC paths. Run `cd apps/docs && pnpm exec vitest run scripts/lib/exceptions/emit.test.ts` and expect FAIL.
- [ ] **Step 2: Implement.** Until Task 6 lands, provenance returns nulls. Add `apps/docs/index/exceptions.json` to `.prettierignore` with the comment `# derived: pnpm exceptions:emit`.
- [ ] **Step 3: Run.** `cd apps/docs && pnpm exceptions:emit && pnpm exec vitest run scripts/lib/exceptions/emit.test.ts`. PASS, with 6 ledgers and 29 entries.
- [ ] **Step 4: Commit.** `feat(exceptions): index every allowance list with a reason per entry`

### Task 6: Provenance from git, only when emitting

**Files:**
- Create: `apps/docs/scripts/lib/exceptions/provenance.ts`, `apps/docs/scripts/lib/exceptions/provenance.test.ts`
- Modify: `apps/docs/scripts/lib/exceptions/build.ts`, `apps/docs/scripts/lib/exceptions/emit.test.ts`

Port REBUILD `src/lib/exceptions/provenance.ts` exactly as the MDS plan's Task 2 does. The one difference is the repo root: here it is `resolve(__dirname, "../../../..")` from `apps/docs/scripts/lib/exceptions/`, which is one level deeper than its siblings.

The tests are the five REBUILD CONTROLs plus:
- `it("gate mode never calls git")`;
- `it("two occurrences of one needle blame two lines")`.

- [ ] **Step 1: Write the tests.** Run and expect FAIL.
- [ ] **Step 2: Implement.** Run `pnpm exceptions:emit && pnpm exec vitest run scripts/lib/exceptions`. PASS, and an `A11Y_EXCLUSIONS` entry carries a commit and a PR.
- [ ] **Step 3: Commit.** `feat(exceptions): blame each entry to its commit and PR when emitting`

### Task 7: The delta on every PR

**Files:**
- Create: `apps/docs/scripts/exceptions-delta.mjs`, `apps/docs/scripts/lib/exceptions-delta.test.ts`
- Modify:
  - `.github/workflows/ci.yml`: a new job `exceptions-delta`, placed between `gates` and `product` in the file, so the product steps stay last in document order
  - `apps/docs/content/system/gates.ts`: a `PLUMBING` entry for the new step, with the reason "a report that never fails: it lists the allowances a PR adds"
  - `AGENTS.md`: "Twelve steps" becomes "Thirteen steps", and the job is named in the CI list
  - `.claude/skills/gate-run/SKILL.md`: "Twelve steps, in" becomes "Thirteen steps, in"
  - `apps/docs/content/system/facts.json`, via `pnpm --filter docs facts:emit`

Port REBUILD `scripts/exceptions-delta.mjs` and its test with all 21 `it`s. The index path is `apps/docs/index/exceptions.json`, relative to the repo root, which is the working directory in CI.

There is one behaviour change, the same one as in the MDS plan. A base ref without the index file reads as an empty index and exits 0, because `main` has none until this wave merges. "Exits 2 when the base ref cannot be read" becomes `it("a base ref with no index file reads as empty: every head entry is added, exit 0")`. Exit 2 stays for a missing base argument or an unreadable working-tree index.

The job:
- runs on `ubuntu-latest`;
- has `if: github.event_name == 'pull_request'` and `timeout-minutes: 5`;
- checks out with `actions/checkout@v7`, `fetch-depth: 0`;
- sets up node with `actions/setup-node@v7`, node 24, no cache;
- has one step named `Exceptions delta report` that runs `node apps/docs/scripts/exceptions-delta.mjs "$BASE_SHA"`;
- has no install step.

- [ ] **Step 1: Port the test.** Add `it("a swapped entry shows as one added and one removed, not a net zero")` (Review Focus 4). Run it and expect FAIL.
- [ ] **Step 2: Port the script.** Run the test and expect PASS. Then run `node apps/docs/scripts/exceptions-delta.mjs origin/main` from the root: exit 0, with a total of 29 added.
- [ ] **Step 3: Add the job and update the step word in both claims.** Add the `PLUMBING` entry, run `facts:emit`, then `cd apps/docs && pnpm exec vitest run content/system scripts/lib`. PASS.
- [ ] **Step 4: Commit.** `ci: report each PR's exceptions delta, flag three or more in one ledger`

### Task 8: The exceptions body, then close the wave

**Files:**
- Create: `docs/agent-rules/exceptions-index.md`
- Modify: `AGENTS.md` (one stub, with gates `apps/docs/scripts/lib/exceptions/emit.test.ts` and `apps/docs/scripts/exceptions-delta.mjs`)

- [ ] **Step 1: Write the body.** It covers what a ledger is here, the six ledgers, the reason rule, emit vs gate mode, the delta, and how to add an allowance, and it ends with `## What it costs`. Add its stub.
- [ ] **Step 2: Run the full local list from the root.** `.claude/skills/gate-run/run-gates.sh`, then `pnpm turbo run test --force`, then `pnpm check:ladder`. All green, and the ladder output matches Task 2 Step 1.
- [ ] **Step 3: Open the PR** against `main` on `VV-DSGN-INC/Super-AI-Components`. Its body carries:
  - the spec path and branch;
  - the REBUILD and MDS paths and commits;
  - the scrub;
  - "assumes the Super-AI rule schema";
  - the deviations below.

## Deviations from the spec

- **P4 moves from wave 2 into this wave for SAC.** The bodies are written here (Task 3), so they are written with their cost sections, and the cost check lands with them.
- **The swap fixture tests the delta, not a ratchet.** SAC has no count-based ratchet: every list here is per item (a path, a glob or a string). A per-file `exempt` entry stays a whole-file allowance, as the rule schema defines it; narrowing those to lines is a schema change for a later round. So the swap fixture is the delta test in Task 7.
- **`UNGATED.md` stays the list.** SAC keeps `docs/design-system/UNGATED.md`, rekeyed by body path, instead of MDS's `UNGATED` constant, because several docs link it by name.
- **`AXE_INCOMPLETE` waits for wave 3,** with P14's axe upgrade, as in the MDS plan.
