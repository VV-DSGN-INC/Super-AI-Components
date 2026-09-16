// The two text helpers both emitters need. Their own module so that
// contract-emit.ts can call into pattern-emit.ts (the shared files carry both)
// without pattern-emit.ts importing a value back out of it: a runtime import
// cycle between the two emitters would work only by function hoisting, which
// is not a property worth depending on.

/** Truncate for a one-line cell, without a trailing half-space. */
export function cut(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n).trimEnd();
}

/** Quote a cell that would otherwise break the row. */
export function csv(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
