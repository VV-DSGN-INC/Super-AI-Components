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
#
# Both the leading env-var-assignment group and the flag-token group between
# `pnpm` and `format` are needed: `DEBUG=1 pnpm format` breaks the start-of-
# command anchor, and `pnpm -w format` / `pnpm --filter docs format` break the
# `pnpm format` adjacency requirement. Both were verified bypasses.
if printf '%s' "$probe" | grep -Eq '(^|[;&|]|&&|\|\|)[[:space:]]*([[:alnum:]_]+=[^[:space:]]*[[:space:]]+)*pnpm([[:space:]]+run)?([[:space:]]+[^;&|[:space:]]+)*[[:space:]]+format([^:[:alnum:]]|$)' \
   || printf '%s' "$probe" | grep -Eq 'prettier[[:space:]]+(--write|-w)[[:space:]]+\.\/?([[:space:]]|;|&|$)'; then
  echo "Repo-wide format is denied. The tree is not prettier-clean at HEAD, so this rewrites ~300 unrelated files — and it breaks check:contract, whose guidance regexes (whatItIs:\\s*\"...\") do not survive re-wrapping. Format only what you touched: pnpm exec prettier --write <paths>" >&2
  exit 2
fi

# `@latest` / `@2.1.0` is how this CLI is normally invoked, and the adjacency
# requirement missed every versioned form. The flag-token group between `add`
# and the URL is needed too: `add --yes https://...` / `add -o https://...`
# both bypassed the old adjacent-only pattern — and consumer-test.sh:77 uses
# exactly the flag-then-URL shape, so it is the house idiom, not an edge case.
if printf '%s' "$probe" | grep -Eq 'shadcn(@[^[:space:]]+)?[[:space:]]+add([[:space:]]+[^;&|[:space:]]+)*[[:space:]]+https?://'; then
  echo "npx shadcn add <third-party URL> is denied in this repo. It resolves the item's own registryDependencies against the default Radix registry, offers to overwrite this repo's Base UI primitives, and then writes no component files. Vendor the file by hand — see CONTINUE.md §5.1." >&2
  exit 2
fi

# History rewriting is forbidden for everyone, integrator included — unlike
# `git commit`/`git add`/`git push`, which the hook deliberately leaves alone
# because it cannot tell a subagent's commit from the integrator's, rewriting
# has no legitimate subagent use and the worst incident on this branch was an
# `--amend` against the wrong commit, recovered only via reflog.
if printf '%s' "$probe" | grep -Eq 'git[[:space:]]+commit[^;&|]*--amend\b' \
   || printf '%s' "$probe" | grep -Eq 'git[[:space:]]+rebase([[:space:]]|$)' \
   || printf '%s' "$probe" | grep -Eq 'git[[:space:]]+reset[^;&|]*--hard\b' \
   || printf '%s' "$probe" | grep -Eq 'git[[:space:]]+push[^;&|]*--force(-with-lease)?\b' \
   || printf '%s' "$probe" | grep -Eq 'git[[:space:]]+filter-branch\b'; then
  echo "History rewriting is denied for everyone, including the integrator. An agent on this branch already ran --amend against the wrong commit and had to recover via reflog. Make a new commit instead, and report the problem rather than trying to repair history." >&2
  exit 2
fi

exit 0
