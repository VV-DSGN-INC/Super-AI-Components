"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  GROUP_TONE_SURFACE,
  UnplacedNotice,
  addDays,
  dayLabel,
  groupFor,
  localDayKey,
  normalizeRange,
  packRows,
  startOfLocalDay,
  textOf,
  withTone,
} from "@/registry/super-ai/data-views-shared";
import type {
  CalendarViewProps,
  GroupTone,
  ViewGroup,
  ViewItem,
} from "@/registry/super-ai/data-views-shared";

/* ─────────────────────────────────────────────────────────────────────────────
   CalendarView — a month grid over the collection.

   Spans are bars across the days they cover, not marks on a start day. The
   reason to open a calendar rather than sort a table is to see OVERLAP, and a
   span collapsed to one cell destroys precisely that.

   Day cells are the layout, so `groups` cannot be position here; they carry
   tone instead — the same partition the board renders as columns, expressed as
   colour because the axis is already spoken for.

   A bar lives in the DOM inside the cell its segment starts in, positioned
   absolutely against the week row. That keeps grid semantics intact (every bar
   is inside a gridcell) while letting it span visually — which is why the cells
   must stay unpositioned and the week row must be `relative`.
   ─────────────────────────────────────────────────────────────────────────── */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = 6; // a fixed grid never reflows as months change
const DAYS_PER_WEEK = 7;
const MAX_ROWS = 3;
const BAR_H = 20;
const CELL_HEADER = 22;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Monday-first grid origin for the month containing `date`. */
function gridStart(date: Date): Date {
  const first = startOfMonth(date);
  return addDays(first, -((first.getDay() + 6) % 7));
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function toneFor<T>(item: T, groups: ViewGroup<T>[]): GroupTone {
  return groupFor(item, groups)?.tone ?? "neutral";
}

/** Whole days from `from` to `to`; rounded so a DST day cannot shift it. */
function dayIndex(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / 86_400_000);
}

interface Segment<T> {
  item: T;
  /** Column 0-6 within the week row. */
  col: number;
  /** Days covered inside this week row, at least 1. */
  days: number;
  /** Grid-day indices, used by the packer and by per-day overflow counting. */
  start: number;
  end: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  /** The whole record's range, for the accessible name. */
  wholeStart: Date;
  wholeEnd: Date;
}

export interface CalendarViewComponentProps<T extends ViewItem> extends CalendarViewProps<T> {
  /** Month to open on. Defaults to the current month; set in tests for determinism. */
  initialMonth?: Date;
}

