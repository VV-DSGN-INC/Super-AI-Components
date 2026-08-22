#!/usr/bin/env bash
# PostToolUse/Write|Edit. Turns a CI-time token failure into an edit-time one.
# Advisory: exit 0 always, so a failure surfaces without blocking the edit that
# is often mid-way through a legitimate multi-step change.
set -uo pipefail

# node, not jq — see deny-dangerous-bash.sh. Here a missing parser would exit
# 127 on EVERY Write/Edit in the session, contradicting this hook's own
# "advisory, always exit 0" promise.
path=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path??"")}catch{process.stdout.write("")}})' 2>/dev/null) || exit 0

# Mirrors the union of rule scopes in packages/ds-rules/rules/*.json —
# `{registry/{super-ai,marketing},components/ui}/**/*.tsx` — so an edit-time
# signal exists for every file the gate actually covers, not just the
# original super-ai subset.
case "$path" in
  *apps/docs/registry/super-ai/*.tsx) ;;
  *apps/docs/registry/marketing/*.tsx) ;;
  *apps/docs/components/ui/*.tsx) ;;
  *) exit 0 ;;
esac

# $CLAUDE_PROJECT_DIR first, matching session-baselines.sh. `git rev-parse` is
# cwd-dependent, and this repo's own CLAUDE.md warns that parallel builds run
# in sibling worktrees — resolving to the wrong root would check another
# tree's files and print pass/fail noise about work you did not do.
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
[ -n "$root" ] || exit 0
if ! out=$(node "$root/packages/ds-rules/rulecheck.mjs" --severity blocker 2>&1); then
  echo "check:tokens is now failing after that edit:" >&2
  printf '%s\n' "$out" | grep -E '^(WARN )?apps/' >&2 || true
fi
exit 0
