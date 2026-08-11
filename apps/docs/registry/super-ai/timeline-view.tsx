"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  GROUP_TONE_LABEL,
  GROUP_TONE_MARK,
  GROUP_TONE_SURFACE,
  UnplacedNotice,
  addDays,
  dayLabel,
  normalizeRange,
  packRows,
  startOfLocalDay,
  textOf,
  withTone,
} from "@/registry/super-ai/data-views-shared";
import type { TimelineViewProps, TimelineZoom, ViewItem } from "@/registry/super-ai/data-views-shared";

/* ─────────────────────────────────────────────────────────────────────────────
   TimelineView — the collection laid out against a horizontal time axis.

   Groups become lanes. That is the same partition the board renders as columns,
   rotated 90 degrees, which is why this view needs no grouping concept of its
   own: a section that already declared groups for its board gets swimlanes for
   free.

   Read-only by design. Drag-to-reschedule needs mutations, optimistic update,
   and conflict handling — that is a feature, not a view, and it is out of scope.

   Zoom is component state, deliberately unpersisted: it is a reading posture,
   not a preference, and persisting it would add a third axis this shell has not
   argued for.
   ─────────────────────────────────────────────────────────────────────────── */

const ZOOM: Record<TimelineZoom, { label: string; days: number; columnPx: number; tickEvery: number }> = {
  week: { label: "Week", days: 14, columnPx: 48, tickEvery: 1 },
  month: { label: "Month", days: 42, columnPx: 24, tickEvery: 7 },
  quarter: { label: "Quarter", days: 120, columnPx: 10, tickEvery: 30 },
};

const ZOOM_VALUES: readonly TimelineZoom[] = ["week", "month", "quarter"];
const ROW_HEIGHT = 28;
const MILESTONE_PX = 12;
/** Fixed gutter holding each lane's label, kept clear of the bar track. */
const LANE_LABEL_PX = 112;

/**
 * Whole days between two local midnights.
 *
 * Rounds rather than truncates: a DST transition makes one day 23 or 25 hours
 * long, and flooring that would lose or gain a day at the boundary.
 */
