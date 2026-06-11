"use client"
import { ReactFlow, Background, type NodeTypes, type EdgeTypes } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { TypedEdge } from "@/registry/super-ai/flow/typed-edge"

const nodeTypes: NodeTypes = {}
const edgeTypes: EdgeTypes = { typed: TypedEdge }

const defaultNodes = [
  { id: "n1", position: { x: 40, y: 60 }, data: { label: "Image Source" } },
  { id: "n2", position: { x: 320, y: 60 }, data: { label: "Image Render" } },
  { id: "n3", position: { x: 40, y: 180 }, data: { label: "Video Source" } },
  { id: "n4", position: { x: 320, y: 180 }, data: { label: "Video Render" } },
]

const defaultEdges = [
  {
    id: "e1",
    source: "n1",
    target: "n2",
    sourceHandle: "n1:image:out",
    targetHandle: "n2:image:in",
    type: "typed",
    data: { streaming: true },
  },
  {
    id: "e2",
    source: "n3",
    target: "n4",
    sourceHandle: "n3:video:out",
    targetHandle: "n4:video:in",
    type: "typed",
    data: { streaming: false },
  },
]

export function TypedEdgeDemo() {
  return (
    <div style={{ height: 300 }} className="rounded-lg border">
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
  )
}
