# Stage 09 — Loops and conventions

## Problem

Two loops move work through a design system, and both end at a human. None of that is
derivable from the code, so a session that has not been told re-derives it — differently
each time.

## What this stage establishes

The build loop, the audit loop, the human gate, the five co-located files a component
change produces, a review-round budget with its blocker taxonomy, and worktree
discipline. All recorded in the instructions file that stage 00's claim `00.1` located.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Checks are coarse | Presence, not prose quality | A convention nobody wrote down is re-litigated every session; one written badly at least has a place to be argued with |
| Where it lives | The instructions file, not a second document | It has to be in context whenever work happens, and a second file is a second thing to drift |
| Round budget | Rounds 1–2 fix everything; round 3+ non-blockers become follow-ups | Review loops do not end on their own; a cap on what a PR must absorb keeps them finite |
| Blocker classes | Two named beyond defects: a weakened existing test or gate, and contract prose the change made false | A reviewer that reads only for defects approves both: a test that keeps its name and passes while pinning less, and prose that now says something the code no longer does. |
| Test-change report | A script lists every line a change removed or changed in tests that existed before it, with the author's reasons from the PR body | Adding a test is free; taking a line from an existing one is how a regression passes its own suite. Checking that a review reads it is `unchecked` (`09.6`) |
| Worktree rule | One session, one worktree, one install each | One checkout has one HEAD; switching branches carries other sessions' uncommitted files onto your branch |
| Missing file | Every claim `unchecked`, not `unmet` | "I could not look" is not "I looked and it is missing" — the same ruling stage 00 makes |

## Rejected alternatives

- **Judging prose quality.** That is a `judgment` check, which belongs to a skill that
  reasons, not to a probe that reads.
- **A separate CONVENTIONS.md.** A second document is a second thing to drift from the
  first, and it would not be in context when it matters.
- **Reporting `unmet` when the instructions file is absent.** Three claims failing
  because one file is missing hides which fact is actually wrong, and it breaks the
  single-fault property every fixture relies on.
