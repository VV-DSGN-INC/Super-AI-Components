#!/usr/bin/env bash
# SessionStart. CONTINUE.md §1 keeps these numbers by hand and §6 already
# contradicts it. Printing them live lets the doc stop being a dashboard.
set -uo pipefail

# Prefer $CLAUDE_PROJECT_DIR — settings.json already resolves the hook's own
# path through it, so it is the reliable anchor. `git rev-parse` is only the
# fallback, and it must not be allowed to abort: a SessionStart hook that can
# exit non-zero prints an error at EVERY session start, forever. Note `set -e`
# is deliberately absent for the same reason.
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
manifest="$root/apps/docs/lib/catalog.manifest.ts"

if [ -z "$root" ] || [ ! -f "$manifest" ]; then
  echo "super-ai-components — baselines unavailable (no manifest at \$CLAUDE_PROJECT_DIR)"
  exit 0
fi

# Both counts come from the manifest, deliberately, because it is always
# present. Reading a build artifact instead — registry.json, which
# gen-registry.mts writes to apps/docs/, NOT public/r/ — reports "?" in any
# tree where `pnpm build:registry` has not been run, which is every fresh
# worktree. A baseline that prints "?" the moment you most need it is worse
# than no baseline.
# `grep -c` exits 1 on zero matches while still printing "0", so `|| echo "?"`
# fired on top of it and the variable became two lines — every session start
# printed a stray "? contractExempt". Validate the output rather than trusting
# the exit code: a number is a number, anything else is unknown.
numeric_or_unknown() {
  case "$1" in '' | *[!0-9]*) printf '?' ;; *) printf '%s' "$1" ;; esac
}

shipped=$(numeric_or_unknown "$(grep -c 'status: "shipped"' "$manifest" 2>/dev/null)")

# contractExempt was deleted by D20, so counting it always reported 0. The
# story-coverage baseline is the live ratchet worth surfacing in its place:
# empty is the guarantee, and any non-zero number is a regression in progress.
baseline_file="$root/apps/docs/scripts/lib/story-coverage.baseline.json"
if [ -f "$baseline_file" ]; then
  baseline=$(numeric_or_unknown "$(node -e '
    const fs = require("fs");
    try {
      process.stdout.write(String(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).length));
    } catch {
      process.stdout.write("");
    }
  ' "$baseline_file" 2>/dev/null)")
else
  baseline="?"
fi

echo "super-ai-components — $shipped shipped · story-coverage baseline: $baseline"
echo "Worktree: $(git -C "$root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?') @ $(git -C "$root" rev-parse --short HEAD 2>/dev/null || echo '?')"
echo "If this is an isolated worktree for a fan-out, CHECK ITS BASE COMMIT — twelve agents were once cut from main and none saw the integration branch's prep (CONTINUE.md §1). Take your own dev-server port too."
