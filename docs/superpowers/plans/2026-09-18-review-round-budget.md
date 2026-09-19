# Review-Round Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write down when a review stops in this repo, so ladder claim `09.3` flips from unmet to met, without pushing `CLAUDE.md` over its byte ceiling and without leaving any written mirror false.

**Architecture:** One new contract document, `docs/design-system/review-rounds.md`, holds the only full copy of the rule. `CLAUDE.md` gets a single 128-byte pointer line under `## Conventions`, worded so the ladder probe's two patterns match it. Three existing files that describe the old state are corrected in the same pull request. No code, no gate, no baseline and no registry file changes.

**Tech Stack:** Markdown; Prettier 3 (`printWidth: 110`, prose not re-wrapped); Vitest 4 for the pinned `claude-md.test.ts`; the vendored `tools/ds-architecture` conformance runner (plain Node, no install needed); pnpm 11; GitHub CLI.

**Spec:** [`../specs/2026-09-18-review-round-budget-design.md`](../specs/2026-09-18-review-round-budget-design.md). Read its §1 table first: every number this plan expects comes from there.

## Global Constraints

- Use `pnpm`, never npm. If `node_modules` is missing in this checkout, run `pnpm install --frozen-lockfile` from the repo root before anything else.
- Never commit to `main`. Before any push, run `git remote -v` and confirm out loud that the remote is `VV-DSGN-INC/Super-AI-Components`. Pushing needs the `weeeha` GitHub account.
- `CLAUDE.md` is pinned at or under **14,500 bytes** by `apps/docs/scripts/lib/claude-md.test.ts`. The `CEILING` constant is never raised. This plan adds exactly **128 bytes** to the file, in one line, and changes nothing else in it.
- Touch only the five files this plan names. Do not reword, re-wrap or "tidy" anything else in them.
- `format:check` is a CI gate. Run Prettier on every file you touch before committing.
- New prose written under this plan contains no em dashes and no exclamation marks. Text the plan tells you to keep verbatim keeps whatever it already has.
- This repository is public. Do not name any private repository, client or company in any file or in the pull request.
- Commit messages are conventional (`docs(scope): …`) and end with the attribution trailer your session was given.

## Decisions Nick makes before Task 1 starts

| #   | decision                     | default the plan assumes                                   | alternative                                                                 |
| --- | ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| D1  | where the pointer lives      | last bullet under `## Conventions` in `CLAUDE.md`          | a bullet under "Rules that are easy to break"; does not fit the byte budget |
| D2  | how many blocker classes     | seven, from the vendored reference, restated for this repo | five, folding "runtime defect" and "mandatory rule" into "a red gate"       |
| D3  | the round-4 stop             | included                                                   | delete the third bullet under "The budget" in Task 1 Step 3                 |
| D4  | where follow-ups are written | one line in `docs/CONTINUE.md` §8                          | GitHub issues, which this repo has never used                               |

If Nick has said nothing about these, use the defaults.

## The two entry states

Task 5 of `docs/superpowers/plans/2026-09-17-project-review-remediation.md` also edits `CLAUDE.md` and adds 123 bytes. Whether it has landed decides two numbers in this plan. Task 1 Step 1 tells you which state you are in.

| state | how to recognise it                                             | `CLAUDE.md` before | `CLAUDE.md` after this plan | Task 2 Step 3 |
| ----- | --------------------------------------------------------------- | ------------------ | --------------------------- | ------------- |
| **A** | `.github/workflows/ci.yml` still has a job named `verify`       | 14244              | 14372                       | do it         |
| **B** | `.github/workflows/ci.yml` has jobs named `gates` and `product` | 14367              | 14495                       | skip it       |

Any other combination of numbers: stop and report to Nick. Do not adjust the file to make a number fit.

---

### Task 1: The document and the pointer

**Files:**

- Create: `docs/design-system/review-rounds.md`
- Modify: `CLAUDE.md` (one line added after the last bullet of `## Conventions`)
- Test: `apps/docs/scripts/lib/claude-md.test.ts` (existing, unchanged), and the ladder probe `tools/ds-architecture/stages/09-loops-and-conventions/acceptance.mjs` (existing, unchanged)

**Interfaces:**

- Consumes: nothing.
- Produces: the path `docs/design-system/review-rounds.md`, which Task 2's three edits cite verbatim.

- [ ] **Step 1: Confirm the branch and find your entry state**

```bash
git fetch origin
git branch --show-current
git merge-base --is-ancestor origin/main HEAD && echo "contains origin/main"
wc -c CLAUDE.md
grep -c "^  verify:" .github/workflows/ci.yml
```

Expected: a branch name that is not `main`; the line `contains origin/main`; then either `14244` and `1` (state A) or `14367` and `0` (state B).

