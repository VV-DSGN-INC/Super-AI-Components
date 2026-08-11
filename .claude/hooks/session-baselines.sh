#!/usr/bin/env bash
# SessionStart. CONTINUE.md §1 keeps these numbers by hand and §6 already
# contradicts it. Printing them live lets the doc stop being a dashboard.
set -euo pipefail
root=$(git rev-parse --show-toplevel)
exempt=$(grep -c 'contractExempt' "$root/apps/docs/lib/catalog.manifest.ts" || echo "?")
items=$(grep -c '"name":' "$root/apps/docs/public/r/registry.json" 2>/dev/null || echo "?")
echo "super-ai-components — contractExempt items: $exempt · registry items: $items"
echo "Worktree: $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)"
echo "If this is an isolated worktree for a fan-out, CHECK ITS BASE COMMIT — twelve agents were once cut from main and none saw the integration branch's prep (CONTINUE.md §1). Take your own dev-server port too."
