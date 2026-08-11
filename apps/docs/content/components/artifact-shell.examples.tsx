"use client";

import { FileText } from "lucide-react";

import { ArtifactGrid } from "@/registry/super-ai/artifact-grid";
import { DateSection } from "@/registry/super-ai/date-section";
import { FilterBar, FilterChip } from "@/registry/super-ai/filter-bar";

/**
 * Live examples for artifact-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs` and the
 * rest straight off the exported object, so the docs module has to stay plain
 * server-evaluable data. Every example here is a zero-prop component, so a
 * handler never has to cross the server/client boundary.
 *
 * These are fragments of the shell, not whole shells: four full page shells
 * stacked down a documentation page would teach nothing the live preview at the
 * top of the page does not already teach.
 */

const SESSION = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private" as const,
      },
    ],
  },
];

/** Two types, so J4's own facet row actually renders in the anti-example. */
const MIXED_SESSION = [
  {
    ...SESSION[0],
    items: [
      ...SESSION[0].items,
      {
        id: "a2",
        excerpt: "const TONE = ['reassuring', 'plain', 'unhurried']",
        type: "code",
        editedAgo: "Edited 9 minutes ago",
        visibility: "shared" as const,
      },
    ],
  },
];

const ONE_COLUMN = "[&_[data-slot=artifact-grid-items]]:grid-cols-1";

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-lg flex-col gap-3 rounded-lg border p-4">{children}</div>;
}

/** Do — the first lines identify the artifact, because the title cannot be trusted to. */
export function ExcerptIdentifiesTheArtifact() {
  return (
    <Frame>
      <ArtifactGrid sessions={SESSION} filterable={false} className={ONE_COLUMN} />
    </Frame>
  );
}

/**
 * Anti-example — a thumbnail above a generated title. The picture is a
 * file-type glyph carrying no information, and the title is the least reliable
 * field on the card.
 */
export function ThumbnailHidesTheArtifact() {
  return (
    <Frame>
      <div className="bg-card flex flex-col gap-3 rounded-lg border p-3">
        <div className="bg-secondary flex h-24 items-center justify-center rounded-md">
          <FileText aria-hidden className="text-secondary-foreground size-8" />
        </div>
        <p className="truncate text-sm font-medium">Untitled document (3)</p>
        <p className="text-muted-foreground text-xs">Edited 4 minutes ago</p>
      </div>
    </Frame>
  );
}

/** Do — recency on the outside, the originating session on the inside. */
export function BucketsHoldSessions() {
  return (
    <Frame>
      <DateSection label="Today" className="space-y-3">
        <ArtifactGrid sessions={SESSION} filterable={false} className={ONE_COLUMN} />
      </DateSection>
    </Frame>
  );
}

/**
 * Anti-example — one facet row in the header and a second one over the cards.
 * Two pieces of state for one index is how a badge and its facet start
 * disagreeing.
 */
export function TwoFacetRowsOverOneIndex() {
  return (
    <Frame>
      <FilterBar role="group" aria-label="Filter artifacts by type (anti-example)" className="gap-1.5">
        <FilterChip active>All</FilterChip>
        <FilterChip>Markdown</FilterChip>
        <FilterChip>Code</FilterChip>
      </FilterBar>
      <ArtifactGrid sessions={MIXED_SESSION} className={ONE_COLUMN} />
    </Frame>
  );
}
