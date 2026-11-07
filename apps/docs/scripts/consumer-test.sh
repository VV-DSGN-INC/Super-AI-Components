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
# @openuidev/lang-core (pulled in by generated-body) has a telemetry postinstall.
# It is denied here as it is in the repo's own pnpm-workspace.yaml; leaving it
# unlisted makes pnpm 11 stop the install with ERR_PNPM_IGNORED_BUILDS.
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
  "@openuidev/lang-core": false
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
# The kit must never write the consumer's own agent files. Hash whatever
# create-next-app left (or a sentinel) before install, compare after.
[ -f CLAUDE.md ] || printf '# consumer sentinel\n' > CLAUDE.md
AGENT_FILES_BEFORE="$(cat CLAUDE.md AGENTS.md 2>/dev/null | shasum)"
pnpm dlx shadcn@latest add --yes --overwrite "${URLS[@]}"

echo "==> Verifying the agent kit installed and its checks can fail"
kit_fail() { printf 'CONSUMER INSTALL TEST: FAIL \xe2\x80\x94 %s\n' "$1" >&2; exit 1; }
[ "$(cat CLAUDE.md AGENTS.md 2>/dev/null | shasum)" = "$AGENT_FILES_BEFORE" ] || kit_fail "the kit changed CLAUDE.md or AGENTS.md"
[ -f AGENTS.super-ai.md ] || kit_fail "AGENTS.super-ai.md did not land at the project root"
[ -f scripts/super-ai/validate.mjs ] || kit_fail "scripts/super-ai/validate.mjs did not install"
if ! kit_out="$(node scripts/super-ai/validate.mjs components)"; then
  printf '%s\n' "$kit_out" | grep -F '[blocker]' | head -40 >&2
  kit_fail "validate is not clean on the installed components"
fi
printf 'export const P = () => <div className="bg-[#ff0000]" />;\n' > app/planted.tsx
set +e; node scripts/super-ai/validate.mjs app/planted.tsx > /dev/null; code=$?; set -e
rm app/planted.tsx
[ "$code" -eq 1 ] || kit_fail "validate exited $code on a planted raw hex, expected 1"
git init -q 2>/dev/null || true
git add -A && git -c user.email=t@t -c user.name=t commit -qm "consumer base" --no-verify
printf ':root {\n  --planted: 1px;\n}\n' >> app/globals.css
set +e; node scripts/super-ai/validate.mjs components --system > /dev/null; code=$?; set -e
git checkout -- app/globals.css
[ "$code" -eq 3 ] || kit_fail "validate --system exited $code on a new token, expected 3"
[ -f scripts/check-tokens.mjs ] || kit_fail "agent-kit-hooks did not install scripts/check-tokens.mjs"
node --input-type=module -e "
const { lintText } = await import(process.cwd() + '/scripts/check-tokens.mjs');
const n = lintText('app/x.tsx', '<div className=\"bg-[#fff]\" />').length;
if (n !== 1) { console.error('lintText returned ' + n + ' findings, expected 1'); process.exit(1); }
" || kit_fail "the check-tokens.mjs shim does not lint"
hook_payload() { node -e 'console.log(JSON.stringify({ tool_name: "Write", tool_input: { file_path: process.argv[1], content: process.argv[2] } }))' "$PWD/app/x.tsx" "$1"; }
set +e; hook_payload '<div className="bg-[#fff]" />' | node .claude/hooks/super-ai-guard.mjs 2>/dev/null; code=$?; set -e
[ "$code" -eq 2 ] || kit_fail "the hook exited $code on a raw hex, expected 2"
hook_payload '<div className="bg-background" />' | node .claude/hooks/super-ai-guard.mjs || kit_fail "the hook blocked a clean edit"
echo "  agent kit: rules file, validate (0, 1, 3), shim and hook all behave"

echo "==> Verifying the usage contract installed beside its component"
META="components/super-ai/mode-tabs.meta.json"
if [ ! -f "components/super-ai/mode-tabs.tsx" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — components/super-ai/mode-tabs.tsx did not install" >&2
  exit 1
fi
if [ ! -f "$META" ]; then
  echo "CONSUMER INSTALL TEST: FAIL — $META did not install (registry:file entry missing or mis-targeted)" >&2
  exit 1
fi
node -e "
const m = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
if (m.name !== 'mode-tabs') { console.error('CONSUMER INSTALL TEST: FAIL — ' + process.argv[1] + ' names ' + m.name); process.exit(1); }
if (!Array.isArray(m.variants) || m.variants.length === 0) { console.error('CONSUMER INSTALL TEST: FAIL — ' + process.argv[1] + ' carries no variants; the control contract did not travel'); process.exit(1); }
" "$META"
echo "  found $META with $(node -e "console.log(JSON.parse(require('fs').readFileSync('$META','utf8')).variants.length)") variant axis"

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
