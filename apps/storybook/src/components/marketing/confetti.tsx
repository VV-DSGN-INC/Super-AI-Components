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

// Scope note vs the reference library: Magic UI also ships a `<Confetti>` canvas
// component; wave 1 deliberately ships only the imperative `fireConfetti` +
// `ConfettiButton` pair — the marketing use case is "celebrate on a click", and a
// managed canvas adds surface without a demo we'd show. Revisit in wave 2 if a use
// appears.
export { ConfettiButton, fireConfetti };
export type { ConfettiButtonProps };
