// Hand-written, NOT generated. The volume does not justify a pipeline, and these
// strings set the terminology that lib/i18n/glossary.ts then holds the generated
// component corpus to. Typed as Record<Locale, Messages>, so a missing Russian
// key is a compile error rather than a gate failure.
//
// "Super-AI-Components" is a proper noun and is deliberately not in here.
import type { Locale, Messages } from "./types";

export const MESSAGES: Record<Locale, Messages> = {
  en: {
    tagline: "The missing half of AI Elements — components for AI applications.",
    groupPrimitives: "Primitives",
    groupComponents: "Components",
    groupBlocks: "Blocks",
    marketingPrefix: "Marketing",
    sectionWhatItIs: "What it is",
    sectionWhyItMatters: "Why it matters",
    sectionAnatomy: "Anatomy",
    sectionUsage: "How to use it",
    sectionAccessibility: "Accessibility",
    sectionPitfalls: "Watch out for",
    doLabel: "Do",
    dontLabel: "Don't",
    a11yKeyboard: "Keyboard",
    a11yScreenReader: "Screen reader",
    a11yFocus: "Focus",
    a11yUndocumented: "Not yet documented.",
    observedIn: "Observed in:",
    installation: "Installation",
    previewTab: "Preview",
    codeTab: "Code",
    switchToEnglish: "English",
    switchToRussian: "Русский",
    languageLabel: "Language",
  },
  ru: {
    tagline: "Недостающая половина AI Elements — компоненты для ИИ-приложений.",
    groupPrimitives: "Примитивы",
    groupComponents: "Компоненты",
    groupBlocks: "Блоки",
    marketingPrefix: "Маркетинг",
    sectionWhatItIs: "Что это",
    sectionWhyItMatters: "Почему это важно",
    sectionAnatomy: "Анатомия",
    sectionUsage: "Как использовать",
    sectionAccessibility: "Доступность",
    sectionPitfalls: "На что обратить внимание",
    doLabel: "Как надо",
    dontLabel: "Как не надо",
    a11yKeyboard: "Клавиатура",
    a11yScreenReader: "Скринридер",
    a11yFocus: "Фокус",
    a11yUndocumented: "Пока не задокументировано.",
    observedIn: "Встречается в:",
    installation: "Установка",
    previewTab: "Просмотр",
    codeTab: "Код",
    switchToEnglish: "English",
    switchToRussian: "Русский",
    languageLabel: "Язык",
  },
};

export function messagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}
