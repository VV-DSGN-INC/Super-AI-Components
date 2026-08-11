"use client";

import { useRef, type ReactNode } from "react";
import { CalendarDays, ChartGantt, Columns3, Rows3, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { CalendarView } from "@/registry/super-ai/calendar-view";
import { FeedView } from "@/registry/super-ai/feed-view";
import { KanbanView } from "@/registry/super-ai/kanban-view";
import { TableView } from "@/registry/super-ai/table-view";
import { TimelineView } from "@/registry/super-ai/timeline-view";
import { hasTimeCapability } from "@/registry/super-ai/data-views-shared";
import { VIEW_MODE_VALUES } from "@/registry/super-ai/use-view-mode";
import type {
  BaseDataViewsConfig,
  DataViewsConfig,
  TimeCapability,
  ViewItem,
  ViewMode,
} from "@/registry/super-ai/data-views-shared";

/* The public surface of this item. Consumers import everything from
   `data-views`; the shared module is an implementation detail of the file set,
   not a second entry point. */
export type {
  BaseDataViewsConfig,
  CalendarViewProps,
  ColumnDef,
  DataViewsConfig,
  DateRange,
  FeedViewProps,
  GroupTone,
  KanbanViewProps,
  TableViewProps,
  TimeCapability,
  TimelineViewProps,
  TimelineZoom,
  ViewGroup,
  ViewItem,
  ViewMode,
} from "@/registry/super-ai/data-views-shared";
export {
  GROUP_TONE_LABEL,
  GROUP_TONE_MARK,
  GROUP_TONE_SURFACE,
  UnplacedNotice,
  groupAccessibleName,
  hasTimeCapability,
  packRows,
  withTone,
  addDays,
  dayLabel,
  isSameLocalDay,
  localDayKey,
  normalizeRange,
  parseLocalDate,
  startOfLocalDay,
} from "@/registry/super-ai/data-views-shared";
export { CalendarView } from "@/registry/super-ai/calendar-view";
export { FeedView } from "@/registry/super-ai/feed-view";
export { KanbanView } from "@/registry/super-ai/kanban-view";
export { KanbanColumn } from "@/registry/super-ai/kanban-column";
export { TableView } from "@/registry/super-ai/table-view";
export { TimelineView } from "@/registry/super-ai/timeline-view";

/* An intersection rather than `interface … extends`: DataViewsConfig is a union
   (the both-or-neither time pair), and an interface can only extend an object
   type with statically known members. The intersection distributes over the
   union, so a caller still gets "both or neither" enforced at this boundary. */
export type DataViewsProps<T extends ViewItem> = DataViewsConfig<T> & {
  items: T[];
  viewMode: ViewMode;
  selectedId?: string | null;
  onItemClick?: (item: T) => void;
  className?: string;
};

export function DataViews<T extends ViewItem>(props: DataViewsProps<T>): ReactNode {
  const { items, viewMode, groups, renderCard, columns, renderRow, selectedId, onItemClick, className } =
    props;

  // Defence in depth: useViewMode should already have prevented a time view on
  // a section without the pair, so falling through to the feed surfaces a real
  // bug rather than rendering nothing.
  //
  // Read off `props` and narrowed by the runtime guard rather than destructured
  // and truthiness-checked: destructuring the union collapses the optional arm,
  // so the compiler decides the pair is always present and flags the check as
  // redundant — which is exactly the check that has to survive.
  if (viewMode === "calendar" || viewMode === "timeline") {
    if (hasTimeCapability(props)) {
      const { getDateRange, renderChip } = props as BaseDataViewsConfig<T> & TimeCapability<T>;
      const timeProps = { items, groups, getDateRange, renderChip, selectedId, onItemClick, className };
      return viewMode === "calendar" ? <CalendarView {...timeProps} /> : <TimelineView {...timeProps} />;
    }
  }

  if (viewMode === "kanban") {
    return <KanbanView items={items} groups={groups} renderCard={renderCard} className={className} />;
  }
  if (viewMode === "table") {
    return (
      <TableView
        items={items}
        columns={columns}
        selectedId={selectedId}
        onItemClick={onItemClick}
        className={className}
      />
    );
  }
  return (
    <FeedView
      items={items}
      groups={groups}
      renderRow={renderRow}
      selectedId={selectedId}
      onItemClick={onItemClick}
      className={className}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   The switcher.

   Folded into this file rather than shipped as its own item: D18 held it
   deliberately. Every product in the records slice has one, but the slice saw
   no screens, so nothing can be said about its anatomy — and promoting a
   component on evidence that cannot describe how it looks is exactly the
   mistake D11 caught with `preview-tile`.
   ─────────────────────────────────────────────────────────────────────────── */

export interface DataViewsSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /**
   * The views this section offers. Defaults to all of them; a section without a
   * date accessor passes the untimed subset. The arrow-key modulus is taken
   * over THIS list, not the global one.
   */
  views?: readonly ViewMode[];
  className?: string;
}

/* "Board" rather than "Kanban": people recognise what they see, not the method
   name behind it. */
const VIEW_LABELS: Record<ViewMode, string> = {
  list: "List",
  kanban: "Board",
  table: "Table",
  calendar: "Calendar",
  timeline: "Timeline",
};

const VIEW_ICONS: Record<ViewMode, React.ComponentType<{ className?: string }>> = {
  list: Rows3,
  kanban: Columns3,
  table: Table2,
  calendar: CalendarDays,
  timeline: ChartGantt,
};

export function DataViewsSwitcher({
  viewMode,
  onViewModeChange,
  views = VIEW_MODE_VALUES,
  className,
}: DataViewsSwitcherProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const index = views.indexOf(viewMode);
    const next = views[(index + delta + views.length) % views.length];
    onViewModeChange(next);
    requestAnimationFrame(() => {
      groupRef.current?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();
    });
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Collection view"
      data-slot="view-switcher"
      onKeyDown={onKeyDown}
      className={cn("inline-flex items-center", className)}
    >
      {views.map((value, i) => {
        const Icon = VIEW_ICONS[value];
        const selected = viewMode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            data-view={value}
            aria-checked={selected}
            aria-label={VIEW_LABELS[value]}
            tabIndex={selected ? 0 : -1}
            onClick={() => onViewModeChange(value)}
            className={cn(
              "border-input flex h-8 items-center justify-center border px-2 transition-colors",
              "focus-visible:ring-ring focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none",
              selected
                ? "bg-accent text-accent-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
              i === 0 && "rounded-l-md",
              i > 0 && "-ml-px",
              i === views.length - 1 && "rounded-r-md",
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
