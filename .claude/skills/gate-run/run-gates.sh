#!/usr/bin/env bash
# Runs every gate in .github/workflows/ci.yml's order: the `gates` job's steps,
# then the `product` job's. CI runs those two jobs in parallel; this script runs
# them back to back and stops at the first failure, as each job does — which is
# why order matters: a red gate hides every gate behind it in the same job, and
# that has already happened here (CONTINUE.md §1).
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

run() {
  printf '\n=== %s ===\n' "$1"
  shift
  if ! "$@"; then
    printf '\nFAILED: %s\n' "$*" >&2
    printf 'Every gate after this one is UNRUN. Fix and re-run from the top.\n' >&2
    exit 1
  fi
}

# The smoke step starts its own server on SMOKE_PORT (3100 unless set, CI's
# port) and, with CI=1, refuses one already there. An unrelated process on that
# port (on 2026-09-24, another project's `next dev -p 3100`) used to surface as
# a red smoke gate after nine green ones. So the port is checked before the
# first gate and again before the smoke step, and a held port stops the run
# naming the holder. Without lsof the check passes and Playwright's own
# "already used" error still stops the step.
export SMOKE_PORT="${SMOKE_PORT:-3100}"
smoke_port_free() {
  local holder
  holder=$(lsof -nP -iTCP:"$SMOKE_PORT" -sTCP:LISTEN 2>/dev/null) || return 0
  printf '\nFAILED: port %s is held, and the Playwright smoke step needs it for its own server:\n%s\n' \
    "$SMOKE_PORT" "$holder" >&2
  printf 'Stop that process, or re-run on a free port: SMOKE_PORT=3101 %s\n' "$0" >&2
  exit 1
}
smoke_port_free

run "install"        pnpm install --frozen-lockfile
run "lint"           pnpm lint
run "format:check"   pnpm format:check
run "typecheck"      pnpm typecheck
run "check:tokens"   pnpm check:tokens
run "check:contract" pnpm check:contract
run "test"           pnpm test
run "build:registry" pnpm build:registry
run "build"          pnpm build
# CI=1 so playwright.config.ts never reuses a server already on the smoke port.
# Locally that server has been a sibling worktree's, and the gate then
# reported 132 green against the wrong build (CONTINUE.md §8, wave 2).
# SMOKE_PORT (exported above, default 3100) picks the port; CI never sets it.
smoke_port_free
run "playwright smoke" env CI=1 pnpm --filter docs exec playwright test

# Not optional: Vite's dep optimiser invalidates mid-run after components are
# added and produces a wall of fake failures that look like a11y errors but say
# "Failed to fetch dynamically imported module" (CONTINUE.md §3.5).
rm -rf apps/storybook/node_modules/.cache/storybook
run "storybook a11y" pnpm --filter storybook test:stories

run "consumer install" apps/docs/scripts/consumer-test.sh

printf '\nAll gates green.\n'
