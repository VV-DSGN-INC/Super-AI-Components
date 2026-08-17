"use client";

import { useState } from "react";

import {
  DataViewsSwitcher,
  FeedView,
  GROUP_TONE_SURFACE,
  KanbanView,
  type GroupTone,
  type ViewGroup,
  type ViewMode,
} from "@/registry/super-ai/data-views";

/**
 * Live examples for data-views.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so
 * data-views.docs.tsx has to stay plain server-evaluable data and cannot carry
 * "use client" itself. Every view shell takes render callbacks, and a callback
 * cannot be serialized across that boundary — so the examples live here and
 * arrive there as zero-prop elements.
 *
 * These are single shells rather than whole switchers: five collection views
 * stacked down the page would teach nothing the live preview at the top of the
 * page does not already teach.
 */

interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
}

const TASKS: Task[] = [
  { id: "t1", title: "Draft the release notes", status: "doing" },
  { id: "t2", title: "Cut the 2.4 branch", status: "done" },
  { id: "t3", title: "Audit the icon set", status: "todo" },
  { id: "t4", title: "Rewrite the onboarding email", status: "todo" },
];

/** One partition, declared once. Columns, sections and lanes all read it. */
const GROUPS: ViewGroup<Task>[] = [
  { id: "todo", label: "To do", match: (task) => task.status === "todo" },
  { id: "doing", label: "In progress", tone: "info", match: (task) => task.status === "doing" },
  { id: "done", label: "Done", tone: "success", match: (task) => task.status === "done" },
];

const row = (task: Task) => <span className="text-sm">{task.title}</span>;

const card = (task: Task) => <div className="bg-background rounded-md border p-2 text-xs">{task.title}</div>;

/** Do — one `groups` array, two shells, no chance of them disagreeing. */
export function OneGroupingEveryView() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="h-40">
        <KanbanView items={TASKS} groups={GROUPS} renderCard={card} />
      </div>
      <div className="h-40">
        <FeedView items={TASKS} groups={GROUPS} renderRow={row} />
      </div>
    </div>
  );
}

/** Do — a section with no date accessor simply never offers the time views. */
export function SwitcherHidesTimeViews() {
  const [timed, setTimed] = useState<ViewMode>("kanban");
  const [untimed, setUntimed] = useState<ViewMode>("kanban");
  const UNTIMED: readonly ViewMode[] = ["list", "kanban", "table"];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-xs font-medium">With `getDateRange` and `renderChip`</span>
        <DataViewsSwitcher viewMode={timed} onViewModeChange={setTimed} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-xs font-medium">Without the pair</span>
        <DataViewsSwitcher viewMode={untimed} onViewModeChange={setUntimed} views={UNTIMED} />
      </div>
    </div>
  );
}

/** Don't — two groupings for one collection, so the board and the feed disagree. */
export function PerViewGroupings() {
  // The board groups by status; the feed groups by something subtly different,
  // and "Done" now holds a different number of items depending on which view
  // you happen to be looking at.
  const FEED_GROUPS: ViewGroup<Task>[] = [
    { id: "open", label: "To do", match: (task) => task.status !== "done" },
    { id: "done", label: "Done", match: (task) => task.status === "done" },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="h-40">
        <KanbanView items={TASKS} groups={GROUPS} renderCard={card} />
      </div>
      <div className="h-40">
        <FeedView items={TASKS} groups={FEED_GROUPS} renderRow={row} />
      </div>
    </div>
  );
}

/** Don't — tone read as colour. Three of the four surfaces are the same fill. */
export function ToneColourAloneIsNotADistinction() {
  const TONES: GroupTone[] = ["neutral", "info", "success", "warning"];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <span key={tone} className={`${GROUP_TONE_SURFACE[tone]} rounded px-2 py-1 text-xs`}>
            {tone}
          </span>
        ))}
      </div>
      <p className="text-foreground text-sm">
        Stripped of their marks, `neutral`, `info` and `success` are one fill. The mark is the distinction,
        not the hue.
      </p>
    </div>
  );
}
