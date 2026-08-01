import * as React from "react";

import { cn } from "@/lib/utils";

interface OrbitingCirclesProps extends React.ComponentProps<"div"> {
  /** Orbit radius in px. */
  radius?: number;
  /** Seconds per revolution. */
  duration?: number;
  /** Reverse orbit direction. */
  reverse?: boolean;
  /** Show the dashed orbit path ring. */
  path?: boolean;
  /** Size of each orbiting item in px. */
  iconSize?: number;
}

function OrbitingCircles({
  radius = 80,
  duration = 20,
  reverse = false,
  path = true,
  iconSize = 32,
  className,
  children,
  style,
  ...props
}: OrbitingCirclesProps) {
  const items = React.Children.toArray(children);
  return (
    <div
      data-slot="orbiting-circles"
      style={
        {
          "--marketing-orbit-radius": radius,
          "--marketing-orbit-duration": duration,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {path && (
        <svg
          aria-hidden="true"
          data-slot="orbiting-circles-path"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-border fill-none"
            cx="50%"
            cy="50%"
            r={radius}
            strokeDasharray="4 4"
          />
        </svg>
      )}
      {items.map((child, i) => (
        <span
          key={i}
          data-slot="orbiting-circles-item"
          data-reverse={reverse}
          className="marketing-orbit-item absolute flex items-center justify-center"
          style={
            {
              width: iconSize,
              height: iconSize,
              "--marketing-orbit-angle": (360 / items.length) * i,
            } as React.CSSProperties
          }
        >
          {child}
        </span>
      ))}
    </div>
  );
}

export { OrbitingCircles };
export type { OrbitingCirclesProps };
