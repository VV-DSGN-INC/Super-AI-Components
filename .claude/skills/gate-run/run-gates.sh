#!/usr/bin/env bash
# Runs every gate in .github/workflows/ci.yml's order. Stops at the first
# failure, exactly as GitHub Actions does — which is precisely why order
# matters: a red gate early in the pipeline hides every gate behind it, and
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

run "install"        pnpm install --frozen-lockfile
run "lint"           pnpm lint
run "typecheck"      pnpm typecheck
run "check:tokens"   pnpm check:tokens
run "check:contract" pnpm check:contract
run "test"           pnpm test
run "build:registry" pnpm build:registry
run "build"          pnpm build
run "playwright smoke" pnpm --filter docs exec playwright test

# Not optional: Vite's dep optimiser invalidates mid-run after components are
# added and produces a wall of fake failures that look like a11y errors but say
# "Failed to fetch dynamically imported module" (CONTINUE.md §3.5).
rm -rf apps/storybook/node_modules/.cache/storybook
run "storybook a11y" pnpm --filter storybook test:stories

run "consumer install" apps/docs/scripts/consumer-test.sh

printf '\nAll gates green.\n'
