# Consumer guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two registry items, `agent-kit` (rules file, routing index, `validate`) and `agent-kit-hooks` (opt-in edit-time hook and `check-tokens.mjs` shim), so the kit's agent rules and its token gate travel into a consumer app with `npx shadcn add`.

**Architecture:** The engine (`packages/ds-rules/rulecheck.mjs` and its detector modules) ships into the consumer as byte copies; what differs in a consumer is data (`rules.json` with rewritten scopes) and a thin CLI (`consumer/validate.mjs`). The rules prose is authored once in `apps/docs/lib/consumer-rules.ts`. Every kit file is emitted into `apps/docs/registry/agent-kit/` by the existing `pnpm contract:emit` loop, so the existing drift test in `contract-emit.test.ts` guards them, and `gen-registry.mts` points the two items at those paths.

**Tech Stack:** Node 24 ESM, stdlib only for anything that ships (the `no-deps.test.ts` rule), vitest, tsx, shadcn 4.x registry, bash for `consumer-test.sh`.

**Spec:** `docs/superpowers/specs/2026-11-06-consumer-guardrails.md` (decisions 1A, 2A, 3A). Read with `docs/superpowers/specs/2026-10-15-agent-surfaces-ledger-design.md` §3.5, which this narrows.

## Global Constraints

- Branch `claude/guardrails-rules-file-7f91be`, repo `VV-DSGN-INC/Super-AI-Components`. Never push to `main`. Nothing is pushed without Nick's go.
- Before Task 1: bring the branch up to `origin/main` with the `sync_with_base_branch` tool (it is 33 commits behind), then `pnpm install --offline --frozen-lockfile` from the repo root.
- Every file that ships into a consumer is stdlib-only ESM. No `zod`, no TypeScript, no `tsx`.
- `packages/ds-rules/` is provenance-tracked: any edit to `rulecheck.mjs` is a numbered divergence in its header and a row update in `packages/ds-rules/README.md`. `src/token-rules.mjs` is "moved verbatim" and is not edited; new detectors go in new files.
- Exit codes for the consumer `validate`: `0` clean, `1` any blocker, `2` could not run, `3` system change and no blocker. Blocker wins over system change.
- Hooks fail open (exit 0 on any internal error); `validate` fails closed.
- The kit never writes `CLAUDE.md`, `AGENTS.md` or `.claude/settings.json` in the consumer.
- Emitted `AGENTS.super-ai.md` is under 8192 bytes.
- Prose for people (README rows, PR text): no em dashes, no exclamation marks.
- Gate order is `ci.yml`'s, run from the repo root: `lint`, `format:check`, `typecheck`, `check:tokens`, `check:contract`, `test`, then `build:registry`, `build`, Playwright smoke, `test:stories`, `consumer-test.sh`. `.claude/skills/gate-run/run-gates.sh` runs the list; use `SMOKE_PORT=3101` if 3100 is held.

## Review Focus

- **A consumer with `src/`.** shadcn apps created with `--src-dir` put components under `src/components`. `validate` must scan `src/components/super-ai` as well, and `components.json` aliases decide. Test in Task 4.
- **A consumer that already has `scripts/check-tokens.mjs`.** Installing `agent-kit-hooks` would replace it. The item's `docs` string must say so, and `consumer-test.sh` runs with `--overwrite`, so the warning is the only guard. Test in Task 6 (the `docs` string names the path).
- **A rule scope added to the gate later.** `consumerRules` must throw on a scope it has no mapping for, so a new scope cannot silently vanish from consumers. Test in Task 5.
- **A gate rule with no line in the rules prose.** The coverage test in Task 5 fails when a blocker id in `rules/*.json` is not listed in any `CONSUMER_RULES[].checks`.
- **No git in the consumer.** `validate --system` outside a git work tree must exit 2 with a message, not 0. Test in Task 4.

---

### Task 1: `scan` takes vendored scopes as a parameter

**Files:**

- Modify: `packages/ds-rules/rulecheck.mjs` (`scan` signature; header divergence list)
- Modify: `packages/ds-rules/README.md` (`rulecheck.mjs` row: "eight divergences")
- Test: `packages/ds-rules/src/rulecheck.test.ts`

**Interfaces:**

- Produces: `scan(rules, files, root = REPO_ROOT, vendored = VENDORED_SCOPES) => { violations, unchecked, summary }`. Unchanged behaviour when `vendored` is omitted.

