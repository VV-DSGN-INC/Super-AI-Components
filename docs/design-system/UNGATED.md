# Rules with no gate, and why

Every stub in `AGENTS.md`
names a gate that exists, or appears here with the reason nothing enforces it.
`apps/docs/scripts/lib/agents-provenance.test.ts` checks both directions: a stub
with neither fails, and an entry below that no stub names fails, so a renamed
body breaks the match rather than drifting quietly.

An entry here is a debt, not a permission. When a gate becomes possible, write
it and delete the row.

| body (as named in AGENTS.md)               | why nothing enforces it                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/agent-rules/gate-list-mirrors-ci.md` | The `gate-run` skill is the discharge. A test that parsed skill prose against `ci.yml` would be a fourth copy of the list it protects.                        |
| `docs/agent-rules/green-proves-nothing.md` | Procedural: it says to rebuild before `playwright test`. The Playwright config runs `pnpm start`, and nothing in the tree can tell a stale build from source. |
| `docs/agent-rules/blocks-compose.md`       | A judgment. `block-build-brief.md` and review discharge it; a reimplemented row passes every mechanical gate, which is precisely what the rule exists to say. |
| `docs/agent-rules/parallel-builds.md`      | Procedural: it says to give each agent its own worktree and to check the base commit. Nothing in the tree can tell which checkout an agent was handed.        |
