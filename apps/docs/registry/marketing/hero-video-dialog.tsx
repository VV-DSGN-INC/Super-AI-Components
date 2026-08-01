"use client";

import { Play, X } from "lucide-react";
import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Hydration-safe prefers-reduced-motion read: server and first client render
    agree (false), reduced clients switch before commit and react to live
    preference changes. motion's useReducedMotion is deliberately not used —
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

type HeroVideoAnimation = "from-center" | "from-bottom" | "fade";

const dialogVariants: Record<
  HeroVideoAnimation,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  "from-center": {
    initial: { scale: 0.6, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.6, opacity: 0 },
  },
  "from-bottom": {
    initial: { y: 80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 80, opacity: 0 },
  },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
};

interface HeroVideoDialogProps extends React.ComponentProps<"div"> {
  /** Embed URL for the player iframe. */
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  animationStyle?: HeroVideoAnimation;
}

function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  animationStyle = "from-center",
  className,
  ...props
}: HeroVideoDialogProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const variants = reducedMotion ? dialogVariants.fade : dialogVariants[animationStyle];

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div data-slot="hero-video-dialog" className={cn("relative", className)} {...props}>
      <button
        ref={triggerRef}
        type="button"
        data-slot="hero-video-dialog-trigger"
        aria-label="Play video"
        className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- registry component must not depend on next/image */}
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="block w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background/80 flex size-16 items-center justify-center rounded-full border backdrop-blur transition-transform duration-300 group-hover:scale-110">
            <Play className="text-foreground ml-0.5 size-6" aria-hidden="true" />
          </span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            data-slot="hero-video-dialog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={thumbnailAlt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              data-slot="hero-video-dialog-content"
              {...variants}
              transition={{ duration: 0.25 }}
              className="relative aspect-video w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close video"
                onClick={close}
                className="bg-background text-foreground absolute -top-12 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full border"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <iframe
                data-slot="hero-video-dialog-iframe"
                src={videoSrc}
                title="Video player"
                className="size-full rounded-xl border"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { HeroVideoDialog };
export type { HeroVideoDialogProps };
