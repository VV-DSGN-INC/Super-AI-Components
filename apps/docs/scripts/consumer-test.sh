#!/usr/bin/env bash
# Proves the registry installs into a fresh app — the product-proving test.
set -euo pipefail

DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT=4848
TMP="$(mktemp -d)"
SERVE_PID=""
cleanup() {
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

echo "==> Building registry against http://127.0.0.1:$PORT"
(cd "$DOCS_DIR" && REGISTRY_URL="http://127.0.0.1:$PORT" pnpm build:registry)

echo "==> Serving registry"
npx --yes serve "$DOCS_DIR/public" -l "$PORT" --no-clipboard &
SERVE_PID=$!
sleep 2

echo "==> Scaffolding consumer app"
cd "$TMP"
# Skip install so we can inject .npmrc before pnpm runs.
# pnpm 11 requires explicit allow-build for packages with postinstall scripts (sharp, unrs-resolver).
pnpm dlx create-next-app@latest consumer --ts --tailwind --app --no-src-dir --import-alias "@/*" --eslint --turbopack --use-pnpm --yes --skip-install
cd consumer
# pnpm 11 requires allowBuilds in pnpm-workspace.yaml to run postinstall scripts.
# create-next-app creates an empty pnpm-workspace.yaml; append allowBuilds to it.
cat >> pnpm-workspace.yaml <<'WSEOF'

allowBuilds:
  sharp: true
  unrs-resolver: true
  esbuild: true
WSEOF
pnpm install
pnpm dlx shadcn@latest init --defaults

echo "==> Installing all 9 items from the local registry"
ITEMS=(kbd cost-chip date-section choice-chips filter-bar field-row gen-settings-bar shortcuts-sheet thread-list)
URLS=()
for item in "${ITEMS[@]}"; do URLS+=("http://127.0.0.1:$PORT/r/$item.json"); done
pnpm dlx shadcn@latest add --yes --overwrite "${URLS[@]}"

echo "==> Using the components in a page"
cat > app/page.tsx <<'EOF'
"use client";

import { CostChip } from "@/components/super-ai/cost-chip";
import { Kbd, KbdGroup } from "@/components/super-ai/kbd";
import { ShortcutsSheet } from "@/components/super-ai/shortcuts-sheet";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/components/super-ai/thread-list";

export default function Page() {
  return (
    <main className="space-y-6 p-10">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <CostChip amount={17} />
      <ShortcutsSheet sections={[{ title: "Editor", shortcuts: [{ label: "Undo", keys: ["⌘", "Z"] }] }]} open onOpenChange={() => {}} />
      <ThreadList aria-label="Conversations">
        <ThreadListSection label="Today">
          <ThreadListItem id="t1" title="Hello" active />
        </ThreadListSection>
      </ThreadList>
    </main>
  );
}
EOF

echo "==> Building consumer app"
pnpm build
echo "CONSUMER INSTALL TEST: PASS"
