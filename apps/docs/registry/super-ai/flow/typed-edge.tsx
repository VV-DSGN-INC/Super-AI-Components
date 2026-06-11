"use client"
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { parseHandleId } from "./flow-types"

export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle)
  return `var(--flow-${parsed?.dataType ?? "text"})`
}

export function typedEdgeStyle(opts: { sourceHandle?: string | null; streaming?: boolean; selected?: boolean }) {
  return {
    stroke: edgeColorFromHandle(opts.sourceHandle),
    className: cn(
      "transition-[stroke-width]",
      opts.streaming && "[stroke-dasharray:6_4] animate-[flow-dash_1s_linear_infinite]",
      opts.selected ? "[stroke-width:2.5]" : "[stroke-width:1.5]",
    ),
  }
}

export type TypedEdgeProps = EdgeProps & { data?: { streaming?: boolean } }

export function TypedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  selected,
  data,
}: TypedEdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const { stroke, className } = typedEdgeStyle({
    sourceHandle: sourceHandleId,
    streaming: data?.streaming,
    selected,
  })
  return <BaseEdge id={id} path={path} className={className} style={{ stroke }} />
}
