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

  /** A one-side border is a real colour reader. Minimal DS's next-step-card
   *  draws its accent stripe as `border-l-accent-bold` on top of a full
   *  border, and that stripe was the token's only consumer: the walk derived
   *  `border-accent-bold` and nothing else, so it called a live token dead. */
  const COLOR_CSS = `
:root { --accent-bold: #171717; }
@theme inline { --color-accent-bold: var(--accent-bold); }
`
  it.each(["t", "r", "b", "l", "x", "y", "s", "e"])(
    "counts a directional border-%s- utility as a colour consumer",
    (side) => {
      const sources = [`export const X = () => <div className="border border-${side}-accent-bold" />`]
      expect(deadTokens(COLOR_CSS, ["--accent-bold"], sources)).toEqual([])
    },
  )

  it("does not read a one-side width as a colour consumer", () => {
    const sources = [`export const X = () => <div className="border-l-4 border-l-[#000]" />`]
    expect(deadTokens(COLOR_CSS, ["--accent-bold"], sources)).toEqual(["--accent-bold"])
  })

  it("returns tokens sorted, so output is stable between runs", () => {
    const tokens = ["--elevation-orphan", "--elevation-ghost"]
    expect(deadTokens(CSS, tokens, [])).toEqual([...deadTokens(CSS, tokens, [])].sort())
  })
})

/** The second consumer path. A site that paints with `style={{ color:
 *  "var(--color-text)" }}` or a CSS module reading the token never writes the
 *  utility, and the utility-only walk called seven live tokens dead on one. */
describe("deadTokens with direct var() readers", () => {
  it("counts a direct var() read as a consumer when no utility is written", () => {
    const readers = [`.card { box-shadow: var(--elevation-card); }`]
    expect(deadTokens(CSS, ["--elevation-card"], readers)).toEqual([])
  })

  it("counts a var() read that carries a fallback", () => {
    const readers = [`export const X = () => <div style={{ boxShadow: "var(--elevation-card, none)" }} />`]
    expect(deadTokens(CSS, ["--elevation-card"], readers)).toEqual([])
  })

  it("counts a var() read with whitespace inside the parentheses", () => {
    const readers = [`.card { box-shadow: var( --elevation-card ); }`]
    expect(deadTokens(CSS, ["--elevation-card"], readers)).toEqual([])
  })

  it("does not let a longer token's read rescue a shorter one", () => {
    const readers = [`.card { box-shadow: var(--elevation-card-raised); }`]
    expect(deadTokens(CSS, ["--elevation-card"], readers)).toEqual(["--elevation-card"])
  })

  it("does not count a bare mention of the name outside var()", () => {
    const readers = [`const name = "--elevation-card"`]
    expect(deadTokens(CSS, ["--elevation-card"], readers)).toEqual(["--elevation-card"])
  })

  it("takes utility writers and var() readers in one list", () => {
    const sources = [...COMPONENTS, `.x { box-shadow: var(--elevation-orphan); }`]
    expect(deadTokens(CSS, ["--elevation-card", "--elevation-orphan"], sources)).toEqual([])
  })
})
