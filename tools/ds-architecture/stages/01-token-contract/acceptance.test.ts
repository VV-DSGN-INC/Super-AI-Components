import path from "node:path"

import { describe, expect, it } from "vitest"

import { loadConfig } from "../../scripts/lib/validate-config.mjs"
import { STATUS } from "../../src/probe-kit/result.mjs"
import probe from "./acceptance.mjs"

const F = path.resolve(process.cwd(), "stages/01-token-contract/__fixtures__")

// `results: any[]` because result.mjs is plain JS under checkJs:false, so TS
// collapses the met/unmet/unchecked union to the met() shape.
function run(fixture: string): { stage: string; results: any[] } {
  const root = path.join(F, fixture)
  const loaded = loadConfig(root)
  if (!loaded.ok) throw new Error(loaded.reason)
  return probe(root, loaded.config)
}

const claimOf = (results: any[], claim: string) => results.find((r) => r.claim === claim)

const BROKEN = [
  ["nonconformant/missing-name-contract", "01.1"],
  ["nonconformant/undeclared-token", "01.2"],
  ["nonconformant/literal-alias", "01.3"],
  ["nonconformant/dead-token", "01.6"],
  ["nonconformant/var-read-only-in-style-entry", "01.6"],
] as const

// `conformant-consumer-paths` reaches each of its five walked tokens a
// different way: a utility in a component, a one-side border utility
// (border-l-x) in a component, a utility in an app page, a var() read in a
// component CSS module, a var() read in an app page. A probe missing any one of
// those paths fails it.
const CONFORMANT = ["conformant", "conformant-consumer-paths"] as const

describe("stage 01 probe", () => {
  it("emits exactly the seven claims ACCEPTANCE.md declares", () => {
    const { stage, results } = run("conformant")
    expect(stage).toBe("01")
    expect(results.map((r: any) => r.claim).sort()).toEqual([
      "01.1", "01.2", "01.3", "01.4", "01.4c", "01.5", "01.6",
    ])
  })

  it.each(CONFORMANT)("meets every settleable claim on %s", (fixture) => {
    const { results } = run(fixture)
    for (const claim of ["01.1", "01.2", "01.3", "01.4", "01.5", "01.6"]) {
      expect(claimOf(results, claim).status, claim).toBe(STATUS.MET)
    }
  })

  it("reports 01.4c unchecked even on the conformant fixture — coverage needs the target's runner", () => {
    const claim = claimOf(run("conformant").results, "01.4c")
    expect(claim.status).toBe(STATUS.UNCHECKED)
    expect(claim.reason).toMatch(/runner/)
  })

  it("01.4c states a single cell in the singular when the config declares zero axes", () => {
    const root = path.join(F, "conformant")
    const loaded = loadConfig(root)
    if (!loaded.ok) throw new Error(loaded.reason)
    const claim = claimOf(probe(root, { ...loaded.config, axes: [] }).results, "01.4c")
    expect(claim.status).toBe(STATUS.UNCHECKED)
    expect(claim.reason).toMatch(/all 1 axis cell needs/)
  })

  it.each(BROKEN)("%s breaks %s", (fixture, claim) => {
    expect(claimOf(run(fixture).results, claim).status).toBe(STATUS.UNMET)
  })

  it("each broken fixture breaks exactly one claim", () => {
    for (const [fixture] of BROKEN) {
      const unmet = run(fixture).results.filter((r: any) => r.status === STATUS.UNMET)
      expect(unmet.map((r: any) => r.claim), fixture).toHaveLength(1)
    }
  })

  it("every unmet result carries a fix", () => {
    for (const [fixture] of BROKEN) {
      for (const r of run(fixture).results) {
        if (r.status === STATUS.UNMET) expect(r.fix, `${fixture} ${r.claim}`).toBeTruthy()
      }
    }
  })

  it("01.2 names the token that is declared but absent from the contract", () => {
    const claim = claimOf(run("nonconformant/undeclared-token").results, "01.2")
    expect(claim.why).toMatch(/--surface-secondary/)
  })

  it("01.6 names the dead token", () => {
    const claim = claimOf(run("nonconformant/dead-token").results, "01.6")
    expect(claim.why).toMatch(/--elevation-popover/)
  })

  it("01.6 does not count an alias chain inside the style entry as a consumer", () => {
    // The app role's glob covers the style entry here, as it does on a Next.js
    // site with `src/app/**`. The only var() read of --color-border is the
    // `--hairline` alias in globals.css, and the tokens that ARE read from
    // components and pages must not be named alongside it.
    const claim = claimOf(run("nonconformant/var-read-only-in-style-entry").results, "01.6")
    expect(claim.why).toMatch(/--color-border\b/)
    expect(claim.why).not.toMatch(/--color-(bg|text|accent)/)
  })
})
