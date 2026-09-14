"use client";
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TypedHandle } from "@/registry/super-ai/typed-handle";

function DemoNode({ id }: NodeProps) {
  return (
    <div className="bg-card rounded-md border p-3 text-xs">
      ports
      <TypedHandle nodeId={id} dataType="image" type="target" top={10} />
      <TypedHandle nodeId={id} dataType="audio" type="target" top={28} />
      <TypedHandle nodeId={id} dataType="image" type="source" />
    </div>
  );
}
const nodes: Node[] = [
  { id: "a", position: { x: 20, y: 40 }, data: {}, type: "demo" },
  { id: "b", position: { x: 220, y: 80 }, data: {}, type: "demo" },
];
const nodeTypes = { demo: DemoNode };

export default function TypedHandleDemo() {
  return (
    <div className="h-52 rounded-lg border">
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