- [ ] **Step 1: Write the failing test** `it("demotes findings under a caller-supplied vendored scope")`: write a temp dir with `components/ui/x.tsx` containing `bg-[#123456]`, load TOK-1 with its scope set to `["components"]`, call `scan([rule], ["components/ui/x.tsx"], tmp, ["components/ui"])`, assert `violations[0].severity === "warning"` and `summary.blocker === 0`.
- [ ] **Step 2: Run** `pnpm --filter ds-rules test -- rulecheck` and expect FAIL (severity is `blocker`).
- [ ] **Step 3: Implement** the fourth parameter; the demotion loop reads `vendored` instead of the constant. Add divergence 8 to the header: "`scan` takes the vendored scopes as a parameter so the consumer kit can reuse this file byte for byte."
- [ ] **Step 4: Run** `pnpm --filter ds-rules test` and expect PASS, including the existing suite.
- [ ] **Step 5: Commit** `feat(ds-rules): scan takes vendored scopes as a parameter`.

### Task 2: MOT-3, unpaired motion, at severity `review`

**Files:**

- Create: `packages/ds-rules/src/motion-rules.mjs`
- Create: `packages/ds-rules/__fixtures__/MOT-3/bad/case.tsx`, `packages/ds-rules/__fixtures__/MOT-3/good/case.tsx`
- Modify: `packages/ds-rules/src/local.ts` (new record), `packages/ds-rules/rulecheck.mjs` (`STRUCTURAL["MOT-3"]`, import), `packages/ds-rules/rules/local.json` (emitted)
- Modify: `apps/docs/content/system/facts.json` (emitted) and any prose the claims ledger pins to `rules` / `rulesStatic`
- Test: `packages/ds-rules/src/motion-rules.test.ts`

**Interfaces:**

- Produces: `findUnpairedMotion(file: string, source: string) => string[]`. Each message is `${file}:${line}`, then the separator `structuralFindings` splits on (space, U+2014, space, as in `token-rules.mjs`), then the prose.

- [ ] **Step 1: Write the failing tests**:
  - `"animate-pulse"` alone gives 1 finding; `"animate-pulse motion-reduce:animate-none"` gives 0.
  - `"transition-transform duration-200"` gives 1; with `motion-reduce:transition-none` it gives 0.
  - `"transition-colors"`, `"animate-none"`, `"animate-spin"` give 0 (colour fades and progress spinners are not movement).
  - `"motion-safe:animate-in"` gives 0 (already gated on the preference).
  - The line number is the line of the string's opening quote.
