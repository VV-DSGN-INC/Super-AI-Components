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
# create-next-app's template owns this file and has already changed shape once:
# it used to emit an empty file, and now emits its own allowBuilds block with
# these same packages set to false. Appending blindly produced a second
# allowBuilds key, which pnpm rejects as a duplicate mapping key before install
# even starts. So: drop whatever block it wrote, then write ours.
if [ -f pnpm-workspace.yaml ]; then
  awk '
    /^allowBuilds:[[:space:]]*$/ { in_block = 1; next }
    in_block && /^([[:space:]]+|[[:space:]]*$)/ { next }
    { in_block = 0; print }
  ' pnpm-workspace.yaml > pnpm-workspace.yaml.next
  mv pnpm-workspace.yaml.next pnpm-workspace.yaml
fi
cat >> pnpm-workspace.yaml <<'WSEOF'

allowBuilds:
  sharp: true
  unrs-resolver: true
  esbuild: true
WSEOF
# Fail by name rather than letting pnpm report a line number, so the next time
# the template changes shape this says which assumption broke.
KEY_COUNT="$(grep -c '^allowBuilds:' pnpm-workspace.yaml || true)"
if [ "$KEY_COUNT" -ne 1 ]; then
  echo "CONSUMER INSTALL TEST: FAIL — pnpm-workspace.yaml has $KEY_COUNT allowBuilds keys, expected 1" >&2
  cat pnpm-workspace.yaml >&2
  exit 1
fi
pnpm install
pnpm dlx shadcn@latest init --defaults

echo "==> Deriving installed item list from registry.json"
ITEMS=()
while IFS= read -r name; do
  ITEMS+=("$name")
done < <(node -e "
const fs = require('fs');
const registry = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
for (const item of registry.items) console.log(item.name);
" "$DOCS_DIR/registry.json")
if [ "${#ITEMS[@]}" -eq 0 ]; then
  echo "CONSUMER INSTALL TEST: FAIL — derived zero items from $DOCS_DIR/registry.json" >&2
  exit 1
fi
echo "==> Installing all ${#ITEMS[@]} items from the local registry: ${ITEMS[*]}"
URLS=()
for item in "${ITEMS[@]}"; do URLS+=("http://127.0.0.1:$PORT/r/$item.json"); done
pnpm dlx shadcn@latest add --yes --overwrite "${URLS[@]}"

echo "==> Verifying marketing css landed in the consumer app's global stylesheet"
GLOBAL_CSS="app/globals.css"
if [ ! -f "$GLOBAL_CSS" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — expected shadcn's global stylesheet at $GLOBAL_CSS, not found" >&2
  exit 1
fi
if ! grep -qF -e ".marketing-dot-fade" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing .marketing-dot-fade (dot-pattern's css block did not install)" >&2
  exit 1
fi
echo "  found .marketing-dot-fade in $GLOBAL_CSS"
if ! grep -qF -e "--marketing-rainbow-1" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --marketing-rainbow-1 (dot-pattern's cssVars did not install)" >&2
  exit 1
fi
echo "  found --marketing-rainbow-1 in $GLOBAL_CSS"

# Tailwind v4 emits no CSS for an undefined utility instead of failing the build, so
# a missing --warning would ship a colourless near-limit state and still go green.
# Only an explicit assertion catches it.
if ! grep -qF -e "--warning" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --warning (quota-meter's cssVars did not install)" >&2
  exit 1
fi
echo "  found --warning in $GLOBAL_CSS"
if ! grep -qF -e "--color-warning" "$GLOBAL_CSS"; then
  echo "CONSUMER INSTALL TEST: FAIL — $GLOBAL_CSS is missing --color-warning (@theme mapping absent; bg-warning would emit nothing)" >&2
  exit 1
fi
echo "  found --color-warning in $GLOBAL_CSS"

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
