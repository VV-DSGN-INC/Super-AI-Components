"use client";

import { Pin, RotateCw, Undo2, X } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableView, type ColumnDef } from "@/registry/super-ai/data-views";
import {
  ViewFrame,
  ViewFrameAction,
  ViewFrameActions,
  ViewFrameContent,
  ViewFrameDescription,
  ViewFrameFoot,
  ViewFrameFooter,
  ViewFrameHeader,
  ViewFrameTitle,
} from "@/registry/super-ai/view-frame";

const RUNS = [
  {
    when: "Tue 02:14",
    project: "Onboarding video",
    prompt: "Scene 3: dashboard tour, slow pan",
    model: "Video HD",
    reason: "Timed out",
    credits: 40,
  },
  {
    when: "Tue 02:31",
    project: "Onboarding video",
    prompt: "Scene 4: settings walkthrough",
    model: "Video HD",
    reason: "Timed out",
    credits: 40,
  },
  {
    when: "Mon 23:05",
    project: "Spring campaign",
    prompt: "Poster variant B, crowd at night",
    model: "Image XL",
    reason: "Content filter",
    credits: 4,
  },
];

/** data-views' table draws a plain table with no scroller of its own, so the
 *  frame's content part stays the one scroll region. */
const RUN_COLUMNS: ColumnDef<(typeof RUNS)[number] & { id: string }>[] = [
  { id: "when", header: "When", cell: (r) => r.when },
  { id: "project", header: "Project", cell: (r) => r.project },
  { id: "prompt", header: "Prompt", cell: (r) => r.prompt },
  { id: "model", header: "Model", cell: (r) => r.model },
  { id: "reason", header: "Reason", cell: (r) => r.reason },
  { id: "credits", header: "Credits", cell: (r) => r.credits, align: "right" },
];

export default function ViewFrameDemo() {
  const [mode, setMode] = React.useState<"table" | "board">("table");
  const [rerunning, setRerunning] = React.useState(false);

  React.useEffect(() => {
    if (!rerunning) return;
    const id = window.setTimeout(() => setRerunning(false), 1200);
    return () => window.clearTimeout(id);
  }, [rerunning]);

  return (
    <div className="h-[28rem] w-full max-w-3xl">
      <ViewFrame title="Failed runs this week">
        <ViewFrameHeader>
          <ViewFrameTitle>Failed runs this week</ViewFrameTitle>
          <ViewFrameDescription>All projects · updated just now</ViewFrameDescription>
          <ViewFrameActions>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "table" | "board")}>
              <TabsList variant="line">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <ViewFrameAction label="Undo" disabled>
              <Undo2 />
            </ViewFrameAction>
            <ViewFrameAction label="Rerun" onClick={() => setRerunning(true)}>
              <RotateCw />
            </ViewFrameAction>
            <ViewFrameAction label="Pin">
              <Pin />
            </ViewFrameAction>
            <ViewFrameAction label="Close">
              <X />
            </ViewFrameAction>
          </ViewFrameActions>
        </ViewFrameHeader>
        <ViewFrameContent aria-busy={rerunning}>
          {rerunning ? (
            <div role="status" aria-label="Rerunning the view" className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : mode === "table" ? (
            <TableView
              items={RUNS.map((r) => ({ ...r, id: r.when }))}
              columns={RUN_COLUMNS}
              className="h-auto overflow-visible"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {["Timed out", "Content filter"].map((reason) => (
                <section key={reason} aria-label={reason} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">{reason}</h3>
                  {RUNS.filter((r) => r.reason === reason).map((r) => (
                    <div key={r.when} className="rounded-lg border p-3">
                      <p>{r.prompt}</p>
                      <p className="text-muted-foreground">
                        {r.project} · {r.when} · {r.credits} credits
                      </p>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </ViewFrameContent>
        <ViewFrameFoot>
          <Input aria-label="Ask about this view" placeholder="Ask about this view" />
        </ViewFrameFoot>
        <ViewFrameFooter origin="Made in chat: Track failed runs" version="v2 · board" />
      </ViewFrame>
    </div>
  );
}
