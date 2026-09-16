import type { DocsShellProps, DocsShellSection } from "@/registry/super-ai/docs-shell";

import { MANIFEST } from "./catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "./families";
import { MARKETING_GROUPS, MARKETING_ITEMS } from "./marketing-catalog";
import { STAGES } from "./pattern-docs";
import type { PatternEntry } from "./patterns";
import { byStage } from "./patterns";

type NavSections = NonNullable<DocsShellProps["navSections"]>;

/** Stages as sections, patterns as rows; a hole is visible as a badge. */
export function patternsNav(entries: PatternEntry[]): NavSections {
  const grouped = byStage(entries);
  return STAGES.map((s) => {
    const list = grouped.get(s.id) ?? [];
    return {
      label: `${s.label} · ${list.length}`,
      items: list.map((e) => ({
        id: e.slug,
        label: e.docs.title,
        href: `/patterns/${e.slug}`,
        ...(e.docs.status === "unfilled" ? { tier: "unfilled" } : {}),
      })),
    };
  });
}

/** Families as sections, components as rows, marketing at the end. */
export function componentsNav(): NavSections {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const families = FAMILY_ORDER.map((f) => ({
    label: `${f} · ${FAMILY_LABELS[f]}`,
    items: shipped
      .filter((i) => i.family === f)
      .map((i) => ({ id: i.name, label: i.title, href: `/components/${i.name}` })),
  })).filter((s) => s.items.length > 0);
  const marketing = MARKETING_GROUPS.map((g) => ({
    label: `Marketing · ${g}`,
    items: MARKETING_ITEMS.filter((i) => i.group === g).map((i) => ({
      id: i.name,
      label: i.title,
      href: `/components/${i.name}`,
    })),
  })).filter((s) => s.items.length > 0);
  return [...families, ...marketing];
}

/** One array drives the sections and the on-page nav (spec §6.4): the body
 *  gains an id the nav's `#` links land on, and the pinned rows are derived.
 *  They cannot disagree, because there is one list. */
export function anchored(sections: DocsShellSection[]): {
  sections: DocsShellSection[];
  pinned: NonNullable<DocsShellProps["navPinned"]>;
} {
  return {
    sections: sections.map((s) => ({
      ...s,
      body: (
        <div id={s.id} className="scroll-mt-8">
          {s.body}
        </div>
      ),
    })),
    pinned: sections.map((s) => ({ id: `on-page-${s.id}`, label: s.title, href: `#${s.id}` })),
  };
}
