import path from "node:path"

import { describe, expect, it } from "vitest"

import { loadConfig } from "../../scripts/lib/validate-config.mjs"
import { STATUS } from "../../src/probe-kit/result.mjs"
import probe from "./acceptance.mjs"

const F = path.resolve(process.cwd(), "stages/09-loops-and-conventions/__fixtures__")

function run(fixture: string): { stage: string; results: any[] } {
  const root = path.join(F, fixture)
  const loaded = loadConfig(root)
  if (!loaded.ok) throw new Error(loaded.reason)
  return probe(root, loaded.config)
}

const claimOf = (results: any[], claim: string) => results.find((r) => r.claim === claim)

const BROKEN = [
  ["nonconformant/no-loops", "09.1"],
  ["nonconformant/no-five-files", "09.2"],
  ["nonconformant/no-round-budget", "09.3"],
  ["nonconformant/no-worktree-rule", "09.4"],
] as const

describe("stage 09 probe", () => {
  it("emits exactly the four claims ACCEPTANCE.md declares", () => {
    const { stage, results } = run("conformant")
    expect(stage).toBe("09")
    expect(results.map((r: any) => r.claim).sort()).toEqual(["09.1", "09.2", "09.3", "09.4"])
  })

  it("meets every claim on the conformant fixture", () => {
    expect(run("conformant").results.every((r: any) => r.status === STATUS.MET)).toBe(true)
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

  it("reports every claim unchecked when there is no instructions file", () => {
    const { results } = run("nonconformant/no-file")
    expect(results.every((r: any) => r.status === STATUS.UNCHECKED)).toBe(true)
  })

  it("every unmet result carries a fix", () => {
    for (const [fixture] of BROKEN) {
      for (const r of run(fixture).results) {
        if (r.status === STATUS.UNMET) expect(r.fix, `${fixture} ${r.claim}`).toBeTruthy()
      }
    }
  })
})
