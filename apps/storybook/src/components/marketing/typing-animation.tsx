"use client";

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

interface TypingAnimationProps extends React.ComponentProps<"span"> {
  children: string;
  /** ms per character. */
  duration?: number;
  /** Delay before typing starts, ms. */
  delay?: number;
  /** Show a blinking caret while typing. */
  showCursor?: boolean;
}

function TypingAnimation({
  children,
  duration = 60,
  delay = 0,
  showCursor = false,
  className,
  ...props
}: TypingAnimationProps) {
  const [typing, setTyping] = React.useState({ source: children, visible: 0 });
  if (typing.source !== children) {
    setTyping({ source: children, visible: 0 });
  }
  const reducedMotion = usePrefersReducedMotion();
  const visibleChars = reducedMotion ? children.length : Math.min(typing.visible, children.length);
  const done = visibleChars >= children.length;

  React.useEffect(() => {
    if (reducedMotion) return;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setTyping((prev) => {
          if (prev.source !== children || prev.visible >= children.length) {
            if (interval) window.clearInterval(interval);
            return prev;
          }
          return { ...prev, visible: prev.visible + 1 };
        });
      }, duration);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [children, duration, delay, reducedMotion]);

  return (
    <span data-slot="typing-animation" className={cn("whitespace-pre-wrap", className)} {...props}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" data-slot="typing-animation-visible">
        {children.slice(0, visibleChars)}
        {showCursor && !done && (
          <span data-slot="typing-animation-cursor" className="animate-pulse">
            |
          </span>
        )}
      </span>
    </span>
  );
}

export { TypingAnimation };
export type { TypingAnimationProps };
