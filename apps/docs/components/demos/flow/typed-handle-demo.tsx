"use client";
import { Background, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TypedHandle } from "@/registry/super-ai/flow/typed-handle";

function DemoNode({ id }: NodeProps) {
  return (
    <div className="rounded-md border bg-card p-3 text-xs">
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
export default function TypedHandleDemo() {
  return (
    <div className="h-52 rounded-lg border">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={[]}
        nodeTypes={{ demo: DemoNode }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
