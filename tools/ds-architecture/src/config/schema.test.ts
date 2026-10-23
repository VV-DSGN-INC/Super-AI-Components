import { describe, expect, it } from "vitest"

import { ADOPTIONS, PROFILES, SCOPE_ROLES, cellCount, configSchema } from "./schema"

const valid = {
  profile: "component-library",
  adoption: "greenfield",
  scopeRoles: { components: ["src/components/**"], styles: ["src/styles/**"] },
  paths: { nameContract: "src/tokens.ts", styleEntry: ["src/styles/globals.css"] },
  axes: [{ attribute: "data-theme", values: ["default", "warm"] }],
  commands: { test: "npm test" },
}

describe("configSchema", () => {
  it("accepts a minimal valid config", () => {
    expect(configSchema.parse(valid).profile).toBe("component-library")
  })

  it("defaults vendored to an empty object so callers never branch on undefined", () => {
    expect(configSchema.parse(valid).vendored).toEqual({})
  })

  it("rejects a scope role outside the closed set", () => {
    const bad = { ...valid, scopeRoles: { ...valid.scopeRoles, widgets: ["src/widgets/**"] } }
    expect(() => configSchema.parse(bad)).toThrow()
  })

  it("rejects an empty glob list — a role mapped to nothing scans nothing", () => {
    expect(() => configSchema.parse({ ...valid, scopeRoles: { components: [] } })).toThrow()
  })

  it("rejects an axis attribute that is not a data-* attribute", () => {
    const bad = { ...valid, axes: [{ attribute: "theme", values: ["a"] }] }
    expect(() => configSchema.parse(bad)).toThrow()
  })

  it("rejects an unknown top-level key rather than ignoring it", () => {
    expect(() => configSchema.parse({ ...valid, scopeRole: {} })).toThrow()
  })

  it("accepts a class axis, because .dark is the single-attribute selector [class~=dark]", () => {
    const withClass = { ...valid, axes: [{ attribute: "class", values: ["dark"] }] }
    expect(configSchema.parse(withClass).axes[0].attribute).toBe("class")
  })

  it.each(["className", "classes", "class-name", "data-", "style", "id"])(
    "rejects %s as an axis attribute",
    (attribute) => {
      const bad = { ...valid, axes: [{ attribute, values: ["a"] }] }
      expect(() => configSchema.parse(bad)).toThrow()
    }
  )

  it("accepts an explicit empty axes list, which is how a one-cell system states it", () => {
    expect(configSchema.parse({ ...valid, axes: [] }).axes).toEqual([])
  })

  it("still requires the axes key, so a one-cell system cannot state it by omission", () => {
    const { axes, ...bad } = valid
    expect(() => configSchema.parse(bad)).toThrow()
  })

  it("exposes the closed sets", () => {
    expect(SCOPE_ROLES).toEqual(["components", "styles", "stories", "docs", "app"])
    expect(PROFILES).toEqual(["tokens-only", "component-library", "app-consumer"])
    expect(ADOPTIONS).toEqual(["greenfield", "retrofit"])
  })
})

describe("cellCount", () => {
  it("counts each axis's unset default — two axes of two values is nine cells, not four", () => {
    expect(
      cellCount([
        { attribute: "data-theme", values: ["a", "b"] },
        { attribute: "data-finish", values: ["x", "y"] },
      ])
    ).toBe(9)
  })

  it("is three for a single two-value axis", () => {
    expect(cellCount([{ attribute: "data-theme", values: ["a", "b"] }])).toBe(3)
  })

  it("is two for a class axis with one class: the class set and the class absent", () => {
    expect(cellCount([{ attribute: "class", values: ["dark"] }])).toBe(2)
  })

  it("is one for zero axes", () => {
    expect(cellCount([])).toBe(1)
  })
})
