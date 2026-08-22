import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { loadConfig, validateAgainst } from "./validate-config.mjs"

const valid = {
  profile: "component-library",
  adoption: "greenfield",
  scopeRoles: { components: ["src/components/**"] },
  paths: { nameContract: "src/tokens.ts", styleEntry: ["src/styles/globals.css"] },
  axes: [{ attribute: "data-theme", values: ["default", "warm"] }],
  commands: { test: "npm test" },
}

function targetWith(contents?: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "dsa-"))
  if (contents !== undefined) {
    writeFileSync(path.join(dir, "ds-architecture.config.json"), contents)
  }
  return dir
}

describe("loadConfig", () => {
  it("loads a valid config", () => {
    const result = loadConfig(targetWith(JSON.stringify(valid)))
    expect(result.ok).toBe(true)
    expect(result.config.profile).toBe("component-library")
  })

  it("reports a missing config rather than throwing", () => {
    const result = loadConfig(targetWith())
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/no ds-architecture.config.json/)
  })

  it("reports unparseable JSON distinctly from a missing file", () => {
    const result = loadConfig(targetWith("{ not json"))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/could not be parsed/)
  })

  it("rejects an unknown scope role", () => {
    const bad = { ...valid, scopeRoles: { widgets: ["src/widgets/**"] } }
    const result = loadConfig(targetWith(JSON.stringify(bad)))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/scopeRoles/)
  })

  it("rejects a missing required key and names it", () => {
    const { commands, ...bad } = valid
    const result = loadConfig(targetWith(JSON.stringify(bad)))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/commands/)
  })

  it("rejects an unknown top-level key rather than ignoring it", () => {
    const result = loadConfig(targetWith(JSON.stringify({ ...valid, extra: 1 })))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/extra/)
  })

  it("rejects a bad axis attribute pattern", () => {
    const bad = { ...valid, axes: [{ attribute: "theme", values: ["a"] }] }
    const result = loadConfig(targetWith(JSON.stringify(bad)))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/axes/)
  })

  it("agrees with the zod schema on the valid fixture", async () => {
    const { configSchema } = await import("../../src/config/schema")
    expect(() => configSchema.parse(valid)).not.toThrow()
    expect(loadConfig(targetWith(JSON.stringify(valid))).ok).toBe(true)
  })

  it("reports an unreadable schema file rather than throwing", () => {
    const result = loadConfig(
      targetWith(JSON.stringify(valid)),
      path.join(tmpdir(), "dsa-no-such-schema.json")
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/could not be read/)
  })

  it("reports a malformed schema file rather than throwing", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-schema-"))
    const schemaPath = path.join(dir, "schema.json")
    writeFileSync(schemaPath, "{ not json")
    const result = loadConfig(targetWith(JSON.stringify(valid)), schemaPath)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/could not be read/)
  })

  it("turns an unsupported schema construct into ok:false, not a propagated throw", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dsa-schema-"))
    const schemaPath = path.join(dir, "schema.json")
    writeFileSync(schemaPath, JSON.stringify({ oneOf: [{ type: "string" }] }))
    let result: any
    expect(() => {
      result = loadConfig(targetWith(JSON.stringify(valid)), schemaPath)
    }).not.toThrow()
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/could not be validated/)
  })
})

/** Every construct below returned `[]` — "valid" — for a value that plainly is
 *  not. A validator that silently ignores a constraint reports success with
 *  nothing having checked it, which is the defect this repo is entirely about. */
describe("validateAgainst rejects constructs outside its closed subset", () => {
  it("throws on oneOf rather than accepting any value", () => {
    expect(() => validateAgainst({ oneOf: [{ type: "string" }] }, 42)).toThrow(/oneOf/)
  })

  it("throws on minLength with no type", () => {
    expect(() => validateAgainst({ minLength: 5 }, "ab")).toThrow(/neither type nor enum/)
  })

  it('throws on type "integer"', () => {
    expect(() => validateAgainst({ type: "integer" }, "not an integer")).toThrow(/integer/)
  })

  it('throws on type "boolean"', () => {
    expect(() => validateAgainst({ type: "boolean" }, "not a boolean")).toThrow(/boolean/)
  })

  it("throws from inside a nested property, not only at the root", () => {
    const schema = {
      type: "object",
      properties: { count: { type: "integer" } },
    }
    expect(() => validateAgainst(schema, { count: 1 })).toThrow(/count/)
  })

  it("still validates the subset it does implement", () => {
    expect(validateAgainst({ type: "string", minLength: 3 }, "ab")).toHaveLength(1)
    expect(validateAgainst({ type: "string", minLength: 3 }, "abc")).toEqual([])
  })

  it("accepts the shipped config schema — the guard must not be a blanket refusal", () => {
    const schema = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "src/config/config.schema.json"), "utf8")
    )
    expect(() => validateAgainst(schema, valid)).not.toThrow()
    expect(validateAgainst(schema, valid)).toEqual([])
  })
})
