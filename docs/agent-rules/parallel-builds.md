# Parallel builds

This rule protects the throughput mechanism of this repo: one agent per component, each writing only its own five files.

Give each agent its own git worktree, because a shared tree has concurrent repo-root `pnpm typecheck` runs racing on `tsbuildinfo` and checking each other's half-written files. Take your own port and browser tab too: a sibling worktree's dev server on the same port serves its build while your preview reports success. Check the worktree's base commit as well. An isolated worktree may be cut from `main` rather than your integration branch, so it will not carry your prep. Verify rather than assume, and check incoming files against any in-flight refactor before landing them.

The full account: `docs/CONTINUE.md` §3.4 and the "Start here for the next phase" part of §1.

## What it costs

A shared tree gives false typecheck failures, and a shared port gives a green preview of the wrong build. The rule prevents both. Following it costs a worktree, a port and a base-commit check per agent, and a fresh worktree needs its own install.
