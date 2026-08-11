#!/usr/bin/env bash
# SessionStart. CONTINUE.md §1 keeps these numbers by hand and §6 already
# contradicts it. Printing them live lets the doc stop being a dashboard.
set -euo pipefail
root=$(git rev-parse --show-toplevel)
manifest="$root/apps/docs/lib/catalog.manifest.ts"

# Both counts come from the manifest, deliberately, because it is always
# present. Reading a build artifact instead — registry.json, which
# gen-registry.mts writes to apps/docs/, NOT public/r/ — reports "?" in any
# tree where `pnpm build:registry` has not been run, which is every fresh
# worktree. A baseline that prints "?" the moment you most need it is worse
# than no baseline.
shipped=$(grep -c 'status: "shipped"' "$manifest" || echo "?")
exempt=$(grep -c 'contractExempt' "$manifest" || echo "?")
echo "super-ai-components — $shipped shipped · $exempt contractExempt"
echo "Worktree: $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)"
echo "If this is an isolated worktree for a fan-out, CHECK ITS BASE COMMIT — twelve agents were once cut from main and none saw the integration branch's prep (CONTINUE.md §1). Take your own dev-server port too."
