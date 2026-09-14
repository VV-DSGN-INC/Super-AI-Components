import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { expect, within } from "storybook/test";

import { TypedHandle, type TypedHandleProps } from "@/registry/super-ai/typed-handle";
import { TypedHandleDocs } from "@/content/components/typed-handle.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/** One node on a tiny canvas; `ports` decides what the node renders. */
function Canvas({ ports, width = 320 }: { ports: Omit<TypedHandleProps, "nodeId">[]; width?: number }) {
  const DemoNode = ({ id }: NodeProps) => (
    <div className="bg-card rounded-md border px-4 py-3 text-xs">
      Video
      {ports.map((p, i) => (
        <TypedHandle key={i} nodeId={id} {...p} />
      ))}
    </div>
  );
  const nodeTypes = React.useMemo(() => ({ demo: DemoNode }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const nodes: Node[] = [{ id: "n1", position: { x: 80, y: 40 }, data: {}, type: "demo" }];
  return (
    <div data-testid="frame" style={{ width }} className="h-40 overflow-hidden rounded-lg border">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={[]}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const meta: Meta<typeof TypedHandle> = {
  title: "Super AI/Typed Handle",
  component: TypedHandle,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedHandleDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedHandle>;

/** A target port on the left, painted with --flow-image. The accessible name is "Image input port". */
export const Input: Story = { render: () => <Canvas ports={[{ dataType: "image", type: "target" }]} /> };

/** A source port on the right. Sources default to Position.Right, targets to Position.Left. */
export const Output: Story = { render: () => <Canvas ports={[{ dataType: "video", type: "source" }]} /> };

/** Three inputs stacked by `top`. The offset is canvas geometry, so it is not mirrored for RTL. */
export const Stacked: Story = {
  render: () => (
    <Canvas
      ports={[
        { dataType: "text", type: "target", top: 8 },
        { dataType: "image", type: "target", top: 24 },
        { dataType: "speech", type: "target", top: 40 },
        { dataType: "video", type: "source" },
      ]}
    />
  ),
};

/** The drag-state highlight: data-flow-compatible="true" scales the port up. flow-canvas sets it from useConnection(); here it is passed through. */
export const Compatible: Story = {
  render: () => (
    <Canvas
      ports={[
        { dataType: "image", type: "target", "data-flow-compatible": "true" } as Omit<
          TypedHandleProps,
          "nodeId"
        >,
      ]}
    />
  ),
};

/** A type nobody registered. It falls back to --flow-text and reads its raw key, so the omission is visible and audible. */
export const UnregisteredType: Story = {
  render: () => <Canvas ports={[{ dataType: "mask", type: "target" }]} />,
};

/*
 * Case stories.
 * // case-skip: RTL — port sides are canvas geometry owned by react-flow `Position`, not text direction; there is no directional icon or text
 * // case-skip: ReducedMotion — the only motion is a `transition-transform` on the compatible scale-up; no keyframe animation in the file
 * // case-skip: KeyboardOrder — react-flow's `Handle` renders a non-focusable div; keyboard connection is the canvas's a11y mode, not a per-port control
 * // case-skip: Controlled — no value/onChange pair
 * // case-skip: EmptyLabel — no text slot; the accessible name is derived from the type
 * // case-skip: LongContent — no author-supplied text; the longest built-in label is "Start frame"
 * // case-skip: Boundary — `grep -l "Handle" registry/super-ai/*.tsx` finds no other port component
 */

/** 375px frame: the canvas is a fixed-height box that clips rather than scrolls, so a narrow viewport never scrolls sideways. */
export const Mobile: Story = {
  render: () => (
    <Canvas
      width={375}
      ports={[
        { dataType: "image", type: "target" },
        { dataType: "video", type: "source" },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
