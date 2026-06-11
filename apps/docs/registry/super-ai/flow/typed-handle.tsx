"use client";
import { Handle, Position, type HandleProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getHandleType, handleId, isValidFlowConnection } from "./flow-types";

export interface TypedHandleProps extends Omit<
  HandleProps,
  "type" | "position" | "id" | "isValidConnection"
> {
  nodeId: string;
  dataType: string;
  type: "source" | "target";
  position?: Position;
  /** vertical offset when stacking multiple ports on one side */
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
  const def = getHandleType(dataType);
  const dir = type === "source" ? "out" : "in";
  return (
    <Handle
      id={handleId(nodeId, dataType, dir)}
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
