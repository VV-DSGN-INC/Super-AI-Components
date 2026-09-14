import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/** Liveness gate. A style axis is only real where a component READS it.
 *
 *  This walks the whole chain rather than any one link: a token is declared →
 *  `@theme inline` aliases it to a utility → some component actually writes
 *  that utility. Break any link and the axis is decoration.
 *
 *  Derive the token list from the CSS rather than hardcoding names, so a token
 *  added later arrives already gated and cannot repeat this by being the one
 *  nobody wired up.
 *
 *  Component sources exclude stories and tests on purpose: a story writing the
 *  utility proves the utility can be typed, not that any shipped component
 *  renders it. */

const STYLE_ENTRY = "src/styles/globals.css"
const COMPONENTS_DIR = "src/components"
const PREFIX = "--elevation-"

const css = readFileSync(path.resolve(process.cwd(), STYLE_ENTRY), "utf8")

const TOKENS = [
  ...new Set([...css.matchAll(new RegExp(`^\\s*(${PREFIX}[\\w-]+)\\s*:`, "gm"))].map((m) => m[1])),
]

function utilityFor(token: string): string | null {
  const m = css.match(new RegExp(`(--[\\w-]+)\\s*:\\s*var\\(${token}\\)`))
  return m ? m[1].replace(/^--/, "") : null
}

function componentSources(): string[] {
  const root = path.resolve(process.cwd(), COMPONENTS_DIR)
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.[jt]sx?$/.test(entry) && !/\.(stories|test|spec)\./.test(entry)) {
        out.push(readFileSync(full, "utf8"))
      }
    }
  }
  walk(root)
  return out
}

describe("token liveness", () => {
  it("finds tokens to check — a scan of zero tokens proves nothing", () => {
    expect(TOKENS.length).toBeGreaterThan(0)
  })

  it.each(TOKENS)("%s reaches a component", (token) => {
    const utility = utilityFor(token)
    expect(utility, `${token} has no @theme inline alias`).not.toBeNull()
    const sources = componentSources()
    const re = new RegExp(`(^|[^\\w-])${utility}(?![\\w-])`)
    expect(sources.some((s) => re.test(s)), `nothing writes ${utility}`).toBe(true)
  })
})
