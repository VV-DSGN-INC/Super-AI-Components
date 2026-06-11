import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { compatibleTargets, ConnectionHint } from "./connection-hint"

const catalog = [
  { kind: "video-node", label: "Video", in: ["image", "text"], out: ["video"] },
  { kind: "tts-node", label: "Text to Speech", in: ["text"], out: ["audio"] },
]

describe("connection-hint", () => {
  it("filters catalog by compatible input type", () => {
    expect(compatibleTargets("image", catalog).map((c) => c.kind)).toEqual(["video-node"])
  })
  it("renders options and fires onPick", async () => {
    const onPick = vi.fn()
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 10, y: 10 }} onPick={onPick} />)
    await userEvent.click(screen.getByText("Text to Speech"))
    expect(onPick).toHaveBeenCalledWith("tts-node")
  })
})
