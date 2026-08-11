"use client";

import * as React from "react";

import {
  DataViews,
  DataViewsSwitcher,
  type ColumnDef,
  type ViewGroup,
  type ViewMode,
} from "@/registry/super-ai/data-views";

interface Task {
  id: string;
  title: string;
  owner: string;
  bucket: "todo" | "doing" | "review" | "done";
  start: Date;
  end?: Date;
}

/* Dates are relative to a fixed anchor rather than `new Date()`, so the demo
   renders the same thing on every visit and in every screenshot. */
const ANCHOR = new Date(2026, 7, 3);
const day = (offset: number) => new Date(2026, 7, ANCHOR.getDate() + offset);

const TASKS: Task[] = [
  { id: "1", title: "Draft the migration plan", owner: "Ada", bucket: "doing", start: day(0), end: day(4) },
  { id: "2", title: "Audit the token contract", owner: "Rex", bucket: "review", start: day(2), end: day(5) },
  { id: "3", title: "Ship the switcher", owner: "Ada", bucket: "todo", start: day(6) },
  { id: "4", title: "Retire the old board", owner: "Wu", bucket: "done", start: day(1), end: day(3) },
  { id: "5", title: "Write the runbook", owner: "Wu", bucket: "doing", start: day(5), end: day(9) },
];

const GROUPS: ViewGroup<Task>[] = [
  { id: "todo", label: "To do", match: (t) => t.bucket === "todo" },
  { id: "doing", label: "In progress", tone: "info", match: (t) => t.bucket === "doing" },
  { id: "review", label: "In review", tone: "warning", match: (t) => t.bucket === "review" },
  { id: "done", label: "Done", tone: "success", match: (t) => t.bucket === "done" },
];

const COLUMNS: ColumnDef<Task>[] = [
  { id: "title", header: "Task", cell: (t) => t.title },
  { id: "owner", header: "Owner", cell: (t) => t.owner, width: "w-28" },
  { id: "bucket", header: "Status", cell: (t) => t.bucket, width: "w-28" },
];

export default function DataViewsDemo() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  /* The demo holds viewMode in component state rather than calling
     useViewMode(): the hook persists to localStorage, and a docs page that
     silently rewrites a reader's stored preference is a side effect nobody
     asked for. Real consumers wire the hook here. */
  return (
    <div className="flex h-[520px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <DataViewsSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        <p className="text-muted-foreground text-xs">
          {selectedId ? `Selected ${selectedId}` : "Nothing selected"}
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <DataViews
          items={TASKS}
          viewMode={viewMode}
          groups={GROUPS}
          columns={COLUMNS}
          selectedId={selectedId}
          onItemClick={(t) => setSelectedId(t.id)}
          renderCard={(t) => (
            <button
              type="button"
              onClick={() => setSelectedId(t.id)}
              className="bg-background hover:bg-accent focus-visible:ring-ring w-full rounded-md border p-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="block font-medium">{t.title}</span>
              <span className="text-muted-foreground block text-xs">{t.owner}</span>
            </button>
          )}
          renderRow={(t) => (
            <span className="flex items-center gap-2">
              <span className="font-medium">{t.title}</span>
              <span className="text-muted-foreground text-xs">{t.owner}</span>
            </span>
          )}
          getDateRange={(t) => ({ start: t.start, end: t.end })}
          renderChip={(t) => <span>{t.title}</span>}
        />
      </div>
    </div>
  );
}
