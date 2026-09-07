#!/usr/bin/env bash
# Runs the Storybook a11y + interaction gate inside the image CI uses.
#
# Why this exists: the suite asserts rendered geometry, and geometry is not
# portable. The same three measurements come out three different ways across
# macOS, GitHub's amd64 runner and an arm64 container — see
# docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md §2.4.
# A green run on a Mac says nothing about CI, and that is how main went red with
# eleven failures nobody could see locally.
#
# Usage:
#   scripts/linux-gate.sh                                    # the whole project
#   scripts/linux-gate.sh src/stories/super-ai/Foo.stories.tsx   # one file
#   KEEP_CONTAINER=1 scripts/linux-gate.sh                   # leave it for docker exec
#
# CAVEAT: if your Docker runs arm64 (colima on Apple silicon), this reproduces
# the failure CLASS but not GitHub's exact numbers — ubuntu-latest is amd64.
# It is a fast pre-push check, not a substitute for CI.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"
CONTAINER="super-ai-linux-gate"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# The image tag tracks the lockfile. A mismatch means the browser under test is
# not the browser CI runs, which is the entire point of this script.
LOCKED="$(grep -oE '^  playwright@[0-9]+\.[0-9]+\.[0-9]+:' pnpm-lock.yaml | head -1 | sed -E 's/^  playwright@(.*):$/\1/')"
if [ -n "$LOCKED" ] && [ "$IMAGE" != "mcr.microsoft.com/playwright:v${LOCKED}-noble" ]; then
  echo "linux-gate: IMAGE is $IMAGE but pnpm-lock.yaml resolves playwright@$LOCKED." >&2
  echo "linux-gate: update IMAGE to mcr.microsoft.com/playwright:v${LOCKED}-noble." >&2
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "linux-gate: no reachable Docker daemon. Start Docker Desktop or 'colima start'." >&2
  exit 2
fi

STAGE="$(mktemp -d)"
cleanup() {
  rm -rf "$STAGE"
  [ -n "${KEEP_CONTAINER:-}" ] || docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Copy the WORKING TREE, not HEAD: an agent converting an assertion needs to
# test the edit it just made. node_modules is excluded because the host's is
# built for the host's platform and would break the install inside.
echo "==> staging working tree"
tar -c -C "$ROOT" \
  --exclude-vcs \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.turbo \
  --exclude=storybook-static \
  --exclude=test-results \
  --exclude=playwright-report \
  -f - . | tar -x -C "$STAGE"

if [ ! -d "$STAGE/apps/storybook/src" ]; then
  echo "linux-gate: staging copy has no apps/storybook/src — refusing to report a green run." >&2
  exit 2
fi

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

# --shm-size is not optional. Docker defaults /dev/shm to 64MB, and Chromium
# uses that shared memory for its renderer processes: run enough story files at
# once and it dies mid-suite with "Browser connection was closed while running
# tests. Was the page closed unexpectedly?", after which vitest reports a
# partial run — 33 of 131 files — that looks like a pass with fewer failures.
# Observed here twice in three runs before this line existed. Playwright's own
# Docker guidance is 1GB or --ipc=host.
#
# Args reach vitest through the container's argv rather than string
# interpolation, so a path with a space or a glob survives intact.
docker create --name "$CONTAINER" -w /w --shm-size=1g "$IMAGE" bash -lc '
  set -euo pipefail
  corepack enable >/dev/null 2>&1
  corepack prepare pnpm@11.1.0 --activate >/dev/null 2>&1
  echo "==> $(uname -m) · node $(node -v) · pnpm $(pnpm -v)"
  pnpm install --frozen-lockfile 2>&1 | tail -3
  cd apps/storybook
  # --no-file-parallelism keeps peak memory to one browser page at a time.
  # CI has a runner to itself; a developer machine may be sharing the Docker VM
  # with whatever else they run, and a Chromium that dies from memory pressure
  # produces a partial run rather than an error. Serializing costs wall-clock
  # and buys a result you can trust. Layout is per-page, so it does not change
  # what is measured. Override by passing your own --file-parallelism.
  pnpm exec vitest run --project storybook --no-file-parallelism "$@"
' bash "$@" >/dev/null

echo "==> copying into container"
docker cp "$STAGE/." "$CONTAINER":/w

echo "==> running the gate"
OUT="$STAGE/.gate-output"
set +e
docker start -a "$CONTAINER" 2>&1 | tee "$OUT"
STATUS=${PIPESTATUS[0]}
set -e

# A partial run is not a pass, and it does not look like a failure either. When
# Chromium dies mid-suite, vitest reports only the files it reached — "2 failed
# | 31 passed (131)" — and a reader comparing failure counts across runs sees
# an improvement. Compare what ran against what was discovered and say so.
SUMMARY="$(sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' "$OUT" | grep -oE 'Test Files.*\([0-9]+\)' | tail -1)"
if [ -n "$SUMMARY" ]; then
  DISCOVERED="$(printf '%s' "$SUMMARY" | grep -oE '\([0-9]+\)$' | tr -d '()')"
  RAN="$(printf '%s' "$SUMMARY" | grep -oE '[0-9]+ (failed|passed|skipped)' | grep -oE '^[0-9]+' | paste -sd+ - | bc)"
  if [ -n "$DISCOVERED" ] && [ -n "$RAN" ] && [ "$RAN" -lt "$DISCOVERED" ]; then
    echo >&2
    echo "linux-gate: PARTIAL RUN — $RAN of $DISCOVERED files ran. This is not a result." >&2
    echo "linux-gate: usually Chromium dying mid-suite. Check /dev/shm and free memory in" >&2
    echo "linux-gate: the Docker VM ('docker info' total memory, minus anything else running)." >&2
    exit 3
  fi
fi
exit "$STATUS"
