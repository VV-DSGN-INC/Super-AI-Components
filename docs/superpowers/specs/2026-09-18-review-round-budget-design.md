# Review-round budget: design

**Date:** 2026-09-18. **Baseline:** `main` at `9ded33d` (PR #58 merged). **Plan:**
[`../plans/2026-09-18-review-round-budget.md`](../plans/2026-09-18-review-round-budget.md).

This repo has never written down when a review stops. `docs/CONTINUE.md` §8 has
listed that as a gap since 2026-09-14, and `pnpm check:ladder` prints it as unmet
claim `09.3` on every run. This spec closes the claim with one new document, one
line in `CLAUDE.md`, and three edits that keep the written mirrors true.

Nothing here touches component code, the registry, a gate, or a baseline.

## 1. Measured state

| check                                                       | result                                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm check:ladder`                                         | `09.3` unmet: "no review-round budget is written down". Exit 0, `highestContiguous=00`                      |
| what the `09.3` probe reads                                 | `CLAUDE.md` only. It needs `/round\s*3\|rounds?\s*1[–-]2/i` and `/blocker/i` to match in that file          |
| `CLAUDE.md` size                                            | 14,244 bytes. Ceiling 14,500, enforced by `apps/docs/scripts/lib/claude-md.test.ts`; it may only be lowered |
| bytes already promised to someone else                      | 123, to Task 5 of `2026-09-17-project-review-remediation.md`, which has not started                         |
| bytes this work may add to `CLAUDE.md`                      | at most 133 (256 free, less Task 5's 123)                                                                   |
| the pointer line chosen in §2.2                             | 128 bytes with its newline. Both probe patterns match it                                                    |
| GitHub issues in this repo                                  | enabled, zero ever opened. Follow-ups live in `docs/CONTINUE.md` §8                                         |
| the probe's measured basis, from the vendored ACCEPTANCE.md | median 6 review rounds, max 15, 7 of 10 pull requests reaching round 3 or beyond                            |

The probe is `tools/ds-architecture/stages/09-loops-and-conventions/acceptance.mjs`.
It is coarse on purpose: it checks that the decision was recorded, and leaves the
quality of the wording to review.

## 2. Design

### 2.1 One copy of the rule: `docs/design-system/review-rounds.md`

`CLAUDE.md` is a map and must never restate a contract, so the budget gets its own
file beside the other contracts. The file says five things:

1. **What a round is.** One review pass plus the author's response to it. The
   reviewer can be Nick, a review skill, a subagent reviewer inside a wave, or a bot.
2. **The budget.** Rounds 1-2 fix everything worth fixing. From round 3, only a
   blocker is fixed in the pull request; every other finding becomes a follow-up
   line in `docs/CONTINUE.md` §8 before the merge.
3. **What counts as a blocker**, in this repo's terms (§2.4).
4. **Findings are hypotheses.** A finding is checked against the code before it is
   acted on. A wrong finding gets a reply with the evidence and no code change.
5. **The stop.** An open blocker at round 4 means the approach is probably wrong.
   Stop and ask Nick instead of patching again.

The wording starts from the vendored reference section,
`tools/ds-architecture/stages/09-loops-and-conventions/reference/AGENTS.md.section`,
which that file says to edit "to match how your system actually works". The full
text of the new document is in the plan, Task 1 Step 3.

### 2.2 The pointer in `CLAUDE.md`, and why it is worded the way it is

The probe reads only `CLAUDE.md`, so a pointer with no gist would leave `09.3`
unmet. The line carries the gist in the fewest bytes that satisfy both patterns:

```markdown
- Review budget: rounds 1-2 fix everything; from round 3 only a blocker holds the PR. → `docs/design-system/review-rounds.md`
```

It goes under `## Conventions`, as the last bullet. That section is the right home
because a review budget is conduct, and it has a practical effect too: the stub
provenance test only checks bullets under "Rules that are easy to break by
accident", so a Conventions bullet needs no gate path and no `UNGATED.md` row.

The line is 128 bytes. After it lands the file is 14,372 bytes, and after Task 5
of the remediation plan also lands it is 14,495: five bytes under the ceiling.
The ceiling is never raised to make room.

### 2.3 Mirrors that change in the same pull request

| file                                                              | change                                                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `tools/ds-architecture/VENDOR.md`                                 | delete the `09.3` table row; add one sentence recording the close and its date                                          |
| `docs/CONTINUE.md` §8, "Ladder stages 01 and 09"                  | replace the "Two are cheap" paragraph: `09.3` closed on 2026-09-18, `09.1` is the one cheap claim left                  |
| `docs/superpowers/plans/2026-09-17-project-review-remediation.md` | only if its Task 5 has not landed: shift the three byte figures it hard-codes by 128, so its "Expected" lines stay true |

The third row exists because Task 5 tells its implementer that any `wc -c` other
than `14367` means "the replacement was not applied verbatim". Left alone, that
sentence would send the next agent hunting for a mistake that is not there.

### 2.4 Blocker classes

The vendored reference names seven. Each is kept, stated as what it means here.

| class in the reference                                 | what it means in this repo                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contradicts approved requirements or a public contract | breaks `component-build-brief.md`, `block-build-brief.md`, `story-conventions.md`, or the normative specs. A block that reimplements what it should compose is this class |
| an unhandled breaking change                           | changes what `npx shadcn add` installs (files, props, `consumes` / `shadcn` / `npm`, cssVars) with no note in the pull request                                            |
| a build, type or test failure                          | any red step in `.github/workflows/ci.yml`. A red `consumer-test.sh` is a shipping bug, never a flake                                                                     |
| a runtime defect                                       | the component throws, shows the wrong state, or loses input in a story or on its docs page                                                                                |
| an accessibility regression                            | a new axe failure, or a growing a11y exclusion list or `story-coverage.baseline.json`                                                                                     |
| incorrect semantics                                    | a `role` or `aria-*` that misdescribes the element                                                                                                                        |
| a violation of a mandatory rule                        | a `blocker`-severity record in `packages/ds-rules/rules/*.json`, or a bullet under "Rules that are easy to break by accident"                                             |

Not blockers, listed in the document so nobody has to argue it: naming
preferences, an equally correct alternative structure, extra test ideas, prose
wording, "while you are here" refactors, and performance concerns with no measured
regression.

## 3. Decisions Nick can overrule

| #   | decision                     | default the plan assumes                                      | alternative                                                                                                                         |
| --- | ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| D1  | where the pointer lives      | last bullet under `## Conventions`                            | a bullet under "Rules that are easy to break" plus an `UNGATED.md` row. Costs about 30 more bytes, which does not fit beside Task 5 |
| D2  | how many blocker classes     | the reference's seven, restated for this repo                 | a shorter list of five (contract, consumer break, red gate, a11y, semantics), folding the other two into "gate"                     |
| D3  | the round-4 stop             | included: an open blocker at round 4 goes to Nick             | omit it; blockers are fixed for as many rounds as it takes                                                                          |
| D4  | where follow-ups are written | a line in `docs/CONTINUE.md` §8, which is already the backlog | start using GitHub issues, which this repo has never done                                                                           |

## 4. Acceptance

- `node tools/ds-architecture/scripts/conformance.mjs .` lists `09.3` under `met:`
  and no longer under `unmet:`. `09.1` stays unmet.
- `wc -c CLAUDE.md` prints `14372` if remediation Task 5 has not landed, `14495` if it has.
- `pnpm --filter docs exec vitest run scripts/lib/claude-md.test.ts` is green.
- `pnpm format:check` is green.
- The full local mirror, `.claude/skills/gate-run/run-gates.sh`, is green before the PR opens.

## 5. Not in scope

- **Claim `09.1`** (loops and the human gate in the instructions file). It costs
  more bytes than `CLAUDE.md` has left, and whether the map should carry it is an
  open decision recorded in `CONTINUE.md` §8.
- **A bot reviewer, a pull request template, or automatic round counting.** The
  author states the round number in the pull request when responding. That is the
  whole mechanism.
- **Minimal Design System.** Its `2026-09-05-agent-ready-design.md` lists the review
  budget under "Deliberately not ported". This spec does not reopen that.
- **CI concurrency and docs-only scoping.** Considered in the same session and
  handled separately, because it collides with remediation Task 5.
