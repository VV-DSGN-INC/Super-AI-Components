"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const rainbowButtonVariants = cva(
  "marketing-rainbow-button peer relative inline-flex cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        outline: "text-foreground",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-10 rounded-lg px-5 text-sm",
        lg: "h-12 rounded-xl px-7 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface RainbowButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof rainbowButtonVariants> {
  /** Gradient sweep duration, e.g. "3s". */
  speed?: string;
}

function RainbowButton({
  variant,
  size,
  speed = "3s",
  className,
  children,
  style,
  ...props
}: RainbowButtonProps) {
  return (
    <span data-slot="rainbow-button-wrap" className="relative isolate inline-flex">
      <button
        type="button"
        data-slot="rainbow-button"
        data-variant={variant ?? "default"}
        style={{ "--marketing-rainbow-speed": speed, ...style } as React.CSSProperties}
        className={cn(rainbowButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
      {/* Fixed rounded-lg — behind a 12px blur the radius difference across sizes
          is imperceptible, and it avoids threading the size variant into a second element. */}
      <span
        data-slot="rainbow-button-glow"
        aria-hidden="true"
        className="marketing-rainbow-glow absolute inset-0.5 -z-10 rounded-lg peer-disabled:hidden"
      />
    </span>
  );
}

export { RainbowButton, rainbowButtonVariants };
export type { RainbowButtonProps };
