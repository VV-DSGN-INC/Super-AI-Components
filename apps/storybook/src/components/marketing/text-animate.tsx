"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type AnimationPreset = "fadeIn" | "blurIn" | "blurInUp" | "slideUp" | "scaleUp";
type SplitBy = "character" | "word";

const presets: Record<AnimationPreset, Variants> = {
  fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: { opacity: 1, filter: "blur(0px)" },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  slideUp: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  scaleUp: { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } },
};

interface TextAnimateProps extends Omit<HTMLMotionProps<"span">, "children"> {
  children: string;
  animation?: AnimationPreset;
  by?: SplitBy;
  /** Seconds between segment starts. */
  stagger?: number;
  /** Delay before the first segment, seconds. */
  delay?: number;
  /** Animate when entering the viewport (else on mount). */
  startOnView?: boolean;
}

function TextAnimate({
  children,
  animation = "fadeIn",
  by = "word",
  stagger = 0.05,
  delay = 0,
  startOnView = true,
  className,
  ...props
}: TextAnimateProps) {
  // Not motion's own useReducedMotion(): that hook queries "(prefers-reduced-motion)"
  // in boolean context (correct in real browsers), but every reduced-motion check
  // elsewhere in this codebase — and its test stubs — keys off the explicit
  // ": reduce" value (see number-ticker.tsx), so this matches that convention.
  const reducedMotion = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )[0];

  if (reducedMotion) {
    return (
      <span
        data-slot="text-animate"
        className={cn(className)}
        {...(props as React.ComponentProps<"span">)}
      >
        {children}
      </span>
    );
  }

  const segments = by === "character" ? Array.from(children) : children.split(/(\s+)/);
  return (
    <motion.span
      data-slot="text-animate"
      className={cn("inline-block", className)}
      initial="hidden"
      {...(startOnView
        ? { whileInView: "show", viewport: { once: true } }
        : { animate: "show" })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      {...props}
    >
      <span className="sr-only">{children}</span>
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          data-slot="text-animate-segment"
          className="inline-block whitespace-pre"
          variants={presets[animation]}
        >
          {segment}
        </motion.span>
      ))}
    </motion.span>
  );
}

export { TextAnimate };
export type { TextAnimateProps };
