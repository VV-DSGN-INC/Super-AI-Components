import type { ComponentDocs } from "@/lib/component-docs";
import {
  ContentIsMeasured,
  ContentIsStretched,
  OneFlatNavigation,
  TwoNavigationsTwoJobs,
} from "./docs-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O11 `docs-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./docs-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const DocsShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a documentation site: a persistent icon rail of product areas, a sectioned page nav beside it, a strip of announcements pinned above the page, and a content column measured for reading. It is a block, not a component — it owns arrangement and nothing else. The rail is B1 in its icon-rail configuration, the nav is B3, the strip is L3 at its quietest level, and the page body is built from A12 headings, K6 citations and A1 keycaps. Each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "OpenAI docs and Lovable docs both split navigation in two, and the split is the whole point: the rail answers which product am I in, the nav answers which page of it am I reading. Merging them into one list is the mistake this shell exists to prevent — a flat nav that mixes products with pages makes both questions harder, and it gets worse with every product you ship. The second decision worth copying is the measure. Documentation is long-form prose, and a column stretched to viewport width turns every line return into a small act of navigation; this is the one surface in the catalog where a max-width is not a preference.",
  evidence: ["OpenAI docs", "Lovable docs"],
  anatomy: [
    {
      slot: 'data-region="icon-rail"',
      note: "B1 app-sidebar at icon width, holding the product areas. Switches product, never page.",
    },
    {
      slot: 'data-region="doc-nav"',
      note: "B3 sidebar-nav for the pages of the active area, or L1 when the area has none.",
    },
    {
      slot: 'data-region="announcement-strip"',
      note: "L3 feature-announcement, fixed at dismissible-chip level, pinned above the content.",
    },
    {
      slot: 'data-region="content-column"',
      note: "The scroll container. Named, focusable, and never itself measured — the article inside it is.",
    },
    { slot: "docs-shell", note: "Root. Contains its own fixed descendants so the shell can be embedded." },
    { slot: "docs-shell-areas", note: "The rail's own nav landmark, named separately from the page nav." },
    {
      slot: "docs-shell-nav-header",
      note: "The rail toggle plus the A1 keycaps that advertise its keyboard binding.",
    },
    {
      slot: "docs-shell-article",
      note: "The measured column. 68ch, on the article rather than the scroller.",
    },
    { slot: "docs-shell-section", note: "One section: an A12 heading, a body, and its citations." },
    { slot: "docs-shell-sources", note: "The labelled run of K6 markers under a section." },
  ],
  usage:
    "Reach for it when your product ships more than one thing and each of them needs its own documentation. Keep the two navigation props apart: `areas` with `activeAreaId` and `onSelectArea` move between products, `navSections` with `activePageId` and `onSelectPage` move between pages of the product you are already in. Feed `navSections` from whichever area is active — the rail changing is what changes the nav. `announcements` is controlled the way L3 is: the shell emits an id and your host stores it, so pass `onDismissAnnouncement` or the dismiss control does nothing. Page bodies can be `sections`, which get A12 headings and K6 citations for free, or arbitrary `children` for MDX you already render; both land inside the measure.",
  dos: [
    {
      text: "Keep the rail and the nav as two named navigations doing two different jobs.",
      example: <TwoNavigationsTwoJobs />,
    },
    {
      text: "Let the content column stay measured, even when the window is wide.",
      example: <ContentIsMeasured />,
    },
  ],
  donts: [
    {
      text: "Don't flatten products and pages into one list — both questions get harder, and it scales badly.",
      example: <OneFlatNavigation />,
    },
    {
      text: "Don't stretch prose to the viewport; long lines are where readers lose their place.",
      example: <ContentIsStretched />,
    },
  ],
  pitfalls: [
    "B1's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a preview, a panel or an app region — if you re-wrap or restyle the root, keep that containment or the rail will pin itself to the browser's left edge. The trade-off is that the rail keeps its full `h-svh` height and gets clipped to the shell's, so `railFooter` falls below the clip and is invisible whenever the shell is shorter than the viewport. Fill it only in a shell rendered at viewport height.",
    "B1 has no prop for what an icon rail is actually made of, so the area rows are the vendored sidebar's own menu primitives placed into B1's `nav` slot, and the rail's `nav` landmark is a wrapper the shell adds. That wrapper is what gives the rail a name distinct from the page nav; drop it and the two navigations become indistinguishable to a screen reader even though they look different on screen.",
    "The rail's rows are 3rem wide, so their labels are clipped rather than removed. That is deliberate — the label is still the row's accessible name, and the tooltip is a convenience on top of it. If you replace the rows with icon-only buttons, give each one an sr-only label; a tooltip must never be the only source of an accessible name.",
    "L3 has no empty form, so unlike the nav and the content column the announcement strip cannot show an empty affordance. It stays mounted with no tint and no padding, which means the first announcement to arrive does change the page height. If a stable height matters more to you than a clean empty page, reserve it yourself on the strip's wrapper.",
    "L3 never stores a dismissal — it emits an id and expects the host to remember. Rendering the shell without `onDismissAnnouncement` gives you a ✕ that visibly does nothing, which is worse than no ✕ at all. Feed `announcements[].dismissed` back from wherever you record it.",
    "The strip is painted `bg-muted`, and `text-muted-foreground` on that surface measures 4.34:1 against a 4.5:1 minimum. The shell rebinds `--muted-foreground` on the strip rather than restyling slots, because composed children carry their own muted classes and no `className` from here can reach them. If you re-tint the strip, move the rebind with the tint.",
    "The doc-nav column is deliberately not tinted. B3's active row is `bg-accent`, so painting the column the same token would erase the very affordance that says which page you are on — and B3's row icons and A12's small headings both carry `text-muted-foreground`, which fails contrast on any of the three muted surfaces.",
    "A section's `action` renders inside the A12 header, and the shell promotes that header to a level-2 heading — so whatever you put there becomes part of the heading's accessible name. Keep it to two or three words; a full sentence turns every heading in the page outline into a paragraph.",
    "The content column is the scroll container, which is why it carries `tabIndex={0}` and an accessible name taken from the page title. Moving the overflow onto the article without moving those two with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the page they navigated to.",
  ],
};
