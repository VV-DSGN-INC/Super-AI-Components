import * as React from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends React.ComponentProps<"div"> {
  /** Scroll vertically instead of horizontally. */
  vertical?: boolean;
  /** Reverse the scroll direction. */
  reverse?: boolean;
  /** Pause the animation while hovered. */
  pauseOnHover?: boolean;
  /** How many copies of the content make up the loop. */
  repeat?: number;
  /** Seconds per loop. */
  duration?: number;
  /** Gap between items and copies (any CSS length). */
  gap?: string;
}

function Marquee({
  vertical = false,
  reverse = false,
  pauseOnHover = false,
  repeat = 4,
  duration = 40,
  gap = "1rem",
  className,
  children,
  style,
  ...props
}: MarqueeProps) {
  return (
    <div
      data-slot="marquee"
      data-pause-on-hover={pauseOnHover}
      style={
        {
          "--marketing-marquee-duration": `${duration}s`,
          "--marketing-marquee-gap": gap,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "flex overflow-hidden [gap:var(--marketing-marquee-gap)]",
        vertical ? "h-full flex-col" : "w-full flex-row",
        className,
      )}
      {...props}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          data-slot="marquee-track"
          data-orientation={vertical ? "vertical" : "horizontal"}
          data-reverse={reverse}
          className={cn(
            "marketing-marquee-track flex shrink-0 justify-around [gap:var(--marketing-marquee-gap)]",
            vertical && "flex-col",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export { Marquee };
export type { MarqueeProps };
