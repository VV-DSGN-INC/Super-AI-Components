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
shipped=$(grep -c 'status: "shipped"' "$manifest" || echo "?")
exempt=$(grep -c 'contractExempt' "$manifest" || echo "?")
echo "super-ai-components — $shipped shipped · $exempt contractExempt"
echo "Worktree: $(git -C "$root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?') @ $(git -C "$root" rev-parse --short HEAD 2>/dev/null || echo '?')"
echo "If this is an isolated worktree for a fan-out, CHECK ITS BASE COMMIT — twelve agents were once cut from main and none saw the integration branch's prep (CONTINUE.md §1). Take your own dev-server port too."
