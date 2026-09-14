import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/** The dependency-free rule is checked, not trusted. A probe that imports a
 *  package works here and fails in a target that never installed it — and it
 *  fails at import time, which reads as a broken probe rather than a broken rule. */
function mjsFilesUnder(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      if (entry === "node_modules") continue
      const full = path.join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith(".mjs")) out.push(full)
    }
  }
  walk(dir)
  return out
}

/** Four forms, because one of them was the whole gate and the other three walked
 *  straight past it. `import ... from "x"` was matched; a bare `import "x"`, a
 *  dynamic `await import("x")` and a CommonJS `require("x")` all left the gate
 *  green while pulling a package into a file that must run in a target repo
 *  that never installed it. This is the only gate keeping probes portable, so
 *  it is control-tested: each evasion form has been fed to it and observed to
 *  fail, naming the file. */
const SPECIFIER_RES = [
  // import x from "m" / import { a } from "m" / import * as x from "m"
  /(?:^|[\n;])\s*import\s[^"';]*from\s*["']([^"']+)["']/g,
  // export { a } from "m" / export * from "m" — an import with another name
  /(?:^|[\n;])\s*export\s[^"';]*from\s*["']([^"']+)["']/g,
  // bare side-effect import: import "m"
  /(?:^|[\n;])\s*import\s*["']([^"']+)["']/g,
  // dynamic: import("m") / await import("m")
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  // CommonJS: require("m")
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
]

const roots = ["scripts", "src/probe-kit", "stages"].map((r) => path.resolve(process.cwd(), r))
const files = roots.flatMap((r) => {
  try {
    return mjsFilesUnder(r)
  } catch {
    return []
  }
})

describe("dependency-free surface", () => {
  it("finds .mjs files to check — a passing scan of zero files proves nothing", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)("%s imports only node: builtins or relative paths", (file) => {
    const source = readFileSync(file, "utf8")
    const specifiers = SPECIFIER_RES.flatMap((re) => [...source.matchAll(re)].map((m) => m[1]))
    const offenders = [
      ...new Set(
        specifiers.filter(
          (s) => !s.startsWith("node:") && !s.startsWith(".") && !s.startsWith("/")
        )
      ),
    ]
    expect(offenders, `${file} imports outside node: and relative paths`).toEqual([])
  })
})
