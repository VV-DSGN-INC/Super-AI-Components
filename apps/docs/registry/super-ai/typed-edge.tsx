"use client";
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { getHandleType, parseHandleId } from "@/registry/super-ai/flow-types";

/**
 * Typed Edge — A react-flow edge coloured by its source port's type
 *
 * Spec: docs/design-system/component-specs.md#g10-typed-edge
 * States: type-coloured · selected · streaming
 */

/**
 * Edge stroke colour for a source handle id, resolved through the handle-type
 * registry so a custom type registered with its own `cssVar` is honoured — the
 * same lookup `typed-handle` uses to paint the port, which is what keeps a port
 * and the edge leaving it the same colour. The outer var still falls back to
 * `--flow-text`, so a type that is registered but whose token is undefined
 * degrades visibly rather than drawing nothing.
 */
export function edgeColorFromHandle(sourceHandle?: string | null) {
  const parsed = parseHandleId(sourceHandle);
  const def = parsed ? getHandleType(parsed.dataType) : undefined;
  return `var(${def?.cssVar ?? "--flow-text"}, var(--flow-text))`;
}

// stroke/strokeWidth are inline styles on purpose: Tailwind v4 emits utilities
// inside cascade layers, which lose to react-flow's unlayered stylesheet. The
// streaming dash is the named theme animation (lib/flow-tokens.ts), gated
// behind motion-safe.
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
      opts.streaming && "[stroke-dasharray:6_4] motion-safe:animate-flow-dash",
    ),
  };
}

export type TypedEdgeType = Edge<{ streaming?: boolean }, "typed">;

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
  className,
}: EdgeProps<TypedEdgeType> & { className?: string }) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const typedStyle = typedEdgeStyle({ sourceHandle: sourceHandleId, streaming: data?.streaming, selected });
  // Per-edge style spreads first so the typed stroke and width win: colour and
  // width are owned by the type system. Markers, opacity and filters pass through.
  return (
    <BaseEdge
      id={id}
      path={path}
      className={cn(typedStyle.className, className)}
      style={{ ...style, ...typedStyle.style }}
      markerEnd={markerEnd}
      markerStart={markerStart}
      data-slot="typed-edge"
    />
  );
}
