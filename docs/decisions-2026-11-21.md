# Decisions, 2026-11-21 (agentic infra wave 1 build)

Each line is a choice made without Nick, with its reason. Nick asked for recommended decisions without waiting.

1. Plan of record is this repo's own copy, `docs/superpowers/plans/2026-10-21-agentic-infra-wave-1.md` (8 tasks, on `main` since PR 121). The ui-kit and Minimal Design System copies are one file (same remote) and are the MDS plan, with MDS paths and 12 tasks, so they cannot be built here.
2. Branch `build/agentic-infra-wave-1` is cut from `origin/main` `4ef49d2e`. PR 121 already merged the plan into `main`, and no ref holds any wave 1 code, so there is nothing earlier to start from.
3. The spec the plan cites (`2026-10-20-agentic-infra-port-design.md`) is on no Minimal Design System ref, so the plan text is the only authority and these rulings are provisional.
4. REBUILD (`design-system-rebuild`) is a Pegbo repo and is off limits for this run. Code the plan ports from it (the cost check, provenance, the delta script) is written fresh to the interfaces and behaviours the plan states, and the test counts it names are not matched one for one.
5. Task 1 Step 1 names `scripts/agents-provenance.test.ts`; the file is created at `apps/docs/scripts/lib/agents-provenance.test.ts`, as the Files list and Global Constraints require.
6. Per-task review is done by the controller, not by reviewer subagents, because the weekly usage cap is near its limit.
7. `AGENTS.md` keeps the em dashes it inherited from `CLAUDE.md`: it is the same house-style text moved, and rewording it was not the task. New bodies in `docs/agent-rules/` use none.
8. The size ceiling is 11,500 bytes (`AGENTS.md` measured 11,010 after the split, rounded up to the next 500). After the exceptions stub it is 11,377 bytes, so the next stub will need a byte trimmed elsewhere, since the ceiling may only go down.
9. Task 2 rekeyed `UNGATED.md` by body path and repointed `gates.ts`, both earlier than the plan placed them, so Task 4 had no edit of its own left and has no commit.
10. `MIGRATED_CEILING` is 25: the 29 entries minus the four `UNGATED` rows, which carry their own reasons.
11. `RawEntry` gained an optional `file`, because `RULE_EXEMPT` spans `core.ts` and `local.ts` and blame needs the file per entry.
12. The delta script is plain Node with no install and always exits 0 when it can run; exit 2 is kept for a missing base argument or an unreadable working-tree index.
13. Task 8 Steps 2 and 3 are not run as written: the controller runs the gate list, and opening the PR is out of scope for this run.
14. `format:check` fails on 19 files that fail identically on `origin/main` `4ef49d2e`; none is touched by this branch, so they are left for a separate format-only change.
