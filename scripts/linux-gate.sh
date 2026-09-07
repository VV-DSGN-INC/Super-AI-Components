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

# Args reach vitest through the container's argv rather than string
# interpolation, so a path with a space or a glob survives intact.
docker create --name "$CONTAINER" -w /w "$IMAGE" bash -lc '
  set -euo pipefail
  corepack enable >/dev/null 2>&1
  corepack prepare pnpm@11.1.0 --activate >/dev/null 2>&1
  echo "==> $(uname -m) · node $(node -v) · pnpm $(pnpm -v)"
  pnpm install --frozen-lockfile 2>&1 | tail -3
  cd apps/storybook
  pnpm exec vitest run --project storybook "$@"
' bash "$@" >/dev/null

echo "==> copying into container"
docker cp "$STAGE/." "$CONTAINER":/w

echo "==> running the gate"
docker start -a "$CONTAINER"
