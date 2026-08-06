"use client";

import { Eye, Globe, Lock, Users } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Artifact Grid — Document/artifact cards grouped by session
 *
 * Spec: docs/design-system/component-specs.md#j4-artifact-grid
 * States: type-badge · excerpt · edited-ago · view-count · privacy-icon
 *
 * Deliberately NOT a preview-tile (A8) consumer. A8 exists to fix a media
 * frame around a thumbnail; here the excerpt *is* the content, so a thumbnail
 * frame would be an empty box above the only field anyone reads. If a future
 * change makes these cards look "inconsistent with the other grids", that
 * inconsistency is the point — this is a text card, per the spec.
 */

type ArtifactVisibility = "private" | "shared" | "public";

const VISIBILITY: Record<ArtifactVisibility, { Icon: typeof Lock; label: string }> = {
  // Each visibility gets a distinct icon *shape* and a distinct visible word.
  // Never colour alone, and never an icon with no accessible name — the label
  // is real text, not a tooltip and not an sr-only suffix glued onto a glyph.
  private: { Icon: Lock, label: "Private" },
  shared: { Icon: Users, label: "Shared" },
  public: { Icon: Globe, label: "Public" },
};

/**
 * Known artifact kinds get a hand-written label; anything else is derived from
 * the same `type` value the filter facet uses. Exported so a consumer rendering
 * its own chrome (a breadcrumb, a page title) can reach for the same label
 * rather than inventing a second display string that drifts from the facet.
 */
const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  code: "Code",
  html: "HTML",
  markdown: "Markdown",
  react: "React",
  svg: "SVG",
};

function artifactTypeLabel(type: string): string {
  return (
    ARTIFACT_TYPE_LABELS[type] ??
    type.replace(/[-_]+/g, " ").replace(/^\p{Ll}/u, (c) => c.toUpperCase())
  );
}

interface ArtifactGridItem {
  id: string;
  /**
   * The load-bearing field. Auto-generated artifact titles are unreliable and
   * first lines are not, so the excerpt carries the visual and semantic weight
   * of the card: it is the largest text, and it is the accessible name of the
   * card's link. It is not a subtitle under `title`.
   */
  excerpt: string;
  /**
   * One value, two renders: it labels the card *and* drives the filter facet.
   * There is deliberately no separate `typeLabel` prop — a display string the
   * caller controls independently is how a badge and its facet drift apart.
   */
  type: string;
  /** Optional and deliberately secondary — see `excerpt`. */
  title?: string;
  /** e.g. "Edited 2 hours ago". Recency, not a raw timestamp. */
  editedAgo?: string;
  viewCount?: number;
  visibility?: ArtifactVisibility;
  /** Renders the excerpt as a link. Takes precedence over `onOpen`. */
  href?: string;
  onOpen?: () => void;
}

interface ArtifactGridSession {
  id: string;
  /** "Brand audit · Tuesday", "Today", "Onboarding rewrite" — a session, not a date bucket. */
  label: string;
  /** Optional trailing link on the session header, e.g. "Open session". */
  action?: React.ReactNode;
  items: ArtifactGridItem[];
}

interface ArtifactGridProps extends React.ComponentProps<"div"> {
  sessions?: ArtifactGridSession[];
  /**
   * Render the type facet row. The row is suppressed anyway when the visible
   * artifacts share a single type — a one-facet filter is noise, not a choice.
   */
  filterable?: boolean;
  /** Controlled active facet. `null` means "All". */
  activeType?: string | null;
  defaultActiveType?: string | null;
  onActiveTypeChange?: (type: string | null) => void;
  /** Session headers become collapse triggers. State lives here, per session id. */
  collapsibleSessions?: boolean;
  filterLabel?: string;
  allLabel?: string;
  emptyLabel?: string;
}

const ALL = "__all__";

function ArtifactTypeBadge({ type }: { type: string }) {
  return (
    <Badge data-slot="artifact-grid-type" data-artifact-type={type} variant="secondary">
      {artifactTypeLabel(type)}
    </Badge>
  );
}

