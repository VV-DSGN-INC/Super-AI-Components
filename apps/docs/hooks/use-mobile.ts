import * as React from "react"

const MOBILE_BREAKPOINT = 768

/** Hydration-safe: server and first client render agree (false), then
    switches in the first post-hydration commit and reacts to live viewport
    changes. Same useSyncExternalStore idiom as usePrefersReducedMotion in
    typing-animation.tsx — no setState-in-effect. */
export function useIsMobile() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener("change", onStoreChange)
      return () => mql.removeEventListener("change", onStoreChange)
    },
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  )
}
