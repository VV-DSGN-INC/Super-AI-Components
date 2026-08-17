import type { Locale } from "./types";

/**
 * The single place a locale prefix is constructed. English is primary and keeps
 * the unprefixed URLs, so nothing already shared breaks and the existing
 * Playwright smoke gate keeps passing unmodified.
 */
export function localeHref(locale: Locale, path: string): string {
  if (locale === "en") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
