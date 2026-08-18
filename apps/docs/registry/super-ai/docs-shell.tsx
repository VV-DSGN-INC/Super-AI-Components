"use client";

import * as React from "react";

import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { CitationRef, type CitationState } from "@/registry/super-ai/citation-ref";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { Kbd, KbdGroup } from "@/registry/super-ai/kbd";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { SidebarNav, type SidebarNavItemData, type SidebarNavSection } from "@/registry/super-ai/sidebar-nav";

/**
 * Docs Shell — documentation
 *
 * Spec: docs/design-system/block-specs.md#o11-docs-shell
 * Regions: icon-rail · doc-nav · announcement-strip · content-column
 *
 * The shell owns arrangement and nothing else. Three sentences from the spec
 * drive every decision in this file:
 *
 * 1. "Sectioned nav with a persistent icon rail. The rail switches product
 *    area; the nav switches page within it." Those are two different jobs and
 *    the API keeps them apart — `areas`/`activeAreaId`/`onSelectArea` move you
 *    between products, `navSections`/`activePageId`/`onSelectPage` move you
 *    between pages of the product you are already in. They are also two
 *    separately-named `nav` landmarks ("Product areas" and "Pages"), so the
 *    distinction survives into the accessibility tree. Collapsing them into one
 *    navigation concept is the failure this block exists to prevent.
 * 2. "The announcement strip is L3 in its dismissible-chip form, pinned above
 *    the content." So it is a sibling *above* the content column rather than a
 *    banner over the whole page, and the level is fixed — a docs shell has no
 *    business opening a modal over the page you navigated to.
 * 3. "The content column is measured for reading, not stretched to viewport
 *    width — the one place a max-width is non-negotiable." See
 *    `CONTENT_MEASURE`. The scroll container fills the pane; the article inside
 *    it does not.
 *
 * B1 is composed in its **icon-rail** configuration, not its full sidebar form:
 * `collapsible="icon"` plus a `SidebarProvider` that starts closed is exactly
 * B1's declared `icon-rail` state, so the rail is 3rem of product areas and the
 * page-level nav is a separate column beside it.
 */

/**
 * `contain: layout` makes this element the containing block for its
 * absolutely- and fixed-positioned descendants. The vendored `Sidebar`'s
 * desktop container is `fixed inset-y-0 h-svh`, which is right when a shell
 * owns the whole viewport and wrong everywhere else — in a docs preview or a
 * Storybook canvas it would escape its parent and pin itself to the browser's
 * left edge. Same fix, and the same trade-off, as `chat-shell`.
 */
const EMBEDDABLE_SHELL = "[contain:layout]";

/**
 * The other half of `EMBEDDABLE_SHELL`. Containment redirects where the
 * vendored sidebar's `fixed` box is anchored, but its `h-svh` still takes its
 * height from the viewport — so in any shell shorter than the window the
 * sidebar overhangs and everything it bottom-anchors (`railFooter`, this
 * shell's name for the slot) falls below the visible edge. Clipped, not
 * hidden: the control stayed in the tab order while being invisible.
 *
 * Targets `[data-slot=app-sidebar]`, not the vendored `sidebar-container`
 * default named at `components/ui/sidebar.tsx:230`: B1 renders
 * `<Sidebar data-slot="app-sidebar" ...>`, and `Sidebar` spreads that prop
 * onto the very div that also carries its own `data-slot="sidebar-container"`
 * — the spread lands after the default, so `app-sidebar` is what's actually
 * on the element at runtime. Verified in the browser (rendered `data-slot`
 * inspected directly): the vendored name never appears once B1 is in use.
 *
 * Overriding here rather than in the primitive: `components/ui` is vendored
 * and stays byte-identical to upstream.
 */
const SIDEBAR_FILLS_SHELL = "[&_[data-slot=app-sidebar]]:h-full";

/**
 * The non-negotiable measure. `68ch` is roughly 75–80 characters at the body
 * size, which is the line length long-form documentation is actually readable
 * at. It lives on the article, never on the scroll container: the column still
 * fills the pane, so the scrollbar sits at the pane edge where it belongs.
 */
const CONTENT_MEASURE = "mx-auto w-full max-w-[68ch]";

