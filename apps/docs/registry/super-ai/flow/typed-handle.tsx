"use client";
import { Handle, Position, useNodeId, type HandleProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getHandleType, handleId, isValidFlowConnection } from "./flow-types";

export interface TypedHandleProps extends Omit<
  HandleProps,
  "type" | "position" | "id" | "isValidConnection"
> {
  /**
   * The React Flow node id that owns this handle.
   *
   * Optional — when rendered inside a React Flow node context the id is read
   * automatically via `useNodeId()`. Only pass this prop outside that context
   * (e.g. unit tests, Storybook, or standalone demos).
   */
  nodeId?: string;
  dataType: string;
  type: "source" | "target";
  position?: Position;
  /** vertical offset when stacking multiple ports on one side */
  top?: number;
  className?: string;
}

/**
 * A typed React Flow handle that encodes data-type semantics into the handle id
 * and enforces same-type, out→in connection validation.
 *
 * ### Handle id codec
 * Rendered handle ids follow the pattern `{nodeId}:{dataType}:{in|out}`.
 * This codec is consumed by typed-edge color derivation and connection
 * validation — do not bypass it by setting the `id` prop directly.
 *
 * ### Connection validation
 * Same-type, out→in connection validation is built in and intentionally NOT
 * overridable via props. To extend validation in the future, AND your extra
 * validator with the built-in `isValidFlowConnection`; do not re-expose
 * `isValidConnection` as a prop.
 *
 * ### Drag-state highlighting
 * `data-flow-compatible="true"` on the rendered handle is the extension hook
 * for drag-state highlighting (scale-up). Hosts can set it via
 * `useConnection()` from `@xyflow/react`. The companion "incompatible → dim"
 * treatment is deferred and recorded in the wave spec deviations.
 *
 * ### Custom type colors
 * Overriding `style.background` breaks type-color semantics. Register a custom
 * type via `registerHandleType` from `./flow-types` instead.
 */
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
    console.warn("TypedHandle: no nodeId available — handle id codec will be invalid");
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
        "size-3.5 rounded-full border-2 border-background transition-transform",
        "data-[flow-compatible=true]:scale-125",
        className,
      )}
      style={{ background: `var(${def?.cssVar ?? "--flow-text"})`, ...(top != null && { top }), ...style }}
      {...rest}
    />
  );
}
