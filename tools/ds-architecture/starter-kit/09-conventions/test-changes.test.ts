/**
 * Gate for the test-change report: every line a pull request removed or changed
 * in a test, snapshot or visual baseline that existed before it.
 *
 * The case it exists for: a change keeps a test's name and assertions and
 * changes one fixture line, so the test still passes and no longer pins what it
 * did. Assertion-only matching misses that; every line counts here. Each
 * fixture below is control-tested in both directions: the line that must be
 * listed is, and the change that must stay quiet does.
 *
 * Keep this file next to `test-changes.mjs`, or fix the import below.
 */
import { describe, expect, it } from "vitest"

// @ts-ignore: .mjs, deliberately untyped so it stays stdlib-only
import { declaredTestChanges, parsePatch, testChanges } from "./test-changes.mjs"

type File = { path: string; kind: string; status: string; lines: string[]; linesTaken: number; movedHere: number; moved?: { line: string; to: string }[]; declared: string | null; binary?: boolean; more?: number }
type Report = { status: string; files: File[]; movedElsewhere: number; summary: { files: number; linesTaken: number; moved: number; undeclared: number } }
const report = (patch: string, body = "") => testChanges(patch, body) as Report

const header = (path: string, extra = "") =>
  `diff --git a/${path} b/${path}\n${extra}index 1111111..2222222 100644\n--- a/${path}\n+++ b/${path}\n`

/* The motivating case, reduced: the name and the assertion stay, the fixture moves. */
const FIXTURE_REWRITE =
  header("src/components/card.test.tsx") +
  `@@ -420,7 +420,7 @@ describe("Contact menu", () => {\n` +
  `   it("offers the address, and opens the composer, for a contact that has one", () => {\n` +
  `     const dana = contact({ id: "ct-1", email: "dana@example.test" })\n` +
  `-    const sam = contact({ id: "ct-2", name: "Sam" })\n` +
  `+    const sam = contact({ id: "ct-2", name: "Sam", email: "sam@example.test" })\n` +
  `     expect(menuItems()).toHaveLength(2)\n`

describe("parsePatch", () => {
  it("reads status, removed and added lines per file, and ignores context", () => {
    const [block] = parsePatch(FIXTURE_REWRITE)
    expect(block.oldPath).toBe("src/components/card.test.tsx")
    expect(block.status).toBe("modified")
    expect(block.removed).toEqual([`    const sam = contact({ id: "ct-2", name: "Sam" })`])
    expect(block.added).toHaveLength(1)
  })
})