/**
 * The strip is a tinted band, and `bg-muted` is one of the three surfaces that
 * `text-muted-foreground` fails 4.5:1 against (4.34:1 — see
 * docs/design-system/a11y-baseline.md). Rebinding the variable, rather than
 * restyling slots, is the fix that actually reaches composed children: L3's
 * chip carries its own `text-muted-foreground` on its description and its ✕,
 * and no `className` this shell passes can reach either of them.
 *
 * In L3's case the chip also paints its own opaque `bg-card`, so its muted text
 * never lands on this band directly. The rebind stays anyway — it is what makes
 * the strip safe for anything else a consumer drops into it.
 */
const ANNOUNCEMENT_STRIP_SURFACE =
  "bg-muted [--muted-foreground:var(--accent-foreground)] flex flex-wrap items-center gap-2 border-b px-4 py-2";

/** A product area. Switching one of these switches which nav you are looking at. */
interface DocsShellArea {
  id: string;
  /**
   * The visible label. At icon-rail width the vendored sidebar clips it rather
   * than removing it, so it is still the row's accessible name — a tooltip is
   * never the only source of one.
   */
  label: string;
  /** Leading glyph. Decorative; `label` carries the name. */
  icon?: React.ReactNode;
}

/** A K6 marker attached to a section — where that section's claims came from. */
interface DocsShellCitation {
  id: string;
  label: React.ReactNode;
  source?: React.ReactNode;
  quote?: React.ReactNode;
  state?: CitationState;
  onJumpToSource?: () => void;
}

interface DocsShellSection {
  id: string;
  /** Rendered through A12, which the shell promotes to a level-2 heading. */
  title: string;
  body?: React.ReactNode;
  /**
   * A12's action slot — a deep link, a "copy anchor", an edit-on-GitHub link.
   * It sits inside the heading, so it contributes to the heading's accessible
   * name; keep it to two or three words.
   */
  action?: React.ReactNode;
  /** K6 citations, rendered as a labelled run under the section body. */
  citations?: DocsShellCitation[];
}

interface DocsShellAnnouncement {
  /** L3's id: what `onDismissAnnouncement` reports, so the host can store it. */
  id: string;
  title: string;
  description?: React.ReactNode;
  /** "New", "Beta", "Preview", or a version string. Always a word, never a dot. */
  stage?: string;
  ctaLabel?: React.ReactNode;
  onCtaClick?: () => void;
  /** Already dismissed. L3 is controlled about this and so is the strip. */
  dismissed?: boolean;
}

interface DocsShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  // ---- icon rail: switches product area -----------------------------------
  /** The products this documentation covers. Empty leaves the rail an empty column. */
  areas?: DocsShellArea[];
  activeAreaId?: string;
  onSelectArea?: (id: string) => void;
  /** Names the rail's own nav landmark, and labels the doc-nav toggle row. */
  railLabel?: string;
  /** B1's switcher slot — a product mark or logo. Collapses to 3rem with the rail. */
  railBrand?: React.ReactNode;
  /** B1's footer slot — account menu, theme toggle. */
  railFooter?: React.ReactNode;
  /** The keycaps shown beside the rail toggle. The vendored sidebar really does bind this. */
  railShortcut?: string[];
  /** Starts the rail expanded to full width instead of at icon width. */
  defaultRailExpanded?: boolean;

  // ---- doc nav: switches page within the area ------------------------------
  /** B3 sections — the pages of the active area, grouped. Empty renders L1. */
  navSections?: SidebarNavSection[];
  /** B3's pinned rows, above every section. "Get started", "Changelog". */
  navPinned?: SidebarNavItemData[];
  activePageId?: string;
  onSelectPage?: (id: string) => void;
  /** Names the nav's own landmark. Distinct from `railLabel` on purpose. */
  navLabel?: string;
  /** Replaces the default L1 shown when the active area has no pages. */
  navEmpty?: React.ReactNode;

  // ---- announcement strip --------------------------------------------------
  /** L3 in dismissible-chip form. Always mounted; collapses to nothing when empty. */
  announcements?: DocsShellAnnouncement[];
  /** Receives the announcement id. Without it the ✕ is inert — L3 never stores. */
  onDismissAnnouncement?: (id: string) => void;

  // ---- content column ------------------------------------------------------
  /** The page title. Also names the content region. */
  title?: string;
  /** The standfirst under the title. */
  lede?: React.ReactNode;
  /** The page body, as A12-headed sections. Empty and childless renders L1. */
  sections?: DocsShellSection[];
  /** Replaces the default L1 shown when the page has no content. */
  contentEmpty?: React.ReactNode;
  /** Arbitrary body content, rendered after `sections` inside the measure. */
  children?: React.ReactNode;
}

