import * as React from "react";

import { cn } from "@/lib/utils";

interface AuroraTextProps extends React.ComponentProps<"span"> {
  /** Seconds per gradient drift cycle. */
  duration?: number;
}

/** Gradient headline text. Intended for display sizes (>= 24px) — the default
    aurora stops target WCAG large-text contrast (3:1) on both themes. */
function AuroraText({ duration = 8, className, children, style, ...props }: AuroraTextProps) {
  return (
    <span
      data-slot="aurora-text"
      style={{ "--marketing-aurora-duration": duration, ...style } as React.CSSProperties}
      className={cn("marketing-aurora-text", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { AuroraText };
export type { AuroraTextProps };
