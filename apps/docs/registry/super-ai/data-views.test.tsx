import {
  CalendarView,
  DataViews,
  DataViewsSwitcher,
  GROUP_TONE_MARK,
  TimelineView,
  addDays,
  dayLabel,
  hasTimeCapability,
  isSameLocalDay,
  localDayKey,
  normalizeRange,
  packRows,
  parseLocalDate,
  startOfLocalDay,
} from "@/registry/super-ai/data-views";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef, ViewGroup, ViewMode } from "@/registry/super-ai/data-views";

/* ─── ported from components/ui/data-views.test.tsx ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  interface Demo {
    id: string;
    title: string;
    done: boolean;
  }

  const items: Demo[] = [
    { id: "1", title: "Alpha", done: false },
    { id: "2", title: "Beta", done: true },
  ];

  const groups: ViewGroup<Demo>[] = [
    { id: "open", label: "Open", match: (i) => !i.done },
    { id: "done", label: "Done", match: (i) => i.done },
  ];

  const columns: ColumnDef<Demo>[] = [{ id: "title", header: "Title", cell: (i) => i.title }];

  function setup(viewMode: "list" | "kanban" | "table", onItemClick = vi.fn()) {
    render(
      <DataViews
        items={items}
        viewMode={viewMode}
        groups={groups}
        columns={columns}
        renderCard={(i) => <button onClick={() => onItemClick(i)}>{i.title}</button>}
        renderRow={(i) => <span>{i.title}</span>}
        onItemClick={onItemClick}
      />,
    );
    return onItemClick;
  }

  /** The same table with no `onItemClick` — a read-only collection. */
  function setupReadOnlyTable() {
    render(
      <DataViews
        items={items}
        viewMode="table"
        groups={groups}
        columns={columns}
        renderCard={(i) => <span>{i.title}</span>}
        renderRow={(i) => <span>{i.title}</span>}
      />,
    );
  }

  /** Body rows only — `getAllByRole("row")` leads with the header row. */
  function bodyRows() {
    const [, ...rows] = screen.getAllByRole("row");
    return rows;
  }

  describe("DataViews", () => {
    it("renders grouped columns in kanban", () => {
      setup("kanban");
      expect(screen.getByRole("region", { name: /Open, 1 items/ })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /Done, 1 items/ })).toBeInTheDocument();
    });

    it("renders a table with headers", () => {
      setup("table");
      expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2
    });

    it("renders grouped rows in list", () => {
      setup("list");
      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    it("reports row clicks in list view", async () => {
      const onItemClick = setup("list");
      await userEvent.click(screen.getByText("Alpha"));
      expect(onItemClick).toHaveBeenCalledWith(items[0]);
    });

    it("reports row clicks in table view", async () => {
      const onItemClick = setup("table");
      await userEvent.click(screen.getByText("Beta"));
      expect(onItemClick).toHaveBeenCalledWith(items[1]);
    });

    // A view the mouse can open and the keyboard cannot is a broken view.
    it("activates a table row with Enter", async () => {
      const onItemClick = setup("table");
      const [firstRow] = bodyRows();
      firstRow.focus();
      expect(firstRow).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      expect(onItemClick).toHaveBeenCalledWith(items[0]);
    });

    it("activates a table row with Space", async () => {
      const onItemClick = setup("table");
      const [, secondRow] = bodyRows();
      secondRow.focus();

      await userEvent.keyboard(" ");
      expect(onItemClick).toHaveBeenCalledWith(items[1]);
    });

    it("puts clickable table rows in the tab order", () => {
      setup("table");
      for (const row of bodyRows()) {
        expect(row).toHaveAttribute("tabindex", "0");
      }
    });

    it("leaves rows unfocusable when no click handler is given", () => {
      setupReadOnlyTable();
      const [firstRow] = bodyRows();

      expect(firstRow).not.toHaveAttribute("tabindex");
      firstRow.focus();
      expect(firstRow).not.toHaveFocus();
    });

    it("renders the calendar when the view mode is calendar", () => {
      render(
        <DataViews
          items={items}
          viewMode="calendar"
          groups={groups}
          columns={columns}
          renderCard={(i) => <span>{i.title}</span>}
          renderRow={(i) => <span>{i.title}</span>}
          getDateRange={() => ({ start: new Date(2026, 7, 4) })}
          renderChip={(i) => <span>{i.title}</span>}
        />,
      );
      expect(document.querySelector("[data-slot='calendar-view']")).toBeInTheDocument();
    });

    it("renders the timeline when the view mode is timeline", () => {
      render(
        <DataViews
          items={items}
          viewMode="timeline"
          groups={groups}
          columns={columns}
          renderCard={(i) => <span>{i.title}</span>}
          renderRow={(i) => <span>{i.title}</span>}
          getDateRange={() => ({ start: new Date(2026, 7, 4) })}
          renderChip={(i) => <span>{i.title}</span>}
        />,
      );
      expect(document.querySelector("[data-slot='timeline-view']")).toBeInTheDocument();
    });

    it("falls back to the feed when a time view is asked for without the pair", () => {
      // Defence in depth: useViewMode should already have prevented this, so
      // rendering nothing would hide a real bug rather than surface it.
      render(
        <DataViews
          items={items}
          viewMode="calendar"
          groups={groups}
          columns={columns}
          renderCard={(i) => <span>{i.title}</span>}
          renderRow={(i) => <span>{i.title}</span>}
        />,
      );
      expect(document.querySelector("[data-slot='feed-view']")).toBeInTheDocument();
    });
  });
}