/**
 * The rail's rows. The vendored `SidebarMenuButton` is what B1 is built to hold
 * — it brings the icon-width collapse, the active treatment and the tooltip
 * that appears only while collapsed. The label stays in the DOM at every width,
 * so the tooltip is a convenience rather than the row's accessible name.
 */
function DocsShellAreaRow({
  area,
  active,
  onSelect,
}: {
  area: DocsShellArea;
  active: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={area.label}
        data-area-id={area.id}
        // Not colour alone: the rail's active row is a filled surface *and* a
        // programmatic current-page state.
        aria-current={active ? "page" : undefined}
        onClick={() => onSelect?.(area.id)}
      >
        {area.icon}
        <span>{area.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DocsShellSectionBlock({ section }: { section: DocsShellSection }) {
  return (
    <section data-slot="docs-shell-section" data-section-id={section.id} className="flex flex-col gap-3">
      {/* A12 is the group title everywhere else in this registry; a docs page
          needs it to be a real heading as well, so the shell promotes it rather
          than rendering a second title element beside it. `action` sits inside
          the heading and contributes to its name — documented on the prop. */}
      <SectionHeader
        role="heading"
        aria-level={2}
        title={section.title}
        action={section.action}
        className="border-b"
      />
      {section.body ? (
        <div data-slot="docs-shell-section-body" className="text-sm leading-relaxed">
          {section.body}
        </div>
      ) : null}
      {section.citations && section.citations.length > 0 ? (
        // K6 markers are superscript by design, so they need a word in front of
        // them: a bare run of numbers at the end of a section reads as nothing.
        <p data-slot="docs-shell-sources" className="text-foreground text-xs">
          <span className="mr-1 font-medium">Sources</span>
          {section.citations.map((citation) => (
            <CitationRef
              key={citation.id}
              label={citation.label}
              source={citation.source}
              quote={citation.quote}
              state={citation.state}
              onJumpToSource={citation.onJumpToSource}
            />
          ))}
        </p>
      ) : null}
    </section>
  );
}

function DocsShell({
  areas = [],
  activeAreaId,
  onSelectArea,
  railLabel = "Product areas",
  railBrand,
  railFooter,
  railShortcut = ["⌘", "B"],
  defaultRailExpanded = false,

  navSections = [],
  navPinned,
  activePageId,
  onSelectPage,
  navLabel = "Pages",
  navEmpty,

  announcements = [],
  onDismissAnnouncement,

  title = "Documentation",
  lede,
  sections = [],
  contentEmpty,
  children,

  className,
  ...props
}: DocsShellProps) {
  const titleId = React.useId();
  const hasNav = navSections.length > 0 || (navPinned?.length ?? 0) > 0;
  const hasContent = sections.length > 0 || children != null;
  const liveAnnouncements = announcements.filter((announcement) => !announcement.dismissed);

  return (
    <SidebarProvider
      // Overriding a vendored ui/ primitive's slot is house idiom — nothing
      // keys on `sidebar-wrapper`, and the block needs one addressable root.
      data-slot="docs-shell"
      // Closed is B1's `icon-rail` state. The rail is a persistent 3rem column
      // of product areas, not a drawer that happens to be shut.
      defaultOpen={defaultRailExpanded}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      {/* display:contents — the region marker has to be addressable without
          inserting a box between the flex row and B1's own gap/container pair,
          which is what positions the rail. */}
      <div data-region="icon-rail" className="contents">
        <AppSidebar
          collapsible="icon"
          switcher={railBrand}
          footer={railFooter}
          nav={
            // B1 supplies no landmark of its own, so the rail names itself. Two
            // navs with two names is what keeps "switch product" and "switch
            // page" apart for a screen-reader user as well as a sighted one.
            <TooltipProvider>
              <nav aria-label={railLabel} data-slot="docs-shell-areas" className="p-2">
                <SidebarMenu>
                  {areas.map((area) => (
                    <DocsShellAreaRow
                      key={area.id}
                      area={area}
                      active={area.id === activeAreaId}
                      onSelect={onSelectArea}
                    />
                  ))}
                </SidebarMenu>
              </nav>
            </TooltipProvider>
          }
        />
      </div>

      <SidebarInset className="min-w-0 flex-col overflow-hidden md:flex-row">
        {/* Plain wrapper, not an <aside>: B3 renders its own <nav>, and the
            region marker must not add a competing landmark around it. */}
        <div
          data-region="doc-nav"
          className="bg-background max-h-56 shrink-0 overflow-y-auto border-b md:max-h-none md:w-64 md:border-r md:border-b-0"
        >
          {/* The one hand-written affordance in this file. The vendored
              SidebarProvider really does bind ⌘B to the rail, and nothing in
              B1 or B3 has a slot to say so — a shortcut nobody can discover is
              a shortcut nobody uses. The trigger carries its own sr-only name,
              so the keycaps are a hint rather than the control. */}
          <div data-slot="docs-shell-nav-header" className="flex items-center gap-2 border-b px-2 py-2">
            <SidebarTrigger />
            <span className="truncate text-sm font-medium">{railLabel}</span>
            <KbdGroup className="ml-auto">
              {railShortcut.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </KbdGroup>
          </div>

          <div className="p-2">
            {hasNav ? (
              <SidebarNav
                aria-label={navLabel}
                sections={navSections}
                pinned={navPinned}
                activeId={activePageId}
                onSelect={onSelectPage}
              />
            ) : (
              (navEmpty ?? (
                <EmptyState
                  size="panel"
                  title="No pages here yet"
                  description="This area has no documentation published."
                />
              ))
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Always mounted, so it is part of the page rather than something
              that appears from nowhere. aria-live because an announcement that
              arrives while you are reading is a state change. */}
          <div
            data-region="announcement-strip"
            aria-live="polite"
            className={cn("shrink-0", liveAnnouncements.length > 0 && ANNOUNCEMENT_STRIP_SURFACE)}
          >
            {liveAnnouncements.map((announcement) => (
              <FeatureAnnouncement
                key={announcement.id}
                // Fixed at the quietest level: the spec says the strip is L3's
                // dismissible-chip form, and a docs page you deliberately
                // navigated to is the wrong moment to interrupt.
                level="dismissible-chip"
                id={announcement.id}
                title={announcement.title}
                description={announcement.description}
                stage={announcement.stage}
                ctaLabel={announcement.ctaLabel}
                onCtaClick={announcement.onCtaClick}
                onDismiss={(id) => onDismissAnnouncement?.(id)}
                // L3's chip is `w-fit max-w-md`, and its truncating children
                // have the usual flex `min-width: auto`, so at 375px it can
                // push the page into horizontal scroll. Capped to the strip
                // below the `sm` breakpoint, left at L3's own width above it.
                className="max-w-full sm:max-w-md"
              />
            ))}
          </div>

          {/* The scroll container is the region: it carries the name and the
              tab stop, or a keyboard user cannot reach the page they navigated
              to (axe `scrollable-region-focusable`). The measure lives on the
              article inside it. */}
          <section
            data-region="content-column"
            aria-labelledby={titleId}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto px-6 py-8"
          >
            <article data-slot="docs-shell-article" className={cn(CONTENT_MEASURE, "flex flex-col gap-8")}>
              <header className="flex flex-col gap-2">
                <h1
                  id={titleId}
                  data-slot="docs-shell-title"
                  className="text-2xl font-semibold tracking-tight"
                >
                  {title}
                </h1>
                {lede ? (
                  <p data-slot="docs-shell-lede" className="text-muted-foreground leading-relaxed">
                    {lede}
                  </p>
                ) : null}
              </header>

              {hasContent ? (
                <>
                  {sections.map((section) => (
                    <DocsShellSectionBlock key={section.id} section={section} />
                  ))}
                  {children}
                </>
              ) : (
                (contentEmpty ?? (
                  <EmptyState
                    size="page"
                    title="Nothing written here yet"
                    description="Pick a page from the navigation, or start this one."
                  />
                ))
              )}
            </article>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { DocsShell };
export type { DocsShellAnnouncement, DocsShellArea, DocsShellCitation, DocsShellProps, DocsShellSection };
