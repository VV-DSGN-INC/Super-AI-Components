import path from "node:path"

import { describe, expect, it } from "vitest"

import { formatStamp, readVendorStamp } from "./vendor-stamp.mjs"

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