describe("what the report lists", () => {
  it("lists a changed fixture line in an existing test, assertions untouched", () => {
    const r = report(FIXTURE_REWRITE)
    expect(r.status).toBe("changes")
    expect(r.files[0]?.lines).toEqual([`const sam = contact({ id: "ct-2", name: "Sam" })`])
    expect(r.summary.undeclared).toBe(1)
  })

  it("stays quiet when a test only gains lines", () => {
    const patch =
      header("src/components/card.test.tsx") +
      `@@ -10,2 +10,5 @@\n   it("a", () => {})\n+  it("b", () => {\n+    expect(b()).toBe(true)\n+  })\n`
    expect(report(patch)).toMatchObject({ status: "none", files: [] })
  })

  it("ignores a new test file and every non-test file", () => {
    const patch =
      header("src/components/new.test.tsx", "new file mode 100644\n") +
      `@@ -0,0 +1,1 @@\n+it("new", () => {})\n` +
      header("src/components/card.tsx") +
      `@@ -1,1 +1,1 @@\n-export const a = 1\n+export const a = 2\n`
    expect(report(patch).files).toEqual([])
  })

  it("counts a test moved into another file as moved, and a reworded one as taken", () => {
    const moved =
      header("src/a.test.ts") +
      `@@ -5,3 +5,0 @@\n-  it("keeps x", () => {\n-    expect(f(1)).toBe(1)\n-  })\n` +
      header("src/b.test.ts", "new file mode 100644\n") +
      `@@ -0,0 +1,3 @@\n+it("keeps x", () => {\n+  expect(f(1)).toBe(1)\n+})\n`
    const quiet = report(moved)
    expect(quiet.files[0]).toMatchObject({ path: "src/a.test.ts", linesTaken: 0, movedHere: 2 })
    expect(quiet.files[0]?.moved?.[0]).toEqual({ line: `it("keeps x", () => {`, to: "src/b.test.ts" })
    expect(quiet.movedElsewhere).toBe(2)
    expect(quiet.summary.undeclared).toBe(0)

    const loosened = moved.replace(`+  expect(f(1)).toBe(1)`, `+  expect(f(1)).toBeTruthy()`)
    expect(report(loosened).files[0]?.lines).toEqual([`expect(f(1)).toBe(1)`])
  })

  const COMMON =
    header("src/a.test.ts") +
    `@@ -7,1 +7,0 @@\n-    expect(f(1)).toBe(true)\n` +
    header("src/b.test.ts") +
    `@@ -3,0 +3,1 @@\n+  expect(f(1)).toBe(true)\n`

  it("lists a common assertion re-added in another test file as moved, with its destination", () => {
    const r = report(COMMON)
    expect(r.files[0]?.moved).toEqual([{ line: "expect(f(1)).toBe(true)", to: "src/b.test.ts" }])
    expect(r.summary).toMatchObject({ moved: 1, linesTaken: 0, undeclared: 0 })
  })

  it("takes a common assertion re-added only in a non-test file", () => {
    const intoSource = COMMON.replaceAll("src/b.test.ts", "src/b.ts")
    const r = report(intoSource)
    expect(r.files[0]).toMatchObject({ linesTaken: 1, lines: ["expect(f(1)).toBe(true)"] })
    expect(r.files[0]?.moved).toBeUndefined()
    expect(r.summary.undeclared).toBe(1)
  })

  it("lists a deleted test file's lines that reappear nowhere", () => {
    const patch =
      header("src/old.test.ts", "deleted file mode 100644\n") +
      `@@ -1,3 +0,0 @@\n-it("pins y", () => {\n-  expect(y()).toBe(2)\n-})\n`
    const r = report(patch)
    expect(r.files[0]).toMatchObject({ status: "deleted", linesTaken: 2 })
  })

  it("lists a changed visual baseline, which has no lines to compare", () => {
    const patch =
      `diff --git a/src/visual/__screenshots__/snapshots.visual.tsx/button-light.png b/src/visual/__screenshots__/snapshots.visual.tsx/button-light.png\n` +
      `index 1111111..2222222 100644\nBinary files a/src/visual/__screenshots__/snapshots.visual.tsx/button-light.png and b/src/visual/__screenshots__/snapshots.visual.tsx/button-light.png differ\n`
    expect(report(patch).files[0]).toMatchObject({ kind: "baseline", binary: true })

    const added = patch.replace("index 1111111", "new file mode 100644\nindex 0000000")
    expect(report(added).files).toEqual([])
  })

  it("never counts a baseline's lines as moved", () => {
    const patch =
      header("src/components/__snapshots__/x.test.tsx.snap") +
      `@@ -1,1 +1,0 @@\n-exports[\`x 1\`] = \`<div>old</div>\`;\n` +
      header("src/components/__snapshots__/y.test.tsx.snap", "new file mode 100644\n") +
      `@@ -0,0 +1,1 @@\n+exports[\`x 1\`] = \`<div>old</div>\`;\n`
    expect(report(patch).files[0]).toMatchObject({ kind: "baseline", linesTaken: 1 })
  })

  it("lists code lines before comment lines", () => {
    const patch =
      header("src/a.test.ts") +
      `@@ -1,3 +1,0 @@\n-  // Alpha carries no badge\n-  expect(name()).toBe("Alpha")\n-   * a docblock line\n`
    expect(report(patch).files[0]?.lines[0]).toBe(`expect(name()).toBe("Alpha")`)
  })

  it("skips blank and bracket-only lines in both directions", () => {
    const patch = header("src/a.test.ts") + `@@ -3,3 +3,0 @@\n-\n-  })\n-});\n`
    expect(report(patch).files).toEqual([])
  })
})

describe("the author's account", () => {
  const BODY = [
    "## Summary",
    "Contacts carry an optional email.",
    "",
    "## Test changes",
    "- `src/components/card.test.tsx`: requirement 2, two addressable contacts show the menu",
    "src/visual/__screenshots__/x.png",
    "",
    "## Notes",
    "src/other.test.ts: outside the section, not an account",
  ].join("\n")

  it("reads path: reason lines under the heading, and nothing outside it", () => {
    const declared = declaredTestChanges(BODY)
    expect([...declared.keys()]).toEqual(["src/components/card.test.tsx"])
  })

  it("attaches the reason to the file, and a bare path is no account", () => {
    expect(report(FIXTURE_REWRITE, BODY).files[0]?.declared).toMatch(/^requirement 2/)
    expect(report(FIXTURE_REWRITE, BODY.replace(": requirement 2, two addressable contacts show the menu", "")).files[0]?.declared).toBeNull()
  })
})
