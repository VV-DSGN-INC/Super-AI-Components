import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { readAppliesTo, readClaims } from "../../scripts/lib/applicability.mjs"
import probe from "./acceptance.mjs"
import { STATUS } from "../../src/probe-kit/result.mjs"
import { mkdtempSync, writeFileSync, copyFileSync } from "node:fs"
import { tmpdir } from "node:os"

const DIR = path.resolve(process.cwd(), "stages/09-loops-and-conventions")

describe("stage 09 documents", () => {
  it("declares all three profiles and its four claims", () => {
    expect(readAppliesTo(path.join(DIR, "ACCEPTANCE.md"))).toHaveLength(3)
    expect(readClaims(path.join(DIR, "ACCEPTANCE.md"))).toEqual(["09.1", "09.2", "09.3", "09.4"])
  })

  it("SPEC.md carries decisions and rejected alternatives", () => {
    const spec = readFileSync(path.join(DIR, "SPEC.md"), "utf8")
    expect(spec).toMatch(/## Decisions/)
    expect(spec).toMatch(/## Rejected alternatives/)
  })

  it("the reference section passes this stage's own probe", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-09-"))
    writeFileSync(
      path.join(dir, "AGENTS.md"),
      readFileSync(path.join(DIR, "reference/AGENTS.md.section"), "utf8")
    )
    copyFileSync(
      path.join(DIR, "__fixtures__/conformant/ds-architecture.config.json"),
      path.join(dir, "ds-architecture.config.json")
    )
    const { results } = probe(dir, { profile: "component-library", adoption: "greenfield", scopeRoles: {} })
    expect(results.every((r: any) => r.status === STATUS.MET)).toBe(true)
  })
})
