import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { readAppliesTo, readClaims } from "../../scripts/lib/applicability.mjs"
import { configSchema } from "../../src/config/schema"
// Imported, never re-declared. A local copy of these patterns tests a constant
// against a constant: the probe's regex could be replaced with something
// impossible and this file stayed green while claiming the template passes
// "the probe's own checks".
import { COMMAND_RE, PLAN_RE, SPEC_RE } from "./acceptance.mjs"

const DIR = path.resolve(process.cwd(), "stages/00-architecture-map")

describe("stage 00 documents", () => {
  it("ACCEPTANCE.md declares appliesTo for all three profiles", () => {
    expect(readAppliesTo(path.join(DIR, "ACCEPTANCE.md"))).toEqual([
      "tokens-only",
      "component-library",
      "app-consumer",
    ])
  })

  it("ACCEPTANCE.md names every claim the probe emits", () => {
    const text = readFileSync(path.join(DIR, "ACCEPTANCE.md"), "utf8")
    for (const claim of ["00.1", "00.2", "00.3", "00.4", "00.5", "00.6"]) {
      expect(text, `missing ${claim}`).toContain(claim)
    }
  })

  it("declares its claim ids as frontmatter data, not only as prose", () => {
    expect(readClaims(path.join(DIR, "ACCEPTANCE.md"))).toEqual([
      "00.1",
      "00.2",
      "00.3",
      "00.4",
      "00.5",
      "00.6",
    ])
  })

  it("the example config validates against the schema", () => {
    const raw = readFileSync(
      path.join(DIR, "reference/ds-architecture.config.example.json"),
      "utf8"
    )
    expect(() => configSchema.parse(JSON.parse(raw))).not.toThrow()
  })

  it("the AGENTS template passes the probe's own 00.2 and 00.3 checks", () => {
    const text = readFileSync(path.join(DIR, "reference/AGENTS.md.template"), "utf8")
    expect(COMMAND_RE.test(text)).toBe(true)
    expect(SPEC_RE.test(text)).toBe(true)
    expect(PLAN_RE.test(text)).toBe(true)
  })

  it("SPEC.md carries a decisions table — what a future agent reads instead of re-deriving", () => {
    const text = readFileSync(path.join(DIR, "SPEC.md"), "utf8")
    expect(text).toMatch(/## Decisions/)
    expect(text).toMatch(/\|.*\|.*\|/)
  })

  it("SPEC.md records rejected alternatives, not only what was chosen", () => {
    expect(readFileSync(path.join(DIR, "SPEC.md"), "utf8")).toMatch(/## Rejected alternatives/)
  })
})
