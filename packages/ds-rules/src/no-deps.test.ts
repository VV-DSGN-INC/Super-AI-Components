import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** rulecheck.mjs and token-rules.mjs run from a hook and a bare shell in any
 *  checkout — node:* and relative imports only. Four specifier forms, because
 *  in the source system one form was the whole gate and the other three
 *  walked straight past it. */
const SPECIFIER_RES = [
  /import\s+[^"']*?from\s+["']([^"']+)["']/g,
  /import\s+["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
];

const PKG = fileURLToPath(new URL("..", import.meta.url));

function mjsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...mjsFiles(full));
    else if (entry.endsWith(".mjs")) out.push(full);
  }
  return out;
}

describe("runtime files are dependency-free", () => {
  it("every .mjs imports only node:* or relative paths", () => {
    for (const file of mjsFiles(PKG)) {
      const source = readFileSync(file, "utf8");
      for (const re of SPECIFIER_RES) {
        for (const m of source.matchAll(re)) {
          const spec = m[1];
          const ok = spec.startsWith("node:") || spec.startsWith("./") || spec.startsWith("../");
          expect(ok, `${path.relative(PKG, file)} imports "${spec}"`).toBe(true);
        }
      }
    }
  });

  it("control: the gate can fail (feed it a known-bad specifier)", () => {
    const bad = 'import { z } from "zod"';
    const hits = SPECIFIER_RES.flatMap((re) => [...bad.matchAll(re)]).map((m) => m[1]);
    expect(hits).toContain("zod");
  });
});
