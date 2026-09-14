# Example system

## Commands

Before claiming any change done: `npm run lint && npm run typecheck && npm test`.

## Layout

- `research/specs/` — dated design specs
- `research/plans/` — implementation plans

## Loops

The **build loop** runs on a component change: scaffold, then the five co-located files
(implementation, meta, tokens, stories, tests), then the usage contract with its why,
then the docs page from the same judgments.

The **audit loop** runs on merge: the detector, the rendered passes, the schema gates.

The **human gate**: review approves judgment, not syntax. A rejection is not finished
when the instance is fixed — encode it back into a rule so it cannot recur.

## Parallel sessions

Every concurrent agent session works in its own git worktree. One checkout has one HEAD.
Every checkout needs its own dependency install, including worktrees.
