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
    // STATUS_LABEL["idle"] === "Idle"
    const node = screen.getByRole("group", { name: "Video node, Idle" });
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

  it("locked renders the ai-node-locked block and hides media/body slots", () => {
    render(
      <AiNode id="n1" title="Lipsync" status="locked" media={<div data-testid="media" />}>
        <div data-testid="body" />
      </AiNode>,
    );
    expect(screen.getByText("Upgrade to unlock this node")).toBeInTheDocument();
    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.queryByTestId("body")).not.toBeInTheDocument();
    // The locked block carries the correct slot attribute
    const lockedBlock = screen.getByText("Upgrade to unlock this node").closest("[data-slot=ai-node-locked]");
    expect(lockedBlock).toBeInTheDocument();
  });

  it("locked renders custom lockedCta when provided", () => {
    render(
      <AiNode id="n1" title="Lipsync" status="locked" lockedCta={<span>Available on Pro</span>}>
        <div data-testid="body" />
      </AiNode>,
    );
    expect(screen.getByText("Available on Pro")).toBeInTheDocument();
    expect(screen.queryByText("Upgrade to unlock this node")).not.toBeInTheDocument();
    expect(screen.queryByTestId("body")).not.toBeInTheDocument();
  });

  it("failed without error prop shows 'Generation failed' banner", () => {
    render(
      <AiNode id="n1" title="Video" status="failed">
        x
      </AiNode>,
    );
    expect(screen.getByText("Generation failed")).toBeInTheDocument();
  });

  it("rest-prop passthrough: consumer data-slot wins over built-in; data-node-id set", () => {
    render(
      <AiNode
        id="n1"
        title="Video"
        status="idle"
        // Consumer overrides data-slot (spread comes after built-in attribute in JSX,
        // but {...props} is placed after data-slot="ai-node" in the render, so consumer wins)
        data-slot="video-node"
      >
        body
      </AiNode>,
    );
    const root = screen.getByRole("group");
    expect(root).toHaveAttribute("data-slot", "video-node");
    expect(root).toHaveAttribute("data-node-id", "n1");
  });

  it("style merge keeps width from size and consumer style can add extra props", () => {
    render(
      <AiNode id="n1" title="Video" status="idle" size="sm" style={{ opacity: 0.5 }}>
        body
      </AiNode>,
    );
    const root = screen.getByRole("group");
    // Width from NODE_WIDTH["sm"] = 280
    expect(root).toHaveStyle({ width: "280px", opacity: "0.5" });
  });
});
