"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Hydration-safe prefers-reduced-motion read: server and first client render
    agree (false), reduced clients switch in the first post-hydration
    commit and react to live preference changes. motion's useReducedMotion is deliberately not used —
    it queries "(prefers-reduced-motion)" without a value, which this repo's
    exact-string matchMedia handling doesn't recognize (see number-ticker.tsx). */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

interface TerminalProps extends React.ComponentProps<"div"> {
  /** Window title shown in the chrome bar. */
  title?: string;
}

function Terminal({ title = "bash", className, children, ...props }: TerminalProps) {
  return (
    <div
      data-slot="terminal"
      className={cn("bg-background w-full max-w-lg rounded-xl border", className)}
      {...props}
    >
      <div data-slot="terminal-chrome" className="flex items-center gap-2 border-b p-3">
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="bg-muted-foreground/40 size-2.5 rounded-full" aria-hidden="true" />
        <span className="text-muted-foreground ml-2 text-xs">{title}</span>
      </div>
      <pre data-slot="terminal-body" className="overflow-x-auto p-4 font-mono text-sm">
        <code className="grid gap-1">{children}</code>
      </pre>
    </div>
  );
}

interface AnimatedSpanProps extends Omit<HTMLMotionProps<"span">, "children"> {
  children: React.ReactNode;
  /** Delay before the line appears, ms. */
  delay?: number;
}

function AnimatedSpan({ delay = 0, className, children, ...props }: AnimatedSpanProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.span
      data-slot="terminal-line"
      initial={reducedMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className={cn("block", className)}
      {...props}
    >
      {children}
    </motion.span>
  );
}

interface TerminalTypingProps extends React.ComponentProps<"span"> {
  children: string;
  /** Delay before typing starts, ms. */
  delay?: number;
  /** ms per character. */
  duration?: number;
}

/** Standalone typewriter line for Terminal — self-contained per registry convention
    (registry items install as single files, so this is deliberately not shared with
    typing-animation). */
function TerminalTyping({ children, delay = 0, duration = 40, className, ...props }: TerminalTypingProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [visibleChars, setVisibleChars] = React.useState(0);

  React.useEffect(() => {
    if (reducedMotion) {
      setVisibleChars(children.length);
      return;
    }
    setVisibleChars(0);
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= children.length) {
            if (interval) window.clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, duration);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [children, duration, delay, reducedMotion]);

  return (
    <span data-slot="terminal-typing" className={cn("block", className)} {...props}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" data-slot="terminal-typing-visible">
        {children.slice(0, visibleChars)}
      </span>
    </span>
  );
}

export { AnimatedSpan, Terminal, TerminalTyping };
export type { AnimatedSpanProps, TerminalProps, TerminalTypingProps };
