import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Background, Handle, Position, ReactFlow, type EdgeTypes, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { expect, waitFor, within } from "storybook/test";

import { handleId } from "@/registry/super-ai/flow-types";
import { TypedEdge } from "@/registry/super-ai/typed-edge";
import { TypedEdgeDocs } from "@/content/components/typed-edge.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function DemoNode({ id }: NodeProps) {
  return (
    <div className="bg-card rounded-md border px-4 py-3 text-xs">
      {id}
      <Handle type="target" position={Position.Left} id={handleId(id, "image", "in")} />
      <Handle type="source" position={Position.Right} id={handleId(id, "image", "out")} />
    </div>
  );
}
const nodeTypes = { demo: DemoNode };
const edgeTypes: EdgeTypes = { typed: TypedEdge };
const nodes = [
  { id: "n1", type: "demo", position: { x: 20, y: 40 }, data: {} },
  { id: "n2", type: "demo", position: { x: 220, y: 40 }, data: {} },
];
const edge = (opts: { selected?: boolean; streaming?: boolean }) => [
  {
    id: "e1",
    source: "n1",
    target: "n2",
    sourceHandle: handleId("n1", "image", "out"),
    targetHandle: handleId("n2", "image", "in"),
    type: "typed",
    selected: opts.selected,
    data: { streaming: opts.streaming ?? false },
  },
];

function Canvas({
  selected,
  streaming,
  width = 360,
}: {
  selected?: boolean;
  streaming?: boolean;
  width?: number;
}) {
  return (
    <div data-testid="frame" style={{ width }} className="h-40 overflow-hidden rounded-lg border">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultNodes={nodes}
        defaultEdges={edge({ selected, streaming })}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const meta: Meta<typeof TypedEdge> = {
  title: "Super AI/Typed Edge",
  component: TypedEdge,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedEdgeDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedEdge>;

/** An image edge at rest: stroke from --flow-image, 1.5px. The colour comes from the source handle id alone. */
export const TypeColoured: Story = { render: () => <Canvas /> };

/** Selected: 2.5px. Width changes transition; colour does not change with selection. */
export const Selected: Story = { render: () => <Canvas selected /> };

/** Streaming: dashed and moving. `data.streaming` is set from the runner's status for the upstream node. */
export const Streaming: Story = { render: () => <Canvas streaming /> };

/*
 * Case stories.
 * // case-skip: RTL — an SVG path between two canvas positions; direction is geometry, not text
 * // case-skip: KeyboardOrder — the path is not focusable; edge selection by keyboard is react-flow's canvas behaviour
 * // case-skip: Controlled — no value/onChange pair
 * // case-skip: EmptyLabel — no text slot
 * // case-skip: LongContent — no text slot
 * // case-skip: Boundary — `grep -l "BaseEdge\|getBezierPath" registry/super-ai/*.tsx` finds no other edge component
 */

/** The dash animation is `motion-safe:animate-flow-dash`: under prefers-reduced-motion the edge is dashed but still. */
export const ReducedMotion: Story = {
  render: () => <Canvas streaming />,
  // React Flow draws edges only after it has measured both nodes, which is a
  // frame later than the story mounting, so the path does not exist when the
  // play function first runs. waitFor is the wait, not a loosened assertion:
  // the class must be present once the edge is drawn.
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const path = canvasElement.querySelector("[data-slot=typed-edge]");
      expect(path).not.toBeNull();
      expect(path!.getAttribute("class") ?? "").toContain("motion-safe:animate-flow-dash");
    });
  },
};

/** 375px frame: the canvas clips inside its box; no horizontal scroll at phone width. */
export const Mobile: Story = {
  render: () => <Canvas width={375} streaming />,
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
