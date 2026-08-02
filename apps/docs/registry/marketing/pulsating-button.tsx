"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps extends React.ComponentProps<"button"> {
  /** Halo pulse duration in seconds. */
  duration?: number;
}

function PulsatingButton({ duration = 1.5, className, children, style, ...props }: PulsatingButtonProps) {
  return (
    <button
      type="button"
      data-slot="pulsating-button"
      style={{ "--marketing-pulse-duration": duration, ...style } as React.CSSProperties}
      className={cn(
        "bg-primary text-primary-foreground group relative inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span
        data-slot="pulsating-button-halo"
        aria-hidden="true"
        className="marketing-pulse-halo absolute inset-0 rounded-[inherit] group-disabled:hidden"
      />
    </button>
  );
}

export { PulsatingButton };
export type { PulsatingButtonProps };
