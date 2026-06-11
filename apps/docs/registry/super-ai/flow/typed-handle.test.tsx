import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { TypedHandle } from "./typed-handle";

const wrap = (ui: React.ReactNode) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

describe("TypedHandle", () => {
  it("renders a port with type color var and aria label", () => {
    wrap(<TypedHandle nodeId="n1" dataType="image" type="target" />);
    const port = screen.getByLabelText("Image input port");
    expect(port).toHaveStyle({ background: "var(--flow-image)" });
    expect(port).toHaveAttribute("data-slot", "typed-handle");
    // Fix 4a: default position — target renders on the left
    expect(port).toHaveAttribute("data-handlepos", "left");
  });
  it("encodes node id, type and direction in the handle id", () => {
    wrap(<TypedHandle nodeId="n1" dataType="audio" type="source" />);
    expect(document.querySelector('[data-handleid="n1:audio:out"]')).toBeTruthy();
  });
  it("unregistered type falls back to --flow-text color and descriptive aria label", () => {
    wrap(<TypedHandle nodeId="n1" dataType="mask" type="target" />);
    const port = screen.getByLabelText("mask input port");
    expect(port).toHaveStyle({ background: "var(--flow-text)" });
  });
});
