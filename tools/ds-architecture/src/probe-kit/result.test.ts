import { describe, expect, it } from "vitest"

import { STATUS, exitCodeFor, met, notApplicable, unchecked, unmet } from "./result.mjs"

describe("result records", () => {
  it("met carries only the claim", () => {
    expect(met("00.1")).toEqual({ status: STATUS.MET, claim: "00.1" })
  })

  it("unmet carries why and fix, because a finding without a fix is a complaint", () => {
    expect(unmet("00.4", "no config file", "run the scaffold")).toEqual({
      status: STATUS.UNMET,
      claim: "00.4",
      why: "no config file",
      fix: "run the scaffold",
    })
  })

  it("unchecked carries the reason it could not be checked", () => {
    expect(unchecked("06.3", "needs the target's test runner")).toEqual({
      status: STATUS.UNCHECKED,
      claim: "06.3",
      reason: "needs the target's test runner",
    })
  })

  it("notApplicable carries the profile that excluded it", () => {
    expect(notApplicable("04.1", "tokens-only")).toEqual({
      status: STATUS.NOT_APPLICABLE,
      claim: "04.1",
      profile: "tokens-only",
    })
  })
})

describe("exitCodeFor", () => {
  it("is 0 when every result is met", () => {
    expect(exitCodeFor([met("a"), met("b")])).toBe(0)
  })

  it("is 0 when the only non-met results are unchecked or n/a", () => {
    expect(exitCodeFor([met("a"), unchecked("b", "r"), notApplicable("c", "p")])).toBe(0)
  })

  it("is 1 when any result is unmet", () => {
    expect(exitCodeFor([met("a"), unmet("b", "w", "f")])).toBe(1)
  })

  it("is 0 for an empty result set — nothing claimed is not a failure", () => {
    expect(exitCodeFor([])).toBe(0)
  })

  it("never returns 2 — that code belongs to the caller that caught a throw", () => {
    expect(exitCodeFor([unmet("a", "w", "f")])).not.toBe(2)
  })
})
