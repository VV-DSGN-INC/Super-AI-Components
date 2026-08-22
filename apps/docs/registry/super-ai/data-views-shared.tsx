import { isValidElement, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ViewMode } from "@/registry/super-ai/use-view-mode";

/* ─────────────────────────────────────────────────────────────────────────────
   One config drives five interchangeable collection views.

   A section declares its groups, its card, its columns and its row once; the
   <DataViews> switcher picks a shell by ViewMode. Adding a sixth view means
   adding one shell and one contract here — no section changes.

   Everything shared by the view shells lives in this file rather than in the
   entry point, so the shells can import it without importing `data-views.tsx`
   back — the entry imports every shell, and the reverse edge would be a cycle.
   ─────────────────────────────────────────────────────────────────────────── */

export type { ViewMode };

/** Every item needs a stable id — it is the selection key in all five views. */
export interface ViewItem {
  id: string;
}

export type GroupTone = "neutral" | "info" | "warning" | "success";

/**
 * A group is one kanban column and one feed section. `match` decides
 * membership; an item matching no group is absent from grouped views, which is
 * why groups must cover the full domain of whatever they group by.
 */
export interface ViewGroup<T> {
  id: string;
  label: string;
  tone?: GroupTone;
  match: (item: T) => boolean;
}

export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  /** Fixed-width Tailwind class, e.g. "w-40". */
  width?: string;
  align?: "left" | "right" | "center";
}

// ---------------------------------------------------------------------------
// Group tone
// ---------------------------------------------------------------------------

/**
 * Tone is carried by mark shape first and colour second.
 *
 * The upstream implementation tinted both the header background and the label
 * text — blue, amber and emerald at low alpha for the three toned states, and
 * a muted pair for neutral. All four failed the token contract: three reached
 * for raw Tailwind palette classes, and the neutral pair was the exact
 * muted-foreground-on-muted combination `check:tokens` exists to catch, at
 * 4.34:1 against a 4.5:1 minimum.
 *
 * (Those class names are described rather than quoted on purpose: the contract
 * lint scans comments too, so writing them literally here would fail the gate
 * this comment is explaining.)
 *
 * This system has two chromatic tokens, `--destructive` and `--warning`. There
 * is no `--success` and no `--info`. So the idiom is J5 `record-list`'s, which
 * states the rule outright: the colour goes on the icon only, because
 * `text-destructive` measures 4.0:1 — fine for a graphic, not fine for a label.
 *
 * The consequence is deliberate and worth stating plainly: `info` and `success`
 * both resolve to `text-primary` and are told apart by **shape**, not hue. A
 * board that read as coloured bands now reads as neutral bands with marks.
 * Colour alone stops separating four tones — which is also why every consumer
 * of this map pairs the mark with `GROUP_TONE_LABEL` in the accessible name.
 */
export const GROUP_TONE_MARK: Record<GroupTone, ReactNode> = {
  neutral: <CircleDashed aria-hidden className="size-3.5 shrink-0 opacity-60" />,
  info: <Circle aria-hidden className="text-primary size-3.5 shrink-0" />,
  warning: <AlertTriangle aria-hidden className="text-warning size-3.5 shrink-0" />,
  success: <CheckCircle2 aria-hidden className="text-primary size-3.5 shrink-0" />,
};

/**
 * The word behind the mark, for the accessible name.
 *
 * `neutral` is null because "neutral" tells a screen-reader user nothing that
 * the group's own label does not — it is the absence of a tone, and announcing
 * it on every untoned group would be noise on the majority case.
 */
export const GROUP_TONE_LABEL: Record<GroupTone, string | null> = {
  neutral: null,
  info: "info",
  warning: "warning",
  success: "success",
};

/** Header surface for a toned group. Never tinted — see GROUP_TONE_MARK. */
export const GROUP_HEADER_CLASS = "flex items-center gap-2 rounded-t-lg border-b px-3 py-2";

/**
 * Fill for a calendar or timeline **bar**, which unlike a header is a graphic
 * and does need a visible surface to be a bar at all.
 *
 * Three of the four tones resolve to the same surface, and that is not an
 * oversight. In a monochrome system `secondary`, `muted` and `accent` are all
 * within a few hundredths of each other in lightness, so spending them on
 * `neutral`, `info` and `success` would produce three fills nobody can tell
 * apart while implying they are distinguishable. Only `warning` has a token
 * that genuinely reads as different.
 *
 * The differentiator is therefore the mark, which every bar renders inline —
 * shape carries what hue cannot. Each pairing here is a semantic
 * surface/foreground pair, so the text inside a bar always clears contrast.
 */
