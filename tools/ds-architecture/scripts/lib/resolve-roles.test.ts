import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { resolveRole, unresolvedRoles } from "./resolve-roles.mjs"

function tree() {
  const dir = mkdtempSync(path.join(tmpdir(), "dsa-roles-"))
  mkdirSync(path.join(dir, "src/components"), { recursive: true })
  writeFileSync(path.join(dir, "src/components/button.tsx"), "export const Button = () => null\n")
  mkdirSync(path.join(dir, "src/styles"), { recursive: true })
  writeFileSync(path.join(dir, "src/styles/globals.css"), ":root{}\n")
  return dir
}

describe("resolveRole", () => {
  it("resolves a directory glob to the files under it", () => {
    const found = resolveRole(tree(), ["src/components/**"])
    expect(found.some((f) => f.endsWith("button.tsx"))).toBe(true)
  })

  it("resolves an extension glob", () => {
    const found = resolveRole(tree(), ["src/**/*.css"])
    expect(found).toHaveLength(1)
    expect(found[0].endsWith("globals.css")).toBe(true)
  })

  it("matches zero intervening directories — the case a naive ** gets wrong", () => {
    const dir = tree()
    writeFileSync(path.join(dir, "src/root.css"), ":root{}\n")
    const found = resolveRole(dir, ["src/**/*.css"])
    expect(found.some((f) => f.endsWith("root.css"))).toBe(true)
  })

  it("returns empty for a glob matching nothing — it does not throw", () => {
    expect(resolveRole(tree(), ["does/not/exist/**"])).toEqual([])
  })

  it("unions multiple globs without duplicating a file matched twice", () => {
    const found = resolveRole(tree(), ["src/**", "src/components/**"])
    expect(found.filter((f) => f.endsWith("button.tsx"))).toHaveLength(1)
  })

  it("never escapes the target root", () => {
    expect(resolveRole(tree(), ["../**"])).toEqual([])
  })

  it("resolves a leading './' glob the same as the bare glob", () => {
    const dir = tree()
    const withDotSlash = resolveRole(dir, ["./src/components/**"])
    const bare = resolveRole(dir, ["src/components/**"])
    expect(withDotSlash).toEqual(bare)
    expect(withDotSlash.some((f) => f.endsWith("button.tsx"))).toBe(true)
  })

  it("does not throw or hang on a symlink loop", () => {
    const dir = tree()
    mkdirSync(path.join(dir, "src/loop"), { recursive: true })
    // A symlink inside its own directory, pointing back at that directory —
    // a cycle that would recurse forever if directory symlinks were followed.
    symlinkSync(path.join(dir, "src/loop"), path.join(dir, "src/loop/self"), "dir")
    expect(() => resolveRole(dir, ["src/**"])).not.toThrow()
  })

  it("does not follow a symlink pointing outside targetRoot", () => {
    const dir = tree()
    const outside = mkdtempSync(path.join(tmpdir(), "dsa-outside-"))
    writeFileSync(path.join(outside, "secret.tsx"), "export const Secret = () => null\n")
    symlinkSync(outside, path.join(dir, "src/outside-link"), "dir")
    const found = resolveRole(dir, ["src/**"])
    expect(found.some((f) => f.endsWith("secret.tsx"))).toBe(false)
  })

  it("skips a broken symlink rather than throwing", () => {
    const dir = tree()
    symlinkSync(path.join(dir, "does-not-exist"), path.join(dir, "src/broken-link"))
    expect(() => resolveRole(dir, ["src/**"])).not.toThrow()
  })
})

describe("unresolvedRoles", () => {
  it("is empty when every role matches something", () => {
    const roles = { components: ["src/components/**"], styles: ["src/styles/**"] }
    expect(unresolvedRoles(tree(), roles)).toEqual([])
  })

  it("names the role that matched nothing", () => {
    const roles = { components: ["src/components/**"], docs: ["docs/**"] }
    expect(unresolvedRoles(tree(), roles)).toEqual(["docs"])
  })
})
