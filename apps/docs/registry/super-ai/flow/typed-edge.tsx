"use client";
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { parseHandleId } from "./flow-types";

/** Edge stroke color for a source handle id; falls back to var(--flow-text) so registered-but-untokened types degrade visibly. */
export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle);
  return `var(--flow-${parsed?.dataType ?? "text"}, var(--flow-text))`;
}

// stroke/strokeWidth are inline styles on purpose: Tailwind v4 emits utilities inside cascade
// layers, which lose to React Flow's unlayered stylesheet. The streaming dash animation is
// gated behind motion-safe (prefers-reduced-motion).
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
  // Per-edge style spreads first so the typed stroke/strokeWidth win: stroke color and width
  // are owned by the type system (same stance as typed-handle color). Everything else
  // (markers, opacity, filters) is forwarded unchanged.
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
