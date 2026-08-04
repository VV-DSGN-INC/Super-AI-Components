"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecentGrid, type RecentGridItem } from "@/registry/super-ai/recent-grid";

/**
 * Live examples for recent-grid.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so recent-grid.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<EditedAgoOverTimestamp />`), so a
 * handler like `onOpen` never has to be serialized across the
 * server/client boundary — it's created and consumed entirely in this
 * client module.
 */

const RECENT_ITEMS: RecentGridItem[] = [
  { id: "1", title: "Q3 Launch Trailer", durationLabel: "12:04", editedAgo: "Edited 19 hours ago" },
  { id: "2", title: "Brand Explainer", durationLabel: "3:41", editedAgo: "Edited 2 days ago" },
];

export function EditedAgoOverTimestamp() {
  return <RecentGrid items={RECENT_ITEMS} layout="list" />;
}

export function FixedEmptyTile() {
  return (
    <RecentGrid
      items={[]}
      emptyTitle="No recent projects"
      emptyDescription="Projects you open or create will show up here."
      emptyAction={<Button size="sm">New project</Button>}
    />
  );
}

export function KeyboardReachableActions() {
  return (
    <RecentGrid
      items={[
        {
          id: "1",
          title: "Q3 Launch Trailer",
          durationLabel: "12:04",
          editedAgo: "Edited 19 hours ago",
          actions: (
            <Button variant="secondary" size="icon-sm" aria-label="Project actions" className="size-7">
              <MoreHorizontal />
            </Button>
          ),
        },
      ]}
    />
  );
}

/**
 * The anti-pattern: `hidden group-hover:flex` removes the actions from the
 * accessibility tree and the tab order entirely, so a keyboard or
 * switch-control user can never reach them, no matter how long they tab.
 * Contrast with the component's real implementation, which only ever
 * toggles opacity.
 */
export function HoverOnlyActionsUnreachable() {
  return (
    <div className="group/demo relative w-40">
      <div className="bg-muted aspect-video w-full rounded-lg" />
      <div className="hidden gap-1 group-hover/demo:flex absolute top-2 left-2">
        <Button variant="secondary" size="icon-sm" aria-label="Rename" className="size-7">
          <Pencil />
        </Button>
        <Button variant="secondary" size="icon-sm" aria-label="Delete" className="size-7">
          <Trash2 />
        </Button>
      </div>
      <p className="mt-2 truncate text-sm font-medium">Untitled Project</p>
    </div>
  );
}

export function BareEmptyString() {
  return (
    <div className="text-muted-foreground flex h-32 w-full items-center justify-center text-sm">
      No projects.
    </div>
  );
}
