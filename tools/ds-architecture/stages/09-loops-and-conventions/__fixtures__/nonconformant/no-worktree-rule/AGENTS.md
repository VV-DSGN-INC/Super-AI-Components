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

