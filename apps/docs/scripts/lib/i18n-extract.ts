// Shared by scripts/i18n-sync.mts (which writes translations) and
// scripts/check-i18n.mts (which verifies they are current). Imports node:crypto,
// so app code must never import this module — the app side is lib/i18n/.
import { createHash } from "node:crypto";

import type { ComponentDocs } from "@/lib/component-docs";
import type { DocsTranslation } from "@/lib/i18n/types";

/**
 * The field whitelist. This function is the only thing that decides what a
 * translator ever sees, which is why it is written as an explicit construction
 * rather than as a spread with deletions: a field added to ComponentDocs is
 * excluded by default and has to be opted in here deliberately.
 */
export function extractStrings(docs: ComponentDocs): DocsTranslation {
  return {
    whatItIs: docs.whatItIs,
    whyItMatters: docs.whyItMatters,
    usage: docs.usage,
    anatomy: Object.fromEntries(docs.anatomy.map((a) => [a.slot, a.note])),
    dos: docs.dos.map((d) => d.text),
    donts: docs.donts.map((d) => d.text),
    accessibility: {
      keyboard: docs.accessibility.keyboard,
      screenReader: docs.accessibility.screenReader,
      // Spread rather than `focus: docs.accessibility.focus` so an absent arm is
      // absent from the JSON, not present-as-undefined — otherwise adding and
      // removing a focus arm would produce two different hashes for one state.
      ...(docs.accessibility.focus?.length ? { focus: docs.accessibility.focus } : {}),
    },
    pitfalls: docs.pitfalls,
  };
}

/** Deterministic JSON: object keys sorted, array order preserved. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Hashes the EXTRACT, not the file. Editing a comment, an import, or an example
 * component in a .docs.tsx file therefore does not mark its page stale. A
 * blocking gate is only tolerable if it does not cry wolf.
 */
export function hashStrings(strings: DocsTranslation): string {
  return createHash("sha256").update(canonicalJson(strings)).digest("hex").slice(0, 16);
}
