---
name: build-component
description: Build a batch of registry components end to end — manifest prep, scaffold, parallel fan-out, integration, gates. Use when adding components to the super-ai catalog or retrofitting existing ones.
---

# Building a batch

The full reasoning is in `docs/CONTINUE.md` §3. This is the sequence.

## 1. Prepare the manifest — you do this, not the agents

`apps/docs/lib/catalog.manifest.ts` is the single source of truth and the one
shared file. Set `status: "building"` and normalise each item's `states` into
clean kebab-case identifiers — the raw values came from a markdown table and
contain prose like `"8–14 items"`.

Three naming traps, all of which have bitten:

- **`default`, `meta` and `story` are reserved.** Their Pascal forms are the
  forbidden `Default` export and the story file's own `Meta`/`Story` imports.
  `check:contract` now rejects them (G4) — but rename them here rather than
  discovering it three steps later.
- **Two states that normalise to the same identifier silently collide.**
- Use meaningful names: `text-only`, `plain`.

## 2. Scaffold

```bash
cd apps/docs && pnpm new:component <name>
```

Five files per item, with deliberately failing tests.

## 3. Fan out — one agent per component

Dedicated fan-out agents for this step are **not yet part of this repo** —
their permission syntax needs verification against a real session, and that
lands in a follow-up. Until then, dispatch each builder as a general-purpose
agent pointed at `docs/design-system/component-build-brief.md`, one per
component, in parallel. Concurrency above ~16 just queues.

Give each agent **only**: its spec anchor, its declared states, and
component-specific steering — which shipped primitive it must compose, which
a11y trap applies to its shape, which prior component solved the same problem.

**Do not paste the house rules into the prompt.** The agent is pointed at
`component-build-brief.md`; a second copy is how instructions drift, which is
the reason the brief exists.

### Worktrees

Give each agent its own git worktree — they otherwise share a working tree and
each runs a repo-root `pnpm typecheck`, racing on `tsbuildinfo` and typechecking
against each other's half-written files.

Two things that have gone wrong anyway:

- **Check the worktree's base commit.** An isolated worktree may be cut from
  `main` rather than your integration branch, so it will not carry your manifest
  prep. Twelve agents once all reported "the five files were not scaffolded".
- **Take your own port and browser tab.** A sibling worktree's dev server on the
  same port will serve *its* build while your preview reports success.

## 4. Integrate

Use the `integrate-batch` skill.

## 5. Gates

Use the `gate-run` skill. Never hand-write a gate list.
