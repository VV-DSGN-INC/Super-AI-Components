# Rules with no gate, and why

Every bullet under "Rules that are easy to break by accident" in `CLAUDE.md`
names a gate that exists, or appears here with the reason nothing enforces it.
`apps/docs/scripts/lib/claude-md.test.ts` checks both directions: a bullet
with neither fails, and the phrases below are matched against the file's own
bold text, so a reworded rule breaks the match rather than drifting quietly.

An entry here is a debt, not a permission. When a gate becomes possible, write
it and delete the row.

| leading phrase (verbatim from CLAUDE.md)               | why nothing enforces it                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A gate list must mirror `ci.yml`, in `ci.yml`'s order. | The `gate-run` skill is the discharge. A test that parsed skill prose against `ci.yml` would be a fourth copy of the list it protects.                        |
| A green run can prove nothing.                         | Procedural: it says to rebuild before `playwright test`. The Playwright config runs `pnpm start`, and nothing in the tree can tell a stale build from source. |
| Blocks compose; they do not implement.                 | A judgment. `block-build-brief.md` and review discharge it; a reimplemented row passes every mechanical gate, which is precisely what the rule exists to say. |
