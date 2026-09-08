/**
 * "Google Sheets" → "GS". Two letters is all a 24px mark can hold.
 *
 * Promoted out of A10 `account-menu`, B2 `workspace-switcher` and K4
 * `record-list`, which each carried their own copy. Two were byte-identical and
 * the third had drifted cosmetically — no `.trim()`, an explicit return type,
 * and a `?? ""` fallback that `.filter(Boolean)` already made unreachable — so
 * the three agreed on behaviour by luck rather than by construction. D3: a piece
 * two components need moves up rather than being copied sideways.
 */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
