import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { formatStamp, readInstalledPackage, readVendorStamp } from "./vendor-stamp.mjs"

describe("readVendorStamp", () => {
  it("reads every vendored artifact row from VENDOR.md", () => {
    const rows = readVendorStamp(process.cwd())
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.artifact).toBeTruthy()
      expect(row.upstreamPath).toBeTruthy()
      expect(row.sha).toMatch(/^[0-9a-f]{7,40}$/)
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("returns an empty array rather than throwing when VENDOR.md is absent", () => {
    expect(readVendorStamp(path.resolve(process.cwd(), "src"))).toEqual([])
  })

  it("skips the markdown header separator row", () => {
    expect(readVendorStamp(process.cwd()).some((r) => r.artifact.includes("---"))).toBe(false)
  })
})

describe("formatStamp", () => {
  it("says none rather than printing an empty line", () => {
    expect(formatStamp([])).toBe("vendored: none")
  })

  it("names each artifact with its sha and date", () => {
    expect(formatStamp([{ artifact: "design-spec", upstreamPath: "x", sha: "abc1234", date: "2026-08-21" }]))
      .toBe("vendored: design-spec@abc1234 (2026-08-21)")
  })
})

describe("installed as a package", () => {
  it("is not reported for a vendored or source checkout", () => {
    expect(readInstalledPackage(process.cwd())).toBeNull()
  })

  it("is reported when the root sits under node_modules", () => {
    const root = mkdtempSync(path.join(tmpdir(), "ds-stamp-"))
    const pkg = path.join(root, "node_modules", "ds-architecture")
    mkdirSync(pkg, { recursive: true })
    writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "ds-architecture", version: "1.2.3" }))
    expect(readInstalledPackage(pkg)).toEqual({ name: "ds-architecture", version: "1.2.3" })
  })

  it("says it is the installed package rather than a vendored copy", () => {
    expect(formatStamp([], { name: "ds-architecture", version: "1.2.3" })).toBe(
      "installed package: ds-architecture@1.2.3 (not vendored)"
    )
  })
})
