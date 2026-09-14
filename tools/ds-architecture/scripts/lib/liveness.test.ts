import { describe, expect, it } from "vitest"

import { deadTokens, utilityFor } from "./liveness.mjs"

const CSS = `
:root {
  --elevation-card: 0 1px 2px #0001;
  --elevation-popover: 0 4px 8px #0001;
  --elevation-orphan: 0 8px 16px #0001;
}
@theme inline {
  --shadow-card: var(--elevation-card);
  --shadow-popover: var(--elevation-popover);
}
`

const COMPONENTS = [
  `export const Card = () => <div className="shadow-card rounded-card" />`,
  `export const Menu = () => <div className="shadow-popover" />`,
]

describe("utilityFor", () => {
  it("returns the utility a token reaches through @theme inline", () => {
    expect(utilityFor(CSS, "--elevation-card")).toBe("shadow-card")
  })

  it("returns null for a token with no alias — the first broken link", () => {
    expect(utilityFor(CSS, "--elevation-orphan")).toBeNull()
  })
})

describe("deadTokens", () => {
  it("is empty when every token reaches a component", () => {
    const tokens = ["--elevation-card", "--elevation-popover"]
    expect(deadTokens(CSS, tokens, COMPONENTS)).toEqual([])
  })

  it("names a token with no alias", () => {
    expect(deadTokens(CSS, ["--elevation-orphan"], COMPONENTS)).toEqual(["--elevation-orphan"])
  })

  it("names a token that HAS an alias but no component writing the utility", () => {
    const css = CSS + `@theme inline { --shadow-ghost: var(--elevation-ghost); }`
    expect(deadTokens(css, ["--elevation-ghost"], COMPONENTS)).toEqual(["--elevation-ghost"])
  })

  it("does not count a partial word match as a consumer", () => {
    const sources = [`export const X = () => <div className="shadow-cardigan" />`]
    expect(deadTokens(CSS, ["--elevation-card"], sources)).toEqual(["--elevation-card"])
  })

  it("counts a utility written with a variant prefix", () => {
    const sources = [`export const X = () => <div className="hover:shadow-card" />`]
    expect(deadTokens(CSS, ["--elevation-card"], sources)).toEqual([])
  })

  it("counts a utility written with a leading dash for a negative utility", () => {
    const sources = [`export const X = () => <div className="-shadow-card" />`]
    expect(deadTokens(CSS, ["--elevation-card"], sources)).toEqual([])
  })

  it("returns tokens sorted, so output is stable between runs", () => {
    const tokens = ["--elevation-orphan", "--elevation-ghost"]
    expect(deadTokens(CSS, tokens, [])).toEqual([...deadTokens(CSS, tokens, [])].sort())
  })
})
