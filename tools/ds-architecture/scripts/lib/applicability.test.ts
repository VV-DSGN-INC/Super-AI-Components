import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { appliesToProfile, readAppliesTo, readClaims } from "./applicability.mjs"

function acceptanceWith(body: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "dsa-app-"))
  const file = path.join(dir, "ACCEPTANCE.md")
  writeFileSync(file, body)
  return file
}

describe("readAppliesTo", () => {
  it("reads a bracketed list from frontmatter", () => {
    const body = "---\nappliesTo: [tokens-only, component-library]\n---\n\n# Claims\n"
    expect(readAppliesTo(acceptanceWith(body))).toEqual(["tokens-only", "component-library"])
  })

  it("reads a dashed list from frontmatter", () => {
    const body = "---\nappliesTo:\n  - app-consumer\n---\n"
    expect(readAppliesTo(acceptanceWith(body))).toEqual(["app-consumer"])
  })

  it("throws when frontmatter is absent, rather than defaulting to all profiles", () => {
    expect(() => readAppliesTo(acceptanceWith("# Claims\n"))).toThrow(/appliesTo/)
  })

  it("throws when frontmatter exists but has no appliesTo key", () => {
    expect(() => readAppliesTo(acceptanceWith("---\ntitle: x\n---\n"))).toThrow(/appliesTo/)
  })

  it("throws on an unknown profile name", () => {
    expect(() => readAppliesTo(acceptanceWith("---\nappliesTo: [everything]\n---\n"))).toThrow(
      /everything/
    )
  })

  it("reads frontmatter with CRLF line endings — the error must not claim there is none", () => {
    const body = "---\r\nappliesTo: [tokens-only]\r\n---\r\n"
    expect(readAppliesTo(acceptanceWith(body))).toEqual(["tokens-only"])
  })

  it("throws on an empty appliesTo — a stage matching no profile is a silent skip", () => {
    expect(() => readAppliesTo(acceptanceWith("---\nappliesTo: []\n---\n"))).toThrow(/empty/)
  })

  it("reads a dashed list with CRLF line endings", () => {
    const body = "---\r\nappliesTo:\r\n  - app-consumer\r\n---\r\n"
    expect(readAppliesTo(acceptanceWith(body))).toEqual(["app-consumer"])
  })
})

describe("appliesToProfile", () => {
  it("is true when the profile is listed", () => {
    expect(appliesToProfile(["tokens-only"], "tokens-only")).toBe(true)
  })

  it("is false when it is not", () => {
    expect(appliesToProfile(["tokens-only"], "app-consumer")).toBe(false)
  })
})

describe("readClaims", () => {
  it("reads a bracketed claim list from frontmatter", () => {
    const body = "---\nappliesTo: [tokens-only]\nclaims: [00.1, 00.2, 00.6]\n---\n"
    expect(readClaims(acceptanceWith(body))).toEqual(["00.1", "00.2", "00.6"])
  })

  it("reads a dashed claim list", () => {
    const body = "---\nclaims:\n  - 04.1\n  - 04.2\n---\n"
    expect(readClaims(acceptanceWith(body))).toEqual(["04.1", "04.2"])
  })

  it("reads a claim list with CRLF line endings", () => {
    const body = "---\r\nclaims: [09.1]\r\n---\r\n"
    expect(readClaims(acceptanceWith(body))).toEqual(["09.1"])
  })

  it("throws when frontmatter is absent", () => {
    expect(() => readClaims(acceptanceWith("# Claims\n"))).toThrow(/claims/)
  })

  it("throws when the claims key is absent — a probe that emits nothing must not be invisible", () => {
    expect(() => readClaims(acceptanceWith("---\nappliesTo: [tokens-only]\n---\n"))).toThrow(
      /no claims key/
    )
  })

  it("throws on an empty claims list", () => {
    expect(() => readClaims(acceptanceWith("---\nclaims: []\n---\n"))).toThrow(/empty/)
  })

  it("throws on a malformed claim id, which could never match an emitted one", () => {
    expect(() => readClaims(acceptanceWith("---\nclaims: [00.1, one]\n---\n"))).toThrow(/one/)
  })

  it("throws on a duplicate claim id", () => {
    expect(() => readClaims(acceptanceWith("---\nclaims: [00.1, 00.1]\n---\n"))).toThrow(
      /duplicate/
    )
  })
})
