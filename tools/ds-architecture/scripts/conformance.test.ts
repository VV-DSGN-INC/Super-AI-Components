import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { formatReport, runConformance } from "./conformance.mjs"

const F = path.resolve(process.cwd(), "stages/00-architecture-map/__fixtures__")
const CONFORMANT = path.join(F, "conformant")
const STAGE_FIXTURE = (name: string) =>
  path.resolve(process.cwd(), "stages/__fixtures__", name)

describe("runConformance", () => {
  it("reports every claim met on the conformant fixture", async () => {
    const out = await runConformance(path.join(F, "conformant"))
    expect(out.unmet).toHaveLength(0)
    expect(out.met.length).toBeGreaterThan(0)
    expect(out.summary.exitCode).toBe(0)
  })

  it("reports unmet claims and exits 1", async () => {
    const out = await runConformance(path.join(F, "nonconformant/missing-instructions"))
    expect(out.unmet.some((r: any) => r.claim === "00.1")).toBe(true)
    expect(out.summary.exitCode).toBe(1)
  })

  it("exits 2 with a reason when the target has no config", async () => {
    const out = await runConformance(path.resolve(process.cwd(), "src"))
    expect(out.summary.exitCode).toBe(2)
    expect(out.summary.reason).toMatch(/no ds-architecture.config.json/)
  })

  it("prints profile and adoption in the summary so narrowing shows in a diff", async () => {
    const out = await runConformance(path.join(F, "conformant"))
    expect(out.summary.profile).toBe("component-library")
    expect(out.summary.adoption).toBe("greenfield")
  })

  it("sorts results by stage then claim so output is stable between runs", async () => {
    const out = await runConformance(path.join(F, "conformant"))
    const keys = out.met.map((r: any) => `${r.stage}.${r.claim}`)
    expect(keys).toEqual([...keys].sort())
  })

  it("computes highestContiguous over applicable stages only", async () => {
    const out = await runConformance(path.join(F, "conformant"))
    expect(out.summary.highestContiguous).toBe("00")
  })

  it("leaves highestContiguous null when the first stage is unmet", async () => {
    const out = await runConformance(path.join(F, "nonconformant/missing-instructions"))
    expect(out.summary.highestContiguous).toBeNull()
  })

  it("turns a probe that throws into exit 2, never a silent pass", async () => {
    const out = await runConformance(path.join(F, "conformant"), {
      stageDirs: [path.resolve(process.cwd(), "stages/__throwing__")],
    })
    expect(out.summary.exitCode).toBe(2)
    expect(out.summary.reason).toMatch(/deliberate/)
  })

  it("does not discover the throwing fixture in a normal run", async () => {
    const out = await runConformance(path.join(F, "conformant"))
    expect(out.summary.exitCode).toBe(0)
  })

  it("exits 2 when an explicit --stage selects no stage directory", async () => {
    const out = await runConformance(CONFORMANT, { stage: "99" })
    expect(out.summary.exitCode).toBe(2)
    expect(out.summary.reason).toMatch(/--stage 99/)
    expect(out.met).toHaveLength(0)
  })

  it("still runs a --stage that does match, so the guard is not blanket", async () => {
    const out = await runConformance(CONFORMANT, { stage: "00" })
    expect(out.summary.exitCode).toBe(0)
    expect(out.met.length).toBeGreaterThan(0)
  })

  it("reports a stage directory with no acceptance.mjs as unchecked, never a silent skip", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("03-missing-probe")],
    })
    expect(out.met).toHaveLength(0)
    const entry = out.unchecked.find((r: any) => r.stage === "03")
    expect(entry).toBeDefined()
    expect(entry!.reason).toMatch(/acceptance\.mjs/)
  })

  it("reports a stage directory with no ACCEPTANCE.md as unchecked", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("04-missing-acceptance")],
    })
    expect(out.met).toHaveLength(0)
    const entry = out.unchecked.find((r: any) => r.stage === "04")
    expect(entry!.reason).toMatch(/ACCEPTANCE\.md/)
  })

  it("marks a declared claim the probe never emitted as unchecked, naming it", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("05-claim-drift")],
    })
    const missing = out.unchecked.find((r: any) => r.claim === "05.2")
    expect(missing, "05.2 is declared and never emitted").toBeDefined()
    expect(missing!.reason).toMatch(/declares this claim/)
  })

  it("marks an emitted claim nobody declared as unchecked rather than met", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("05-claim-drift")],
    })
    expect(out.met.map((r: any) => r.claim)).toEqual(["05.1"])
    const undeclared = out.unchecked.find((r: any) => r.claim === "05.9")
    expect(undeclared, "05.9 is emitted and never declared").toBeDefined()
    expect(undeclared!.reason).toMatch(/does not declare it/)
  })

  it("exits 2 when an ACCEPTANCE.md declares no claims key", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-stage-"))
    writeFileSync(
      path.join(dir, "ACCEPTANCE.md"),
      "---\nappliesTo: [component-library]\n---\n"
    )
    writeFileSync(
      path.join(dir, "acceptance.mjs"),
      'export default function probe() { return { stage: "07", results: [] } }\n'
    )
    const out = await runConformance(CONFORMANT, { stageDirs: [dir] })
    expect(out.summary.exitCode).toBe(2)
    expect(out.summary.reason).toMatch(/claims/)
  })

  it("breaks contiguity at a stage whose claims are all unchecked", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("01-all-unchecked"), STAGE_FIXTURE("02-met")],
    })
    expect(out.summary.highestContiguous).toBeNull()
    expect(out.summary.stagesReached).toEqual(["02"])
  })

  it("still reaches a stage that IS determined, so the contiguity guard is not blanket", async () => {
    const out = await runConformance(CONFORMANT, { stageDirs: [STAGE_FIXTURE("02-met")] })
    expect(out.summary.highestContiguous).toBe("02")
  })

  it("carries the vendor stamp in the returned object, so --json prints it too", async () => {
    const out = await runConformance(CONFORMANT)
    expect(Array.isArray(out.vendored)).toBe(true)
    expect(out.vendored.length).toBeGreaterThan(0)
    expect(out.vendored[0]).toHaveProperty("sha")
  })

  it("carries the vendor stamp even on an exit-2 run", async () => {
    const out = await runConformance(path.resolve(process.cwd(), "src"))
    expect(out.summary.exitCode).toBe(2)
    expect(out.vendored.length).toBeGreaterThan(0)
  })

  it("has one definition of the exit-code contract — it calls exitCodeFor", () => {
    const source = readFileSync(path.resolve(process.cwd(), "scripts/conformance.mjs"), "utf8")
    expect(source).toMatch(/exitCodeFor\(/)
    // The inline reimplementation this replaced. Two definitions of one contract
    // is how the tested one and the shipped one drift apart.
    expect(source).not.toMatch(/unmet\.length\s*>\s*0\s*\?\s*1\s*:\s*0/)
  })

  it("exits 0 when every result is unchecked — nothing determined is not a failure", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("01-all-unchecked")],
    })
    expect(out.summary.exitCode).toBe(0)
  })

  it("prints an unchecked result's reason, not a bare claim id", async () => {
    const out = await runConformance(CONFORMANT, {
      stageDirs: [STAGE_FIXTURE("01-all-unchecked")],
    })
    const lines = formatReport(out)
    const claimLine = lines.find((l: string) => l.trim().startsWith("01.1"))
    expect(claimLine).toBeDefined()
    expect(claimLine).toMatch(/needs the target's own runner/)
  })

  it("still prints why and fix for an unmet result", async () => {
    const out = await runConformance(path.join(F, "nonconformant/missing-instructions"))
    const text = formatReport(out).join("\n")
    expect(text).toMatch(/00\.1 — no AGENTS\.md/)
    expect(text).toMatch(/fix: Copy stages/)
  })

  it("prints the vendor stamp in the rendered report too", async () => {
    const out = await runConformance(CONFORMANT)
    expect(formatReport(out).at(-1)).toMatch(/^vendored: /)
  })

  it("does not print profile=undefined on a could-not-tell run", async () => {
    const out = await runConformance(CONFORMANT, { stage: "99" })
    const text = formatReport(out).join("\n")
    expect(text).not.toMatch(/undefined/)
    expect(text).toMatch(/could not tell/)
  })
})
