import * as React from "react";

import { cn } from "@/lib/utils";

interface BorderBeamProps extends React.ComponentProps<"span"> {
  /** Beam length in px. */
  size?: number;
  /** Seconds per lap. */
  duration?: number;
  /** Start delay in seconds. */
  delay?: number;
  /** Radius of the traced path in px — match the parent's border radius. */
  borderRadius?: number;
}

/** Place inside a `position: relative` container with `overflow-hidden`. */
function BorderBeam({
  size = 64,
  duration = 6,
  delay = 0,
  borderRadius = 12,
  className,
  style,
  ...props
}: BorderBeamProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="border-beam"
      style={
        {
          width: size,
          height: 2,
          "--marketing-beam-duration": duration,
          "--marketing-beam-delay": delay,
          "--marketing-beam-radius": `${borderRadius}px`,
          ...style,
        } as React.CSSProperties
      }
      className={cn("marketing-border-beam pointer-events-none absolute", className)}
      {...props}
    />
  );
}

export { BorderBeam };
export type { BorderBeamProps };
