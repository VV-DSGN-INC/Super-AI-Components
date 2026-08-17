/**
 * The locales the docs site serves. English is primary and keeps the unprefixed
 * URLs; every other locale is path-prefixed with its own code.
 */
export type Locale = "en" | "ru";

export const LOCALES: readonly Locale[] = ["en", "ru"] as const;
export const DEFAULT_LOCALE: Locale = "en";

/**
 * `ComponentDocs` reduced to prose, and nothing but prose.
 *
 * What is ABSENT here is the point of the type. Translation is machine-produced
 * and unreviewed (spec §1 decision 2), so the fields a translator must never
 * touch are kept out of its reach structurally rather than by instruction:
 *
 *   - `anatomy[].slot` — a `data-slot` attribute value. Keyed here, so a slot
 *     name is only ever a key, never a translatable value.
 *   - `dos[].example` / `donts[].example` — React nodes. Examples render once,
 *     from the English definition, in every locale.
 *   - `evidence` — product names ("NotebookLM"). Verbatim, always.
 */
export interface DocsTranslation {
  whatItIs: string;
  whyItMatters: string;
  usage: string;
  /** slot name -> translated note. Keyed, so reordering anatomy cannot misalign notes. */
  anatomy: Record<string, string>;
  /** Index-aligned with the English `dos`. Length equality is gate-enforced. */
  dos: string[];
  /** Index-aligned with the English `donts`. Length equality is gate-enforced. */
  donts: string[];
  accessibility: {
    keyboard: string[];
    screenReader: string[];
    focus?: string[];
  };
  pitfalls: string[];
}

/** Site chrome. Hand-written per locale — see lib/i18n/messages.ts. */
export interface Messages {
  tagline: string;
  groupPrimitives: string;
  groupComponents: string;
  groupBlocks: string;
  marketingPrefix: string;
  sectionWhatItIs: string;
  sectionWhyItMatters: string;
  sectionAnatomy: string;
  sectionUsage: string;
  sectionAccessibility: string;
  sectionPitfalls: string;
  doLabel: string;
  dontLabel: string;
  a11yKeyboard: string;
  a11yScreenReader: string;
  a11yFocus: string;
  a11yUndocumented: string;
  observedIn: string;
  installation: string;
  previewTab: string;
  codeTab: string;
  switchToEnglish: string;
  switchToRussian: string;
  languageLabel: string;
}