If `contains origin/main` is not printed, run `git merge origin/main`. The files this branch adds cannot conflict with anything on `main`. Then repeat the last two commands.

- [ ] **Step 2: Watch the probe fail**

```bash
node tools/ds-architecture/scripts/conformance.mjs . | grep "09.3"
```

Expected, exactly one line:

```
  09.3 — no review-round budget is written down
```

- [ ] **Step 3: Create `docs/design-system/review-rounds.md`**

Create the file with exactly this content. It is already Prettier-formatted; the table is wide on purpose, because that is how Prettier aligns it.

```markdown
# Review rounds and blockers

Review loops do not end on their own. This file says when one ends here: how many
rounds fix everything, what still holds a pull request after that, and where the
rest goes. It applies to every reviewer: Nick, a review skill, a subagent reviewer
inside a wave, or a bot.

The measured basis ships with the vendored ladder, in
`tools/ds-architecture/stages/09-loops-and-conventions/ACCEPTANCE.md`: a median of 6
review rounds per pull request, a maximum of 15, and 7 of 10 pull requests reaching
round 3 or beyond.

## A round

One review pass, plus the author's response to it. Round 1 is the first review of
the change, whether that happens on the pull request or on a wave's batch before the
pull request opens. The author states the round number when responding, for example
"Round 3: blockers only". Nothing counts rounds automatically.

## The budget

- **Rounds 1-2:** fix everything worth fixing.
- **From round 3:** fix blockers only. Every other finding becomes a follow-up: one
  line in `docs/CONTINUE.md` §8, written before the merge, naming the file and the
  finding. The pull request merges with that line in it.
- **Round 4 with a blocker still open:** stop and ask Nick. A blocker that survives
  two fixes usually means the approach is wrong, and another patch will not show that.

## Blockers

A blocker holds a pull request at any round.

| blocker                             | what it means here                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breaks a house contract             | The change contradicts `component-build-brief.md`, `block-build-brief.md`, `story-conventions.md`, or the normative specs (`catalog.md`, `component-specs.md`, `block-specs.md`). A block that reimplements what it should compose is this class. |
| Breaks a consumer without saying so | The change alters what `npx shadcn add` installs (files, props, `consumes` / `shadcn` / `npm`, cssVars) and the pull request does not say so.                                                                                                     |
| A red gate                          | Any step in `.github/workflows/ci.yml` fails. A red `apps/docs/scripts/consumer-test.sh` is a shipping bug, never a flake.                                                                                                                        |
| A runtime defect                    | The component throws, shows the wrong state, or loses input, in a story or on its docs page.                                                                                                                                                      |
| An accessibility regression         | A new axe failure, or a growing a11y exclusion list or `story-coverage.baseline.json`. Both lists may only shrink.                                                                                                                                |
| Wrong semantics                     | A `role` or `aria-*` that misdescribes the element.                                                                                                                                                                                               |
| Breaks a mandatory rule             | A `blocker`-severity record in `packages/ds-rules/rules/*.json`, or a bullet under "Rules that are easy to break by accident" in `CLAUDE.md`.                                                                                                     |

## Not blockers

From round 3 these go to `docs/CONTINUE.md` §8 and the pull request moves on:

- a naming preference
- a different structure that is equally correct
- an idea for one more test
- prose wording
- a "while you are here" refactor
- a performance concern with no measured regression

## A finding is a hypothesis

Check a finding against the code before acting on it. Reviewers are wrong often
enough, models included, that a fix applied on trust can add the defect it claims to
remove. When a finding is wrong, reply with the evidence and change nothing. When it
is right, fix it and say what you checked.

## What enforces this

Nothing mechanical. `pnpm check:ladder` claim `09.3` checks that the budget is
written into `CLAUDE.md`, and it cannot see a pull request. The line in `CLAUDE.md`
is a pointer under Conventions; this file is the only full copy.
```

- [ ] **Step 4: Add the pointer line to `CLAUDE.md`**

Find this line. It is the last bullet under `## Conventions`:

```markdown
- Branch per task; never commit to `main` directly. Deploys are manual, from `apps/docs`, and need the `weeeha` GitHub account — nothing deploys on merge.
```

Add this line directly below it, with no blank line between the two bullets:

```markdown
- Review budget: rounds 1-2 fix everything; from round 3 only a blocker holds the PR. → `docs/design-system/review-rounds.md`
```

Type it exactly. The hyphen in `1-2` is a plain hyphen, the arrow is `→` (U+2192), and there is one space on each side of the arrow. The wording is fixed by two things at once: the probe needs `rounds 1-2` or `round 3`, plus `blocker`, and the line may not exceed 133 bytes.

- [ ] **Step 5: Measure**

```bash
wc -c CLAUDE.md
```

Expected: `14372` in state A, `14495` in state B. If the number differs, the line was not typed exactly. Fix the line. Do not shorten any other part of the file and do not touch `CEILING`.

- [ ] **Step 6: Watch the probe pass**

```bash
node tools/ds-architecture/scripts/conformance.mjs . | sed -n '/^met:/,/^unmet:/p' | grep -c "09.3"
node tools/ds-architecture/scripts/conformance.mjs . | sed -n '/^unmet:/,/^unchecked:/p' | grep -c "09.3"
```

Expected: `1`, then `0`. Claim `09.1` stays under `unmet:`; that is correct and out of scope.

- [ ] **Step 7: Run the pinned test and Prettier**

```bash
pnpm --filter docs exec vitest run scripts/lib/claude-md.test.ts
pnpm exec prettier --check docs/design-system/review-rounds.md CLAUDE.md
```

Expected: every test passes, including "is under the ceiling" and "is within 2000 bytes of the ceiling"; Prettier prints `All matched files use Prettier code style!`. If Prettier complains about `review-rounds.md`, run it with `--write` on that one file and look at the diff: it should be whitespace only.

- [ ] **Step 8: Commit**

```bash
git add docs/design-system/review-rounds.md CLAUDE.md
git commit -m "docs(review): write down the review-round budget"
```

Append your session's attribution trailer to the message.

---

### Task 2: The mirrors, the gate, and the pull request

**Files:**

- Modify: `tools/ds-architecture/VENDOR.md` (one table row deleted, one bullet added)
- Modify: `docs/CONTINUE.md` (one paragraph in §8, under "Ladder stages 01 and 09, unmet and unfixed (2026-09-14)")
- Modify, state A only: `docs/superpowers/plans/2026-09-17-project-review-remediation.md` (three figures)

**Interfaces:**

- Consumes: the path `docs/design-system/review-rounds.md` from Task 1, and the entry state (A or B) from Task 1 Step 1.
- Produces: nothing a later task needs.

- [ ] **Step 1: Correct `tools/ds-architecture/VENDOR.md`**

Delete the one table row whose first cell is `` `09.3` ``. It is the line that starts with two spaces and then ``| `09.3` |``. Leave the other four rows and the header exactly as they are.

Then find the line that starts with `- **Local changes:**` and add this bullet above it, followed by one blank line:

```markdown
- **`09.3` closed 2026-09-18.** The review-round budget is
  `docs/design-system/review-rounds.md`, with a one-line pointer under
  Conventions in `CLAUDE.md` because the probe reads only that file. Four
  claims stay unmet, so `highestContiguous` is still **00**.
```

Check:

```bash
grep -c '| `09.3` |' tools/ds-architecture/VENDOR.md
grep -c '09.3` closed 2026-09-18' tools/ds-architecture/VENDOR.md
```

Expected: `0`, then `1`.

- [ ] **Step 2: Correct `docs/CONTINUE.md` §8**

Find this paragraph (search for `Two are cheap`):

```markdown
Two are cheap and self-contained, and are the place to start: `09.3` wants a
review-round budget written down, which the two sibling repos already carry
and this one has never written; `09.1` wants the instructions file to describe
both loops and the human gate, which lives in §3 here rather than in
`CLAUDE.md` — a deliberate split, so closing it means deciding whether the map
should carry a pointer or the claim should be excused.
```

Replace it with:

```markdown
`09.3` was closed on 2026-09-18: the review-round budget is
`docs/design-system/review-rounds.md`, with a one-line pointer under
Conventions in `CLAUDE.md` because the probe reads only that file, so
`pnpm check:ladder` now prints four unmet claims. One cheap claim is left:
`09.1` wants the instructions file to describe
both loops and the human gate, which lives in §3 here rather than in
`CLAUDE.md` — a deliberate split, so closing it means deciding whether the map
should carry a pointer or the claim should be excused.
```

The last four lines are the old text, kept verbatim. Leave the section heading and the paragraph above it alone: they are a dated record of 2026-09-14 and are still true of that date.

Check:

```bash
grep -c "Two are cheap" docs/CONTINUE.md
grep -c "was closed on 2026-09-18" docs/CONTINUE.md
```

Expected: `0`, then `1`.

- [ ] **Step 3 (state A only): Shift the three figures in the remediation plan**

Skip this step in state B.

Task 5 of that plan hard-codes `CLAUDE.md`'s size before and after its own edit, and tells its implementer that any other number means a mistake. Your 128 bytes make those numbers wrong. In `docs/superpowers/plans/2026-09-17-project-review-remediation.md`, make these three replacements and nothing else:

| find                                                                                           | replace with                                                                                            |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `It is 14,244 bytes today. Only Task 5 edits it,`                                              | `It is 14,372 bytes since 2026-09-18-review-round-budget.md landed. In this plan only Task 5 edits it,` |
| ``Expected: `14244`. The ceiling is 14,500; this task may add at most 256 bytes to the file.`` | ``Expected: `14372`. The ceiling is 14,500; this task may add at most 128 bytes to the file.``          |
| ``Expected: `14367` (the replacement adds 123 bytes;``                                         | ``Expected: `14495` (the replacement adds 123 bytes;``                                                  |

Check:

```bash
grep -c -e "14,244 bytes today" -e 'Expected: `14244`' -e 'Expected: `14367`' docs/superpowers/plans/2026-09-17-project-review-remediation.md
grep -c -e "14,372 bytes since" -e 'Expected: `14372`' -e 'Expected: `14495`' docs/superpowers/plans/2026-09-17-project-review-remediation.md
```

Expected: `0`, then `3`.

Then look for remediation Task 5 already in flight:

```bash
git branch -r | grep -i "ci-two-jobs"
gh pr list --state open --search "gates product in:title"
```

If either prints anything, keep your edits and add this sentence to your pull request body: "Remediation Task 5 is in flight; whichever of the two pull requests merges second must re-measure `wc -c CLAUDE.md` before merging."

- [ ] **Step 4: Format**

```bash
pnpm format:check
```

Expected: `All matched files use Prettier code style!`. If it names one of your files, run `pnpm exec prettier --write <that file>` and confirm with `git diff` that only whitespace moved.

- [ ] **Step 5: Run the full local gate**

Make sure nothing is listening on port 3100, then from the repo root:

```bash
.claude/skills/gate-run/run-gates.sh
```

Expected: every gate green. It takes about ten minutes because it builds the site and runs Playwright, the Storybook a11y gate and the consumer install test. A red gate here was not caused by five markdown edits: report it with its output instead of trying to fix it under this plan.

- [ ] **Step 6: Commit**

State A:

```bash
git add tools/ds-architecture/VENDOR.md docs/CONTINUE.md docs/superpowers/plans/2026-09-17-project-review-remediation.md
git commit -m "docs(continue): record ladder claim 09.3 as closed, and shift Task 5's byte figures"
```

State B:

```bash
git add tools/ds-architecture/VENDOR.md docs/CONTINUE.md
git commit -m "docs(continue): record ladder claim 09.3 as closed"
```

Append your session's attribution trailer to the message.

- [ ] **Step 7: Push and open the pull request**

```bash
git remote -v
```

Say the target out loud: repository `VV-DSGN-INC/Super-AI-Components`, the branch name from Task 1 Step 1, base `main`. Then:

```bash
git push -u origin HEAD
gh pr create --base main --title "docs(review): write down the review-round budget (ladder 09.3)" --body-file - <<'EOF'
TL;DR: this repo now says when a review stops. Ladder claim 09.3 goes from unmet to met. Docs only.

- New contract: `docs/design-system/review-rounds.md`. Rounds 1-2 fix everything; from round 3 only a blocker holds the PR; seven blocker classes in this repo's terms; an open blocker at round 4 goes to Nick.
- `CLAUDE.md` gains one 128-byte pointer line under Conventions, because the ladder probe reads only that file. The ceiling is unchanged.
- `VENDOR.md` and `CONTINUE.md` §8 no longer list 09.3 as unmet. 09.1 is still open.
- The remediation plan's Task 5 byte figures move by 128 so its "Expected" lines stay true.

Checked: `pnpm check:ladder` lists 09.3 under met; `claude-md.test.ts` green; `run-gates.sh` green.
EOF
```

Drop the fourth bullet in state B. Append the pull request attribution line your session was given. Nick edits the body by hand before anyone else reads it.

- [ ] **Step 8: Confirm on the pull request itself**

```bash
gh pr checks --watch
```

Expected: `verify` passes in state A; `gates` and `product` both pass in state B. Report the pull request URL to Nick. Do not merge.

---

## Self-review against the spec

| spec section                             | where the plan does it                                      |
| ---------------------------------------- | ----------------------------------------------------------- |
| §2.1 one copy of the rule, five contents | Task 1 Step 3                                               |
| §2.2 the pointer line and its byte count | Task 1 Steps 4 and 5                                        |
| §2.3 `VENDOR.md`                         | Task 2 Step 1                                               |
| §2.3 `CONTINUE.md` §8                    | Task 2 Step 2                                               |
| §2.3 remediation plan figures            | Task 2 Step 3, state A only                                 |
| §2.4 seven blocker classes               | the table inside Task 1 Step 3                              |
| §3 D1 to D4                              | "Decisions Nick makes before Task 1 starts"                 |
| §4 acceptance                            | Task 1 Steps 5 to 7, Task 2 Steps 4, 5 and 8                |
| §5 not in scope                          | nothing in the plan touches `09.1`, CI, a template or a bot |
