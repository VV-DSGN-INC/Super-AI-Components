"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecordList } from "@/registry/super-ai/record-list";

/**
 * Live examples for records-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onEnabledChange` never has to cross
 * the server/client boundary.
 *
 * These are fragments of the shell, not whole shells — four page shells stacked
 * down a documentation page would teach nothing the live preview at the top of
 * the page does not already teach.
 */

const RECORDS = [
  {
    id: "digest",
    title: "Daily briefing digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }],
    runState: "success" as const,
    lastRun: "Last run 4 min ago",
    enabled: true,
  },
  {
    id: "lead-sync",
    title: "Lead sync to CRM",
    apps: [{ name: "HubSpot" }],
    runState: "failed" as const,
    lastRun: "Last run 2 hours ago",
    enabled: true,
  },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-2xl rounded-lg border p-2">{children}</div>;
}

/** Do — J5's toggle stays in the row, one keystroke from the list. */
export function ToggleInTheRow() {
  return (
    <Frame>
      <RecordList records={RECORDS} label="Scenarios (example)" />
    </Frame>
  );
}

/**
 * Don't — the toggle demoted into a kebab menu. Turning a live automation
 * off is now two clicks and a guess, and the list no longer says which records
 * are running at all.
 */
export function ToggleBehindTheKebab() {
  return (
    <Frame>
      <ul className="divide-y text-sm">
        {RECORDS.map((record) => (
          <li key={record.id} className="flex items-center justify-between gap-2 px-2 py-3">
            <span className="flex flex-col">
              <span className="font-medium">{record.title}</span>
              <span className="text-foreground/70 text-xs">{record.lastRun}</span>
            </span>
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${record.title}`}>
              <MoreHorizontal />
            </Button>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** Do — run status lives in the subtitle: an icon shape, a word, and a time. */
export function RunStatusInTheSubtitle() {
  return (
    <Frame>
      <RecordList
        records={[
          {
            id: "lead-sync",
            title: "Lead sync to CRM",
            apps: [{ name: "HubSpot" }],
            runState: "failed",
            lastRun: "Last run 2 hours ago",
            meta: ["Revenue ops"],
            enabled: true,
          },
        ]}
        label="Scenarios (example)"
      />
    </Frame>
  );
}

/**
 * Don't — status reduced to a coloured dot in its own column. Nothing says
 * what failed, when it failed, or what the colour means.
 */
export function RunStatusAsAColouredDot() {
  return (
    <Frame>
      <ul className="divide-y text-sm">
        <li className="flex items-center gap-3 px-2 py-3">
          <span aria-hidden className="bg-destructive size-2 shrink-0 rounded-full" />
          <span className="flex-1 font-medium">Lead sync to CRM</span>
          <span className="text-foreground/70 text-xs">Revenue ops</span>
        </li>
      </ul>
    </Frame>
  );
}
