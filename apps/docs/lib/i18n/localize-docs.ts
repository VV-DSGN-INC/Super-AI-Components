import type { ComponentDocs } from "@/lib/component-docs";
import type { DocsTranslation } from "./types";

/**
 * Overlays a Russian `DocsTranslation` onto an English `ComponentDocs` and
 * returns an ordinary `ComponentDocs`. Everything downstream — ComponentDocsView
 * and every component beneath it — is locale-unaware by design.
 *
 * Fallback is per-field and per-item, so a translation that is missing, short,
 * or hand-edited into an invalid shape degrades to English rather than to a
 * blank. In a passing build the fallback path is unreachable for component docs
 * (check:i18n requires complete coverage); it exists so a half-applied change is
 * legible instead of empty.
 *
 * `.at(i)` rather than `[i]` on purpose: it is typed `string | undefined`, so the
 * `??` below is honest to the compiler instead of relying on
 * noUncheckedIndexedAccess being off.
 */
export function localizeDocs(en: ComponentDocs, ru?: DocsTranslation): ComponentDocs {
  if (!ru) return en;

  return {
    ...en,
    whatItIs: ru.whatItIs || en.whatItIs,
    whyItMatters: ru.whyItMatters || en.whyItMatters,
    usage: ru.usage || en.usage,

    // Product names. Never translated, never overlaid.
    evidence: en.evidence,

    // `slot` is a data-slot attribute value and comes from English, always.
    anatomy: en.anatomy.map((a) => ({
      slot: a.slot,
      note: ru.anatomy?.[a.slot] ?? a.note,
    })),

    // `example` is a React node and is kept from English; only `text` is overlaid.
    dos: en.dos.map((d, i) => ({ ...d, text: ru.dos?.at(i) ?? d.text })),
    donts: en.donts.map((d, i) => ({ ...d, text: ru.donts?.at(i) ?? d.text })),

    accessibility: {
      keyboard: ru.accessibility?.keyboard?.length
        ? ru.accessibility.keyboard
        : en.accessibility.keyboard,
      screenReader: ru.accessibility?.screenReader?.length
        ? ru.accessibility.screenReader
        : en.accessibility.screenReader,
      focus: ru.accessibility?.focus?.length ? ru.accessibility.focus : en.accessibility.focus,
    },

    pitfalls: ru.pitfalls?.length ? ru.pitfalls : en.pitfalls,
  };
}
