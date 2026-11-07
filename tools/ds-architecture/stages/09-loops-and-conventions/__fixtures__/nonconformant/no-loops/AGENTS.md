# Example system

## Commands

Before claiming any change done: `npm run lint && npm run typecheck && npm test`.

## Layout

- `research/specs/` — dated design specs
- `research/plans/` — implementation plans

## Component changes

A component change produces five co-located files:
implementation, meta, tokens, stories, tests.

## Review rounds

Rounds 1–2 fix everything worth fixing. From round 3, a finding that is not a blocker
becomes a follow-up issue rather than a change in this pull request.

A **blocker** at any round: contradicts approved requirements or a public contract,
including contract prose the change made false; weakens an existing test or gate without
a reason the requirements support; an unhandled breaking change; a build, type or test
failure; a runtime defect; an accessibility regression; incorrect semantics; a violation
of a mandatory rule.

The review reads a test-change report: every line the change removed or changed in a
test that existed before it, set against the author's reasons under a `## Test changes`
heading in the PR body.

## Parallel sessions

Every concurrent agent session works in its own git worktree. One checkout has one HEAD.
Every checkout needs its own dependency install, including worktrees.
