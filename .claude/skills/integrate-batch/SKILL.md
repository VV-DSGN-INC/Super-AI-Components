---
name: integrate-batch
description: Land a finished batch of components — reconcile declared dependencies against real imports, regenerate wiring, run the gates. Use after a parallel build fan-out completes.
---

# Integrating a batch

You do this centrally. Agents never touch the manifest.

## 1. Reconcile declared deps against real imports

```bash
cd apps/docs && pnpm reconcile:deps <name> <name> ...
```

Omit the names to check the whole catalog. It prints `declared` vs `real` for
`shadcn` and `consumes`.

**Never take these from the catalog's assumed bases** — it names primitives this
repo does not vendor — **and never from a builder's own declared list.** Only
real imports.

### `@base-ui/react` in `npm`

Normally omitted: it arrives as a peer of any vendored `ui/` primitive the
component also imports, which is why `parameter-panel`, `run-button` and
`compare-viewer` all declare `[]`. The exception is a component importing **no**
`ui/` primitive at all — `time-ruler` uses only `@base-ui/react/slider`, so
nothing would drag the package in and it declares `npm: ["@base-ui/react"]`.
Check rather than assuming.

## 2. Update the manifest and regenerate

Set `shadcn` / `consumes` / `npm` from the real column, flip `status` to
`"shipped"`, then:

```bash
cd apps/docs && pnpm gen:wiring && pnpm check:contract
```

## 3. Run every gate

Use the `gate-run` skill.

## 4. Commit

Every component ships with its story and its registry entry **in the same
commit**. Keep a batch in one PR so the family reads as a set.

```bash
git -c user.name="weeeha" -c user.email="1083934+weeeha@users.noreply.github.com" commit
```

GitHub rejects the default email for this account.
