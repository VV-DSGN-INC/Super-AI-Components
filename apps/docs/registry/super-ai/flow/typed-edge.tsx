"use client";
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { parseHandleId } from "./flow-types";

// Fix 3: fallback to var(--flow-text) so registered-but-untokened types degrade visibly
export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle);
  return `var(--flow-${parsed?.dataType ?? "text"}, var(--flow-text))`;
}

// Fix 1: strokeWidth inline (Tailwind v4 cascade layers make utility classes inert against
// unlayered React Flow stylesheet). motion-safe: prefix added (prefers-reduced-motion).
export function typedEdgeStyle(opts: {
  sourceHandle?: string | null;
  streaming?: boolean;
  selected?: boolean;
}) {
  return {
    style: {
      stroke: edgeColorFromHandle(opts.sourceHandle),
      strokeWidth: opts.selected ? 2.5 : 1.5,
    } satisfies React.CSSProperties,
    className: cn(
      "transition-[stroke-width]",
      opts.streaming && "[stroke-dasharray:6_4] motion-safe:animate-[flow-dash_1s_linear_infinite]",
    ),
  };
}

// Fix 4: Export TypedEdgeType and use EdgeProps<TypedEdgeType>
export type TypedEdgeType = Edge<{ streaming?: boolean }, "typed">;
/** @deprecated use TypedEdgeType */
export type TypedEdgeProps = EdgeProps<TypedEdgeType>;

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
  // Fix 4: forward markerEnd, markerStart and per-edge style
  style,
  markerEnd,
  markerStart,
}: EdgeProps<TypedEdgeType>) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const typedStyle = typedEdgeStyle({
    sourceHandle: sourceHandleId,
    streaming: data?.streaming,
    selected,
  });
  // Fix 4: per-edge style first so typed stroke/strokeWidth (type semantics) win.
  // JSDoc: stroke and strokeWidth are owned by the type system (same stance as typed-handle color).
  // Everything else (markers, opacity, filters) is forwarded unchanged.
  return (
    <BaseEdge
      id={id}
      path={path}
      className={typedStyle.className}
      style={{ ...style, ...typedStyle.style }}
      markerEnd={markerEnd}
      markerStart={markerStart}
      data-slot="typed-edge"
    />
  );
}
