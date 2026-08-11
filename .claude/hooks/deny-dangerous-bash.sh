#!/usr/bin/env bash
# PreToolUse/Bash. Reads the tool input on stdin; exit 2 denies with the
# message on stderr. Each rule here is a CONTINUE.md §4 trap that has cost a
# real debugging session.
set -euo pipefail
cmd=$(jq -r '.tool_input.command // ""')

if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])pnpm[[:space:]]+format([[:space:]]|$)' \
   || printf '%s' "$cmd" | grep -Eq 'prettier[[:space:]]+--write[[:space:]]+\.[[:space:]]*$'; then
  echo "Repo-wide format is denied. The tree is not prettier-clean at HEAD, so this rewrites ~300 unrelated files — and it breaks check:contract, whose guidance regexes (whatItIs:\\s*\"...\") do not survive re-wrapping. Format only what you touched: pnpm exec prettier --write <paths>" >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -Eq 'shadcn[[:space:]]+add[[:space:]]+https?://'; then
  echo "npx shadcn add <third-party URL> is denied in this repo. It resolves the item's own registryDependencies against the default Radix registry, offers to overwrite this repo's Base UI primitives, and then writes no component files. Vendor the file by hand — see CONTINUE.md §5.1." >&2
  exit 2
fi

exit 0