function daysBetween(from: Date, to: Date): number {
  const ms = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

interface Placed<T> {
  item: T;
  start: Date;
  end: Date;
  /** Numeric mirrors of start/end, for the shared row packer. */
  startMs: number;
  endMs: number;
  isMilestone: boolean;
  left: number;
  width: number;
  clipped: boolean;
}

export interface TimelineViewComponentProps<T extends ViewItem> extends TimelineViewProps<T> {
  /** First day of the visible range. Defaults to today; set in tests for determinism. */
  initialStart?: Date;
}

export function TimelineView<T extends ViewItem>({
  items,
  groups,
  getDateRange,
  renderChip,
  selectedId,
  onItemClick,
  initialStart,
  className,
}: TimelineViewComponentProps<T>) {
  const [zoom, setZoom] = useState<TimelineZoom>("month");
  const [rangeStart, setRangeStart] = useState(() => startOfLocalDay(initialStart ?? new Date()));

  const { days, columnPx, tickEvery } = ZOOM[zoom];
  const viewportPx = days * columnPx;

  // Derived every render rather than memoised — correctness first, per spec.
  const lanes = groups.map((group) => ({ group, placed: [] as Placed<T>[] }));
  let unscheduled = 0;
  let unlaned = 0;

  for (const item of items) {
    const range = getDateRange(item);
    // Checked before the lane so an item that is both undated and unlaned is
    // counted once, under the reason the user can actually act on.
    if (!range) {
      unscheduled += 1;
      continue;
    }
    const laneIndex = groups.findIndex((group) => group.match(item));
    if (laneIndex === -1) {
      unlaned += 1;
      continue;
    }

    const { start, end, isMilestone } = normalizeRange(range);
    const rawLeft = daysBetween(rangeStart, start) * columnPx;
    const rawWidth = isMilestone ? MILESTONE_PX : (daysBetween(start, end) + 1) * columnPx;

    // Entirely outside the visible window: not unplaceable, just not here yet.
    // The range is navigable, so this is a scroll position, not a lost item.
    if (rawLeft + rawWidth <= 0 || rawLeft >= viewportPx) continue;

    const left = Math.max(0, rawLeft);
    const right = Math.min(viewportPx, rawLeft + rawWidth);
    lanes[laneIndex].placed.push({
      item,
      start,
      end,
      startMs: start.getTime(),
      endMs: end.getTime(),
      isMilestone,
      left,
      width: Math.max(MILESTONE_PX, right - left),
      clipped: rawLeft < 0 || rawLeft + rawWidth > viewportPx,
    });
  }

  // Stack overlaps via the shared packer — the same primitive Calendar uses,
  // so the two views cannot drift on what "overlapping" means.
  //
  // The packer is projected onto {start, end, index} rather than handed the
  // entry directly: Placed already uses `start`/`end` for Dates, and spreading
  // the numeric mirrors over them would replace the Dates with numbers — which
  // then reaches dayLabel() as a number and throws.
  const packedLanes = lanes.map(({ group, placed }) => ({
    group,
    placed: packRows(placed.map((entry, index) => ({ start: entry.startMs, end: entry.endMs, index }))).map(
      ({ index, row }) => ({ ...placed[index], row }),
    ),
  }));

  const ticks = Array.from({ length: Math.ceil(days / tickEvery) }, (_, i) =>
    addDays(rangeStart, i * tickEvery),
  );

  return (
    <div
      data-slot="timeline-view"
      className={cn("bg-background flex h-full flex-col rounded-lg border", className)}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <div role="radiogroup" aria-label="Zoom" className="inline-flex items-center gap-1">
          {ZOOM_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={zoom === value}
              aria-label={ZOOM[value].label}
              tabIndex={zoom === value ? 0 : -1}
              onClick={() => setZoom(value)}
              className={cn(
                "focus-visible:ring-ring rounded px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none",
                zoom === value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {ZOOM[value].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <UnplacedNotice count={unscheduled} noun="unscheduled" />
          <UnplacedNotice count={unlaned} noun="unlaned" />
          <Button variant="ghost" size="sm" onClick={() => setRangeStart(startOfLocalDay(new Date()))}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous range"
            onClick={() => setRangeStart(addDays(rangeStart, -days))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next range"
            onClick={() => setRangeStart(addDays(rangeStart, days))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          <div className="text-muted-foreground flex h-6 border-b text-xs">
            <div
              className="bg-background sticky left-0 z-20 shrink-0 border-r"
              style={{ width: LANE_LABEL_PX }}
            />
            <div className="relative shrink-0" style={{ width: viewportPx }}>
              {ticks.map((tick) => (
                <span
                  key={tick.getTime()}
                  className="absolute top-0 border-l pl-1 whitespace-nowrap"
                  style={{ left: daysBetween(rangeStart, tick) * columnPx }}
                >
                  {tick.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              ))}
            </div>
          </div>

          {packedLanes.map(({ group, placed }) => {
            const rows = placed.reduce((max, entry) => Math.max(max, entry.row + 1), 1);
            return (
              <section
                key={group.id}
                aria-label={group.label}
                className="flex border-b"
                style={{ height: rows * ROW_HEIGHT + 8 }}
              >
                {/* A gutter rather than an overlay: a bar whose span begins
                    before the window starts at left 0, and a label floating
                    there would sit on top of it. Sticky so it survives the
                    horizontal scroll. */}
                <div
                  className="bg-background sticky left-0 z-20 shrink-0 border-r px-2 py-1"
                  style={{ width: LANE_LABEL_PX }}
                >
                  {/* Lane label: a header, not a graphic, so it is never
                      tinted. The mark carries the tone. */}
                  <span className="flex max-w-full items-center gap-1.5 text-xs font-medium">
                    {GROUP_TONE_MARK[group.tone ?? "neutral"]}
                    <span className="truncate">{group.label}</span>
                    {GROUP_TONE_LABEL[group.tone ?? "neutral"] ? (
                      <span className="sr-only">{GROUP_TONE_LABEL[group.tone ?? "neutral"]}</span>
                    ) : null}
                  </span>
                </div>

                <div className="relative shrink-0" style={{ width: viewportPx }}>
                  {placed.map((entry) => (
                    <button
                      key={entry.item.id}
                      type="button"
                      data-slot="timeline-bar"
                      data-shape={entry.isMilestone ? "milestone" : "bar"}
                      data-clipped={entry.clipped ? "true" : undefined}
                      aria-label={withTone(
                        entry.isMilestone
                          ? `${textOf(renderChip(entry.item))}, ${dayLabel(entry.start)}`
                          : `${textOf(renderChip(entry.item))}, ${dayLabel(entry.start)} to ${dayLabel(entry.end)}`,
                        group.tone,
                      )}
                      aria-current={selectedId === entry.item.id ? "true" : undefined}
                      onClick={() => onItemClick?.(entry.item)}
                      className={cn(
                        "focus-visible:ring-ring absolute flex items-center gap-1 truncate rounded px-1.5 text-left text-xs leading-6 focus-visible:z-20 focus-visible:ring-2 focus-visible:outline-none",
                        GROUP_TONE_SURFACE[group.tone ?? "neutral"],
                        selectedId === entry.item.id && "ring-ring ring-2",
                      )}
                      style={{
                        left: entry.left,
                        width: entry.width,
                        top: entry.row * ROW_HEIGHT + 4,
                        height: ROW_HEIGHT - 6,
                      }}
                    >
                      {/* The mark rides inside the bar because three of the
                          four tone surfaces are identical by design — shape is
                          what separates them. See GROUP_TONE_SURFACE. */}
                      {GROUP_TONE_MARK[group.tone ?? "neutral"]}
                      {entry.isMilestone ? null : renderChip(entry.item)}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
