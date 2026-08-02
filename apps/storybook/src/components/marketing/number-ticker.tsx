"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.ComponentProps<"span"> {
  /** Final value counted to when the ticker enters the viewport. */
  value: number;
  startValue?: number;
  decimalPlaces?: number;
  /** Delay before counting starts, seconds. */
  delay?: number;
}

function NumberTicker({
  value,
  startValue = 0,
  decimalPlaces = 0,
  delay = 0,
  className,
  ref: forwardedRef,
  ...props
}: NumberTickerProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(startValue);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true });
  // Not motion's own useReducedMotion(): that hook queries "(prefers-reduced-motion)"
  // in boolean context (correct in real browsers), but every reduced-motion check
  // elsewhere in this codebase — and its test stubs — keys off the explicit
  // ": reduce" value (see ripple-button.tsx), so this matches that convention.
  const [reducedMotion] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const format = React.useCallback(
    (latest: number) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(latest),
    [decimalPlaces],
  );

  // Reduced motion renders the final value instantly and never waits for the
  // viewport — this is also the deterministic branch tests rely on.
  React.useEffect(() => {
    if (reducedMotion) {
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    if (!isInView) return;
    const timeout = window.setTimeout(() => motionValue.set(value), delay * 1000);
    return () => window.clearTimeout(timeout);
  }, [isInView, reducedMotion, motionValue, value, delay, format]);

  React.useEffect(
    () =>
      spring.on("change", (latest: number) => {
        if (ref.current) ref.current.textContent = format(latest);
      }),
    [spring, format],
  );

  return (
    <span
      ref={(node) => {
        ref.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-slot="number-ticker"
      className={cn("tabular-nums", className)}
      {...props}
    >
      {format(startValue)}
    </span>
  );
}

export { NumberTicker };
export type { NumberTickerProps };
