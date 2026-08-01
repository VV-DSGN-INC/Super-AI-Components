"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

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
  const [visibleChars, setVisibleChars] = React.useState(0);
  const done = visibleChars >= children.length;

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, [children, duration, delay]);

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
