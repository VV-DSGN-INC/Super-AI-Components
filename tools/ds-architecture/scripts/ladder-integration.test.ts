import path from "node:path"

import { describe, expect, it } from "vitest"

import { runConformance } from "./conformance.mjs"

const F = (stage: string, fixture: string) =>
  path.resolve(process.cwd(), `stages/${stage}/__fixtures__/${fixture}`)

describe("ladder integration", () => {
  it("runs all three stages against one target", async () => {
    const out = await runConformance(F("09-loops-and-conventions", "conformant"))
    const stages = new Set([...out.met, ...out.unmet, ...out.unchecked].map((r: any) => r.stage))
    expect(stages).toContain("00")
    expect(stages).toContain("09")
  })

  it("reports 01.4c in the unchecked bucket, never omitted", async () => {
    const out = await runConformance(F("01-token-contract", "conformant"))
    expect(out.unchecked.some((r: any) => r.claim === "01.4c")).toBe(true)
  })

  it("emits no cross-check drift — every declared claim is emitted and vice versa", async () => {
    const out = await runConformance(F("01-token-contract", "conformant"))
    const drift = out.unchecked.filter((r: any) => /declares|does not declare/.test(r.reason ?? ""))
    expect(drift).toEqual([])
  })

  it("keeps output sorted by stage then claim", async () => {
    const out = await runConformance(F("09-loops-and-conventions", "conformant"))
    const keys = out.met.map((r: any) => `${r.stage}.${r.claim}`)
    expect(keys).toEqual([...keys].sort())
  })
})
