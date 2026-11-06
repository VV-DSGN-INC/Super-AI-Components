import path from "node:path"

import { describe, expect, it } from "vitest"

import { loadConfig } from "../../scripts/lib/validate-config.mjs"
import { STATUS } from "../../src/probe-kit/result.mjs"
import probe from "./acceptance.mjs"

const F = path.resolve(process.cwd(), "stages/10-runtime-identity-and-streams/__fixtures__")
const CLAIMS = ["10.1", "10.2", "10.3", "10.4"]

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
  ["nonconformant/missing-slot", "10.1", /card\.tsx/],
  ["nonconformant/short-exemption-reason", "10.1", /20 characters: src\/components\/provider\.tsx/],
  ["nonconformant/stale-exemption", "10.1", /button\.tsx[\s\S]*deleted\.tsx|deleted\.tsx[\s\S]*button\.tsx/],
  ["nonconformant/no-system-id", "10.2", /systemId/],
  ["nonconformant/system-id-not-rendered", "10.2", /fixture-ds/],
  ["nonconformant/renderer-missing-part", "10.3", /source-document/],
  ["nonconformant/renderer-without-never", "10.3", /never/],
  ["nonconformant/stream-not-replayed", "10.4", /tool-call-error/],
] as const

describe("stage 10 probe", () => {
  it("emits exactly the four claims ACCEPTANCE.md declares", () => {
    const { stage, results } = run("conformant")
    expect(stage).toBe("10")
    expect(results.map((r: any) => r.claim).sort()).toEqual(CLAIMS)
  })

  it("meets every claim on the conformant fixture", () => {
    const { results } = run("conformant")
    for (const claim of CLAIMS) expect(claimOf(results, claim).status, claim).toBe(STATUS.MET)
  })

  it("reports the stream claims not applicable when no parts renderer is declared", () => {
    const { results } = run("conformant-no-ai")
    expect(claimOf(results, "10.1").status).toBe(STATUS.MET)
    expect(claimOf(results, "10.2").status).toBe(STATUS.MET)
    for (const claim of ["10.3", "10.4"]) {
      const r = claimOf(results, claim)
      expect(r.status, claim).toBe(STATUS.NOT_APPLICABLE)
      // The reason is the finding: a skip that does not say what switches it on
      // reads like a pass.
      expect(r.profile, claim).toMatch(/runtime\.partsRenderer/)
    }
  })

  it.each(BROKEN)("%s breaks %s and nothing else", (fixture, claim, why) => {
    const { results } = run(fixture)
    const broken = claimOf(results, claim)
    expect(broken.status).toBe(STATUS.UNMET)
    expect(broken.why).toMatch(why)
    expect(broken.fix, "an unmet claim without a fix is a complaint").toBeTruthy()
    const others = results.filter((r: any) => r.claim !== claim)
    for (const r of others) expect(r.status, `${r.claim} on ${fixture}`).toBe(STATUS.MET)
  })

  it("ignores stories and underscore files when listing component files", () => {
    // conformant ships _icons.tsx and button.stories.tsx without a data-slot;
    // a probe that counted them would fail the conformant tree.
    expect(claimOf(run("conformant").results, "10.1").status).toBe(STATUS.MET)
  })

  it("reports 10.2 unmet rather than throwing when runtime is absent altogether", () => {
    const root = path.join(F, "conformant")
    const loaded = loadConfig(root)
    if (!loaded.ok) throw new Error(loaded.reason)
    const { runtime: _drop, ...config } = loaded.config as any
    const { results } = probe(root, config)
    expect(claimOf(results, "10.2").status).toBe(STATUS.UNMET)
    expect(claimOf(results, "10.3").status).toBe(STATUS.NOT_APPLICABLE)
  })
})