function ArtifactPrivacy({ visibility }: { visibility: ArtifactVisibility }) {
  const { Icon, label } = VISIBILITY[visibility];
  return (
    <span
      data-slot="artifact-grid-privacy"
      data-visibility={visibility}
      className="inline-flex items-center gap-1"
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

function ArtifactViewCount({ viewCount }: { viewCount: number }) {
  return (
    <span data-slot="artifact-grid-view-count" className="inline-flex items-center gap-1 tabular-nums">
      <Eye aria-hidden className="size-3.5" />
      {viewCount === 1 ? "1 view" : `${viewCount.toLocaleString("en-US")} views`}
    </span>
  );
}

function ArtifactCard({ item }: { item: ArtifactGridItem }) {
  const { id, excerpt, type, title, editedAgo, viewCount, visibility, href, onOpen } = item;

  // A stretched pseudo-element, not a link wrapped around the whole card. If
  // the card itself were the link, the badge, the edited-ago line, the view
  // count and the privacy word would all fuse into one run-on accessible name.
  // Here the link's name is exactly the excerpt — the load-bearing field —
  // while the whole card stays clickable.
  const stretched =
    "after:absolute after:inset-0 after:content-[''] focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none";

  return (
    <Card
      data-slot="artifact-grid-card"
      data-artifact-id={id}
      data-artifact-type={type}
      size="sm"
      className="relative h-full"
    >
      <CardHeader className="flex flex-row items-center gap-2">
        <ArtifactTypeBadge type={type} />
        {title ? (
          <span data-slot="artifact-grid-title" className="text-muted-foreground min-w-0 truncate text-xs">
            {title}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <p
          data-slot="artifact-grid-excerpt"
          className="text-foreground line-clamp-4 text-sm leading-relaxed font-medium"
        >
          {href !== undefined ? (
            <a href={href} className={stretched}>
              {excerpt}
            </a>
          ) : onOpen ? (
            <button type="button" onClick={onOpen} className={cn(stretched, "text-left")}>
              {excerpt}
            </button>
          ) : (
            excerpt
          )}
        </p>
        {editedAgo ? (
          <p data-slot="artifact-grid-edited-ago" className="text-muted-foreground truncate text-xs">
            {editedAgo}
          </p>
        ) : null}
      </CardContent>

      {visibility || viewCount !== undefined ? (
        // Privacy and reach are one thought — "who can see this, and how many
        // have" — so they share the footer rather than being split across the
        // card. text-foreground, not text-muted-foreground: CardFooter's own
        // frame is bg-muted/50, and muted-on-muted measures 4.34:1.
        <CardFooter
          data-slot="artifact-grid-footer"
          className="text-foreground justify-between gap-2 text-xs"
        >
          {visibility ? <ArtifactPrivacy visibility={visibility} /> : <span />}
          {viewCount !== undefined ? <ArtifactViewCount viewCount={viewCount} /> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function ArtifactGrid({
  sessions = [],
  filterable = true,
  activeType: activeTypeProp,
  defaultActiveType = null,
  onActiveTypeChange,
  collapsibleSessions = false,
  filterLabel = "Filter artifacts by type",
  allLabel = "All",
  emptyLabel = "No artifacts match this type.",
  className,
  ...props
}: ArtifactGridProps) {
  const [internalType, setInternalType] = React.useState<string | null>(defaultActiveType);
  const controlled = activeTypeProp !== undefined;
  const activeType = controlled ? activeTypeProp : internalType;

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const setActiveType = (next: string | null) => {
    if (!controlled) setInternalType(next);
    onActiveTypeChange?.(next);
  };

  // Facets are derived from the very same `item.type` values the badges
  // render, so a badge can never say one thing while its facet says another.
  const facets: { type: string; count: number }[] = [];
  for (const session of sessions) {
    for (const item of session.items) {
      const existing = facets.find((f) => f.type === item.type);
      if (existing) existing.count += 1;
      else facets.push({ type: item.type, count: 1 });
    }
  }

  const visibleSessions = sessions
    .map((session) => ({
      ...session,
      items: activeType === null ? session.items : session.items.filter((i) => i.type === activeType),
    }))
    .filter((session) => session.items.length > 0);

  const showFacets = filterable && facets.length > 1;

  return (
    <div data-slot="artifact-grid" className={cn("flex flex-col gap-6", className)} {...props}>
      {showFacets ? (
        <div data-slot="artifact-grid-filters">
          <ChoiceChips
            aria-label={filterLabel}
            value={activeType ?? ALL}
            onValueChange={(next) => setActiveType(next === ALL ? null : next)}
          >
            <ChoiceChip value={ALL}>{allLabel}</ChoiceChip>
            {facets.map(({ type, count }) => (
              <ChoiceChip key={type} value={type} data-artifact-type={type}>
                {artifactTypeLabel(type)}
                {/* No text-muted-foreground here: the chip turns bg-accent on
                    hover, and muted-on-accent is 4.34:1. It inherits the
                    chip's own foreground instead. */}
                <span className="ml-1.5 tabular-nums">{count}</span>
              </ChoiceChip>
            ))}
          </ChoiceChips>
        </div>
      ) : null}

      {visibleSessions.length === 0 ? (
        // role="status": filtering is what usually empties this view, and a
        // silent disappearance is indistinguishable from a broken filter.
        <p data-slot="artifact-grid-empty" role="status" className="text-muted-foreground text-sm">
          {emptyLabel}
        </p>
      ) : (
        visibleSessions.map((session) => (
          <ArtifactSession
            key={session.id}
            session={session}
            collapsible={collapsibleSessions}
            open={!collapsed[session.id]}
            onOpenChange={(open) => setCollapsed((prev) => ({ ...prev, [session.id]: !open }))}
          />
        ))
      )}
    </div>
  );
}

function ArtifactSession({
  session,
  collapsible,
  open,
  onOpenChange,
}: {
  session: ArtifactGridSession;
  collapsible: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const labelId = React.useId();
  return (
    <section
      data-slot="artifact-grid-session"
      data-session-id={session.id}
      aria-labelledby={labelId}
      className="flex flex-col gap-3"
    >
      {/* A12 section-header, not A3 date-section: a session is not a date
          bucket, and the count and the "open session" action are part of the
          header, which date-section has no slot for. Its own data-slot is left
          alone — overriding it would erase every style and test keyed to it. */}
      <SectionHeader
        title={<span id={labelId}>{session.label}</span>}
        count={session.items.length}
        action={session.action}
        collapsible={collapsible}
        open={open}
        onOpenChange={onOpenChange}
      />
      {open ? (
        <div
          data-slot="artifact-grid-items"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {session.items.map((item) => (
            <ArtifactCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export { ArtifactGrid, artifactTypeLabel };
export type { ArtifactGridItem, ArtifactGridProps, ArtifactGridSession, ArtifactVisibility };