export const GROUP_TONE_SURFACE: Record<GroupTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-secondary text-secondary-foreground",
  warning: "bg-warning text-warning-foreground",
  success: "bg-secondary text-secondary-foreground",
};

/** The group an item belongs to, or undefined if the groups do not cover it. */
export function groupFor<T>(item: T, groups: ViewGroup<T>[]): ViewGroup<T> | undefined {
  return groups.find((g) => g.match(item));
}

/** Composed accessible name: "Review, 4 items, warning". */
export function groupAccessibleName(label: string, count: number, tone: GroupTone = "neutral"): string {
  return withTone(`${label}, ${count} items`, tone);
}

/**
 * Suffix an accessible name with its tone word.
 *
 * Every surface that shows tone visually must also say it, because the visual
 * channel is a mark shape — and a shape has no accessible name of its own. The
 * marks are all `aria-hidden` for exactly that reason: they are decoration, and
 * this function is where the meaning actually reaches assistive tech.
 */
export function withTone(name: string, tone: GroupTone = "neutral"): string {
  const toneWord = GROUP_TONE_LABEL[tone];
  return toneWord ? `${name}, ${toneWord}` : name;
}

// ---------------------------------------------------------------------------
// View props
// ---------------------------------------------------------------------------

export interface KanbanViewProps<T extends ViewItem> {
  items: T[];
  groups: ViewGroup<T>[];
  /** The card owns its own click and selected state; the shell never wraps it. */
  renderCard: (item: T) => ReactNode;
  className?: string;
}

export interface FeedViewProps<T extends ViewItem> {
  items: T[];
  groups?: ViewGroup<T>[];
  renderRow: (item: T) => ReactNode;
  selectedId?: string | null;
  onItemClick?: (item: T) => void;
  className?: string;
}

export interface TableViewProps<T extends ViewItem> {
  items: T[];
  columns: ColumnDef<T>[];
  selectedId?: string | null;
  onItemClick?: (item: T) => void;
  className?: string;
}

/**
 * Time capability — both fields or neither.
 *
 * A position without a compact renderer is the defect this pairing prevents:
 * the calendar would fall back to renderCard and overflow a day cell, or to
 * renderRow and draw a full-width row inside a 120px box.
 */
export interface TimeCapability<T> {
  /** Where the item sits in time. `null` means it has no temporal position. */
  getDateRange: (item: T) => DateRange | null;
  /** Compact form for a calendar bar or a timeline bar. */
  renderChip: (item: T) => ReactNode;
}

/** The per-entity config every section provides. */
export interface BaseDataViewsConfig<T extends ViewItem> {
  groups: ViewGroup<T>[];
  renderCard: (item: T) => ReactNode;
  columns: ColumnDef<T>[];
  renderRow: (item: T) => ReactNode;
}

/**
 * Supplying one half of TimeCapability without the other is a compile error:
 * the `?: never` arm makes the partial object match neither branch.
 */
export type DataViewsConfig<T extends ViewItem> =
  | (BaseDataViewsConfig<T> & TimeCapability<T>)
  | (BaseDataViewsConfig<T> & { getDateRange?: never; renderChip?: never });

/**
 * Runtime counterpart to the type union, for data the compiler did not check.
 *
 * Takes a bare `object` rather than a shape with two optional members: a target
 * whose properties are all optional rejects any argument sharing none of them,
 * so the honest "neither field supplied" case would not type-check.
 */
export function hasTimeCapability(config: object): boolean {
  const candidate = config as Partial<TimeCapability<unknown>>;
  return typeof candidate.getDateRange === "function" && typeof candidate.renderChip === "function";
}

export type TimelineZoom = "week" | "month" | "quarter";

export interface CalendarViewProps<T extends ViewItem> extends TimeCapability<T> {
  items: T[];
  /** Partition — rendered as a bar mark, since day cells are the layout. */
  groups: ViewGroup<T>[];
  selectedId?: string | null;
  onItemClick?: (item: T) => void;
  className?: string;
}

