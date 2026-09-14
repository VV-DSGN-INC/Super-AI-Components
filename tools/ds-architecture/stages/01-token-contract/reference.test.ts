import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { declaredTokens, literalAliases, themeAliases } from "../../scripts/lib/css-tokens.mjs"
import { readAppliesTo, readClaims } from "../../scripts/lib/applicability.mjs"

const DIR = path.resolve(process.cwd(), "stages/01-token-contract")
const read = (rel: string) => readFileSync(path.join(DIR, rel), "utf8")

describe("stage 01 documents", () => {
  it("ACCEPTANCE.md declares appliesTo for all three profiles", () => {
    expect(readAppliesTo(path.join(DIR, "ACCEPTANCE.md"))).toEqual([
      "tokens-only", "component-library", "app-consumer",
    ])
  })

  it("ACCEPTANCE.md declares every claim the probe emits, including 01.4c", () => {
    expect(readClaims(path.join(DIR, "ACCEPTANCE.md"))).toEqual([
      "01.1", "01.2", "01.3", "01.4", "01.4c", "01.5", "01.6",
    ])
  })

  it("SPEC.md carries a decisions table and rejected alternatives", () => {
    const spec = read("SPEC.md")
    expect(spec).toMatch(/## Decisions/)
    expect(spec).toMatch(/## Rejected alternatives/)
  })
})

describe("stage 01 reference stylesheet", () => {
  const css = read("reference/globals.css")

  it("declares no alias carrying a literal — it must pass claim 01.3 itself", () => {
    expect(literalAliases(css)).toEqual([])
  })

  it("every @theme inline alias points at a token the stylesheet declares", () => {
    const declared = new Set(declaredTokens(css))
    for (const [alias, target] of themeAliases(css)) {
      expect(declared.has(target), `${alias} -> ${target}`).toBe(true)
    }
  })

  it("every token the reference contract lists is declared in the stylesheet", () => {
    const contract = read("reference/tokens.ts")
    for (const token of declaredTokens(css)) {
      expect(contract, token).toContain(token)
    }
  })

  it("ships placeholder values, not this system's palette", () => {
    expect(css).not.toMatch(/emerald|pegbo|geist/i)
  })
})
