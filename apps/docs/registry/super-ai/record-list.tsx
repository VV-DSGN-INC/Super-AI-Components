"use client";

import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Record List — project / scenario rows.
 *
 * Spec: docs/design-system/component-specs.md#j5-record-list
 * States: app-icon-cluster · meta · enable-toggle · run-status · overflow-menu
 *
 * Three rules, all of them about a list of things that *run*:
 *
 * 1. "The enable toggle is the primary control and sits in the row." Not behind
 *    the overflow menu, not on a detail page — one keystroke from the list.
 * 2. "App-icon clusters communicate what a record touches faster than any
 *    title. Data, not decoration." So the cluster is a real list of app names;
 *    the marks are `aria-hidden` and the names carry the meaning. A screen
 *    reader gets the same information a glance does.
 * 3. "Last-run and draft states belong in the subtitle" — not a separate
 *    column. The run status sits there too, for the same reason: "Last run
 *    failed" is a fact about the last run, and splitting it from "4 min ago"
 *    into its own column pulls one sentence apart.
 *
 * ## Why `<tr>` is inert
 *
 * A row here holds a `Switch` *and* an overflow `DropdownMenuTrigger`. If the
 * row itself were a button — or carried a row-level `onClick` that reads as
 * one — both controls would be nested interactives, which axe fails and which
 * makes "click the row to open, but not on the toggle" a permanent source of
 * mis-clicks. So the record **title** is the interactive element (an `<a>` when
 * you pass `href`, a `<button>` when you pass `onOpen`, plain text when you
 * pass neither) and the `<tr>` stays inert.
 */

type RecordRunState = "success" | "failed" | "running" | "never";

interface RecordApp {
  /**
   * The name is the data. It is what gets announced; the mark beside it is
   * decoration and is hidden from assistive tech so the name is not read twice.
   */
  name: string;
  /** Optional mark. Falls back to the name's initials. */
  icon?: React.ReactNode;
}

interface RecordAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onSelect?: (recordId: string) => void;
}

interface RecordListItem {
  id: string;
  title: string;
  /** Makes the title a link. Takes precedence over the list's `onOpen`. */
  href?: string;
  /** What this record touches. Order is yours; it is preserved. */
  apps?: RecordApp[];
  /** Subtitle, e.g. "Last run 4 min ago". Never its own column. */
  lastRun?: React.ReactNode;
  /** Subtitle, again — an unpublished record says so beside its last run. */
  draft?: boolean;
  /** Further subtitle fragments: folder, owner, operation count. */
  meta?: React.ReactNode[];
  /** How the last run went. Rendered as an icon *and* words. */
  runState?: RecordRunState;
  /** Overrides the default wording for `runState`. */
  runLabel?: string;
  enabled?: boolean;
  /** Greys the toggle without removing it — the control stays discoverable. */
  toggleDisabled?: boolean;
  actions?: RecordAction[];
}

interface RecordListProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  records: RecordListItem[];
  /** Fired by the in-row toggle. The primary control of the whole component. */
  onEnabledChange?: (id: string, enabled: boolean) => void;
  /** Makes each title a button. Ignored for a record that supplies `href`. */
  onOpen?: (id: string) => void;
  /** Marks shown before the cluster collapses. Collapsed names stay announced. */
  maxApps?: number;
  /** Accessible name for the table. */
  label?: string;
}

const RUN_STATE_TEXT: Record<RecordRunState, string> = {
  success: "Last run OK",
  failed: "Last run failed",
  running: "Running",
  never: "Never run",
};

/**
 * Icon shape carries the state as well as the colour, and the words carry it a
 * third time. The colour is on the icon only: `text-destructive` measures
 * 4.0:1, which is fine for a graphic and not fine for a label.
 */
const RUN_STATE_ICON: Record<RecordRunState, React.ReactNode> = {
  success: <CheckCircle2 aria-hidden className="text-primary size-3.5" />,
  failed: <AlertTriangle aria-hidden className="text-destructive size-3.5" />,
  running: <Loader2 aria-hidden className="size-3.5 animate-spin" />,
  never: <CircleDashed aria-hidden className="size-3.5" />,
};

/** "Google Sheets" → "GS". Two letters is all a 24px mark can hold. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The cluster. Each entry is a hidden mark plus a readable name, never both
 * visible — an sr-only suffix beside visible text fuses into one word in the
 * accessible name ("GSGoogle Sheets"), so the visual half is hidden outright.
 */
