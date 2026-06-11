import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiNode } from "./ai-node";

describe("AiNode", () => {
  it("renders title, model label, runtime suffix and status group semantics", () => {
    render(
      <AiNode id="n1" title="Video" modelLabel="LTX 2.3" runtime="local" status="idle" size="md">
        body
      </AiNode>,
    );
    const node = screen.getByRole("group", { name: "Video node, idle" });
    expect(node).toHaveStyle({ width: "320px" });
    expect(screen.getByText("LTX 2.3 · Local")).toBeInTheDocument();
  });
  it("failed shows inline error banner", () => {
    render(
      <AiNode id="n1" title="Image" status="failed" error="Provider exploded">
        x
      </AiNode>,
    );
    expect(screen.getByText("Provider exploded")).toBeInTheDocument();
  });
  it("selected applies ring, slots render in order", () => {
    render(
      <AiNode
        id="n1"
        title="T"
        status="idle"
        selected
        media={<div data-testid="media" />}
        footer={<div data-testid="footer" />}
      >
        <div data-testid="body" />
      </AiNode>,
    );
    const order = ["media", "body", "footer"].map((t) => screen.getByTestId(t));
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
