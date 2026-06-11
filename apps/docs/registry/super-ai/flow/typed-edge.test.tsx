import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Position } from "@xyflow/react";
import { edgeColorFromHandle, typedEdgeStyle, TypedEdge } from "./typed-edge";

describe("typed-edge helpers", () => {
  // Fix 3: expected strings updated for the new double-fallback form
  it("derives stroke color from the source handle id", () => {
    expect(edgeColorFromHandle("n1:video:out")).toBe("var(--flow-video, var(--flow-text))");
    expect(edgeColorFromHandle("garbage")).toBe("var(--flow-text, var(--flow-text))");
  });

  // Fix 1: stroke moved into style object; selected branch returns strokeWidth 2.5
  it("puts stroke and strokeWidth inside the style object", () => {
    const result = typedEdgeStyle({ sourceHandle: "n1:image:out", selected: false });
    expect(result.style.stroke).toBe("var(--flow-image, var(--flow-text))");
    expect(result.style.strokeWidth).toBe(1.5);
  });

  it("selected edge gets strokeWidth 2.5", () => {
    const result = typedEdgeStyle({ sourceHandle: "n1:image:out", selected: true });
    expect(result.style.strokeWidth).toBe(2.5);
  });

  // Fix 4: strengthen streaming-class assertion to include "flow-dash"
  it("streaming edges get the dash animation class", () => {
    const result = typedEdgeStyle({ sourceHandle: "n1:image:out", streaming: true });
    expect(result.className).toContain("flow-dash");
  });
});

// Fix 4: smoke test — TypedEdge renders path with data-slot, correct stroke, and strokeWidth
describe("TypedEdge smoke test", () => {
  it("renders data-slot, typed stroke color and strokeWidth on the path", () => {
    const { container } = render(
      <svg>
        <TypedEdge
          id="e"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={50}
          sourcePosition={Position.Right}
          targetPosition={Position.Left}
          sourceHandleId="a:video:out"
          selected={true}
          data={{ streaming: true }}
          source="n1"
          target="n2"
          type="typed"
          animated={false}
          deletable={true}
          selectable={true}
          interactionWidth={20}
        />
      </svg>,
    );
    const path = container.querySelector("[data-slot='typed-edge']");
    expect(path).toBeTruthy();
    const styleAttr = (path as SVGPathElement | null)?.getAttribute("style") ?? "";
    expect(styleAttr).toContain("var(--flow-video, var(--flow-text))");
    expect(styleAttr).toContain("2.5");
  });
});