- [ ] **Step 2: Run** `pnpm --filter ds-rules test -- motion-rules` and expect FAIL (module missing).
- [ ] **Step 3: Implement** `findUnpairedMotion`. The algorithm the tests do not pin: for each quoted run `/(["'`])([^"'`\n]\*)\1/g`, split on whitespace; a movement token matches `/(^|:)(animate-(?!none|spin)[a-z0-9-]+|transition-transform|transition)$/`and does not start with`motion-reduce:`or`motion-safe:`; the string is unpaired when it has a movement token and no token starting `motion-reduce:`.
- [ ] **Step 4: Add the record** to `local.ts`, shaped like TOK-4's: `id: "MOT-3"`, `severity: "review"`, `detect.method: "heuristic"`, scope and include equal to MOT-2's, `falsePositives: "A pair set in a sibling cn() argument or in CSS under prefers-reduced-motion is not seen."`, `fix: "Pair the animation with motion-reduce:animate-none or motion-reduce:transition-none in the same class string."`, `why: "Movement that ignores the OS reduced-motion setting fails the users who asked for less of it."` Route it in `STRUCTURAL`. Write the two fixtures.
- [ ] **Step 5: Emit and run** `pnpm --filter ds-rules rules:emit && pnpm --filter ds-rules test`; expect PASS. Then `pnpm check:tokens` from the root: expect exit 0 with about 37 `MOT-3 [review]` lines (measured 37 on `origin/main`). A blocker exit means the severity is wrong.
- [ ] **Step 6: Facts** `cd apps/docs && pnpm facts:emit`; expect `rules: 21`, `rulesStatic: 19`, `ruleBlockers: 17`. Run `pnpm test` and fix any prose sentence the claims ledger flags.
- [ ] **Step 7: Commit** `feat(ds-rules): MOT-3 flags movement with no motion-reduce pair, as review`.

### Task 3: `systemChanges`, the diff classifier

**Files:**

- Create: `packages/ds-rules/consumer/system-diff.mjs`
- Test: `packages/ds-rules/consumer/system-diff.test.ts`

**Interfaces:**

- Produces: `systemChanges({ diff: string, untracked: string[], dirs: { ui: string, kit: string } }) => Array<{ file: string, reason: "new-primitive" | "installed-edit" | "token-change" }>`. Pure: the caller runs git.

- [ ] **Step 1: Write the failing tests** against small unified diffs (`--unified=0`):
  - New file `components/ui/slider.tsx` (`new file mode` header) gives `new-primitive`; the same path in `untracked` does too.
  - Modified `components/super-ai/cost-chip.tsx` gives `installed-edit`; modified `components/ui/button.tsx` does too.
  - `app/globals.css` with `+  --brand: oklch(...)` or `-  --radius: 0.5rem;` gives `token-change`.
  - `app/page.tsx` added, `components/settings-form.tsx` modified, and a `.css` hunk with no custom-property line all give `[]`.
  - One entry per file and reason, sorted by file.
- [ ] **Step 2: Run** `pnpm --filter ds-rules test -- system-diff`; expect FAIL.
- [ ] **Step 3: Implement**. Token lines match `/^[+-]\s*--[a-z0-9-]+\s*:/` in any `.css` hunk (documented false positive: a component-local custom property in CSS).
- [ ] **Step 4: Run** again; expect PASS. `no-deps.test.ts` must still pass with `consumer/` in its walk; extend its glob if it does not cover `consumer/`.
- [ ] **Step 5: Commit** `feat(ds-rules): classify diffs that change the system`.

### Task 4: `consumer/validate.mjs`, the CLI and `lintText`

**Files:**

- Create: `packages/ds-rules/consumer/validate.mjs`
- Test: `packages/ds-rules/consumer/validate.test.ts`

**Interfaces:**

- Consumes: `scan` (Task 1, imported as `./rulecheck.mjs` relative to the installed layout), `systemChanges` (Task 3, `./system-diff.mjs`).
- Produces:
  - `resolveDirs(cwd: string) => { ui, kit, scopes: string[], vendored: string[] }`, from `components.json` aliases (`@/` stripped, `src/` prefixed when `src/` exists), defaults `components/ui`, `components/super-ai`.
  - `lintText(relPath: string, text: string) => Array<{ why: string, values: string[] }>`, synchronous, the shape `~/.claude/hooks/design-token-guard.mjs` reads; one entry per rule id, `why` is the record's `why` or `title`, `values` are the snippets. Works by writing `text` into a temp dir at `relPath` and calling `scan` there.
  - CLI: `node validate.mjs [paths...] [--system [--base <ref>]] [--json]`; with no paths it walks `scopes`.
- Layout assumption: at install time `validate.mjs`, `rulecheck.mjs`, `src/token-rules.mjs`, `src/motion-rules.mjs`, `system-diff.mjs` and `rules.json` sit together in `scripts/super-ai/`. The test builds that layout in a temp dir by copying the package files, so it runs the shipped shape, not the repo one.

- [ ] **Step 1: Write the failing tests** (each in a fresh temp consumer with a `components.json`):
  - Clean `components/super-ai/a.tsx` exits 0.
  - Planted `app/x.tsx` with `bg-[#ff0000]` exits 1, and stdout names TOK-1.
  - The same hex under `components/ui/` exits 0, line tagged `WARN`.
  - `src/components/super-ai/b.tsx` with a palette class, alias `@/components` and a `src/` dir, exits 1.
  - A MOT-3 finding alone exits 0.
  - `--system` after `git init` and a commit, then a new `--brand:` line in `app/globals.css`, exits 3; with a planted hex as well it exits 1.
  - `--system` with no git exits 2, and stderr says git is required.
  - `lintText("app/x.tsx", '<div className="bg-[#fff]" />')` returns one entry whose `values[0]` contains `#fff`; clean text returns `[]`.
- [ ] **Step 2: Run** `pnpm --filter ds-rules test -- validate`; expect FAIL.
- [ ] **Step 3: Implement**. Load `rules.json` beside the script; keep `grep` and `heuristic` records only. `--system` runs `git diff --unified=0 <base>` (default `HEAD`) and `git ls-files --others --exclude-standard`, prints each `systemChanges` entry as `SYSTEM <reason> <file>`, then the line "Rule 5: show this diff to the human before continuing." Any thrown error exits 2.
- [ ] **Step 4: Run** again; expect PASS.
- [ ] **Step 5: Commit** `feat(ds-rules): consumer validate CLI and lintText`.

### Task 5: The rules source and the kit emitter

**Files:**

- Create: `apps/docs/lib/consumer-rules.ts`
- Create: `apps/docs/scripts/lib/agent-kit-emit.ts`
- Modify: `apps/docs/scripts/lib/contract-emit.test.ts` (merge kit files into the drift loop; the orphan check covers `registry/agent-kit/`)
- Modify: `.prettierignore` (add `apps/docs/registry/agent-kit/`, reason: emitted and byte-compared)
- Create (emitted, committed): `apps/docs/registry/agent-kit/**`
- Test: `apps/docs/scripts/lib/agent-kit-emit.test.ts`

**Interfaces:**

- Produces:
  - `CONSUMER_RULES: ReadonlyArray<{ n: 1|2|3|4|5|6, title: string, body: string, why: string, checks: string[] }>`. Text is the spec §3 block, verbatim, with rule 6's path `scripts/super-ai/validate.mjs`. `checks`: R2 `TOK-1` to `TOK-8`, `COL-1`, `CHT-1`, `CHT-3`; R3 `MOT-1`, `MOT-2`, `MOT-3`; R6 `CPY-1`, `ICO-1`, `ICO-2`, `STA-3`, with the body line "The check also covers generic CTAs, icons from outside lucide-react, emoji in chrome, and outline-none with no focus-visible replacement."
  - `renderAgentsFile(rules: typeof CONSUMER_RULES) => string`: the banner "Generated by Super AI Components agent-kit. Do not edit; reinstall to update.", the rules, then a "Where to look" section naming `components/super-ai/index.toon`, then `<name>.meta.json`, then `https://super-ai-components.vercel.app/llms.txt`, with "the installed file wins on conflict".
  - `consumerRules(records: Rule[]) => Rule[]`: drops `rendered` and `judgment`; rewrites scopes with the map `apps/docs/registry/super-ai` to `components/super-ai`, `apps/docs/registry/marketing` to `components/marketing`, `apps/docs/components` to `components`, `apps/docs/app` to `app`, each plus its `src/` twin; throws `unmapped scope <s>` otherwise.
  - `agentKitFiles(input: { toon: string, records: Rule[], sources: Record<string, string> }) => Map<string, string>` with keys under `registry/agent-kit/`: `AGENTS.super-ai.md`, `index.toon`, `scripts/super-ai/{validate,rulecheck,system-diff}.mjs`, `scripts/super-ai/src/{token-rules,motion-rules}.mjs`, `scripts/super-ai/rules.json`, `scripts/check-tokens.mjs`, `hooks/super-ai-guard.mjs`. `sources` holds the byte-copied files, read by the test from `packages/ds-rules`.

- [ ] **Step 1: Write the failing tests**:
  - `renderAgentsFile(CONSUMER_RULES)` is under 8192 bytes, contains each rule's `Why:` line, and contains no U+2014.
  - Coverage: every `severity: "blocker"` id in `packages/ds-rules/rules/*.json`, plus MOT-3, appears in exactly one `checks` list.
  - `consumerRules` rewrites MOT-2's scope to the four consumer paths and throws on `apps/docs/lib`.
  - `agentKitFiles` copies each source byte for byte (string equality against `sources`).
- [ ] **Step 2: Run** `cd apps/docs && pnpm vitest run scripts/lib/agent-kit-emit.test.ts`; expect FAIL.
- [ ] **Step 3: Implement** the module, the renderer and the emitter. The shim and hook sources are authored here as two small template strings in `agent-kit-emit.ts`:
  - Shim: `export { lintText } from "./super-ai/validate.mjs"`.
  - Hook: PreToolUse on Write, Edit and MultiEdit; takes the candidate text the same way the global hook does; imports `../../scripts/super-ai/validate.mjs` relative to itself; on findings, exits 2 with the findings and the line "Use the theme's semantic utilities. If no token fits, ask the human before adding one (rule 5)."; exits 0 on any error.
- [ ] **Step 4: Wire into the drift loop**: in `contract-emit.test.ts`, merge `agentKitFiles(...)` into `files` before the write/compare, using `files.get("index/components.toon")` for `toon`, and extend the orphan scan to `registry/agent-kit/`.
- [ ] **Step 5: Emit and run** `cd apps/docs && pnpm contract:emit && pnpm test`; expect PASS, and `git status` shows the new `registry/agent-kit/` tree.
- [ ] **Step 6: Commit** `feat(agent-kit): rules source and emitter for the consumer kit`.

### Task 6: The two registry items, proven in `consumer-test.sh`

**Files:**

- Modify: `apps/docs/scripts/gen-registry.mts` (two items appended to `allItems`)
- Modify: `apps/docs/scripts/consumer-test.sh` (assertions after install)
- Modify (emitted): `apps/docs/registry.json`

**Interfaces:**

- Consumes: the `registry/agent-kit/` paths from Task 5.
- Produces: items `agent-kit` and `agent-kit-hooks`, `type: "registry:item"`, every file `registry:file`.
  - `agent-kit` targets: `~/AGENTS.super-ai.md`, `components/super-ai/index.toon`, and `~/scripts/super-ai/...` (seven files).
  - `agent-kit-hooks`: `registryDependencies: [self("agent-kit")]`; targets `~/scripts/check-tokens.mjs` and `~/.claude/hooks/super-ai-guard.mjs`.
  - `docs` strings. agent-kit: "Add `@AGENTS.super-ai.md` to your CLAUDE.md, or point AGENTS.md at it. Run `node scripts/super-ai/validate.mjs` before calling UI done." agent-kit-hooks: "Replaces scripts/check-tokens.mjs if you have one. To enable the hook, add a PreToolUse entry for Write|Edit|MultiEdit running `node .claude/hooks/super-ai-guard.mjs` to .claude/settings.json."

- [ ] **Step 1: Verify the root target first.** Add only `agent-kit` with its `~/AGENTS.super-ai.md` file, run `pnpm build:registry`, then `bash apps/docs/scripts/consumer-test.sh` with a temporary `ls "$TMP/consumer/AGENTS.super-ai.md"` after the install line. If shadcn rejects `~/` or lands the file elsewhere, fall back to `components/super-ai/agent-kit/` for every kit target, update the shim and hook relative imports, `renderAgentsFile`'s paths and the `docs` strings, and record the fallback in the spec's changelog.
- [ ] **Step 2: Write the failing assertions** in `consumer-test.sh`, after the install and before "Using the components in a page". Each failure uses the script's existing `CONSUMER INSTALL TEST: FAIL` prefix:
  - Before install, write a sentinel `CLAUDE.md`; after, it is byte-identical.
  - `AGENTS.super-ai.md` and `scripts/super-ai/validate.mjs` exist.
  - `node scripts/super-ai/validate.mjs` exits 0 on the installed tree.
  - Plant `app/planted.tsx` with `bg-[#ff0000]`: exit 1. Remove it.
  - `git init -q`, `git add -A`, `git -c user.email=t@t -c user.name=t commit -qm base`, then append `--planted: 1px;` inside `:root` of the global stylesheet: `validate --system` exits 3. `git checkout -- .` after.
  - `node -e` imports `./scripts/check-tokens.mjs` and asserts `lintText("app/x.tsx", '<div className="bg-[#fff]" />').length === 1`.
  - Piping a Write payload with a hex into `node .claude/hooks/super-ai-guard.mjs` exits 2, and a clean payload exits 0.
- [ ] **Step 3: Run** `bash apps/docs/scripts/consumer-test.sh` with the assertions but without `agent-kit-hooks`; expect FAIL at the shim assertion. This shows the assertions catch something.
- [ ] **Step 4: Add `agent-kit-hooks`**, then `pnpm build:registry` and run the consumer test again; expect `CONSUMER INSTALL TEST: PASS`.
- [ ] **Step 5: Run** `cd apps/docs && pnpm vitest run lib/catalog.manifest.test.ts && pnpm facts:emit`; commit any facts change with the claims prose it moves.
- [ ] **Step 6: Commit** `feat(agent-kit): agent-kit and agent-kit-hooks registry items`.

### Task 7: Full gates and hand-back

**Files:**

- Modify: `docs/CONTINUE.md` §8 (one line: MOT-3 promotion follow-up, 37 strings in 24 files)
- Modify: `docs/superpowers/specs/2026-11-06-consumer-guardrails.md` changelog (built, with the commit range)

- [ ] **Step 1: Run** `.claude/skills/gate-run/run-gates.sh` from the repo root in the foreground; every step green in `ci.yml` order. Report the actual output if a step is red; do not reorder or skip.
- [ ] **Step 2: Plant-check the gate**: temporarily add `bg-[#123456]` to one `registry/super-ai` file, confirm `pnpm check:tokens` exits 1, revert. A gate that stays green here proves nothing.
- [ ] **Step 3: Commit** `docs: record the agent-kit build and the MOT-3 follow-up`.
- [ ] **Step 4: Stop.** Report the commit range and the gate output to Nick. Push, PR and deploy wait for his go; the PR body says the validate CLI is worth carrying to the Minimal Design System and which schema it assumes.

## Out of this plan

- Fixing the 37 unpaired motion strings and promoting MOT-3 to `blocker`.
- A docs page for the kit, and the ledger's harness and rows.
- Changing `~/.claude/hooks/design-token-guard.mjs`. Its message tells agents to add a token to `globals.css` when none fits, which contradicts rule 5. Flagged to Nick separately.