function AppCluster({ apps, max, recordTitle }: { apps: RecordApp[]; max: number; recordTitle: string }) {
  if (apps.length === 0) {
    return (
      <span data-slot="record-list-apps-empty" className="text-foreground text-sm">
        <span aria-hidden>—</span>
        <span className="sr-only">No apps</span>
      </span>
    );
  }

  const shown = apps.slice(0, max);
  const collapsed = apps.slice(max);

  return (
    <ul
      data-slot="record-list-apps"
      aria-label={`Apps in ${recordTitle}`}
      className="flex items-center -space-x-1.5"
    >
      {shown.map((app) => (
        <li
          key={app.name}
          data-slot="record-list-app"
          className="bg-background ring-background relative rounded-full ring-2"
        >
          <span
            aria-hidden
            className="bg-muted text-foreground flex size-6 items-center justify-center rounded-full border text-[0.625rem] font-medium"
          >
            {app.icon ?? initials(app.name)}
          </span>
          {/* The name is the point of the cluster. */}
          <span className="sr-only">{app.name}</span>
        </li>
      ))}
      {collapsed.length > 0 ? (
        <li
          data-slot="record-list-app-overflow"
          className="bg-background ring-background relative rounded-full ring-2"
        >
          <span
            aria-hidden
            className="bg-muted text-foreground flex size-6 items-center justify-center rounded-full border text-[0.625rem] font-medium"
          >
            {`+${collapsed.length}`}
          </span>
          {/* Collapsing is a layout decision, so it must not cost the names. */}
          <span className="sr-only">{collapsed.map((app) => app.name).join(", ")}</span>
        </li>
      ) : null}
    </ul>
  );
}

function RecordList({
  records,
  onEnabledChange,
  onOpen,
  maxApps = 4,
  label = "Records",
  className,
  ...props
}: RecordListProps) {
  return (
    <div data-slot="record-list" className={cn("w-full", className)} {...props}>
      <Table>
        <TableCaption className="sr-only">{label}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Record</TableHead>
            <TableHead>Apps</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const runState = record.runState;
            const fragments = [
              record.draft ? "Draft" : undefined,
              record.lastRun,
              ...(record.meta ?? []),
            ].filter((fragment) => fragment !== undefined && fragment !== null && fragment !== "");

            // The title is the row's only navigational control, so the <tr>
            // never has to become one. See the file header.
            const titleClassName = "truncate text-sm font-medium text-foreground";
            const titleNode = record.href ? (
              <a
                data-slot="record-list-title"
                href={record.href}
                className={cn(titleClassName, "focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none")}
              >
                {record.title}
              </a>
            ) : onOpen ? (
              <button
                data-slot="record-list-title"
                type="button"
                onClick={() => onOpen(record.id)}
                className={cn(titleClassName, "focus-visible:ring-ring rounded-sm text-left hover:underline focus-visible:ring-2 focus-visible:outline-none")}
              >
                {record.title}
              </button>
            ) : (
              <span data-slot="record-list-title" className={titleClassName}>
                {record.title}
              </span>
            );

            return (
              <TableRow
                key={record.id}
                data-slot="record-list-row"
                data-record-id={record.id}
                data-enabled={record.enabled ? "" : undefined}
                data-run-state={runState}
              >
                <TableCell data-slot="record-list-record" className="max-w-xs">
                  <div className="flex flex-col gap-0.5">
                    {titleNode}
                    {runState || fragments.length > 0 ? (
                      <span
                        data-slot="record-list-subtitle"
                        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
                      >
                        {runState ? (
                          <span
                            data-slot="record-list-run-status"
                            className="text-foreground flex items-center gap-1"
                          >
                            {RUN_STATE_ICON[runState]}
                            {record.runLabel ?? RUN_STATE_TEXT[runState]}
                          </span>
                        ) : null}
                        {fragments.map((fragment, i) => (
                          // Subtitle text is a foreground tint, never
                          // `text-muted-foreground`: the row's hover background
                          // is `bg-muted/50`, and muted text on a muted surface
                          // measures 4.34:1 against a 4.5 minimum.
                          <span
                            key={i}
                            data-slot="record-list-meta"
                            className="text-foreground/70 flex items-center gap-1.5"
                          >
                            {runState || i > 0 ? <span aria-hidden>·</span> : null}
                            {fragment}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell data-slot="record-list-apps-cell">
                  <AppCluster
                    apps={record.apps ?? []}
                    max={maxApps}
                    recordTitle={record.title}
                  />
                </TableCell>

                <TableCell>
                  {/* The primary control, in the row. Its name says which
                      record it enables — a column of bare "Enable" switches is
                      unusable the moment you cannot see the column. */}
                  <Switch
                    data-slot="record-list-toggle"
                    aria-label={`Enable ${record.title}`}
                    checked={record.enabled ?? false}
                    disabled={record.toggleDisabled}
                    onCheckedChange={(checked) => onEnabledChange?.(record.id, checked)}
                  />
                </TableCell>

                <TableCell>
                  <div data-slot="record-list-overflow" className="flex justify-end">
                    {record.actions && record.actions.length > 0 ? (
                      <DropdownMenu>
                        {/* Base UI adaptation: DropdownMenuTrigger takes
                            `render=`, not `asChild`. It stamps its own
                            data-slot onto whatever it renders, so the slot for
                            this control lives on the cell wrapper. */}
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`More actions for ${record.title}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {record.actions.map((action) => (
                            // Base UI adaptation: MenuItem uses onClick, not onSelect.
                            <DropdownMenuItem
                              key={action.id}
                              variant={action.destructive ? "destructive" : "default"}
                              onClick={() => action.onSelect?.(record.id)}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { RecordList };
export type { RecordAction, RecordApp, RecordListItem, RecordListProps, RecordRunState };
