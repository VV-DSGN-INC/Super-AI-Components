#!/usr/bin/env bash
# Proves the registry installs into a fresh app AND renders under a preset —
# the product-proving test. One row per run; `default` is what it always did
# plus rendering and axe. Rows: apps/docs/harness/presets.ts.
#
#   apps/docs/scripts/consumer-test.sh                # row `default`
#   apps/docs/scripts/consumer-test.sh radix-violet-large
#   KEEP_CONSUMER=1 apps/docs/scripts/consumer-test.sh   # leave the scaffold for a look
set -euo pipefail

ROW="${1:-default}"
DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT=4848
APP_PORT=4849
TMP="$(mktemp -d)"
SERVE_PID=""
APP_PID=""
cleanup() {
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  if [ "${KEEP_CONSUMER:-}" = "1" ]; then
    echo "KEEP_CONSUMER=1: consumer left at $TMP/consumer"
  else
    rm -rf "$TMP"
  fi
}
trap cleanup EXIT

# The row's preset, from the same record the tests pin.
eval "$(cd "$DOCS_DIR" && pnpm exec tsx harness/preset-code.mts "$ROW")"
echo "==> Row $HARNESS_ROW: base=$HARNESS_BASE preset=$HARNESS_CODE"

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
CONSUMER_DIR="$PWD"
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

echo "==> shadcn init on the row's preset"
pnpm dlx shadcn@latest init --base "$HARNESS_BASE" --preset "$HARNESS_CODE" --yes

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

echo "==> Asserting the preset declares every stock name TOK-9 trusts"
(cd "$DOCS_DIR" && pnpm exec tsx harness/assert-stock.mts "$CONSUMER_DIR/$GLOBAL_CSS")

echo "==> Mounting the docs demos on /harness/<name>"
SCAFFOLD_OUT="$(cd "$DOCS_DIR" && pnpm exec tsx harness/scaffold-consumer.mts "$CONSUMER_DIR")"
echo "$SCAFFOLD_OUT" | head -1
UI_DEPS=()
while IFS= read -r name; do
  [ -n "$name" ] && [ ! -f "components/ui/$name.tsx" ] && UI_DEPS+=("$name")
done < <(echo "$SCAFFOLD_OUT" | sed -n '/^UI_IMPORTS_BEGIN$/,/^UI_IMPORTS_END$/p' | sed '1d;$d')
if [ "${#UI_DEPS[@]}" -gt 0 ]; then
  echo "==> Demos import ${#UI_DEPS[@]} ui primitive(s) no item pulled in; adding from the consumer's own registry: ${UI_DEPS[*]}"
  pnpm dlx shadcn@latest add --yes "${UI_DEPS[@]}"
fi

echo "==> Building consumer app"
pnpm build

echo "==> Serving consumer app on :$APP_PORT"
pnpm start --port "$APP_PORT" &
APP_PID=$!
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$APP_PORT/harness" >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -fsS "http://127.0.0.1:$APP_PORT/harness" >/dev/null 2>&1; then
  echo "CONSUMER INSTALL TEST: FAIL — consumer app did not come up on :$APP_PORT" >&2
  exit 1
fi

echo "==> Rendering every demo under $HARNESS_ROW, light and dark, with axe"
(cd "$DOCS_DIR" && HARNESS_ROW="$HARNESS_ROW" HARNESS_URL="http://127.0.0.1:$APP_PORT" pnpm exec playwright test --config harness/playwright.config.ts)

echo "CONSUMER INSTALL TEST ($HARNESS_ROW): PASS"
