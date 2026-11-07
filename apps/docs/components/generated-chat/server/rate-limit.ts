/**
 * A sliding-window limit per address, held in memory. On Vercel's Fluid
 * compute an instance serves many requests, so this slows a single client
 * down, but each instance counts on its own: it is a brake for a public
 * demo, not a quota.
 */
export interface RateLimiter {
  /** Records a call at `now` and says whether it is allowed. */
  check(key: string, now: number): boolean;
  /** How many addresses are being tracked. */
  size(): number;
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const calls = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [key, times] of calls) {
      const kept = times.filter((t) => now - t < windowMs);
      if (kept.length === 0) calls.delete(key);
      else calls.set(key, kept);
    }
  };

  return {
    check(key, now) {
      prune(now);
      const times = calls.get(key) ?? [];
      if (times.length >= limit) return false;
      calls.set(key, [...times, now]);
      return true;
    },
    size: () => calls.size,
  };
}
