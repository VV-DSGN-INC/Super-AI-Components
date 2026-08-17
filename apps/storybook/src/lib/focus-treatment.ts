import { expect, waitFor } from "storybook/test";

/**
 * `KeyboardOrder`'s "a visible focus treatment at every stop", measured.
 *
 * The idiom this replaces —
 *
 *     style.boxShadow !== "none" || style.outlineStyle !== "none"
 *
 * — is vacuous on both halves, and wave 1 produced a live counterexample for
 * each:
 *
 * - **A zero-width ring is still a full box-shadow string.** Tailwind draws
 *   `ring-*` as a box-shadow, so `focus-visible:ring-0` computes to
 *   `oklab(0.708 0 0 / 0.5) 0px 0px 0px 0px` — a coloured ring of zero width,
 *   painting nothing, passing `boxShadow !== "none"`. Measured on
 *   `hero-omnibox`'s prompt field, which is `border-none focus-visible:ring-0`
 *   and shows a keyboard user nothing at all.
 * - **`outline-hidden` is a *transparent* outline, not `outline-style: none`.**
 *   It compiles to `outline: 2px solid transparent`, so `outlineStyle !== "none"`
 *   passes on a completely unstyled element. Measured on `account-menu`, whose
 *   `DropdownMenuItem` rows carry it.
 *
 * So the test is not "is some property set" but "would a sighted keyboard user
 * see anything". Three forms count, because three forms are what this registry
 * actually ships:
 *
 * | form | what it is | judged by |
 * | --- | --- | --- |
 * | `ring` | `focus-visible:ring-2` / `ring-3`, drawn as a box-shadow | at least one shadow entry with non-zero blur or spread, in a colour that is not fully transparent |
 * | `outline` | `focus-visible:outline-2 outline-ring` (`table-view`, `tabs`) | `outline-style` not `none`, non-zero `outline-width`, non-transparent `outline-color` |
 * | `fill` | a row that paints on focus (`focus:bg-accent`) — what menu rows use, because a ring inside a `p-1` popup is clipped | `background-color` differs from the resting value the caller measured |
 *
 * **`fill` is only judged against a `restingBackground` the caller supplies**,
 * and that is deliberate rather than fussy. "Paints a non-transparent
 * background" is true of most buttons at rest, so accepting it unconditionally
 * would hand back exactly the vacuous escape hatch this helper exists to close.
 * A fill is a *change*, so the caller has to have measured what the element
 * paints when it is not focused — read it off a resting sibling row, or off the
 * element itself before focus moves to it.
 *
 * This does **not** assert `:focus-visible`. That is a separate claim (the
 * browser considers this a keyboard focus) and the case stories assert it on
 * their own line, immediately above the call to this.
 *
 * The wait is load-bearing, not defensive: `Button` carries `transition-all`,
 * so reading `getComputedStyle` the instant `userEvent.tab()` resolves returns
 * the pre-transition `0px` ring and the assertion fails for a reason that has
 * nothing to do with the component.
 */

export type FocusTreatment = "ring" | "outline" | "fill";

export type FocusMeasurement = {
  /** The form found, or `null` when the element paints nothing perceptible. */
  treatment: FocusTreatment | null;
  /** Per-form prose: what was measured and, where it failed, why. */
  report: string;
};

export type PerceptibleFocusOptions = {
  /**
   * How the element is named in the failure message. Defaults to its
   * `data-slot`, else its tag plus a snippet of its accessible text.
   */
  label?: string;
  /**
   * The element's computed `background-color` when it is *not* focused.
   * Supplying it enables the `fill` form; without it a fill cannot be
   * distinguished from a surface the element always paints.
   */
  restingBackground?: string;
  /** Forms that count for this element. Defaults to all three. */
  accept?: readonly FocusTreatment[];
  /** Passed through to `waitFor`. */
  timeout?: number;
};

const ALL_FORMS: readonly FocusTreatment[] = ["ring", "outline", "fill"];

/** Chromium serializes a fully transparent colour several different ways. */
function isFullyTransparent(color: string): boolean {
  const value = color.trim().toLowerCase();
  if (value === "transparent" || value === "") return true;

  // `rgba(0, 0, 0, 0)` / `hsla(0, 0%, 0%, 0)` — comma form, four components.
  const commaForm = /^(?:rgba|hsla)\(([^)]*)\)$/.exec(value);
  if (commaForm) {
    const parts = commaForm[1].split(",");
    if (parts.length === 4) return Number.parseFloat(parts[3]) === 0;
  }

  // `oklab(0.7 0 0 / 0)` / `color(srgb 0 0 0 / 0%)` — slash form.
  const slashForm = /\/\s*([\d.]+)(%?)\s*\)$/.exec(value);
  if (slashForm) return Number.parseFloat(slashForm[1]) === 0;

  return false;
}

/**
 * Split a box-shadow list on its top-level commas. Splitting on every comma is
 * wrong: `rgba(0, 0, 0, 0.5) 0px 0px 0px 3px` is one entry containing three.
 */
