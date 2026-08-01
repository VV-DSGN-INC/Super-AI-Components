import * as React from "react";

import { cn } from "@/lib/utils";

interface DotPatternProps extends React.ComponentProps<"svg"> {
  /** Distance between dot centers, px. */
  size?: number;
  /** Dot radius, px. */
  radius?: number;
  /** Pattern origin offset, px. */
  x?: number;
  y?: number;
  /** Fade the pattern radially from the center. */
  fade?: boolean;
}

function DotPattern({
  size = 16,
  radius = 1,
  x = 0,
  y = 0,
  fade = false,
  className,
  ...props
}: DotPatternProps) {
  const id = React.useId();
  return (
    <svg
      aria-hidden="true"
      data-slot="dot-pattern"
      className={cn(
        "text-muted-foreground/40 pointer-events-none absolute inset-0 size-full",
        fade && "marketing-dot-fade",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x={x} y={y}>
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export { DotPattern };
export type { DotPatternProps };
