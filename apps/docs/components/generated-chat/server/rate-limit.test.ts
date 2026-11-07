import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows the limit within a window and refuses the next call", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([0, 10, 20].map((t) => limiter.check("a", t))).toEqual([true, true, true]);
    expect(limiter.check("a", 30)).toBe(false);
  });

  it("allows again once the oldest call leaves the window", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("a", 500);
    expect(limiter.check("a", 999)).toBe(false);
    expect(limiter.check("a", 1000)).toBe(true);
  });

  it("counts each address on its own", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0)).toBe(true);
    expect(limiter.check("b", 0)).toBe(true);
    expect(limiter.check("a", 1)).toBe(false);
  });

  it("forgets an address whose calls have all left the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("b", 5000);
    expect(limiter.size()).toBe(1);
  });
});
