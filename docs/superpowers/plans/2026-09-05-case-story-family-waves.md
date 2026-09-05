# Case-story family waves — the wave brief

**Spec:** [`2026-08-14-story-guarantees-retrofit-design.md`](../specs/2026-08-14-story-guarantees-retrofit-design.md)
§3.2 (family waves) and §3.4 (fix policy). This plan is the brief a wave agent is
handed; the contracts it points at are the only copy of the rules
(`CONTINUE.md` §3.4 — never paste them into a prompt).

**What changed since the spec:** the gate landed first, as a shrink-only ratchet
(`story-conventions.md` "Scope today"). A wave therefore does not prepare the
tree for a gate — it shrinks `story-coverage.baseline.json`. Both kinds of debt
in that file are in scope for the same agent, in the same file-opening: the
eight case names, and a JSDoc description above every declared-state export.

**Waves** (one agent per item, in parallel, integrated centrally):

| wave | families | items |
| --- | --- | --- |
| 1 | D, I | 11 |
| 2 | E, P | 11 |
| 3 | F, L | 11 |
| 4 | H, M | 11 |
| 5 | J, K | 12 |
| 6 | N | 8 |
| 7 | O | 13 |

Plus 18 items whose only debt is descriptions (A 2 · B 7 · C 5 · E 1 · K 1 ·
M 1 · N 1) — same procedure, steps 3b onward. `pnpm story-coverage:report`
from `apps/docs` is the live list; recount with it rather than trusting the
table.

## Agent procedure

You own exactly one item. Read this whole file before doing anything.

### 1. Make your worktree current

Agent worktrees are cut from `origin/main`, which lacks the ratchet, this
brief and the earlier waves. From your worktree root:

```bash
git merge --ff-only claude/component-stories-specs-b80050
pnpm install --offline --frozen-lockfile
```

Confirm `git log --oneline -1` shows a commit on or after `feat(stories):
story-coverage ratchet`. If the fast-forward refuses, stop and report.

### 2. Read, in this order

1. [`docs/design-system/story-conventions.md`](../../design-system/story-conventions.md) — whole file. The eight, the skip grammar, the four mechanical facts, the play-function rule.
2. [`docs/design-system/component-build-brief.md`](../../design-system/component-build-brief.md) §Story.
3. The spec's §3.4 fix policy (link above): mechanical fixes land in-wave, behavioural fixes are recorded and never pinned.
4. Exemplars: `apps/storybook/src/stories/super-ai/SuggestionChips.stories.tsx` (pilot — the skip-comment block), `RunButton.stories.tsx` (wave 0). If your component renders inside a Base UI portal (dialog, popover, sheet, menu, select, tooltip), also `TaskTray.stories.tsx` and `ShortcutsSheet.stories.tsx` before writing `KeyboardOrder`.
5. Your own item: the component source `apps/docs/registry/super-ai/<name>.tsx`, its docs module `apps/docs/content/components/<name>.docs.tsx`, its spec anchor in `component-specs.md` or `block-specs.md`, and the existing story file `apps/storybook/src/stories/super-ai/<Pascal>.stories.tsx`.
6. `cd apps/docs && pnpm story-coverage:report <name>` — your exact obligations.

### 3. Write

**3a. The case-story block.** Each of the eight is either written or recorded as
`// case-skip: <Name> — <reason>` in the convention's grammar. Write only the
ones true for this component; a story written to complete the set is worse than
a skip. `Controlled` and `KeyboardOrder` without play functions do not count.
Every story gets a JSDoc description that carries the judgment.

**3b. Descriptions.** A JSDoc block directly above every declared-state export
the report names. Say what the state is for and what a reader should notice —
never restate the export name.

**Files you may touch:** your story file; your component source
(`apps/docs/registry/super-ai/<name>.tsx`) only for a mechanical fix under §3.4
(`motion-reduce:*` beside an animation, the `[--muted-foreground:…]` rebind on a
painted surface, or the physical→logical class swap that is byte-identical in
LTR — `pl-`→`ps-`, `ml-`→`ms-`, `border-l`→`border-s`, `text-left`→`text-start` —
which `CONTINUE.md` §8 "Logical properties" sanctions; a swap that is not
byte-identical is recorded, never swept). **Never:** `apps/docs/lib/catalog.manifest.ts`,
`story-coverage.baseline.json`, the convention docs, the a11y exclusion list,
any other component's files. If a story needs a change outside that list, record
the gap in the story description and your report instead.

### 4. Verify

```bash
cd apps/docs && pnpm story-coverage:report <name>            # must print 0 unmet, exit 0
cd ../storybook && pnpm exec vitest run --project storybook src/stories/super-ai/<Pascal>.stories.tsx
pnpm --filter storybook typecheck
```

If you touched the component source, also from the repo root:
`pnpm --filter docs lint`, `pnpm --filter docs typecheck`, `pnpm check:tokens`,
and `cd apps/docs && pnpm exec vitest run registry/super-ai/<name>.test.tsx`.

Do not start `storybook dev`: sibling worktrees share the machine and the port,
and a dev server is not the verification — the vitest run is. If the offline
install fails, report it; do not install from the network.

`apps/docs/scripts/lib/story-coverage.test.ts` will now fail in your worktree on
"the committed baseline holds no resolved entries", listing your item's keys.
That is expected and is the integrator's job. **Do not run
`pnpm story-coverage:baseline`.**

### 5. Commit

One commit on your worktree branch, author set on the command line
(`CONTINUE.md` §3.6):

```bash
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit -am "feat(stories): case stories — <name>" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### 6. Report, tersely

- Written: which of the eight, one line each on what the story shows.
- Skipped: which, with the reason as committed.
- Defects: fixed in-wave (mechanical) vs recorded (behavioural), each with the evidence.
- Judgment calls and anything ambiguous in the convention or the spec — flag, don't bury.
- Files touched, commit SHA, branch name, and the vitest counts.

## Integrator procedure

1. `git cherry-pick <sha>` each agent commit onto the integration branch (distinct files — no conflicts expected; if one appears, stop and read it).
2. `cd apps/docs && pnpm story-coverage:baseline` — must shrink; it refuses to grow.
3. From the repo root, the gate list in `ci.yml` order: `lint` → `typecheck` → `check:tokens` → `check:contract` → `test` → `build:registry` → `build` → Playwright (`cd apps/docs && pnpm exec playwright test`, after the build) → `cd apps/storybook && rm -rf node_modules/.cache/storybook && pnpm test:stories`. The consumer install test only when registry sources changed.
4. Record what the wave found in `CONTINUE.md` §8/§9 (defects, gaps, judgment calls worth keeping), then one commit: `feat(stories): case-story retrofit — family <X>, baseline ratcheted`.
5. `git worktree remove --force <agent worktree>` and delete its branch.
