// The pure half of the docs-citation gate: extraction and classification,
// deliberately I/O-free so its tests cannot be confounded by the tree.
// The gate itself (manifest walk, reach set, verdicts) lives in
// scripts/check-citations.mts. Spec:
// docs/superpowers/specs/2026-08-23-docs-citation-gate-design.md

/** Axe rule ids and similar reviewed vocabulary that is kebab-shaped but
 *  names neither a utility nor a slot. Grown only by triage, one comment
 *  each — an auditable list, never a cleverer pattern. */
export const ALLOWED_TERMS = new Set([
  // axe rule id, cited when a docs module explains a scroll region's tabindex
  "scrollable-region-focusable",
  // axe rule ids cited by a11y notes explaining a report line or a fix
  "nested-interactive",
  "landmark-unique",
  // CSS cursor keyword, cited bare ("shows an `ew-resize` cursor")
  "ew-resize",
  // frame-strip's domain vocabulary for the trim range
  "in-out",
]);

/** First segments that mark a span as Tailwind-utility-shaped. Deliberately
 *  the cited vocabulary, not all of Tailwind — a new prefix arriving in docs
 *  prose lands in `name` and the triage promotes it here explicitly. */
export const UTILITY_PREFIXES = new Set([
  "bg", "text", "border", "ring", "outline", "fill", "stroke", "placeholder",
  "decoration", "caret", "shadow", "rounded", "gap", "p", "px", "py", "pt",
  "pb", "pl", "pr", "m", "mx", "my", "mt", "mb", "ml", "mr", "size", "h", "w",
  "min", "max", "grid", "col", "flex", "items", "justify", "self", "font",
  "leading", "tracking", "underline", "opacity", "inset", "truncate",
  "divide", "space", "animate", "transition", "duration", "hover", "focus",
  "active", "disabled", "group", "peer", "sr", "pointer", "select", "line",
  "list", "overflow", "align", "tabular", "break", "left", "right",
]);

export function classifySpan(span: string): "utility" | "name" | "allowed" | "ignored" {
  if (ALLOWED_TERMS.has(span)) return "allowed";
  // Runtime-injected attributes (Radix writes aria-*/data-* at render time);
  // proving them is story work, deferred by the spec — never a citation lie.
  if (/^(aria|data)-/.test(span)) return "ignored";
  if (!/^[a-z][a-z0-9]*(-[a-z0-9/[\]]+)+$/.test(span)) return "ignored";
  if (/\/(?:\d|\[)/.test(span)) return "utility"; // a /step is always a utility
  if (UTILITY_PREFIXES.has(span.split("-")[0])) return "utility";
  return "name";
}

/** Claim-position fields only. donts/pitfalls legitimately cite what must
 *  NOT be written (every "stale" hit in the design audit was a pitfall doing
 *  its job) and are exempt — recorded, with their positive tails, in the spec. */
const CLAIM_PATHS: [string, (d: Record<string, unknown>) => [string, string][]][] = [
  ["whatItIs", (d) => (typeof d.whatItIs === "string" ? [["whatItIs", d.whatItIs]] : [])],
  ["whyItMatters", (d) => (typeof d.whyItMatters === "string" ? [["whyItMatters", d.whyItMatters]] : [])],
  ["usage", (d) => (typeof d.usage === "string" ? [["usage", d.usage]] : [])],
  [
    "anatomy",
    (d) =>
      Array.isArray(d.anatomy)
        ? d.anatomy.map((a: { note?: string }, i: number) => [`anatomy[${i}].note`, a?.note ?? ""] as [string, string])
        : [],
  ],
  [
    "dos",
    (d) =>
      Array.isArray(d.dos)
        ? d.dos.map((x: { text?: string }, i: number) => [`dos[${i}].text`, x?.text ?? ""] as [string, string])
        : [],
  ],
  [
    "accessibility",
    (d) => {
      const acc = d.accessibility as { keyboard?: string[]; screenReader?: string[] } | undefined;
      return [
        ...(acc?.keyboard ?? []).map((s, i) => [`accessibility.keyboard[${i}]`, s] as [string, string]),
        ...(acc?.screenReader ?? []).map((s, i) => [`accessibility.screenReader[${i}]`, s] as [string, string]),
      ];
    },
  ],
];

export function extractCitations(docs: unknown): { path: string; span: string }[] {
  const out: { path: string; span: string }[] = [];
  if (!docs || typeof docs !== "object") return out;
  for (const [, fields] of CLAIM_PATHS) {
    for (const [fieldPath, prose] of fields(docs as Record<string, unknown>)) {
      for (const m of prose.matchAll(/`([^`\n]+)`/g)) out.push({ path: fieldPath, span: m[1] });
    }
  }
  return out;
}

/** data-slot values a source can satisfy: literals, and the static prefixes
 *  of template-literal slots (approval-card builds `approval-card-${verb}` —
 *  a literal-only read calls four true claims lies). */
export function slotTargets(source: string): {
  literals: Set<string>;
  prefixes: string[];
  regions: Set<string>;
} {
  const literals = new Set<string>();
  for (const m of source.matchAll(/data-slot="([a-z0-9-]+)"/g)) literals.add(m[1]);
  // slot="…" props: composed primitives take a slot prop and stamp it as
  // data-slot (stem-mixer's sliders, drawing-tools' rails).
  for (const m of source.matchAll(/\bslot="([a-z0-9-]+)"/g)) literals.add(m[1]);
  // Expression slots: every string literal inside data-slot={…} counts — a
  // ternary picks one at runtime (suggestion-chips: icon vs thumbnail).
  for (const m of source.matchAll(/data-slot=\{([^}]*)\}/g))
    for (const s of m[1].matchAll(/"([a-z0-9-]+)"/g)) literals.add(s[1]);
  const prefixes: string[] = [];
  for (const m of source.matchAll(/data-slot=\{`([a-z0-9-]+)\$\{/g)) prefixes.push(m[1]);
  // The O-family convention: shells mark layout regions with data-region,
  // and their anatomy entries claim the full `data-region="x"` string.
  const regions = new Set<string>();
  for (const m of source.matchAll(/data-region="([a-z0-9-]+)"/g)) regions.add(m[1]);
  return { literals, prefixes, regions };
}