/* ─── ported from components/ui/calendar-view.test.tsx ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  /* Date strings are built with dayLabel rather than hardcoded: the shell renders
   in the reader's locale on purpose, so pinning "4 August 2026" here would only
   assert which machine ran the test. */

  interface Row {
    id: string;
    title: string;
    from: Date | null;
    to?: Date;
    done: boolean;
  }

  const GROUPS: ViewGroup<Row>[] = [
    { id: "open", label: "Open", tone: "info", match: (r) => !r.done },
    { id: "done", label: "Done", tone: "success", match: (r) => r.done },
  ];

  function row(id: string, from: number | null, to?: number, done = false): Row {
    return {
      id,
      title: `Item ${id}`,
      from: from === null ? null : new Date(2026, 7, from),
      to: to === undefined ? undefined : new Date(2026, 7, to),
      done,
    };
  }

  function renderCalendar(items: Row[], onItemClick = vi.fn()) {
    render(
      <CalendarView
        items={items}
        groups={GROUPS}
        getDateRange={(r) => (r.from ? { start: r.from, end: r.to } : null)}
        renderChip={(r) => <span>{r.title}</span>}
        onItemClick={onItemClick}
        initialMonth={new Date(2026, 7, 1)}
      />,
    );
    return onItemClick;
  }

  describe("CalendarView", () => {
    it("places a milestone on its own local day", () => {
      renderCalendar([row("a", 4)]);
      const bar = screen.getByRole("button", { name: /Item a/ });
      expect(bar).toHaveAttribute("data-days", "1");
      expect(bar).toHaveAttribute("data-start", "2026-08-04");
    });

    it("keeps a late-evening item on that day", () => {
      // 23:00 local is already tomorrow in UTC; bucketing by UTC would move it.
      render(
        <CalendarView
          items={[{ id: "a", title: "Late", from: new Date(2026, 7, 4, 23, 30), done: false }]}
          groups={GROUPS}
          getDateRange={(r) => (r.from ? { start: r.from } : null)}
          renderChip={(r) => <span>{r.title}</span>}
          initialMonth={new Date(2026, 7, 1)}
        />,
      );
      expect(screen.getByRole("button", { name: /Late/ })).toHaveAttribute("data-start", "2026-08-04");
    });

    it("draws a span as one bar covering every day it touches", () => {
      renderCalendar([row("a", 4, 8)]);
      expect(screen.getByRole("button", { name: /Item a/ })).toHaveAttribute("data-days", "5");
    });

    it("splits a span across a week boundary into two continuing segments", () => {
      // Sat 8 Aug -> Tue 11 Aug straddles the Aug 3-9 / Aug 10-16 rows.
      renderCalendar([row("a", 8, 11)]);
      const segments = screen.getAllByRole("button", { name: /Item a/ });
      expect(segments).toHaveLength(2);
      expect(segments[0]).toHaveAttribute("data-days", "2"); // Sat 8, Sun 9
      expect(segments[0]).toHaveAttribute("data-continues", "after");
      expect(segments[1]).toHaveAttribute("data-days", "2"); // Mon 10, Tue 11
      expect(segments[1]).toHaveAttribute("data-continues", "before");
    });

    it("names every segment with the whole record's range, not the segment's", () => {
      // A screen reader user must hear one record, not two two-day tasks.
      renderCalendar([row("a", 8, 11)]);
      const whole = `${dayLabel(new Date(2026, 7, 8))} to ${dayLabel(new Date(2026, 7, 11))}`;
      for (const segment of screen.getAllByRole("button", { name: /Item a/ })) {
        // The tone word is appended by withTone(). It is the whole point of
        // the mark-based tone treatment: the visual channel is a shape, and a
        // shape has no accessible name, so the word has to arrive here.
        expect(segment).toHaveAccessibleName(`Item a, ${whole}, info`);
      }
    });

    it("stacks overlapping spans onto separate rows", () => {
      renderCalendar([row("a", 3, 6), row("b", 5, 8)]);
      expect(screen.getByRole("button", { name: /Item a/ })).toHaveAttribute("data-row", "0");
      expect(screen.getByRole("button", { name: /Item b/ })).toHaveAttribute("data-row", "1");
    });

    it("returns a span to row 0 once the row is free", () => {
      renderCalendar([row("a", 3, 4), row("b", 3, 8), row("c", 6, 7)]);
      expect(screen.getByRole("button", { name: /Item c/ })).toHaveAttribute("data-row", "0");
    });

    it("caps a week at three rows and counts the hidden per day", () => {
      // Four spans all covering Wed 5 Aug: three render, one is hidden there.
      renderCalendar([row("a", 3, 6), row("b", 3, 6), row("c", 3, 6), row("d", 5, 5)]);
      expect(screen.getByRole("button", { name: "+1 more" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Item d/ })).not.toBeInTheDocument();
    });

    it("reveals the hidden items when the overflow is opened", async () => {
      renderCalendar([row("a", 3, 6), row("b", 3, 6), row("c", 3, 6), row("d", 5, 5)]);
      await userEvent.click(screen.getByRole("button", { name: "+1 more" }));
      expect(screen.getByRole("button", { name: /Item d/ })).toBeInTheDocument();
    });

    it("excludes an item with no date and counts it", () => {
      renderCalendar([row("a", 4), row("b", null), row("c", null)]);
      expect(screen.getByRole("status")).toHaveTextContent("2 unscheduled");
      expect(screen.queryByRole("button", { name: /Item b/ })).not.toBeInTheDocument();
    });

    it("clips a span that runs past the shown grid rather than dropping it", () => {
      // 20 July -> 5 August starts before the grid origin of Mon 27 July.
      render(
        <CalendarView
          items={[
            { id: "a", title: "Long", from: new Date(2026, 6, 20), to: new Date(2026, 7, 5), done: false },
          ]}
          groups={GROUPS}
          getDateRange={(r) => ({ start: r.from!, end: r.to })}
          renderChip={(r) => <span>{r.title}</span>}
          initialMonth={new Date(2026, 7, 1)}
        />,
      );
      expect(screen.getAllByRole("button", { name: /Long/ }).length).toBeGreaterThan(0);
    });

    it("opens a record when its bar is clicked", async () => {
      const onItemClick = renderCalendar([row("a", 4)]);
      await userEvent.click(screen.getByRole("button", { name: /Item a/ }));
      expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    });

    it("labels each day cell with its date", () => {
      renderCalendar([]);
      expect(screen.getByRole("gridcell", { name: dayLabel(new Date(2026, 7, 4)) })).toBeInTheDocument();
    });

    it("moves to the previous and next month", async () => {
      renderCalendar([row("a", 4)]);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("August 2026");
      await userEvent.click(screen.getByRole("button", { name: "Next month" }));
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("September 2026");
      await userEvent.click(screen.getByRole("button", { name: "Previous month" }));
      await userEvent.click(screen.getByRole("button", { name: "Previous month" }));
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("July 2026");
    });

    it("returns to today", async () => {
      renderCalendar([row("a", 4)]);
      await userEvent.click(screen.getByRole("button", { name: "Next month" }));
      await userEvent.click(screen.getByRole("button", { name: "Today" }));
      const label = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(label);
    });

    it("renders the full grid even when nothing lands in the month", () => {
      renderCalendar([]);
      expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    });
  });
}

