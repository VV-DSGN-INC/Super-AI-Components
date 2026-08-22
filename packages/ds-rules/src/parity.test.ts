import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** TEMPORARY (deleted with check-tokens.mjs in the swap commit). Runs the old
 *  gate and the new detector against the live tree and asserts the TOK-family
 *  finding sets are identical. Old-gate line shapes:
 *    `registry/super-ai/x.tsx:12 — raw hex color: …`      (stderr, blocker)
 *    `WARN components/ui/x.tsx:3 — tailwind palette …`    (stderr, vendored)
 *  New-detector findings carry repo-root-relative paths; strip the
 *  `apps/docs/` prefix to compare. */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const DOCS = `${REPO_ROOT}apps/docs`;

function oldFindings(): Set<string> {
  const out = spawnSync("node", ["scripts/check-tokens.mjs"], { cwd: DOCS, encoding: "utf8" });
  const text = `${out.stdout}\n${out.stderr}`;
  const found = new Set<string>();
  for (const m of text.matchAll(/^(WARN )?((?:registry|components)\/[^\s:]+):(\d+) — /gm)) {
    found.add(`${m[1] ? "warn:" : "block:"}${m[2]}:${m[3]}`);
  }
  return found;
}

function newFindings(): Set<string> {
  const out = spawnSync("node", [`${REPO_ROOT}packages/ds-rules/rulecheck.mjs`, "--json"], {
    encoding: "utf8",
  });
  const report = JSON.parse(out.stdout);
  const found = new Set<string>();
  for (const v of report.violations) {
    if (!v.id.startsWith("TOK-")) continue;
    const rel = v.file.replace(/^apps\/docs\//, "");
    found.add(`${v.severity === "warning" ? "warn:" : "block:"}${rel}:${v.line}`);
  }
  return found;
}

describe("old gate vs rulecheck on the live tree", () => {
  it("TOK-family findings are identical", () => {
    const a = oldFindings();
    const b = newFindings();
    expect([...b].filter((x) => !a.has(x)), "new-only findings").toEqual([]);
    expect([...a].filter((x) => !b.has(x)), "old-only findings").toEqual([]);
  });
});
