import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { TypedHandle } from "@/registry/super-ai/typed-handle";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

describe("TypedHandle", () => {
  it("renders a port with the type colour var and an accessible name", () => {
    wrap(<TypedHandle nodeId="n1" dataType="image" type="target" />);
    const port = screen.getByLabelText("Image input port");
    expect(port).toHaveStyle({ background: "var(--flow-image)" });
    expect(port).toHaveAttribute("data-slot", "typed-handle");
    expect(port).toHaveAttribute("data-flow-type", "image");
    expect(port).toHaveAttribute("data-handlepos", "left");
  });
  it("encodes node id, type and direction in the handle id", () => {
    wrap(<TypedHandle nodeId="n1" dataType="audio" type="source" />);
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
  it("knows the ten built-in types, including the ones that start with a digit", () => {
    wrap(<TypedHandle nodeId="n1" dataType="3d" type="source" />);
    expect(screen.getByLabelText("3D output port")).toHaveStyle({ background: "var(--flow-3d)" });
  });
  it("an unregistered type falls back to --flow-text and a descriptive name", () => {
    wrap(<TypedHandle nodeId="n1" dataType="mask" type="target" />);
    expect(screen.getByLabelText("mask input port")).toHaveStyle({ background: "var(--flow-text)" });
  });
  it("stacks by top offset and passes className through", () => {
    wrap(<TypedHandle nodeId="n1" dataType="text" type="target" top={28} className="test-class" />);
    const port = screen.getByLabelText("Text input port");
    expect(port).toHaveStyle({ top: "28px" });
    expect(port.className).toContain("test-class");
  });
});
