"use client";
import { Handle, Position, useNodeId, type HandleProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { getHandleType, handleId, isValidFlowConnection } from "@/registry/super-ai/flow-types";

/**
 * Typed Handle — A react-flow port that encodes its data type in the handle id
 *
 * Spec: docs/design-system/component-specs.md#g3-typed-handle
 * States: input · output · stacked · compatible · unregistered-type
 *
 * Handle ids follow `{nodeId}:{dataType}:{in|out}` (flow-types). Same-type,
 * out→in validation is built in and not overridable per handle; to extend it,
 * AND your validator with `isValidFlowConnection` at the canvas.
 *
 * `data-flow-compatible="true"` is the hook for drag-state highlighting; the
 * canvas sets it from react-flow's `useConnection()`. Overriding
 * `style.background` breaks type-colour semantics: register a type through
 * `registerHandleType` instead.
 */
export interface TypedHandleProps extends Omit<
  HandleProps,
  "type" | "position" | "id" | "isValidConnection"
> {
  /**
   * The react-flow node id that owns this handle. Optional inside a node
   * context (read from `useNodeId()`); pass it in tests, stories and demos.
   */
  nodeId?: string;
  dataType: string;
  type: "source" | "target";
  position?: Position;
  /** Vertical offset in px when stacking several ports on one side. Canvas geometry, not layout. */
  top?: number;
  className?: string;
}

export function TypedHandle({
  nodeId,
  dataType,
  type,
  position,
  top,
  className,
  style,
  ...rest
}: TypedHandleProps) {
  const contextNodeId = useNodeId();
  const nid = nodeId ?? contextNodeId ?? "";
  if (process.env.NODE_ENV !== "production" && nid === "") {
    console.warn("TypedHandle: no nodeId available, the handle id codec will be invalid");
  }
  const def = getHandleType(dataType);
  const dir = type === "source" ? "out" : "in";
  return (
    <Handle
      id={handleId(nid, dataType, dir)}
      type={type}
      position={position ?? (type === "source" ? Position.Right : Position.Left)}
      isValidConnection={isValidFlowConnection}
      aria-label={`${def?.label ?? dataType} ${dir === "in" ? "input" : "output"} port`}
      data-slot="typed-handle"
      data-flow-type={dataType}
      className={cn(
        "border-background size-3.5 rounded-full border-2 transition-transform",
        "data-[flow-compatible=true]:scale-125",
        className,
      )}
      style={{ background: `var(${def?.cssVar ?? "--flow-text"})`, ...(top != null && { top }), ...style }}
      {...rest}
    />
  );
}
