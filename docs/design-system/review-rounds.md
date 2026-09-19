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
