# Decisions, 2026-11-21 (agentic infra wave 1 build)

Each line is a choice made without Nick, with its reason. Nick asked for recommended decisions without waiting.

1. Plan of record is this repo's own copy, `docs/superpowers/plans/2026-10-21-agentic-infra-wave-1.md` (8 tasks, on `main` since PR 121). The ui-kit and Minimal Design System copies are one file (same remote) and are the MDS plan, with MDS paths and 12 tasks, so they cannot be built here.
2. Branch `build/agentic-infra-wave-1` is cut from `origin/main` `4ef49d2e`. PR 121 already merged the plan into `main`, and no ref holds any wave 1 code, so there is nothing earlier to start from.
3. The spec the plan cites (`2026-10-20-agentic-infra-port-design.md`) is on no Minimal Design System ref, so the plan text is the only authority and these rulings are provisional.
4. REBUILD (`design-system-rebuild`) is a Pegbo repo and is off limits for this run. Code the plan ports from it (the cost check, provenance, the delta script) is written fresh to the interfaces and behaviours the plan states, and the test counts it names are not matched one for one.
5. Task 1 Step 1 names `scripts/agents-provenance.test.ts`; the file is created at `apps/docs/scripts/lib/agents-provenance.test.ts`, as the Files list and Global Constraints require.
6. Per-task review is done by the controller, not by reviewer subagents, because the weekly usage cap is near its limit.
