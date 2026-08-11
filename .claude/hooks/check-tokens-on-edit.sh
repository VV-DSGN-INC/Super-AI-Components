#!/usr/bin/env bash
# PostToolUse/Write|Edit. Turns a CI-time token failure into an edit-time one.
# Advisory: exit 0 always, so a failure surfaces without blocking the edit that
# is often mid-way through a legitimate multi-step change.
set -euo pipefail
path=$(jq -r '.tool_input.file_path // ""')
case "$path" in
  *apps/docs/registry/super-ai/*.tsx) ;;
  *) exit 0 ;;
esac
cd "$(git rev-parse --show-toplevel)/apps/docs" || exit 0
if ! out=$(node scripts/check-tokens.mjs 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^registry/|^components/' >&2 || true
fi
exit 0