function splitShadowList(value: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      entries.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) entries.push(current.trim());
  return entries;
}

/**
 * A shadow entry paints a ring when it has blur or spread. Chromium serializes
 * computed box-shadows as `<color> <offset-x> <offset-y> <blur> <spread>`, but
 * the shorter forms are handled too so this does not depend on that.
 */
function shadowEntryPaints(entry: string): boolean {
  const lengths = entry.match(/-?[\d.]+px/g) ?? [];
  if (lengths.length < 3) return false; // offsets only: no blur, no spread
  const blur = Number.parseFloat(lengths[2]);
  const spread = lengths.length > 3 ? Number.parseFloat(lengths[3]) : 0;
  if (blur <= 0 && spread <= 0) return false;

  // Strip the lengths and the `inset` keyword; what remains is the colour.
  const color = entry
    .replace(/-?[\d.]+px/g, "")
    .replace(/\binset\b/g, "")
    .trim();
  return !isFullyTransparent(color);
}

function describeElement(element: Element): string {
  const slot = element.getAttribute("data-slot");
  const text = element.textContent?.trim().replace(/\s+/g, " ").slice(0, 32) ?? "";
  const name = element.getAttribute("aria-label") ?? text;
  const base = slot ?? element.tagName.toLowerCase();
  return name ? `${base} "${name}"` : base;
}

/**
 * Read the three forms off one element. Exported so a story can inspect what
 * was measured — for example to record a treatment it deliberately does not
 * assert — without duplicating the parsing.
 */
export function measureFocusTreatment(
  element: HTMLElement,
  options: Pick<PerceptibleFocusOptions, "restingBackground" | "accept"> = {},
): FocusMeasurement {
  const accept = options.accept ?? ALL_FORMS;
  const style = getComputedStyle(element);
  const notes: string[] = [];
  let treatment: FocusTreatment | null = null;

  if (accept.includes("ring")) {
    const shadows = splitShadowList(style.boxShadow);
    const painted = shadows.filter(shadowEntryPaints);
    if (painted.length > 0) treatment ??= "ring";
    else if (style.boxShadow === "none") notes.push(`ring: box-shadow is "none"`);
    else
      notes.push(
        `ring: box-shadow "${style.boxShadow}" has no entry with non-zero blur or spread in a visible colour`,
      );
  }

  if (accept.includes("outline")) {
    const { outlineStyle, outlineWidth, outlineColor } = style;
    const width = Number.parseFloat(outlineWidth);
    if (outlineStyle === "auto") treatment ??= "outline"; // the UA focus ring
    else if (outlineStyle === "none") notes.push(`outline: outline-style is "none"`);
    else if (!(width > 0))
      notes.push(`outline: outline-style "${outlineStyle}" but outline-width is "${outlineWidth}"`);
    else if (isFullyTransparent(outlineColor))
      notes.push(
        `outline: outline-style "${outlineStyle}" ${outlineWidth} but outline-color is "${outlineColor}" (transparent — this is what \`outline-hidden\` compiles to)`,
      );
    else treatment ??= "outline";
  }

  if (accept.includes("fill")) {
    const { backgroundColor } = style;
    if (options.restingBackground === undefined)
      notes.push(
        `fill: background-color is "${backgroundColor}", but no restingBackground was supplied, so a change cannot be judged`,
      );
    else if (backgroundColor === options.restingBackground)
      notes.push(
        `fill: background-color is "${backgroundColor}", unchanged from the resting "${options.restingBackground}"`,
      );
    else treatment ??= "fill";
  }

  return { treatment, report: notes.join("; ") };
}

/**
 * Assert that `element` shows a perceptible focus treatment, and return which
 * form it was. See the module comment for the three forms and for why `fill`
 * needs `restingBackground`.
 *
 *     await userEvent.tab();
 *     const focused = document.activeElement as HTMLElement;
 *     await expect(focused.matches(":focus-visible")).toBe(true);
 *     await expectPerceptibleFocus(focused);
 */
export async function expectPerceptibleFocus(
  element: HTMLElement,
  options: PerceptibleFocusOptions = {},
): Promise<FocusTreatment> {
  const label = options.label ?? describeElement(element);
  let measurement = measureFocusTreatment(element, options);

  if (!measurement.treatment) {
    // `transition-all` on Button means the ring grows from 0px after the tab
    // resolves. Settle before concluding it paints nothing.
    try {
      await waitFor(
        () => {
          measurement = measureFocusTreatment(element, options);
          if (!measurement.treatment) throw new Error(measurement.report);
        },
        options.timeout === undefined ? undefined : { timeout: options.timeout },
      );
    } catch {
      // Fall through to the assertion below, which reports what was measured.
    }
  }

  const verdict = measurement.treatment ?? `none — ${measurement.report}`;
  await expect(`${label} → ${verdict}`).toMatch(/ → (ring|outline|fill)$/);

  return measurement.treatment as FocusTreatment;
}
