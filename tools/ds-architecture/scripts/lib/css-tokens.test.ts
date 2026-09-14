import { describe, expect, it } from "vitest"

import { aliasTargets, declaredTokens, literalAliases, themeAliases } from "./css-tokens.mjs"

const CSS = `
:root {
  --ink-500: #71717a;
  --surface-primary: #ffffff;
  --text-primary: var(--ink-900);
  --background: var(--surface-primary);
  --primary: #10b981;
}

@theme inline {
  --color-background: var(--background);
  --shadow-card: var(--elevation-card);
  --radius-card: 12px;
}

.dark {
  --surface-primary: #18181b;
}
`

describe("declaredTokens", () => {
  it("finds every custom property declared anywhere, deduplicated and sorted", () => {
    const found = declaredTokens(CSS)
    expect(found).toContain("--surface-primary")
    expect(found).toContain("--color-background")
    expect(found.filter((t) => t === "--surface-primary")).toHaveLength(1)
    expect(found).toEqual([...found].sort())
  })

  it("does not report a var() REFERENCE as a declaration", () => {
    expect(declaredTokens(":root { --a: var(--b); }")).toEqual(["--a"])
  })

  it("returns an empty array for CSS with no custom properties", () => {
    expect(declaredTokens(".x { color: red; }")).toEqual([])
  })
})

describe("themeAliases", () => {
  it("maps an @theme inline alias to the token it references", () => {
    expect(themeAliases(CSS).get("--color-background")).toBe("--background")
    expect(themeAliases(CSS).get("--shadow-card")).toBe("--elevation-card")
  })

  it("omits an @theme inline entry whose value is a literal", () => {
    expect(themeAliases(CSS).has("--radius-card")).toBe(false)
  })

  it("ignores declarations outside the @theme inline block", () => {
    expect(themeAliases(CSS).has("--text-primary")).toBe(false)
  })
})

describe("aliasTargets", () => {
  it("resolves a single-var alias to its target", () => {
    expect(aliasTargets(CSS).get("--background")).toBe("--surface-primary")
  })

  it("omits a declaration whose value is a literal", () => {
    expect(aliasTargets(CSS).has("--primary")).toBe(false)
    expect(aliasTargets(CSS).has("--ink-500")).toBe(false)
  })
})

describe("literalAliases", () => {
  it("names an @theme inline entry carrying a literal instead of a var()", () => {
    expect(literalAliases(CSS)).toContain("--radius-card")
  })

  it("is empty when every @theme inline entry is a var()", () => {
    expect(literalAliases("@theme inline { --color-a: var(--a); }")).toEqual([])
  })
})
