"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RecentGrid, type RecentGridItem } from "@/registry/super-ai/recent-grid";

function Thumbnail({ from, to }: { from: string; to: string }) {
  return (
    <div
      // Decorative — the title text already carries the item's identity, so
      // the thumbnail is marked aria-hidden rather than given redundant alt text.
      aria-hidden
      className="h-full w-full"
      style={{ background: `linear-gradient(135deg, var(--color-${from}), var(--color-${to}))` }}
    />
  );
}

function ItemActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="secondary" size="icon-sm" aria-label="Project actions" className="size-7" />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Pencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ITEMS: RecentGridItem[] = [
  {
    id: "1",
    title: "Q3 Launch Trailer",
    thumbnail: <Thumbnail from="chart-1" to="chart-2" />,
    durationLabel: "12:04",
    editedAgo: "Edited 19 hours ago",
    actions: <ItemActions />,
  },
  {
    id: "2",
    title: "Brand Explainer — Draft 2",
    thumbnail: <Thumbnail from="chart-3" to="chart-4" />,
    durationLabel: "3:41",
    editedAgo: "Edited 2 days ago",
    actions: <ItemActions />,
  },
  {
    id: "3",
    title: "Onboarding Walkthrough",
    thumbnail: <Thumbnail from="chart-2" to="chart-5" />,
    editedAgo: "Edited 5 days ago",
    actions: <ItemActions />,
  },
  {
    id: "4",
    title: "Untitled Project",
    editedAgo: "Edited just now",
    actions: <ItemActions />,
  },
];

export default function RecentGridDemo() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Grid</p>
        <RecentGrid items={ITEMS} layout="grid" />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">List</p>
        <RecentGrid items={ITEMS} layout="list" />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Empty</p>
        <RecentGrid items={[]} />
      </div>
    </div>
  );
}
