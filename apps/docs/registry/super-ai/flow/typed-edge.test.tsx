import { describe, expect, it } from "vitest"
import { edgeColorFromHandle, typedEdgeStyle } from "./typed-edge"

describe("typed-edge helpers", () => {
  it("derives stroke color from the source handle id", () => {
    expect(edgeColorFromHandle("n1:video:out")).toBe("var(--flow-video)")
    expect(edgeColorFromHandle("garbage")).toBe("var(--flow-text)")
  })
  it("streaming edges get the dash animation class", () => {
    expect(typedEdgeStyle({ sourceHandle: "n1:image:out", streaming: true }).className).toContain("animate")
  })
})
