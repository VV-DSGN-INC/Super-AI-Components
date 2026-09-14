# Stage 09 — Loops and conventions

## Problem

Two loops move work through a design system, and both end at a human. None of that is
derivable from the code, so a session that has not been told re-derives it — differently
each time.

## What this stage establishes

The build loop, the audit loop, the human gate, the five co-located files a component
change produces, a review-round budget, and worktree discipline. All recorded in the
instructions file that stage 00's claim `00.1` located.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Checks are coarse | Presence, not prose quality | A convention nobody wrote down is re-litigated every session; one written badly at least has a place to be argued with |
| Where it lives | The instructions file, not a second document | It has to be in context whenever work happens, and a second file is a second thing to drift |
| Round budget | Rounds 1–2 fix everything; round 3+ non-blockers become follow-ups | Measured basis: median 6 rounds, max 15, 7 of 10 pull requests reaching round 3+ |
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
