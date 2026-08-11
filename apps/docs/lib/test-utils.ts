import { computeAccessibleName } from "dom-accessibility-api";

/**
 * Assert an element's COMPUTED accessible name, not its text content.
 *
 * accname concatenates name-from-content chunks with whitespace trimmed and no
 * separator, so `<span>In</span><span class="sr-only"> point at 3s</span>`
 * computes as "Inpoint at 3s". Two components shipped that bug on the same
 * afternoon and it broke three tests before anyone worked out why.
 *
 * The fix at the component is either an outright `aria-label`, or marking the
 * visual half `aria-hidden` and putting the COMPLETE phrase in the sr-only span.
 *
 * This is deliberately a helper rather than a static gate: a detector for
 * "visible text plus an sr-only sibling" fires on every legitimate use of the
 * pattern, and a noisy gate gets excluded. See the design spec §6 G5.
 *
 * Lives in lib/, not registry/super-ai/ — the registry is the published
 * product and a test helper must never be installable by `shadcn add`.
 */
export function expectAccessibleName(el: Element, expected: string): void {
  const actual = computeAccessibleName(el);
  if (actual !== expected) {
    throw new Error(
      `accessible name mismatch — expected "${expected}", computed "${actual}". ` +
        `If the two differ only by a missing space, an sr-only span has fused with the visible text.`,
    );
  }
}
