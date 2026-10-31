# Starter kit

Files to copy into a design system, in the order the [manual](../MANUAL.md) applies them.

Files marked **harvested** are copied verbatim from a system that runs them against 154 components across nine token cells with CI on every commit. They are not illustrations. They carry that system's directory names and token names, and the porting note under each says exactly what to change — nothing more. Files marked **template** are shape only; every value in them is meant to be replaced.

Do not "improve" a harvested file before you have run it. Its comments record why each decision was made, and several of them record a specific failure that cost real time.

---

## 01-tokens

| File | Kind | Port it by |
|---|---|---|
| `globals.css` | template | Replacing every value. Keep the three-layer structure and the `@theme inline` block. |
| `tokens.ts` | template | Listing your own token names. This is the name contract with your design tool. |
| `themes/example-theme.css` | template | Renaming the attribute value and setting your accent + radius scale. |
| `finishes/example-finish.css` | template | Same. Note the import-order comment — it is load-bearing. |
| `liveness.test.ts` | **harvested** | Change `componentsDir` (line ~34, currently resolves to `../components`) and the token prefix in the `ROLES` regex (currently `--elevation-`). Everything else works as-is. |
| `contrast.test.ts` | **harvested** | Change the token pairs it asserts and the axis-cell list. Node built-ins only, no other edits. |
| `axis-scale.test.ts` | **harvested** | Change the rung names and the paths to your axis stylesheets. Node built-ins only. |

`liveness.test.ts` is the single most valuable file here. It walks declared token → `@theme inline` alias → a component that actually writes the utility, and it derives its token list from the CSS rather than hardcoding names — so a token added later arrives already gated instead of being the one nobody wired up.

## 02-rules

| File | Kind | Port it by |
|---|---|---|
| `schema.ts` | **harvested** | Nothing. It imports only `zod`. Drops in clean. |
| `core.ts` | **harvested** | Two edits: the `scope` arrays name that system's directories (`src/components`, `prototypes/proto-*`): replace with yours. One `fix` string names its icon adapter module (`lib/icons`): replace with yours or drop that rule. |
| `core.json` | **harvested** | Regenerate it from your edited `core.ts` rather than hand-editing. The drift gate exists to stop the two disagreeing. |
| `rulecheck.mjs` | **harvested** | Nothing. Node built-ins only. Check the path it reads rules from matches where you put the JSON. |
| `anti-slop-rules.md` | pointer | Nothing. It says where a rule's reasoning lives (its record's `title`, `fix` and `why`) and where the method lives (the unslop skill). Read it before relaxing a rule. |

## 03-gates

| File | Kind | Port it by |
|---|---|---|
| `settings.json` | template | Merge into your `.claude/settings.json`. It registers `rulecheck-hook.mjs` as a `PostToolUse` hook on every Write/Edit, in **warn mode**: the hook always exits 0. Do not make it blocking until every blocker rule has a passing false-positive fixture. |
| `rulecheck-hook.mjs` | template | Copy next to `rulecheck.mjs` (it imports `loadRules` and `scan` from it), at `scripts/` in your project. It reads the hook event on stdin, scans only the file just written for blocker-severity rules, reports only the lines the edit changed when git can say which, and says so when it could not check. Edit nothing unless your rules directory is not `rules/` at the project root. |
| `rulecheck-hook.test.ts` | template | Copy beside the hook. It copies the hook and `rulecheck.mjs` into a temp project with one rule and drives the hook with synthetic events: clean file, violation on a changed line, pre-existing hit left out, scan failure, path outside the project. Fix the `../02-rules/rulecheck.mjs` path if your layout differs. |
| `unslop-SKILL.md` | template | Copy to `.claude/skills/unslop/SKILL.md` and fill Phase 0 with your system's decisions and detector commands. The block between the `unslop-core` markers is generated: run the unslop plugin's `scripts/sync.mjs write <your repo>` to fill and stamp it, and `sync.mjs check` to see when it falls behind. |

## 04-component-meta

| File | Kind | Port it by |
|---|---|---|
| `component-meta.ts` | **harvested** | One real edit: it imports token groups from the source system's tokens package (line 3–12) to validate that every token a component claims actually exists. Repoint that at your own token module. Everything else is portable. |

This is the largest single file in the kit and worth reading before using. Its comments record four schema decisions that each cost real debugging time — most notably why `propName` exists separately from `prop` (a coverage gate built its lookup key out of human-readable prose and 57 obligations sat permanently unsatisfiable, with no signal telling the broken ones from the working ones).

## 09-conventions

| File | Kind | Port it by |
|---|---|---|
| `AGENTS.md.template` | template | Fill in your system's name and paths. Keep the Commands, Loops and Parallel-sessions sections — those are what a fresh agent session reads before it does anything. |
| `review-SKILL.md` | template | Copy to `.claude/skills/review/SKILL.md` and fill the one angle-bracket value. Keep the refutation stance, the six blocker classes and the cite-or-downgrade rule. Its input commands assume `scripts/rulecheck.mjs` and `scripts/test-changes.mjs`. |
| `test-changes.mjs` | template | Copy to `scripts/`. Stdlib only. Lists every line a PR removed or changed in a test, snapshot or baseline that existed before it (a line re-added in another test file is listed as moved, with its destination), read from the PR diff and the `## Test changes` section of its body. A report, never a gate. Exit 2 means an input was unreadable, which is not a clean report. |
| `test-changes.test.ts` | template | Copy beside the script and fix the import if you move either. Synthetic diffs only; each case is checked in both directions. |

---

## What is deliberately not here

- **A component library.** The architecture governs components; it does not supply them.
- **A design-tool sync script.** That work is API-specific and mostly manual. The manual's Part 8 covers what the contract has to guarantee.
- **The derivation pipeline** (extracting variant axes and token usage from source via the TypeScript AST). It is real and it works, but it is tightly coupled to one component-authoring style. Manual Part 5 describes the split it enforces — derived facts versus authored judgments — which is the transferable idea.
