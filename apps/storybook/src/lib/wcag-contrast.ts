/**
 * Real WCAG contrast measurement for story play functions, not an identity
 * check. `text-muted-foreground` and `bg-muted` are different CSS custom
 * properties that can share lightness — a `color !== backgroundColor` check
 * passes regardless of whether the pairing clears 4.5:1, so it can never
 * fail against a real contrast defect. This walks the box model the way a
 * reader's eye does: if an element paints no background of its own, the
 * colour that actually shows through is its nearest ancestor's.
 */

// Linear-light sRGB, one channel per component, each roughly in [0, 1]
// (out-of-gamut oklch values can fall slightly outside; that's fine, the
// luminance formula below doesn't require clamping).
type LinearRgb = [number, number, number];

/**
 * Chromium's getComputedStyle resolves `color`/`background-color` to
 * whatever colour function the source declaration used (CSS Color 4) —
 * this token set is authored entirely in oklch(), so the computed values
 * come back as e.g. "oklch(0.556 0 0)", never "rgb(...)". Parse that
 * directly into linear-light sRGB via the published OKLab→linear-sRGB
 * matrix (Björn Ottosson), rather than reprojecting into 8-bit sRGB first —
 * WCAG relative luminance is a linear-light quantity, so this skips a
 * needless round trip through gamma encoding and back.
 */
function parseOklch(value: string): { linear: LinearRgb; alpha: number } | null {
  const match = value.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i,
  );
  if (!match) return null;
  const [, lRaw, cRaw, hRaw, alphaRaw] = match;
  const L = lRaw.endsWith("%") ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
  const C = parseFloat(cRaw);
  const H = (parseFloat(hRaw) * Math.PI) / 180;
  if ([L, C, H].some((n) => Number.isNaN(n))) return null;

  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const alpha = alphaRaw ? (alphaRaw.endsWith("%") ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw)) : 1;

  return { linear: [r, g, bl], alpha };
}

/** 8-bit sRGB → linear-light sRGB, per the WCAG relative-luminance formula. */
function srgb255ToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseColor(value: string): { linear: LinearRgb; alpha: number } | null {
  const oklch = parseOklch(value);
  if (oklch) return oklch;

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((part) => parseFloat(part.trim()));
    if (parts.length >= 3 && !parts.slice(0, 3).some((n) => Number.isNaN(n))) {
      const [r, g, b] = parts;
      const alpha = parts.length >= 4 && !Number.isNaN(parts[3]) ? parts[3] : 1;
      return { linear: [srgb255ToLinear(r), srgb255ToLinear(g), srgb255ToLinear(b)], alpha };
    }
  }

  const hexMatch = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hexMatch) {
    const [, rgbHex, alphaHex] = hexMatch;
    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);
    const alpha = alphaHex ? parseInt(alphaHex, 16) / 255 : 1;
    return { linear: [srgb255ToLinear(r), srgb255ToLinear(g), srgb255ToLinear(b)], alpha };
  }

  return null;
}

function relativeLuminance([r, g, b]: LinearRgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two colours' relative luminances, in [1, 21]. */
export function contrastRatio(a: LinearRgb, b: LinearRgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The background actually behind `element`: its own, if it paints a
 * non-transparent one, else the nearest ancestor's. Falls back to white
 * (the assumed page background) if nothing up the tree paints one.
 */
export function resolveEffectiveBackground(element: HTMLElement): LinearRgb {
  let node: HTMLElement | null = element;
  while (node) {
    const parsed = parseColor(getComputedStyle(node).backgroundColor);
    if (parsed && parsed.alpha > 0) return parsed.linear;
    node = node.parentElement;
  }
  return [1, 1, 1];
}

/**
 * Contrast ratio between `element`'s own computed text colour and the
 * background actually painted behind it (its own, or the nearest ancestor's
 * if it paints none). Throws if the text colour can't be parsed — a broken
 * measurement should fail loudly, not silently report a false pass.
 */
export function measureContrastAgainstAncestor(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const text = parseColor(style.color);
  if (!text) {
    throw new Error(`wcag-contrast: could not parse computed text color "${style.color}"`);
  }
  const background = resolveEffectiveBackground(element);
  return contrastRatio(text.linear, background);
}
