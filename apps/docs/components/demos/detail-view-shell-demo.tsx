"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DetailFields, DetailViewShell, type DetailChannel } from "@/registry/super-ai/detail-view-shell";
import { type DetailMode } from "@/registry/super-ai/use-view-mode";

const MODES: DetailMode[] = ["popup", "overlay", "fullscreen"];

const ATTRIBUTES = (
  <DetailFields
    fields={[
      { id: "owner", label: "Owner", value: "Ada Lovelace" },
      { id: "status", label: "Status", value: "In review" },
      { id: "due", label: "Due", value: "12 August 2026" },
      { id: "estimate", label: "Estimate", value: "3 days" },
      { id: "repo", label: "Repository", value: "weeeha/DS-WebApp-Shells" },
      { id: "branch", label: "Branch", value: "feat/arrangements-tier" },
    ]}
  />
);

const CONVERSATION: DetailChannel[] = [
  {
    id: "comments",
    label: "Comments",
    count: 2,
    content: (
      <ol className="flex flex-col gap-3 p-4 text-sm">
        <li>
          <p className="font-medium">Ada</p>
          <p className="text-muted-foreground">Split the timeline work out of this one.</p>
        </li>
        <li>
          <p className="font-medium">Rex</p>
          <p className="text-muted-foreground">Done — it is tracked separately now.</p>
        </li>
      </ol>
    ),
  },
];

export default function DetailViewShellDemo() {
  const [mode, setMode] = React.useState<DetailMode>("overlay");
  const [open, setOpen] = React.useState(false);

  /* Mode is component state rather than useDetailMode(): the hook persists to
     localStorage, and a docs page that rewrites a reader's stored preference is
     a side effect nobody asked for. Real consumers wire the hook here. */
  return (
    <div className="relative flex h-[520px] flex-col gap-3 overflow-hidden rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
            {m}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Open record"}
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        The collection stays interactive behind overlay, dimmed behind popup, and is replaced by fullscreen.
        Collapse is driven by the panel&rsquo;s own measured width, not the viewport.
      </p>

      <div className="bg-muted/40 min-h-0 flex-1 rounded-md border border-dashed p-4 text-sm">
        <p className="font-medium">The collection lives here.</p>
        <p className="text-muted-foreground">Still clickable while an overlay is open.</p>
      </div>

      <DetailViewShell
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        ariaLabel="Draft the migration plan"
        header={
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <h2 className="text-sm font-medium">Draft the migration plan</h2>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setOpen(false)}>
              Close
            </Button>
          </header>
        }
        attributes={ATTRIBUTES}
        conversation={CONVERSATION}
      />
    </div>
  );
}
