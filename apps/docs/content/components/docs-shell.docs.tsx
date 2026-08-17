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
  accessibility: {
    keyboard: [
      "Tab order is rail rows, then the rail toggle, then the nav rows, then each announcement's CTA and ✕, then the content column, then the citation markers inside the prose. Nothing here uses a roving tabindex, so the counts add up: three product areas and a forty-page nav is forty-four stops before the page you came to read. There is no skip link.",
      "The content column is itself a tab stop — `tabIndex={0}` on the scroll container, so a keyboard user can scroll the page they navigated to (axe `scrollable-region-focusable`). It holds no controls of its own, so it reads as a stop that does nothing until you press an arrow key.",
      "⌘B / Ctrl+B toggles the rail. That binding is a `window` listener from the vendored sidebar provider and it calls `preventDefault`, so it fires wherever focus is — including inside a text field, where it takes Ctrl+B away from any rich-text editor you embed in the page. The A1 keycaps in the nav header exist to advertise it.",
      "The rail's drag handle is `tabIndex={-1}` and unreachable by keyboard, so the toggle button and the shortcut are the only two ways to collapse and expand the rail.",
      "Rail rows and nav rows are buttons unless a nav item carries `href`, in which case that row is an anchor. Both activate on Enter; only the button form also activates on Space.",
      "A resolved citation marker opens its quote on hover **and** on keyboard focus, so the preview is reachable — but Enter on the marker fires `onJumpToSource` rather than pinning the card open.",
    ],
    screenReader: [
      'Two `nav` landmarks with two names — "Product areas" and "Pages" by default — is the split surviving into the accessibility tree. Landmark navigation is the fast path here, and it only works because the names differ; give both the same string and the distinction is gone for screen-reader users while remaining obvious on screen.',
      'The active area and the active page both carry `aria-current="page"` alongside their filled surface, so "where am I" is programmatic rather than colour alone.',
      "The content column is a `<section>` named by the page `<h1>` through `aria-labelledby`, so it is a region a screen reader can jump to by name.",
      "Rail labels stay in the DOM at 3rem and are clipped rather than removed, so each row's accessible name is its label and the tooltip merely repeats it. Replace the rows with icon-only buttons and you lose the name entirely — a tooltip is never one.",
      "A section's `action` renders inside the element the shell promotes to a level-2 heading, so it becomes part of that heading's accessible name. Two or three words; a sentence turns every entry in the heading outline into a paragraph.",
      'Citation markers announce as their visible label — usually a bare number, which on its own says nothing about what is cited. An `unresolved` marker gets an explicit name instead, but that name is built from `typeof label === "string"`: pass a number or an element and it degrades to "Citation  — source unavailable" with the index missing.',
      "The quote in a citation's hover card is portaled and the marker sets no `aria-describedby` pointing at it, so the card opening is not announced — the quote has to be found in the reading order once it is there.",
      'The announcement strip is `aria-live="polite"` and always mounted, so an announcement arriving mid-read is announced in full. Each ✕ is named for its announcement ("Dismiss announcement: Multi-track timeline"), which is what keeps three of them apart.',
      "Nothing announces a page change. Selecting a nav row swaps the whole content column with no live region and no focus move, so a screen-reader user hears silence and has to go looking for the article they just asked for.",
    ],
    focus: [
      "Selecting a page or an area leaves focus on the nav row. The content changes underneath it, so pair `onSelectPage` with a focus move into the content region — it already carries a `tabIndex` and an accessible name, which is exactly what makes it a legitimate target.",
      "Dismissing an announcement unmounts the ✕ that was activated and focus falls to `<body>`. Move focus to the next announcement, or to the content column, from `onDismissAnnouncement`.",
      "Toggling the rail collapses it to icon width rather than unmounting it, so a focused rail row survives ⌘B — only its label clips.",
      "Nav rows, the rail toggle and the citation markers all carry explicit `focus-visible` rings. The content column does not: it is a tab stop with no focus styling at all, so tabbing into the page gives no visible indication of where focus went.",
    ],
  },
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
