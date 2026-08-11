"use client";

import { useCallback, useRef, useState, type RefCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   useContainerWidth — resolve a container to `wide` or `narrow`.

   Measures the ELEMENT, not the viewport, and that distinction is the whole
   point. Overlay mode is `min(65vw, 100vw - 540px)`, so a viewport media query
   would be measuring a box that is not the one being laid out.

   Starts narrow and only widens once measured: one column renders correctly at
   any width, two columns in a 400px box does not, so the pessimistic default is
   the safe one.

   Returns a CALLBACK ref rather than a ref object, and that is load-bearing.
   With `useLayoutEffect` + a ref object, the effect runs once and bails if
   `ref.current` is still null — which is exactly what happens inside a Radix
   Dialog or Sheet, because their content mounts through a portal on a later
   pass. React then attaches the ref to a node nobody is watching, and the
   container is measured never. A callback ref fires whenever the node appears,
   however late, so the observer always lands on a real element.
   ─────────────────────────────────────────────────────────────────────────── */

export type ContainerSize = "wide" | "narrow";

export function useContainerWidth<T extends HTMLElement>(
  threshold: number,
): readonly [RefCallback<T>, ContainerSize] {
  const [size, setSize] = useState<ContainerSize>("narrow");
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback<RefCallback<T>>(
    (node) => {
      observer.current?.disconnect();
      observer.current = null;

      // React calls the ref with null on unmount; disconnecting above is the
      // whole cleanup.
      if (!node) return;
      // No ResizeObserver (old browser, some SSR shims): stay narrow. A working
      // one-column layout beats a broken two-column one.
      if (typeof ResizeObserver === "undefined") return;

      function apply(width: number) {
        setSize(width >= threshold ? "wide" : "narrow");
      }

      apply(node.getBoundingClientRect().width);

      const next = new ResizeObserver((entries) => {
        for (const entry of entries) apply(entry.contentRect.width);
      });
      next.observe(node);
      observer.current = next;
    },
    [threshold],
  );

  return [ref, size] as const;
}