/* ─── ported from components/ui/timeline-view.test.tsx ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  interface Row {
    id: string;
    title: string;
    start: Date | null;
    end?: Date;
    lane: "a" | "b" | "none";
  }

  const GROUPS: ViewGroup<Row>[] = [
    { id: "a", label: "Lane A", tone: "info", match: (r) => r.lane === "a" },
    { id: "b", label: "Lane B", tone: "warning", match: (r) => r.lane === "b" },
  ];

  function renderTimeline(items: Row[], onItemClick = vi.fn()) {
    render(
      <TimelineView
        items={items}
        groups={GROUPS}
        getDateRange={(r) => (r.start ? { start: r.start, end: r.end } : null)}
        renderChip={(r) => <span>{r.title}</span>}
        onItemClick={onItemClick}
        initialStart={new Date(2026, 7, 1)}
      />,
    );
    return onItemClick;
  }

  describe("TimelineView", () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it("renders one lane per group", () => {
      renderTimeline([{ id: "a", title: "A", start: new Date(2026, 7, 4), lane: "a" }]);
      expect(screen.getByRole("region", { name: "Lane A" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Lane B" })).toBeInTheDocument();
    });

    it("places an item in its own lane", () => {
      // Asserted on the control, not on text: a milestone renders as a marker
      // with no label, so text content would be the wrong probe for placement.
      renderTimeline([{ id: "a", title: "Only A", start: new Date(2026, 7, 4), lane: "a" }]);
      expect(
        within(screen.getByRole("region", { name: "Lane A" })).getByRole("button", { name: /Only A/ }),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "Lane B" })).queryByRole("button", {
          name: /Only A/,
        }),
      ).not.toBeInTheDocument();
    });

    it("excludes an item matching no group and counts it", () => {
      renderTimeline([
        { id: "a", title: "Placed", start: new Date(2026, 7, 4), lane: "a" },
        { id: "b", title: "Laneless", start: new Date(2026, 7, 4), lane: "none" },
      ]);
      expect(screen.queryByText("Laneless")).not.toBeInTheDocument();
      expect(screen.getByText(/1 unlaned/)).toBeInTheDocument();
    });

    it("excludes an item with no date and counts it", () => {
      renderTimeline([{ id: "a", title: "Undated", start: null, lane: "a" }]);
      expect(screen.getByText(/1 unscheduled/)).toBeInTheDocument();
    });

    it("marks a span as a bar and an end-less item as a milestone", () => {
      renderTimeline([
        { id: "a", title: "Span", start: new Date(2026, 7, 4), end: new Date(2026, 7, 8), lane: "a" },
        { id: "b", title: "Point", start: new Date(2026, 7, 6), lane: "b" },
      ]);
      expect(screen.getByRole("button", { name: /Span/ })).toHaveAttribute("data-shape", "bar");
      expect(screen.getByRole("button", { name: /Point/ })).toHaveAttribute("data-shape", "milestone");
    });

    it("degrades an inverted range to a milestone rather than a negative bar", () => {
      renderTimeline([
        {
          id: "a",
          title: "Backwards",
          start: new Date(2026, 7, 10),
          end: new Date(2026, 7, 2),
          lane: "a",
        },
      ]);
      expect(screen.getByRole("button", { name: /Backwards/ })).toHaveAttribute("data-shape", "milestone");
    });

    it("names each bar with its dates", () => {
      renderTimeline([
        { id: "a", title: "Span", start: new Date(2026, 7, 4), end: new Date(2026, 7, 8), lane: "a" },
      ]);
      const expected = `Span, ${dayLabel(new Date(2026, 7, 4))} to ${dayLabel(new Date(2026, 7, 8))}`;
      // ", info" is appended by withTone() — see the calendar case above.
      expect(screen.getByRole("button", { name: /Span/ })).toHaveAccessibleName(`${expected}, info`);
    });

    it("stacks overlapping bars in one lane", () => {
      renderTimeline([
        { id: "a", title: "First", start: new Date(2026, 7, 3), end: new Date(2026, 7, 9), lane: "a" },
        {
          id: "b",
          title: "Second",
          start: new Date(2026, 7, 6),
          end: new Date(2026, 7, 12),
          lane: "a",
        },
      ]);
      const first = screen.getByRole("button", { name: /First/ });
      const second = screen.getByRole("button", { name: /Second/ });
      // Stacked, not overlapping: different vertical offsets within the lane.
      expect(first.style.top).not.toBe(second.style.top);
    });

    it("clips a span running past the window instead of stretching the axis", () => {
      renderTimeline([
        {
          id: "a",
          title: "Huge",
          start: new Date(2026, 5, 1),
          end: new Date(2026, 11, 31),
          lane: "a",
        },
      ]);
      expect(screen.getByRole("button", { name: /Huge/ })).toHaveAttribute("data-clipped", "true");
    });

    it("opens a record when its bar is clicked", async () => {
      const onItemClick = renderTimeline([
        { id: "a", title: "Span", start: new Date(2026, 7, 4), lane: "a" },
      ]);
      await userEvent.click(screen.getByRole("button", { name: /Span/ }));
      expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    });

    it("changes the zoom without persisting it", async () => {
      renderTimeline([{ id: "a", title: "A", start: new Date(2026, 7, 4), lane: "a" }]);
      await userEvent.click(screen.getByRole("radio", { name: "Quarter" }));
      expect(screen.getByRole("radio", { name: "Quarter" })).toBeChecked();
      // Zoom is a reading posture, not a preference — nothing is written.
      expect(window.localStorage.length).toBe(0);
    });

    it("renders the axis when nothing is in range", () => {
      renderTimeline([]);
      expect(screen.getByRole("region", { name: "Lane A" })).toBeInTheDocument();
    });
  });
}

/* ─── ported from components/ui/view-switcher.test.tsx ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  const UNTIMED: readonly ViewMode[] = ["list", "kanban", "table"];

  describe("DataViewsSwitcher", () => {
    it("marks only the active view as checked", () => {
      render(<DataViewsSwitcher viewMode="kanban" onViewModeChange={() => {}} />);
      expect(screen.getByRole("radio", { name: "Board" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "List" })).not.toBeChecked();
    });

    it("reports the chosen view", async () => {
      const onViewModeChange = vi.fn();
      render(<DataViewsSwitcher viewMode="kanban" onViewModeChange={onViewModeChange} />);
      await userEvent.click(screen.getByRole("radio", { name: "Table" }));
      expect(onViewModeChange).toHaveBeenCalledWith("table");
    });

    it("exposes exactly one tab stop", () => {
      render(<DataViewsSwitcher viewMode="kanban" onViewModeChange={() => {}} />);
      const radios = screen.getAllByRole("radio");
      expect(radios.filter((r) => r.getAttribute("tabindex") === "0")).toHaveLength(1);
    });

    /* Same reasoning as ModeSwitcher: the `+ length` in
     `(index + delta + length) % length` only ever matters at the left edge, so
     the left edge is asserted directly rather than inferred from a mid-group
     step. Asserted at BOTH list lengths, because the modulus is now taken over
     a per-section list — a wrap correct at three and wrong at five is exactly
     the regression this locks. */
    it("wraps backwards from the first view to the last (untimed section)", async () => {
      const onViewModeChange = vi.fn();
      render(<DataViewsSwitcher viewMode="list" views={UNTIMED} onViewModeChange={onViewModeChange} />);
      screen.getByRole("radio", { name: "List" }).focus();

      await userEvent.keyboard("{ArrowLeft}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("table");

      await userEvent.keyboard("{ArrowUp}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("table");
    });

    it("wraps forwards from the last view to the first (untimed section)", async () => {
      const onViewModeChange = vi.fn();
      render(<DataViewsSwitcher viewMode="table" views={UNTIMED} onViewModeChange={onViewModeChange} />);
      screen.getByRole("radio", { name: "Table" }).focus();

      await userEvent.keyboard("{ArrowRight}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("list");

      await userEvent.keyboard("{ArrowDown}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("list");
    });

    it("wraps backwards from the first view to the last (time-capable section)", async () => {
      const onViewModeChange = vi.fn();
      render(<DataViewsSwitcher viewMode="list" onViewModeChange={onViewModeChange} />);
      screen.getByRole("radio", { name: "List" }).focus();

      await userEvent.keyboard("{ArrowLeft}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("timeline");
    });

    it("wraps forwards from the last view to the first (time-capable section)", async () => {
      const onViewModeChange = vi.fn();
      render(<DataViewsSwitcher viewMode="timeline" onViewModeChange={onViewModeChange} />);
      screen.getByRole("radio", { name: "Timeline" }).focus();

      await userEvent.keyboard("{ArrowRight}");
      expect(onViewModeChange).toHaveBeenLastCalledWith("list");
    });

    it("renders only the views it is given", () => {
      render(<DataViewsSwitcher viewMode="list" views={UNTIMED} onViewModeChange={() => {}} />);
      expect(screen.queryByRole("radio", { name: "Calendar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: "Timeline" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(3);
    });

    it("offers the time views when they are available", () => {
      render(<DataViewsSwitcher viewMode="calendar" onViewModeChange={() => {}} />);
      expect(screen.getByRole("radio", { name: "Calendar" })).toBeChecked();
      expect(screen.getAllByRole("radio")).toHaveLength(5);
    });

    function StatefulViewSwitcher() {
      const [viewMode, setViewMode] = useState<ViewMode>("kanban");
      return <DataViewsSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />;
    }

    it("moves focus to the newly selected view", async () => {
      render(<StatefulViewSwitcher />);
      screen.getByRole("radio", { name: "Board" }).focus();

      await userEvent.keyboard("{ArrowRight}");

      await waitFor(() => {
        expect(screen.getByRole("radio", { name: "Table" })).toHaveFocus();
      });
    });
  });
}

/* ─── ported from lib/date-range.test.ts ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  describe("date-range", () => {
    it("keys a late-evening time to its own local day, not the UTC day", () => {
      // 23:00 local in America/Los_Angeles is already the next day in UTC.
      // Keying by UTC would silently move this item forward one day.
      const late = new Date(2026, 7, 4, 23, 0, 0);
      expect(localDayKey(late)).toBe("2026-08-04");
    });

    it("pads month and day to two digits", () => {
      expect(localDayKey(new Date(2026, 0, 9))).toBe("2026-01-09");
    });

    it("collapses a time to local midnight", () => {
      const noon = new Date(2026, 7, 4, 12, 30);
      const midnight = startOfLocalDay(noon);
      expect(midnight.getHours()).toBe(0);
      expect(midnight.getDate()).toBe(4);
    });

    it("compares days, not instants", () => {
      expect(isSameLocalDay(new Date(2026, 7, 4, 1), new Date(2026, 7, 4, 23))).toBe(true);
      expect(isSameLocalDay(new Date(2026, 7, 4), new Date(2026, 7, 5))).toBe(false);
    });

    it("crosses a month boundary when adding days", () => {
      expect(localDayKey(addDays(new Date(2026, 7, 31), 1))).toBe("2026-09-01");
    });

    it("stays on local midnight across a DST transition", () => {
      // 2026-11-01 is the US DST end. Adding a day by milliseconds would land at
      // 23:00 the previous day; re-normalising to local midnight must not.
      const beforeDst = new Date(2026, 9, 31);
      expect(localDayKey(addDays(beforeDst, 2))).toBe("2026-11-02");
      expect(addDays(beforeDst, 2).getHours()).toBe(0);
    });

    it("treats a missing end as a milestone", () => {
      const r = normalizeRange({ start: new Date(2026, 7, 4) });
      expect(r.isMilestone).toBe(true);
      expect(isSameLocalDay(r.start, r.end)).toBe(true);
    });

    it("treats an end equal to start as a milestone", () => {
      const day = new Date(2026, 7, 4);
      expect(normalizeRange({ start: day, end: day }).isMilestone).toBe(true);
    });

    it("degrades an inverted range to a milestone instead of a negative span", () => {
      const r = normalizeRange({ start: new Date(2026, 7, 10), end: new Date(2026, 7, 2) });
      expect(r.isMilestone).toBe(true);
      expect(localDayKey(r.start)).toBe("2026-08-10");
      expect(r.end.getTime()).toBe(r.start.getTime());
    });

    it("keeps a real span", () => {
      const r = normalizeRange({ start: new Date(2026, 7, 4), end: new Date(2026, 7, 8) });
      expect(r.isMilestone).toBe(false);
      expect(localDayKey(r.end)).toBe("2026-08-08");
    });

    it("parses an ISO date as a local day, not UTC midnight", () => {
      expect(localDayKey(parseLocalDate("2026-08-04"))).toBe("2026-08-04");
    });

    it("labels a day for an accessible name", () => {
      expect(dayLabel(new Date(2026, 7, 4))).toMatch(/4 August 2026|August 4, 2026/);
    });
  });
}

/* ─── ported from lib/pack-rows.test.ts ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  function e(id: string, start: number, end: number) {
    return { id, start, end };
  }

  describe("packRows", () => {
    it("puts non-overlapping entries on one row", () => {
      const packed = packRows([e("a", 1, 2), e("b", 4, 5)]);
      expect(packed.map((p) => p.row)).toEqual([0, 0]);
    });

    it("stacks overlapping entries", () => {
      const packed = packRows([e("a", 1, 5), e("b", 3, 7)]);
      expect(packed.map((p) => p.row)).toEqual([0, 1]);
    });

    it("uses a third row when an entry overlaps two", () => {
      const packed = packRows([e("a", 1, 9), e("b", 2, 9), e("c", 3, 9)]);
      expect(packed.map((p) => p.row)).toEqual([0, 1, 2]);
    });

    it("reuses a freed row", () => {
      const packed = packRows([e("a", 1, 3), e("b", 2, 8), e("c", 5, 6)]);
      // 'c' starts after 'a' ends, so it drops back to row 0 rather than opening a third.
      expect(packed.find((p) => p.id === "c")!.row).toBe(0);
    });

    it("treats touching entries as overlapping", () => {
      // Same end and start day means both occupy that day; sharing a row would
      // render them as one continuous bar.
      const packed = packRows([e("a", 1, 3), e("b", 3, 5)]);
      expect(packed.map((p) => p.row)).toEqual([0, 1]);
    });

    it("orders by start regardless of input order", () => {
      const packed = packRows([e("b", 5, 6), e("a", 1, 2)]);
      expect(packed.map((p) => p.id)).toEqual(["a", "b"]);
    });

    it("returns an empty array unchanged", () => {
      expect(packRows([])).toEqual([]);
    });
  });
}

/* ─── ported from lib/data-views.types.test.ts ───
   Wrapped in a block: the upstream files were separate modules and freely
   reuse top-level names (Row, GROUPS, row, setup). Concatenating them into
   the one file a multi-file item is allowed makes those collide, and block
   scope is the smallest fix that keeps every test verbatim. */
{
  interface Row {
    id: string;
    at: Date;
  }

  const base = {
    groups: [],
    renderCard: () => null,
    columns: [],
    renderRow: () => null,
  };

  describe("time capability", () => {
    it("is false when neither field is supplied", () => {
      expect(hasTimeCapability(base)).toBe(false);
    });

    it("is true when both are supplied", () => {
      expect(
        hasTimeCapability({
          ...base,
          getDateRange: (r: Row) => ({ start: r.at }),
          renderChip: () => null,
        }),
      ).toBe(true);
    });

    it("is false when only one is supplied", () => {
      // The type forbids this; the guard must still hold at runtime for data
      // crossing a boundary the compiler did not check.
      expect(hasTimeCapability({ ...base, getDateRange: (r: Row) => ({ start: r.at }) })).toBe(false);
      expect(hasTimeCapability({ ...base, renderChip: () => null })).toBe(false);
    });

    it("exposes a class for every tone", () => {
      expect(Object.keys(GROUP_TONE_MARK).sort()).toEqual(["info", "neutral", "success", "warning"]);
    });
  });
}
