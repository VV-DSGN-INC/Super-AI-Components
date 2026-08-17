/**
 * Fixed English→Russian renderings for design-system vocabulary, injected into
 * every translation prompt.
 *
 * This exists because the corpus is translated by 116 INDEPENDENT calls with no
 * shared context. Without a glossary each call renders "slot", "live region" and
 * "tab stop" differently and the result is 116 unrelated documents rather than
 * one design system. Terms here match lib/i18n/messages.ts, so chrome and body
 * agree.
 */
export const GLOSSARY: ReadonlyArray<{ en: string; ru: string }> = [
  { en: "slot", ru: "слот" },
  { en: "anatomy", ru: "анатомия" },
  { en: "surface", ru: "поверхность" },
  { en: "primitive", ru: "примитив" },
  { en: "block", ru: "блок" },
  { en: "empty state", ru: "пустое состояние" },
  { en: "tab stop", ru: "точка табуляции" },
  { en: "focus ring", ru: "кольцо фокуса" },
  { en: "focus", ru: "фокус" },
  { en: "live region", ru: "живая область" },
  { en: "screen reader", ru: "скринридер" },
  { en: "accessible name", ru: "доступное имя" },
  { en: "landmark", ru: "ориентир" },
  { en: "affordance", ru: "аффорданс" },
  { en: "call to action", ru: "призыв к действию" },
  { en: "shell", ru: "оболочка" },
  { en: "pane", ru: "панель" },
  { en: "route", ru: "маршрут" },
  { en: "grid cell", ru: "ячейка сетки" },
  { en: "prop", ru: "пропс" },
  { en: "consumer", ru: "потребитель" },
  { en: "registry", ru: "реестр" },
];
