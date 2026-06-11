"use client";
import { ReactFlow, Background, Handle, Position, type EdgeTypes, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TypedEdge } from "@/registry/super-ai/flow/typed-edge";
import { handleId } from "@/registry/super-ai/flow/flow-types";

// Fix 2: inline node type with real handles so RF can find matching handle ids.
// Do NOT import typed-handle (parallel branch). Use raw Handle + handleId codec.
function DemoNode({ id }: NodeProps) {
  return (
    <div className="rounded-md border bg-card px-4 py-3 text-xs">
      {id}
      <Handle type="target" position={Position.Left} id={handleId(id, "image", "in")} />
      <Handle type="source" position={Position.Right} id={handleId(id, "image", "out")} />
    </div>
  );
}

const nodeTypes = { demo: DemoNode };
const edgeTypes: EdgeTypes = { typed: TypedEdge };

const defaultNodes = [
  { id: "n1", type: "demo", position: { x: 40, y: 60 }, data: {} },
  { id: "n2", type: "demo", position: { x: 320, y: 60 }, data: {} },
  { id: "n3", type: "demo", position: { x: 40, y: 180 }, data: {} },
  { id: "n4", type: "demo", position: { x: 320, y: 180 }, data: {} },
];

const defaultEdges = [
  {
    id: "e1",
    source: "n1",
    target: "n2",
    sourceHandle: handleId("n1", "image", "out"),
    targetHandle: handleId("n2", "image", "in"),
    type: "typed",
    data: { streaming: true },
  },
  {
    id: "e2",
    source: "n3",
    target: "n4",
    sourceHandle: handleId("n3", "image", "out"),
    targetHandle: handleId("n4", "image", "in"),
    type: "typed",
    data: { streaming: false },
  },
];

export default function TypedEdgeDemo() {
  return (
    <div className="h-52 rounded-lg border">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultNodes={defaultNodes}
        defaultEdges={defaultEdges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
