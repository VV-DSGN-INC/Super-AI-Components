import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { loadConfig } from "../../scripts/lib/validate-config.mjs"
import { STATUS } from "../../src/probe-kit/result.mjs"
import probe from "./acceptance.mjs"

const F = path.resolve(process.cwd(), "stages/00-architecture-map/__fixtures__")

// `results: any[]` because result.mjs is plain JS under checkJs:false, so TS
// collapses the met/unmet/unchecked union to the met() shape and `r.fix` fails
// to typecheck. Same reason claimOf below takes `any[]`.
function run(fixture: string): { stage: string; results: any[] } {
  const root = path.join(F, fixture)
  const loaded = loadConfig(root)
  if (!loaded.ok) throw new Error(loaded.reason)
  return probe(root, loaded.config)
}

const claimOf = (results: any[], claim: string) => results.find((r) => r.claim === claim)

const BROKEN = [
  "nonconformant/missing-instructions",
  "nonconformant/no-done-command",
  "nonconformant/no-spec-location",
  "nonconformant/unresolved-role",
]

describe("stage 00 probe", () => {
  it("meets every claim on the conformant fixture", () => {
    const { stage, results } = run("conformant")
    expect(stage).toBe("00")
    expect(results).toHaveLength(6)
    expect(results.every((r: any) => r.status === STATUS.MET)).toBe(true)
  })

  it("fails 00.1 when the instructions file is absent", () => {
    const { results } = run("nonconformant/missing-instructions")
    expect(claimOf(results, "00.1").status).toBe(STATUS.UNMET)
  })

  it("reports 00.2 and 00.3 UNCHECKED when there is no file to read, not unmet", () => {
    const { results } = run("nonconformant/missing-instructions")
    expect(claimOf(results, "00.2").status).toBe(STATUS.UNCHECKED)
    expect(claimOf(results, "00.3").status).toBe(STATUS.UNCHECKED)
    expect(claimOf(results, "00.2").reason).toMatch(/no instructions file/)
  })

  it("fails 00.2 when no runnable definition of done is stated", () => {
    expect(claimOf(run("nonconformant/no-done-command").results, "00.2").status).toBe(STATUS.UNMET)
  })

  it("fails 00.3 when spec and plan locations are absent", () => {
    expect(claimOf(run("nonconformant/no-spec-location").results, "00.3").status).toBe(STATUS.UNMET)
  })

  it("fails 00.5 and names the role that resolves to nothing", () => {
    const claim = claimOf(run("nonconformant/unresolved-role").results, "00.5")
    expect(claim.status).toBe(STATUS.UNMET)
    expect(claim.why).toMatch(/docs/)
  })

  it("fails 00.4 when the config on disk is invalid, even when the caller passes a valid config object", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-badcfg-"))
    writeFileSync(path.join(dir, "AGENTS.md"), readFileSync(path.join(F, "conformant/AGENTS.md"), "utf8"))
    writeFileSync(path.join(dir, "ds-architecture.config.json"), "{ not json")
    const { results } = probe(dir, {
      profile: "component-library",
      adoption: "greenfield",
      scopeRoles: {},
    })
    expect(claimOf(results, "00.4").status).toBe(STATUS.UNMET)
    expect(claimOf(results, "00.4").fix).toBeTruthy()
  })

  it("every unmet result carries a fix", () => {
    for (const fixture of BROKEN) {
      for (const r of run(fixture).results) {
        if (r.status === STATUS.UNMET) expect(r.fix, `${fixture} ${r.claim}`).toBeTruthy()
      }
    }
  })

  it("each broken fixture breaks exactly one claim", () => {
    for (const fixture of BROKEN) {
      const unmetCount = run(fixture).results.filter((r: any) => r.status === STATUS.UNMET).length
      expect(unmetCount, fixture).toBe(1)
    }
  })

  it("fails 00.5 when scopeRoles is empty — nothing scoped is not every role resolving", () => {
    // A target with no src/ at all and "scopeRoles": {} used to report all six
    // claims met: unresolvedRoles mapped over zero entries and returned [].
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-noroles-"))
    writeFileSync(
      path.join(dir, "AGENTS.md"),
      readFileSync(path.join(F, "conformant/AGENTS.md"), "utf8")
    )
    writeFileSync(
      path.join(dir, "ds-architecture.config.json"),
      readFileSync(path.join(F, "conformant/ds-architecture.config.json"), "utf8")
    )
    const { results } = probe(dir, {
      profile: "component-library",
      adoption: "greenfield",
      scopeRoles: {},
    })
    const claim = claimOf(results, "00.5")
    expect(claim.status).toBe(STATUS.UNMET)
    expect(claim.why).toMatch(/no scope roles/)
    expect(claim.fix).toBeTruthy()
  })

  it("exports the regexes its reference test asserts against", async () => {
    const mod: any = await import("./acceptance.mjs")
    for (const name of ["COMMAND_RE", "SPEC_RE", "PLAN_RE"]) {
      expect(mod[name], name).toBeInstanceOf(RegExp)
    }
  })
})