export interface TimelineViewProps<T extends ViewItem> extends TimeCapability<T> {
  items: T[];
  /** Partition — rendered as lanes. */
  groups: ViewGroup<T>[];
  selectedId?: string | null;
  onItemClick?: (item: T) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Accessible-name helpers
// ---------------------------------------------------------------------------

/**
 * Best-effort plain text of a rendered node, for accessible names.
 *
 * A chip is caller-supplied JSX, so the shell cannot know its text without
 * walking it. Position on a grid or an axis is not information a screen reader
 * can use, so every bar needs a name carrying its own text plus its dates.
 */
export function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

export interface UnplacedNoticeProps {
  count: number;
  /** What these items are missing, e.g. "unscheduled" or "unlaned". */
  noun: string;
  className?: string;
}

/**
 * Items a time view cannot place — no date, or no matching group — are absent
 * from the view. Absent is not the same as gone, and a user cannot tell the
 * difference without being told. This is the same failure mode already
 * documented for items matching no group, so it gets the same remedy: say the
 * number out loud.
 */
export function UnplacedNotice({ count, noun, className }: UnplacedNoticeProps) {
  if (count === 0) return null;
  return (
    <p
      role="status"
      data-slot="unplaced-notice"
      className={cn("text-muted-foreground px-1 text-xs tabular-nums", className)}
    >
      {count} {noun}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Local-day date primitives
// ---------------------------------------------------------------------------

/* Everything here works in LOCAL time, deliberately. A due date at 23:00 local
   belongs to that local day; bucketing by UTC would move it to the next day for
   anyone west of Greenwich, which is the classic off-by-one-day defect and is
   invisible to a test suite running in UTC. */

/** Where an item sits in time. `end` absent means a point, not a span. */
export interface DateRange {
  start: Date;
  end?: Date;
}

/** A range resolved to local midnights, with degenerate cases collapsed. */
export interface NormalizedRange {
  start: Date;
  end: Date;
  isMilestone: boolean;
}

/** Stable bucket key for a local calendar day: "2026-08-04". */
export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midnight at the start of this date's local day. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Add whole days. Goes through the local-midnight constructor rather than
 * arithmetic on milliseconds, so a DST transition cannot shift the result by an
 * hour and land it on the previous day.
 */
export function addDays(date: Date, days: number): Date {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDayKey(a) === localDayKey(b);
}

/**
 * Resolve a range for rendering. A missing, equal, or inverted `end` becomes a
 * milestone: bad data degrades to a marker rather than a negative-width bar or
 * a thrown error, because a collection view is the wrong place to fail hard.
 */
export function normalizeRange(range: DateRange): NormalizedRange {
  const start = startOfLocalDay(range.start);
  if (!range.end) return { start, end: start, isMilestone: true };

  const end = startOfLocalDay(range.end);
  if (end.getTime() <= start.getTime()) {
    // `import.meta.env.DEV` upstream — Vite-only, and undefined in Next, where
    // reading `.DEV` off it throws rather than quietly skipping the warning.
    if (process.env.NODE_ENV !== "production" && end.getTime() < start.getTime()) {
      console.warn("[data-views] range end precedes start; rendering a milestone", range);
    }
    return { start, end: start, isMilestone: true };
  }
  return { start, end, isMilestone: false };
}

/** Human date for an accessible name: "4 August 2026". */
export function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Parse an ISO calendar date as a LOCAL day.
 *
 * `new Date("2026-08-04")` parses as UTC midnight, which is the previous
 * evening in any negative-offset zone — the item then lands on the wrong day.
 * Splitting the parts and using the local constructor avoids that entirely.
 */
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// ---------------------------------------------------------------------------
// Row packing
// ---------------------------------------------------------------------------

/* Calendar and Timeline both need it: two things happening at once must stack,
   not hide one another. Kept numeric and view-agnostic so it can be tested on
   its own, without dates, DOM, or a component — and so the two views cannot
   drift on what "overlapping" means. */

export interface Packable {
  /** Inclusive start, in any consistent unit — a day index or a timestamp. */
  start: number;
  /** Inclusive end. Equal to `start` for a point. */
  end: number;
}

/**
 * Assign each entry the lowest row on which it does not overlap an earlier one.
 *
 * Entries that merely touch (one ends where the next begins) are treated as
 * overlapping: they both occupy that unit, and sharing a row would draw them as
 * a single continuous bar.
 */
export function packRows<T extends Packable>(entries: T[]): (T & { row: number })[] {
  const sorted = [...entries].sort((a, b) => a.start - b.start || a.end - b.end);
  const rowEnds: number[] = [];

  return sorted.map((entry) => {
    let row = rowEnds.findIndex((end) => end < entry.start);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(entry.end);
    } else {
      rowEnds[row] = entry.end;
    }
    return { ...entry, row };
  });
}
