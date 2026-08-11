#!/usr/bin/env bash
# PreToolUse/Bash. Reads the tool input on stdin; exit 2 denies with the
# message on stderr. Each rule here is a CONTINUE.md §4 trap that has cost a
# real debugging session.
set -uo pipefail

# Parse with node, not jq. This is a JS monorepo pinned to Node 24, so node is
# guaranteed present and jq is not — and a `jq: command not found` exits 127,
# which the harness treats as a non-blocking hook error rather than a denial.
# That fails OPEN: the guardrail silently disappears with no message. Verified.
cmd=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{process.stdout.write("")}})' 2>/dev/null) || {
  echo "WARNING: the bash guardrail could not parse its input and is NOT active for this call." >&2
  exit 0
}

# Blank out quoted regions before matching. Without this,
# `git commit -m "explain the pnpm format ban"` is denied — the patterns are
# substring matches with no notion of quoting, so any command whose *payload*
# mentions a forbidden phrase gets blocked. Verified as a real false positive.
probe=$(printf '%s' "$cmd" | sed "s/'[^']*'/''/g; s/\"[^\"]*\"/\"\"/g")

# `pnpm format` and `pnpm run format` are the same script. `format:check` is a
# real and permitted script in this repo, hence the `[^:[:alnum:]]` guard.
# The prettier arm covers `.`, `./`, and a trailing `. && something` — the
# end-anchored version missed all three.
if printf '%s' "$probe" | grep -Eq '(^|[;&|]|&&|\|\|)[[:space:]]*pnpm([[:space:]]+run)?[[:space:]]+format([^:[:alnum:]]|$)' \
   || printf '%s' "$probe" | grep -Eq 'prettier[[:space:]]+(--write|-w)[[:space:]]+\.\/?([[:space:]]|;|&|$)'; then
  echo "Repo-wide format is denied. The tree is not prettier-clean at HEAD, so this rewrites ~300 unrelated files — and it breaks check:contract, whose guidance regexes (whatItIs:\\s*\"...\") do not survive re-wrapping. Format only what you touched: pnpm exec prettier --write <paths>" >&2
  exit 2
fi

# `@latest` / `@2.1.0` is how this CLI is normally invoked, and the adjacency
# requirement missed every versioned form.
if printf '%s' "$probe" | grep -Eq 'shadcn(@[^[:space:]]+)?[[:space:]]+add[[:space:]]+https?://'; then
  echo "npx shadcn add <third-party URL> is denied in this repo. It resolves the item's own registryDependencies against the default Radix registry, offers to overwrite this repo's Base UI primitives, and then writes no component files. Vendor the file by hand — see CONTINUE.md §5.1." >&2
  exit 2
fi

exit 0
