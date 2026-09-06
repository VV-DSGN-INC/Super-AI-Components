/**
 * Whether a focused element actually paints something a sighted user can see,
 * for story play functions — not the string check it replaces.
 *
 * The convention's `KeyboardOrder` requires "a visible focus treatment at every
 * stop". The obvious predicate is
 *
 *     style.boxShadow !== "none" || style.outlineStyle !== "none"
 *
 * and it is wrong in both directions on this registry's own primitives. Four
 * case-story agents hit it independently across the D/I, E/P and F waves, and
 * between them they measured the whole mechanism:
 *
 * - **False positive.** A Tailwind `ring-*` utility compiles to a composed
 *   `box-shadow` whose layers are all present even when the ring is off, as
 *   `rgba(0, 0, 0, 0) 0px 0px 0px 0px` — transparent and zero-sized. That is
 *   not the string `"none"`, so the check passes on an element painting
 *   nothing. Measured on a plain vendored `Button` (five such layers, while
 *   `--tw-ring-shadow` separately held a real value) and on `detail-view-shell`'s
 *   close button.
 * - **False positive, second shape.** `focus-visible:outline-none` leaves
 *   `outline-width` at its used value while `outline-style` reads `none`, so a
 *   width-based check reports a treatment on a row that has none. Measured on
 *   A9 `entity-row`.
 * - **False negative.** The vendored `Button` carries `transition-all`, so the
 *   ring *fades in*: read on the frame focus lands, the same element gives a
 *   transparent zero-size shadow and settles to a real one ~250ms later.
 *   Measured on F1 `result-card`'s Retry (`oklab(0 0 0 / 0) 0px 0px 0px 0px`
 *   immediately, `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px` at 250ms).
 *
 * - **False positive, third shape — a treatment on an invisible element.** Base
 *   UI's slider puts a real `<input>` inside the thumb, clipped away with
 *   `position: fixed; clip-path: inset(50%)`. Focus lands there and the user
 *   agent paints its own `outline: auto 1px` on it, so an outline check reports
 *   a ring while the thumb that carries `focus-visible:ring-3` never matches
 *   `:focus-visible`. Measured on H2 `time-ruler` — whose three handles paint no
 *   ring at all — after this helper had already shipped, which is why
 *   `isPainted` exists.
 *
 * So a correct check has to look at the layers rather than the string, ignore
 * an element that is not painted, and be given time to settle.
 * `settledFocusRing` does all three.
 *
 * This is additive: 63 story files still carry the inline string check, and
 * they were not rewritten. Use this one in new work — see
 * `docs/design-system/story-conventions.md`, "The eight", `KeyboardOrder`.
 */

/** Split a computed `box-shadow` into layers, ignoring commas inside `rgb()`,
 *  `oklab()`, `color-mix()` and friends. */
export function shadowLayers(boxShadow: string): string[] {
  if (!boxShadow || boxShadow === "none") return [];
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of boxShadow) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) layers.push(current.trim());
  return layers;
}

/** A layer paints only if it has a non-zero alpha *and* a non-zero geometry.
 *  Both halves matter: Tailwind's off-state ring fails the first, and a
 *  fully-transparent-but-sized layer would fail it too. */
export function layerIsVisible(layer: string): boolean {
  const colour = /(?:rgba?|oklab|oklch|hsla?|color-mix)\([^)]*\)/i.exec(layer)?.[0] ?? "";
  if (colour) {
    // Trailing `/ <alpha>` (oklab/oklch/modern rgb) or a 4th comma-separated
    // argument (legacy rgba). Absent means fully opaque.
    const slashAlpha = /\/\s*([0-9.]+%?)\s*\)/.exec(colour)?.[1];
    const legacyAlpha = /rgba?\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\s*\)/i.exec(colour)?.[1];
    const raw = slashAlpha ?? legacyAlpha;
    if (raw !== undefined) {
      const alpha = raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
      if (!Number.isNaN(alpha) && alpha <= 0.05) return false;
    }
  }
  // Offsets, blur and spread. Any non-zero length means the layer has size.
  const lengths = layer
    .replace(/(?:rgba?|oklab|oklch|hsla?|color-mix)\([^)]*\)/gi, " ")
    .match(/-?[0-9.]+px/g);
  return (lengths ?? []).some((l) => Math.abs(parseFloat(l)) > 0);
}

/**
 * Whether the element is painted at all. A treatment on something clipped to
 * nothing is not a treatment.
 *
 * The case that forced this: Base UI's slider renders a real `<input>` inside
 * the thumb and styles it `position: fixed; clip-path: inset(50%)`. Focus lands
 * on that input, which carries the user agent's own `outline: auto 1px` — so an
 * outline check reports a ring on an element with nothing on screen, while the
 * thumb `<div>` that actually carries `focus-visible:ring-3` never matches
 * `:focus-visible`. Measured on H2 `time-ruler`, whose three handles paint no
 * ring at all; F5 `compare-viewer`'s wipe handle is the same shape.
 */
function isPainted(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  // `inset(50%)` and friends collapse the box to nothing; any full inset does.
  if (/inset\(\s*(?:50%|100%)/.test(style.clipPath)) return false;
  const rect = el.getBoundingClientRect();
  return rect.width >= 2 && rect.height >= 2;
}

/** True when the element paints a focus treatment right now. */
export function hasVisibleFocusRing(el: Element): boolean {
  if (!isPainted(el)) return false;
  const style = getComputedStyle(el);
  if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth || "0") > 0) return true;
  return shadowLayers(style.boxShadow).some(layerIsVisible);
}

/**
 * The form to use in a play function. Waits for the treatment to settle,
 * because the vendored `Button` fades its ring in and an immediate read is a
 * false negative.
 *
 * Pass `waitFor` from `storybook/test` rather than importing it here, so this
 * module stays free of test-runner imports:
 *
 *     await settledFocusRing(document.activeElement!, waitFor);
 */
export async function settledFocusRing(
  el: Element,
  waitFor: (cb: () => void) => Promise<unknown>,
): Promise<void> {
  await waitFor(() => {
    if (!hasVisibleFocusRing(el)) {
      const style = getComputedStyle(el);
      throw new Error(
        `no visible focus treatment on ${el.tagName.toLowerCase()}` +
          `[${el.getAttribute("data-slot") ?? el.className.slice(0, 40)}] — ` +
          `outline ${style.outlineStyle}/${style.outlineWidth}, box-shadow ${style.boxShadow}`,
      );
    }
  });
}
