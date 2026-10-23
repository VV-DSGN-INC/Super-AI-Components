import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const REF = path.resolve(process.cwd(), "stages/10-runtime-identity-and-streams/reference")
const partList = JSON.parse(readFileSync(path.join(REF, "ui-part-types.json"), "utf8"))
const streamFiles = readdirSync(path.join(REF, "streams")).filter((f) => f.endsWith(".json")).sort()
const streams = streamFiles.map((f) => ({ file: f, ...JSON.parse(readFileSync(path.join(REF, "streams", f), "utf8")) }))

describe("stage 10 reference", () => {
  it("ships a versioned part list with types and prefixes", () => {
    expect(partList.sdk).toMatch(/^ai@\d+$/)
    expect(partList.verifiedAgainst).toMatch(/^ai@\d+\.\d+\.\d+$/)
    expect(partList.types.length).toBeGreaterThan(0)
    expect(partList.prefixes).toEqual(["tool-", "data-"])
  })

  it("finds stream fixtures to check — a passing scan of zero files proves nothing", () => {
    expect(streams.length).toBeGreaterThanOrEqual(4)
  })

  it.each(streams.map((s) => [s.file, s]))("%s is a well-formed recording", (file, s: any) => {
    expect(`${s.id}.json`).toBe(file)
    expect(s.title).toBeTruthy()
    // The provenance line is what stops a scripted recording passing for a live one.
    expect(s.recordedWith).toMatch(/^ai@\d+\.\d+\.\d+: .*scripted/)
    expect(s.chunks.length).toBeGreaterThan(0)
    expect(s.chunks.at(-1).type).toBe("finish")
    expect(s.message.parts.length).toBeGreaterThan(0)
    expect(s.partTypes).toEqual([...new Set(s.message.parts.map((p: any) => p.type))].sort())
  })

  it("covers every listed part type and both prefixes across the recordings", () => {
    const seen = new Set(streams.flatMap((s: any) => s.partTypes as string[]))
    const missingTypes = partList.types.filter((t: string) => !seen.has(t))
    const missingPrefixes = partList.prefixes.filter((p: string) => ![...seen].some((t) => t.startsWith(p)))
    expect({ missingTypes, missingPrefixes }).toEqual({ missingTypes: [], missingPrefixes: [] })
  })

  it("records both outcomes of a tool call", () => {
    const states = streams.flatMap((s: any) =>
      s.message.parts.filter((p: any) => p.type.startsWith("tool-")).map((p: any) => p.state)
    )
    expect(states).toContain("output-available")
    expect(states).toContain("output-error")
  })
})