export function CalendarView<T extends ViewItem>({
  items,
  groups,
  getDateRange,
  renderChip,
  selectedId,
  onItemClick,
  initialMonth,
  className,
}: CalendarViewComponentProps<T>) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth ?? new Date()));
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const origin = gridStart(month);
  const todayKey = localDayKey(startOfLocalDay(new Date()));

  // Derived every render rather than memoised — correctness first, per spec.
  const placed: { item: T; from: number; to: number }[] = [];
  let unscheduled = 0;
  for (const item of items) {
    const range = getDateRange(item);
    if (!range) {
      unscheduled += 1;
      continue;
    }
    const { start, end } = normalizeRange(range);
    placed.push({ item, from: dayIndex(origin, start), to: dayIndex(origin, end) });
  }

  return (
    <div
      data-slot="calendar-view"
      className={cn("bg-background flex h-full flex-col rounded-lg border", className)}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <h2 className="text-sm font-medium">{monthLabel(month)}</h2>
        <div className="ml-auto flex items-center gap-1">
          <UnplacedNotice count={unscheduled} noun="unscheduled" className="mr-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              setExpandedWeek(null);
            }}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              setExpandedWeek(null);
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              setExpandedWeek(null);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="text-muted-foreground grid grid-cols-7 border-b text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-1.5 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div role="grid" aria-label="Calendar" className="min-h-0 flex-1 overflow-y-auto">
        {Array.from({ length: WEEKS }, (_, week) => {
          const weekFrom = week * DAYS_PER_WEEK;
          const weekTo = weekFrom + DAYS_PER_WEEK - 1;

          // Clip each record to this week row; a record spanning Sunday into
          // Monday yields one segment here and another in the next row.
          const segments: Segment<T>[] = placed
            .filter((p) => p.to >= weekFrom && p.from <= weekTo)
            .map((p) => {
              const from = Math.max(p.from, weekFrom);
              const to = Math.min(p.to, weekTo);
              return {
                item: p.item,
                col: from - weekFrom,
                days: to - from + 1,
                start: from,
                end: to,
                continuesBefore: p.from < weekFrom,
                continuesAfter: p.to > weekTo,
                wholeStart: addDays(origin, p.from),
                wholeEnd: addDays(origin, p.to),
              };
            });

          const packed = packRows(segments);
          const rowCap = expandedWeek === week ? Infinity : MAX_ROWS;
          const visible = packed.filter((s) => s.row < rowCap);
          const hidden = packed.filter((s) => s.row >= rowCap);
          const usedRows = visible.reduce((max, s) => Math.max(max, s.row + 1), 1);

          return (
            <div
              key={week}
              role="row"
              className="relative grid grid-cols-7"
              style={{ minHeight: CELL_HEADER + usedRows * BAR_H + 14 }}
            >
              {Array.from({ length: DAYS_PER_WEEK }, (_, col) => {
                const dayIdx = weekFrom + col;
                const day = addDays(origin, dayIdx);
                const key = localDayKey(day);
                const outside = day.getMonth() !== month.getMonth();
                const startingHere = visible.filter((s) => s.col === col);
                // Count only the items hidden ON THIS DAY, so a reader sees the
                // number relevant to the cell they are looking at.
                const hiddenHere = hidden.filter((s) => s.start <= dayIdx && s.end >= dayIdx).length;

                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={dayLabel(day)}
                    className={cn("border-r border-b p-1", outside && "bg-muted/30")}
                  >
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        /* Out-of-month days were muted-foreground at 60%
                           opacity, which measures 2.26:1 against the calendar
                           surface — the browser a11y gate caught it; the
                           static token lint of the day could not, because an
                           opacity modifier on a legal token was still a legal
                           token (TOK-8 has since banned that composite shape).
                           De-emphasis now comes from the cell, not from fading
                           the number below readable. */
                        outside ? "text-muted-foreground" : "text-foreground",
                        key === todayKey &&
                          "bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full font-medium",
                      )}
                    >
                      {day.getDate()}
                    </span>

                    {startingHere.map((segment) => (
                      <button
                        key={`${segment.item.id}-${segment.start}`}
                        type="button"
                        data-slot="calendar-bar"
                        data-days={segment.days}
                        data-row={segment.row}
                        data-start={localDayKey(addDays(origin, segment.start))}
                        data-continues={
                          segment.continuesBefore && segment.continuesAfter
                            ? "both"
                            : segment.continuesBefore
                              ? "before"
                              : segment.continuesAfter
                                ? "after"
                                : undefined
                        }
                        // The whole record's range, not this segment's: a split
                        // bar is still one task, and must be heard as one.
                        aria-label={withTone(
                          `${textOf(renderChip(segment.item))}, ${dayLabel(segment.wholeStart)}${
                            segment.wholeEnd.getTime() === segment.wholeStart.getTime()
                              ? ""
                              : ` to ${dayLabel(segment.wholeEnd)}`
                          }`,
                          toneFor(segment.item, groups),
                        )}
                        aria-current={selectedId === segment.item.id ? "true" : undefined}
                        onClick={() => onItemClick?.(segment.item)}
                        className={cn(
                          "focus-visible:ring-ring absolute flex items-center gap-1 truncate px-1.5 text-left text-xs leading-5 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none",
                          GROUP_TONE_SURFACE[toneFor(segment.item, groups)],
                          segment.continuesBefore ? "rounded-l-none" : "rounded-l",
                          segment.continuesAfter ? "rounded-r-none" : "rounded-r",
                          selectedId === segment.item.id && "ring-ring ring-2",
                        )}
                        style={{
                          left: `${(col / DAYS_PER_WEEK) * 100}%`,
                          width: `${(segment.days / DAYS_PER_WEEK) * 100}%`,
                          top: CELL_HEADER + segment.row * BAR_H,
                          // The 2px gutters are transparent borders rather than
                          // `calc(… - 4px)`: jsdom 30 throws inside
                          // getComputedStyle when an inline width uses calc(),
                          // which breaks every getByRole in the test suite.
                          // Box-sizing is border-box, so these inset the bar
                          // without changing its outer width.
                          borderLeft: "2px solid transparent",
                          borderRight: "2px solid transparent",
                          backgroundClip: "padding-box",
                        }}
                      >
                        {renderChip(segment.item)}
                      </button>
                    ))}

                    {hiddenHere > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedWeek(week)}
                        className="text-muted-foreground hover:text-foreground absolute text-xs"
                        style={{
                          left: `${(col / DAYS_PER_WEEK) * 100}%`,
                          top: CELL_HEADER + MAX_ROWS * BAR_H,
                          marginLeft: 6,
                        }}
                      >
                        +{hiddenHere} more
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
