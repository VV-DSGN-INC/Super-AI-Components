"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps extends React.ComponentProps<"button"> {
  /** Ripple lifetime in ms — keep in sync with the marketing-ripple keyframe (600ms). */
  rippleDuration?: number;
}

function RippleButton({
  rippleDuration = 600,
  className,
  children,
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const nextId = React.useRef(0);
  const reducedMotion = React.useRef(false);
  // Why a ref (not state): it's read inside an event handler only — no re-render
  // needed when it's set, and reading it in the handler always sees the current value.
  React.useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const spawnRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple: Ripple = {
      id: nextId.current++,
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
      size,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, rippleDuration);
  };

  return (
    <button
      type="button"
      data-slot="ripple-button"
      className={cn(
        "bg-primary text-primary-foreground relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        spawnRipple(event);
        onClick?.(event);
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          data-slot="ripple-button-ripple"
          aria-hidden="true"
          className="marketing-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}

export { RippleButton };
export type { RippleButtonProps };
