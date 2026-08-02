"use client";

import confetti from "canvas-confetti";
import type { Options as ConfettiOptions } from "canvas-confetti";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Fire a confetti burst. No-ops under prefers-reduced-motion. */
function fireConfetti(options?: ConfettiOptions) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, ...options });
}

interface ConfettiButtonProps extends React.ComponentProps<"button"> {
  /** Options passed to canvas-confetti on click. */
  options?: ConfettiOptions;
}

function ConfettiButton({ options, className, children, onClick, ...props }: ConfettiButtonProps) {
  return (
    <button
      type="button"
      data-slot="confetti-button"
      className={cn(
        "bg-primary text-primary-foreground inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        fireConfetti({
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: rect.top / window.innerHeight,
          },
          ...options,
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Deliberately imperative-only: `fireConfetti` + `ConfettiButton` cover the
// celebrate-on-click use case; a managed canvas component is out of scope here.
export { ConfettiButton, fireConfetti };
export type { ConfettiButtonProps };
