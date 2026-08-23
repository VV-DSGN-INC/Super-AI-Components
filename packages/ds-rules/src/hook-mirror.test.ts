import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CATALOG_SCOPES } from "./local";

/** .claude/hooks/check-tokens-on-edit.sh hand-maintains a shell `case` that
 *  is meant to mirror CATALOG_SCOPES — the file-scope union the emitted
 *  rules actually cover — so the edit-time hook fires on every file the gate
 *  checks, not a stale subset. Nothing pinned that the two stay equal; this
 *  does. */

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const HOOK_PATH = path.join(REPO_ROOT, ".claude/hooks/check-tokens-on-edit.sh");

/** Extracts the `apps/docs/X` scope named by each `*apps/docs/X/*.tsx)`
 *  case-pattern line in the hook script's text. */
export function extractHookScopes(source: string): string[] {
  return [...source.matchAll(/^\s*\*apps\/docs\/(.+?)\/\*\.tsx\)/gm)].map((m) => `apps/docs/${m[1]}`);
}

describe("hook scope mirror", () => {
  it("control: the extractor recognizes a seeded case-pattern line", () => {
    const seeded = "  *apps/docs/registry/__seeded-control__/*.tsx) ;;\n";
    expect(extractHookScopes(seeded)).toEqual(["apps/docs/registry/__seeded-control__"]);
  });

  it("the hook's case patterns name exactly CATALOG_SCOPES — no missing or extra scope", () => {
    const source = readFileSync(HOOK_PATH, "utf8");
    const hookScopes = extractHookScopes(source);
    expect(hookScopes.slice().sort()).toEqual([...CATALOG_SCOPES].sort());
  });
});
