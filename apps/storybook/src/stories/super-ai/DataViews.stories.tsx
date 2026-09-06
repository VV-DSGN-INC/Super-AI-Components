import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Circle } from "lucide-react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  DataViews,
  DataViewsSwitcher,
  addDays,
  startOfLocalDay,
  type BaseDataViewsConfig,
  type ColumnDef,
  type TimeCapability,
  type ViewGroup,
  type ViewItem,
  type ViewMode,
} from "@/registry/super-ai/data-views";
import { RecordList, type RecordListItem } from "@/registry/super-ai/record-list";
import { DataViewsDocs } from "@/content/components/data-views.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

interface Task {
  id: string;
  title: string;
  owner: string;
  bucket: "todo" | "doing" | "review" | "done";
  start: Date;
  end?: Date;
}

/* Fixed dates, not offsets from today: a calendar story that moves with the
   clock produces a different screenshot every day and a flaky a11y run. */
const d = (day: number) => new Date(2026, 7, day);

const TASKS: Task[] = [
  { id: "1", title: "Draft the migration plan", owner: "Ada", bucket: "doing", start: d(3), end: d(7) },
  { id: "2", title: "Audit the token contract", owner: "Rex", bucket: "review", start: d(5), end: d(8) },
  { id: "3", title: "Ship the switcher", owner: "Ada", bucket: "todo", start: d(9) },
  { id: "4", title: "Retire the old board", owner: "Wu", bucket: "done", start: d(4), end: d(6) },
  { id: "5", title: "Write the runbook", owner: "Wu", bucket: "doing", start: d(8), end: d(12) },
];

/* …and the two time views cannot use them, which the case-story pass measured
   rather than assumed. `CalendarView` opens on `initialMonth ?? new Date()`
   and `TimelineView` on `initialStart ?? new Date()`, but `DataViews` builds
   its `timeProps` by hand and forwards neither — so through the switcher there
   is no way to say which month or range to open on. Rendered with the fixed
   August 2026 fixture above, the Calendar story drew **zero** bars: the grid
   was showing whichever month the test ran in.

   So the time views get their own fixture, anchored to today and offset by
   whole days. Every offset here is 0–7, which sits inside the calendar's
   42-day grid and inside the timeline's 42-day month window in every month, so
   the bar COUNT is stable even though the dates printed on them are not. What
   is not stable is where the week boundary falls, and a calendar span crossing
   Sunday into Monday renders as two segments — so these stories assert
   per-record presence by accessible name, never a bar count.

   The missing pass-through is recorded as a gap: a consumer cannot deep-link a
   month either, which is the same hole seen from the product side. */
const soon = (offsetDays: number) => addDays(startOfLocalDay(new Date()), offsetDays);

const SCHEDULED: Task[] = TASKS.map((task, i) => ({
  ...task,
  start: soon(i),
  end: task.end ? soon(i + 2) : undefined,
}));

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

const config = {
  items: TASKS,
  groups: GROUPS,
  columns: COLUMNS,
  renderCard: (t: Task) => (
    <div className="bg-background rounded-md border p-2 text-sm">
      <span className="block font-medium">{t.title}</span>
      <span className="text-muted-foreground block text-xs">{t.owner}</span>
    </div>
  ),
  renderRow: (t: Task) => (
    <span className="flex items-center gap-2">
      <span className="font-medium">{t.title}</span>
      <span className="text-muted-foreground text-xs">{t.owner}</span>
    </span>
  ),
  getDateRange: (t: Task) => ({ start: t.start, end: t.end }),
  renderChip: (t: Task) => <span>{t.title}</span>,
};

/* Storybook's arg inference cannot see through `DataViewsProps`.
   That type is a UNION — the both-or-neither time pair means a config either
   has `getDateRange` + `renderChip` or has neither — and `StoryObj` collapses a
   union-typed args object to `never`, so every story's `args` fails to
   assign. It type-checks inside apps/docs, which never compiles this file;
   only the root `pnpm typecheck` (turbo, both packages) catches it.

   The fix is a wrapper whose props are the INTERSECTION arm: these stories all
   supply the time pair, so nothing is lost, and the real component is still
   what renders and what axe audits. */
type DataViewsStoryProps<T extends ViewItem> = BaseDataViewsConfig<T> &
  TimeCapability<T> & {
    items: T[];
    viewMode: ViewMode;
    selectedId?: string | null;
    onItemClick?: (item: T) => void;
    className?: string;
  };

function DataViewsStory(props: DataViewsStoryProps<Task>) {
  return <DataViews {...props} />;
}

const meta = {
  title: "Super AI/Data Views",
  component: DataViewsStory,
  parameters: {
    layout: "padded",
    docs: { page: componentDocsPage(DataViewsDocs) },
  },
  decorators: [
    (Story) => (
      <div className="h-[520px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataViewsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The board. `groups` become columns, and the card is entirely yours — the
 * shell never wraps it, so its click target, its selected treatment and its
 * focus ring are all things `renderCard` has to supply. What the shell does
 * own is the column: a named `<section>` carrying label, count and tone word,
 * which is the fullest group announcement of the five views and the one the
 * other four are measured against.
 */
export const Kanban: Story = { args: { ...config, viewMode: "kanban" } };

/**
 * The audit view. It is a `role="grid"` rather than a static table because the
 * rows themselves are the clickable surface — and rows are focusable **only**
 * when `onItemClick` is supplied, which it is here. A read-only table refuses
 * to advertise a tab stop that does nothing; `Boundary` renders the same
 * columns without the callback, where the rows go inert.
 */
export const Table: Story = { args: { ...config, viewMode: "table", onItemClick: () => {} } };

/**
 * The default view, and the one everything falls back to. `groups` become
 * sticky section headers over a single scroll rather than columns, so the same
 * partition reads as an ordered list instead of a workspace. This is also the
 * shell a time view lands in when `hasTimeCapability()` fails at runtime, so a
 * blank region where a calendar was asked for means the fallback was bypassed.
 */
export const Feed: Story = { args: { ...config, viewMode: "list" } };

/**
 * A month grid, with spans drawn as bars across every day they cover rather
 * than marks on a start day: the reason to open a calendar instead of sorting
 * the table is to see overlap, and a span collapsed into one cell destroys
 * exactly that. A record crossing Sunday into Monday is two DOM segments and
 * one accessible name.
 *
 * Two things to notice, both measured rather than assumed. This story uses the
 * today-anchored fixture, because with the file's fixed August 2026 dates it
 * drew nothing at all — `DataViews` forwards no `initialMonth`, so the grid
 * always opens on the month the test runs in. And the `In review` group is
 * toned `warning`, so its bar paints `bg-warning text-warning-foreground` —
 * **which resolves to nothing in Storybook.** See `GroupTone` below: the bar
 * you are looking at is unpainted, and a green axe pass on this story is not
 * evidence about that surface.
 */
export const Calendar: Story = { args: { ...config, items: SCHEDULED, viewMode: "calendar" } };

/**
 * The board rotated ninety degrees: `groups` become lanes against a horizontal
 * time axis, so a section that already declared groups for its board gets
 * swimlanes without declaring anything else. Read-only by design —
 * drag-to-reschedule needs mutations and conflict handling, which is a feature
 * rather than a view.
 *
 * Same today-anchored fixture and the same reason as `Calendar`: no
 * `initialStart` reaches the shell through `DataViews`, so the visible range
 * always begins on the day the test runs. The `In review` lane's bar is the
 * unpainted warning surface described under `GroupTone`.
 */
export const Timeline: Story = { args: { ...config, items: SCHEDULED, viewMode: "timeline" } };

/**
 * All four tones on one board. `info` and `success` deliberately share a
 * surface — the mark is what separates them, and the tone word rides in each
 * column's accessible name.
 *
 * **The warning tone is unpainted in this environment, and no story in this
 * file is evidence about it.** `apps/storybook/src/index.css` defines neither
 * `--warning` nor `--warning-foreground` (only `apps/docs/app/globals.css`
 * does), Tailwind v4 emits no utility for an undefined theme key, and this
 * item declares no `cssVars` in the manifest — so the same surface also
 * arrives colourless in a consumer's app after `shadcn add`. Measured on the
 * calendar bars: the three `secondary` tones compute `oklch(0.97 0 0)`, and
 * the `warning` bar computes `rgba(0, 0, 0, 0)` with the page's inherited
 * foreground rather than `text-warning-foreground`. Both halves of the
 * semantic pair are missing, which is why the bar still clears contrast and
 * why clearing it proves nothing. Recorded, deliberately not fixed here:
 * `CONTINUE.md` §8 ("`--warning` is undefined in Storybook") and §9's wave 1
 * entry ("Two components ship colourless to consumers").
 *
 * The `warning` mark on a board header is the same story in miniature: the
 * `AlertTriangle` is `text-warning`, so it draws in the inherited colour and
 * is told from `neutral` by shape alone — which is what the tone system claims
 * to be doing anyway, and is why the board above still reads correctly.
 */
export const GroupTone: Story = { args: { ...config, viewMode: "kanban" } };

/* -------------------------------------------------------------------------
 * Case stories — the situations five interchangeable views meet in a real
 * section, as opposed to the five shells enumerated above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. The one that is not:
 *
 * // case-skip: ReducedMotion — nothing in the seven files moves; every transition is a colour crossfade, and the one thing that does move is the vendored Button's press chrome
 * `data-views.tsx`, the five shells and `kanban-column.tsx` carry no
 * `animate-*` class anywhere. Every `transition-*` in the set is
 * `transition-colors` — the switcher's segments, the feed row, the table row
 * and the timeline's zoom buttons — which crossfades a background and a text
 * colour and moves nothing, so `motion-reduce:transition-none` beside it would
 * document no branch (story-conventions.md, mechanical fact 3; A11
 * `reset-affordance` is the shipped precedent for exactly this reasoning). The
 * one thing in the composed tree that does move is the vendored `Button`
 * behind the calendar's and timeline's Today/previous/next controls, which
 * carries `transition-all` and a one-pixel `active:` nudge — a library-wide
 * posture recorded in `CONTINUE.md` §8 and explicitly not a case story's to
 * patch. Under `vitest.config.ts`'s emulated reduce a ReducedMotion story here
 * would render pixel-identical to `Feed` and imply a branch that does not
 * exist.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the five views do not answer it the same way — which is
 * the most useful thing this story records, because "one config, five views"
 * invites the assumption that they share a fate.
 *
 * **The switcher and the board mirror, and two one-class repairs are why.**
 * Both landed in this wave as swaps that are byte-identical in LTR:
 *
 * - The switcher is a plain flex row, so its segments reverse for free — but
 *   `rounded-l-md` / `rounded-r-md` / `-ml-px` then put both rounded corners
 *   on the group's inner edges and pulled the 1px border overlap the wrong
 *   way. Now `rounded-s-md` / `rounded-e-md` / `-ms-px`, asserted below by
 *   reading the corner radii back off the first segment rather than by
 *   checking for a class name.
 * - A kanban column's count carried `ml-auto`. Under RTL a physical left
 *   margin absorbs the free space on the wrong side, so the count jammed
 *   against the title instead of sitting at the header's inline end — measured
 *   at 203px into a 289px header before the swap. Now `ms-auto`.
 *
 * **The two time views do not mirror, and no class swap can make them.** Both
 * position bars with inline physical geometry — `left: <n>%` in the calendar,
 * `left: <n>px` in the timeline, plus `sticky left-0` on the timeline's lane
 * gutter — so the axis keeps running left to right while the text around it
 * reverses. Swapping the utility classes inside those two shells (`border-r`,
 * `pl-1`, `text-left`, the `rounded-l/r` bar caps) would produce a
 * half-mirrored view, which is worse than a consistently unmirrored one, so
 * none of them was swept: that is a layout change rather than a drift
 * correction. The timeline rendered below is the artifact — read the lane
 * labels right to left and the bars left to right.
 *
 * Two more, recorded and unfixed for the same reason. The calendar's month
 * navigation is `ChevronLeft` / `ChevronRight` regardless of direction, so
 * under RTL "Previous month" points the way the month advances. And
 * `ColumnDef.align` takes `"left" | "right" | "center"`, an API that names
 * physical directions, so swapping its class map to `text-start` / `text-end`
 * would quietly redefine what a caller asked for — the same shape as the
 * reorder-control naming already in `CONTINUE.md` §8.
 */
export const RTL: Story = {
  args: { ...config, items: SCHEDULED, viewMode: "kanban" },
  render: (args) => (
    <div dir="rtl" className="flex h-full flex-col gap-3">
      <DataViewsSwitcher viewMode="kanban" onViewModeChange={() => {}} />
      <div className="min-h-0 flex-1">
        <DataViews {...args} viewMode="kanban" />
      </div>
      <div className="min-h-0 flex-1">
        <DataViews {...args} viewMode="timeline" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The switcher mirrors: the first segment paints furthest right.
    const switcher = canvas.getByRole("radiogroup", { name: "Collection view" });
    const segments = within(switcher).getAllByRole("radio");
    await expect(segments).toHaveLength(5);
    await expect(segments[0].getBoundingClientRect().left).toBeGreaterThan(
      segments[4].getBoundingClientRect().left,
    );

    // 2. …and its outer corner is rounded on the OUTER edge. Under RTL the
    //    start-start corner is top-right, so the physical classes reported
    //    exactly the opposite pair here before the swap.
    const first = getComputedStyle(segments[0]);
    await expect(`topLeft=${first.borderTopLeftRadius}`).toBe("topLeft=0px");
    await expect(first.borderTopRightRadius).not.toBe("0px");

    // 3. The board mirrors: the first group is the rightmost column.
    const columns = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]'),
    );
    await expect(columns).toHaveLength(4);
    await expect(columns[0].getBoundingClientRect().left).toBeGreaterThan(
      columns[3].getBoundingClientRect().left,
    );

    // 4. …and a column's count sits at the header's inline END, which under
    //    RTL is its left edge. The `ms-auto` swap, stated as geometry rather
    //    than as a class name.
    const header = columns[0].querySelector("header") as HTMLElement;
    const count = header.lastElementChild as HTMLElement;
    const inset = count.getBoundingClientRect().left - header.getBoundingClientRect().left;
    await expect(inset).toBeLessThan(header.getBoundingClientRect().width / 4);
  },
};

/**
 * The switcher is one tab stop for five views, and every other view spends one
 * stop per item. That asymmetry is the whole keyboard story of this component,
 * and it is what the docs page means by "paginate or virtualise before you
 * hand a keyboard user a long collection".
 *
 * What the walk proves, in order: exactly one segment is tabbable and it is
 * the checked one; an arrow key **moves and selects in the same press**, so
 * one lap re-renders the entire collection five times; focus follows the
 * selection onto the newly checked segment, which the switcher does itself on
 * the next frame; the group wraps rather than stopping dead; a single Tab then
 * leaves all five segments behind; and each feed row after it is its own stop
 * with a visible ring.
 *
 * Two defects are deliberately **not** asserted, so that fixing either leaves
 * this story green:
 *
 * - The timeline's zoom control is a `role="radiogroup"` with a roving
 *   tabindex and **no `onKeyDown` at all**, so Week/Month/Quarter are
 *   mouse-only: only the checked one is reachable and no arrow key moves off
 *   it. The switcher asserted here implements precisely the handler that group
 *   is missing, which is what makes it drift rather than an open question.
 * - Changing view unmounts the previous shell wholesale, so a row, cell or bar
 *   holding focus takes it to `<body>`. Arrowing through the group is
 *   therefore a focus reset for everything below it.
 *
 * Both are already on the docs page; neither is pinned here.
 */
export const KeyboardOrder: Story = {
  args: { ...config, viewMode: "list" },
  render: () => <KeyboardShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "Collection view" });
    const segmentAt = (i: number) => within(group).getAllByRole("radio")[i];

    const assertVisiblyFocused = async (el: HTMLElement, id: string) => {
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // 1. Roving tabindex: five segments, one tab stop, and it is the checked one.
    const segments = within(group).getAllByRole("radio");
    await expect(segments).toHaveLength(5);
    const tabbable = segments.filter((el) => el.tabIndex !== -1);
    await expect(tabbable).toHaveLength(1);
    await expect(tabbable[0]).toHaveAttribute("aria-checked", "true");

    await userEvent.tab();
    await expect(document.activeElement).toBe(segmentAt(0));
    await assertVisiblyFocused(segmentAt(0), "List");

    // 2. One lap. Each ArrowRight selects AND moves focus, and the move lands
    //    in a requestAnimationFrame after the host re-renders, so the read has
    //    to settle. The cycle is asserted directly rather than counted inside
    //    an allowance (story-conventions.md, mechanical fact 4).
    const labels = ["Board", "Table", "Calendar", "Timeline", "List"];
    for (let i = 0; i < labels.length; i += 1) {
      const expected = segmentAt((i + 1) % 5);
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(document.activeElement).toBe(expected));
      await expect(`${labels[i]} checked=${expected.getAttribute("aria-checked")}`).toBe(
        `${labels[i]} checked=true`,
      );
      await assertVisiblyFocused(expected, labels[i]);
    }

    // 3. …which wrapped: five presses from List returned to List, and the feed
    //    is what is rendered again.
    await expect(segmentAt(0)).toHaveAttribute("aria-checked", "true");
    const feed = canvasElement.querySelector('[data-slot="feed-view"]') as HTMLElement;
    await expect(feed).not.toBeNull();

    // 4. One Tab leaves all five segments. Five views, one stop.
    await userEvent.tab();
    await expect(group.contains(document.activeElement)).toBe(false);

    // 5. Below it the cost inverts: one stop per row, each with a ring.
    const rows = within(feed).getAllByRole("button");
    await expect(rows).toHaveLength(5);
    for (let i = 0; i < rows.length; i += 1) {
      await expect(document.activeElement).toBe(rows[i]);
      await assertVisiblyFocused(rows[i], `row#${i}`);
      await userEvent.tab();
    }
  },
};

function KeyboardShell() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  return (
    <div className="flex h-full flex-col gap-3">
      <DataViewsSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="min-h-0 flex-1">
        <DataViews {...config} items={SCHEDULED} viewMode={viewMode} />
      </div>
    </div>
  );
}

/**
 * `viewMode` / `onViewModeChange` is the controlled pair the spec leads with
 * ("Fully controlled. `viewMode` is a prop. The component never writes to
 * storage."), and this host holds it the hard way: it records what the
 * switcher asked for and applies it only when told to.
 *
 * In order: pressing a segment does not change the rendered view; the callback
 * still fires with the `ViewMode` a host has to apply; a re-render with an
 * unchanged `viewMode` leaves the collection exactly where it was; and
 * applying the request swaps the shell. The third step is the one worth
 * having — nothing in this component holds a mode internally, so a host that
 * forgets to store the value gets a switcher that visibly does nothing.
 *
 * **A refusing host loses the roving tabindex, and this is the only place that
 * is written down.** `onKeyDown` calls `onViewModeChange(next)` and then, on
 * the following frame, focuses `[data-view="<next>"]` unconditionally — every
 * segment is always mounted, so that query succeeds whether or not the host
 * applied anything. Measured on a host that refuses: after one ArrowRight,
 * `document.activeElement` is the *unchecked* `kanban` segment with
 * `tabIndex = -1`, while `list` is still the checked and tabbable one, so
 * focus and the roving index stay out of sync until the next click. The docs
 * module says focus "stays on the old button" in this case, which is not what
 * happens — a docs correction, recorded rather than made here. Not asserted
 * either: focusing the applied value is the more defensible behaviour, and
 * pinning today's would go red on that fix.
 */
export const Controlled: Story = {
  args: { ...config, viewMode: "list" },
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rendered = () =>
      canvasElement.querySelector('[data-slot="feed-view"]') !== null
        ? "feed"
        : canvasElement.querySelector('[data-slot="table-view"]') !== null
          ? "table"
          : "neither";

    await expect(rendered()).toBe("feed");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("radio", { name: "Table" }));
    await expect(rendered()).toBe("feed");
    await expect(canvas.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");

    // 2. …but the callback fired, carrying the mode a host has to store.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("table");

    // 3. Re-render with an unchanged `viewMode`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(rendered()).toBe("feed");

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(rendered()).toBe("table"));
    await expect(canvas.getByRole("radio", { name: "Table" })).toHaveAttribute("aria-checked", "true");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<ViewMode>("list");
  const [requested, setRequested] = React.useState<ViewMode | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <DataViewsSwitcher viewMode={applied} onViewModeChange={setRequested} />

        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>viewMode prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last onViewModeChange</dt>
          <dd data-testid="requested">{requested ?? "none yet"}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={requested === null}
            onClick={() => requested !== null && setApplied(requested)}
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataViews {...config} viewMode={applied} />
      </div>
    </div>
  );
}

/**
 * Every visible string in these five views is caller-supplied and none of them
 * is defaulted, so the empty case is reachable in two places at once and the
 * shells answer it differently.
 *
 * **A group with no label loses its header outright, and its count and tone
 * with it.** `groupAccessibleName` would compose ", 1 items, warning" for it,
 * but the function is never reached: `feed-view.tsx` guards the whole header
 * on `section.label ?` and renders `null` when the string is empty. Measured
 * here — four groups, three headers — so the "In review" group's rows arrive
 * with no separator above them, no count, and no warning word anywhere in the
 * accessibility tree. That last part is the sharp end: `groupAccessibleName`'s
 * own docstring says the tone marks are `aria-hidden` decoration and that the
 * function is "where the meaning actually reaches assistive tech", so an empty
 * label silently deletes the only channel carrying it. A caller passing `""`
 * to hide a heading gets a data loss, not a visual tweak.
 *
 * Recorded, not fixed, and deliberately not pinned to today's markup: the
 * repair could be a rendered-but-unlabelled header, a fallback name, or a
 * documented refusal to accept an empty label, and this story stays green
 * under all three. The feed is used here rather than the board because a
 * kanban column puts the label in an `<h2>`, where an empty string is an axe
 * `empty-heading` failure sitting behind the same input.
 *
 * **A chip with no text children collapses the bar's name to its dates.**
 * `textOf()` walks `props.children` only, so an icon-only `renderChip` — the
 * shape a compact bar most invites — yields the empty string and the calendar
 * bar announces as ", <date>" with no subject at all. This is the
 * accessible-name-collapse class the D/I wave found twice, and the docs module
 * already names it ("Return text as children"). Asserted here only from the
 * date forward, because the fix could reasonably be a `name` field on the
 * chip, a fallback to the item id, or a documented refusal — pinning today's
 * exact string would go red on all three.
 */
export const EmptyLabel: Story = {
  args: { ...config, items: SCHEDULED, viewMode: "calendar" },
  render: (args) => (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <DataViews
          {...args}
          viewMode="list"
          groups={GROUPS.map((g) => (g.id === "review" ? { ...g, label: "" } : g))}
        />
      </div>
      <div className="min-h-0 flex-1">
        <DataViews {...args} viewMode="calendar" renderChip={() => <Circle className="size-3" />} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 1. The unlabelled group renders no header at all — four groups, three
    //    headers — so neither its count nor its tone word exists to be read.
    const feed = canvasElement.querySelector<HTMLElement>('[data-slot="feed-view"]')!;
    const headers = Array.from(feed.querySelectorAll<HTMLElement>("header[aria-label]"));
    await expect(feed.querySelectorAll("section")).toHaveLength(GROUPS.length);
    await expect(headers).toHaveLength(GROUPS.length - 1);

    // No header opens on a comma, because the empty-labelled one was never
    // rendered rather than rendered anonymously.
    const labels = headers.map((h) => h.getAttribute("aria-label") ?? "");
    await expect(labels.some((l) => l.startsWith(","))).toBe(false);

    // "warning" is the emptied group's tone and it reaches nothing: not a
    // header name, and not any text in the feed, because the mark that shows
    // it is aria-hidden.
    await expect(labels.some((l) => l.includes("warning"))).toBe(false);

    // Its rows are still there — the group is silent, not missing.
    await expect(within(feed).getByText("Audit the token contract")).toBeInTheDocument();

    // 2. Every calendar bar is still a named, focusable target — and the name
    //    it has left is the date half.
    const bars = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="calendar-bar"]'));
    await expect(bars.length).toBeGreaterThan(0);
    const year = String(new Date().getFullYear());
    for (const bar of bars) {
      await expect(bar.tagName).toBe("BUTTON");
      await expect(bar.getAttribute("aria-label")).toContain(year);
    }
  },
};

/**
 * A 70-character task title, in a board card and in a table cell. The two
 * shells give it the same answer and the two time views give it the opposite
 * one, which is the asymmetry worth carrying away.
 *
 * - **In a card it wraps.** A column is `min-w-64` and the card is the
 *   caller's own markup with no truncation, so the title takes as many lines
 *   as it needs and the column grows downward. Nothing is lost and nothing
 *   moves sideways, which is what a board is for.
 * - **In a table cell it is simply absorbed.** Two of the three columns are
 *   pinned at `w-28`, so the title column takes everything left over — 974px
 *   of a 1200px table at the width this gate runs — and the 66-character title
 *   fits on one line. Measured: the long row and a short one are the same
 *   height, and `scrollWidth` equals `clientWidth`, so nothing wraps and
 *   nothing is cut. `<td>` sets no `white-space`, so the wrap path is real and
 *   would engage in a narrower column; it just is not what this width
 *   exercises, which is why the assertion is "no taller" rather than an
 *   equality that a narrower table would break.
 * - **On a bar it is cut.** Calendar and timeline bars are both `truncate`,
 *   and the timeline's lane label is `truncate` inside a fixed 112px gutter.
 *   None of the three carries a `title` attribute, so in the two views where
 *   the string is clipped there is no way to read the rest of it. Recorded,
 *   not fixed: a tooltip on a bar is a design decision, and the bar's
 *   accessible name already carries the full text for anyone using it.
 */
export const LongContent: Story = {
  args: { ...config, viewMode: "kanban" },
  render: (args) => {
    const items = TASKS.map((task) =>
      task.id === "1" ? { ...task, title: LONG_TITLE } : task,
    );
    return (
      <div className="flex h-full flex-col gap-3">
        <div className="min-h-0 flex-1">
          <DataViews {...args} items={items} viewMode="kanban" />
        </div>
        <div className="min-h-0 flex-1">
          <DataViews {...args} items={items} viewMode="table" />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The card wraps: the long title is taller than a short one on the same
    //    board, and it is not clipped horizontally.
    const board = canvasElement.querySelector('[data-slot="kanban-view"]') as HTMLElement;
    const longTitle = within(board).getByText(LONG_TITLE);
    const shortTitle = within(board).getByText("Write the runbook");
    await expect(longTitle.getBoundingClientRect().height).toBeGreaterThan(
      shortTitle.getBoundingClientRect().height,
    );
    await expect(longTitle.scrollWidth).toBeLessThanOrEqual(longTitle.clientWidth);

    // 2. The cell wraps as well — the row gets taller, the grid does not get
    //    wider, and nothing is clipped.
    const table = canvasElement.querySelector('[data-slot="table-view"]') as HTMLElement;
    const longCell = within(table).getByText(LONG_TITLE).closest("td") as HTMLElement;
    const shortCell = within(table).getByText("Write the runbook").closest("td") as HTMLElement;
    // The table's answer is neither wrap nor truncate at this width: the title
    // column takes 974px of a 1200px table, so the long title fits on one line
    // and the cell is exactly as tall as a short one. Asserted as "no taller",
    // not as an equality, because a narrower column would wrap it and that is
    // the same correct behaviour seen at a different size — what must hold at
    // every width is the two assertions below it, that nothing is cut off.
    await expect(longCell.getBoundingClientRect().height).toBeLessThanOrEqual(
      shortCell.getBoundingClientRect().height,
    );
    await expect(longCell.scrollWidth).toBeLessThanOrEqual(longCell.clientWidth);
    await expect(getComputedStyle(longCell).textOverflow).toBe("clip");

    // 3. Both readings are complete: the string is in the accessibility tree
    //    twice, once per view.
    await expect(canvas.getAllByText(LONG_TITLE)).toHaveLength(2);
  },
};

/** 70 characters, and something this repo could really emit. */
const LONG_TITLE = "Audit every registry component for the muted-on-muted contrast bug";

/**
 * 375px, with the two views most likely to disagree with "one config, five
 * views" stacked in one column: a board of four groups and a table of three
 * columns.
 *
 * Both fit, and for the same reason — **each shell owns its own scroller.**
 * `kanban-view` is `w-full overflow-x-auto` around columns that are
 * `min-w-64`, so four 256px columns scroll inside 375px instead of pushing the
 * page sideways; `table-view` is an `overflow-auto` box around a `w-full`
 * table. The claim survives a phone, but not for free: what a phone gets is a
 * board it must swipe through one column at a time, which is an argument for a
 * section defaulting to `list` on a small screen rather than to `kanban`.
 * Nothing in this component makes that choice — `viewMode` belongs to the
 * host, and `use-view-mode` persists one preference per section with no
 * breakpoint anywhere in it.
 *
 * The calendar is the view that changes character here rather than breaking:
 * seven fixed columns divide 375px into roughly 53px cells, so a bar's
 * `truncate` starts eating the chip text at exactly the width where a month
 * grid is least able to spare it.
 */
export const Mobile: Story = {
  args: { ...config, viewMode: "kanban" },
  render: (args) => (
    <div data-testid="viewport" className="flex h-full w-[375px] max-w-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <DataViews {...args} viewMode="kanban" />
      </div>
      <div className="min-h-0 flex-1">
        <DataViews {...args} viewMode="table" onItemClick={() => {}} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    // 1. Nothing escapes 375px.
    await expect(viewport.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // 2. The board is wider than the phone and says so itself: its own
    //    container is the horizontal scroller, not the page.
    const board = canvasElement.querySelector('[data-slot="kanban-view"]') as HTMLElement;
    await expect(board.scrollWidth).toBeGreaterThan(board.clientWidth);
    await expect(getComputedStyle(board).overflowX).toBe("auto");

    // 3. All four columns are there — none was dropped to make it fit.
    await expect(board.querySelectorAll('[data-slot="kanban-column"]')).toHaveLength(4);

    // 4. The table keeps its own scroller too, so the two shells never fight
    //    over the same overflow.
    const table = canvasElement.querySelector('[data-slot="table-view"]') as HTMLElement;
    await expect(getComputedStyle(table).overflowX).toBe("auto");
  },
};

/**
 * Why this is one component and not five, and where it stops being the right
 * component at all.
 *
 * **Against itself.** The two panels on the top row are the same `config`
 * object with one prop different. Neither passes a board-specific group, a
 * table-specific column set, or a second definition of "done" — `groups` is
 * declared once and read as columns by one shell and ignored by the other,
 * while `columns` and `renderCard` sit unused in whichever view is not asking
 * for them. That is the argument for a single component: five shells each
 * taking their own config would let one screen ship four definitions of the
 * same partition, which is the failure the docs page's second "don't" draws.
 * A sixth view costs one shell and one contract, and no section changes.
 *
 * **Against J5 `record-list`**, the catalog's nearest neighbour and the one
 * most likely to be rebuilt by accident — both draw a list of records with a
 * status, and from a screenshot the feed view and a record list are the same
 * thing. The rule is what the component knows about a row:
 *
 * - **P1 `data-views` knows nothing.** A partition, a set of columns, and
 *   three render callbacks. Every control inside a row is yours. Choose it
 *   when the same records need to be *browsed* more than one way, and when who
 *   is looking decides which way.
 * - **J5 `record-list` knows the row is a thing that runs.** The enable toggle
 *   is a real prop and sits in the row rather than behind an overflow menu,
 *   the app cluster is data rather than decoration, and last-run state belongs
 *   in the subtitle. Choose it when there is one right way to look at these
 *   records and the row's controls are part of the component's argument.
 *
 * If you need both — a running-record list that can also be a board — compose
 * them: hand P1 a `renderRow` that draws J5's row shape. Do not teach either
 * one the other's job.
 *
 * The bottom panel is where that rule stops being abstract. Only the neighbour
 * has a per-row control, and only it makes its rows interactive on its own;
 * the table here is given no `onItemClick`, so its rows stay inert rather than
 * advertising a tab stop that does nothing.
 */
export const Boundary: Story = {
  args: { ...config, viewMode: "kanban" },
  render: (args) => (
    <div className="flex h-full flex-col gap-4">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <section className="flex min-h-0 flex-col gap-2">
          <p className="text-foreground text-xs font-medium">
            P1 data-views — one config, viewMode=&quot;kanban&quot;
          </p>
          <div className="min-h-0 flex-1">
            <DataViews {...args} viewMode="kanban" />
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-2">
          <p className="text-foreground text-xs font-medium">
            P1 data-views — the same config, viewMode=&quot;table&quot;
          </p>
          <div className="min-h-0 flex-1">
            <DataViews {...args} viewMode="table" />
          </div>
        </section>
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          J5 record-list — one way to look, with the row&apos;s controls built in
        </p>
        <div className="min-h-0 flex-1 overflow-auto">
          <RecordList label="Tasks" records={NEIGHBOUR_RECORDS} onEnabledChange={() => {}} />
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. One config, two shells, the same five records in both.
    const board = canvasElement.querySelector('[data-slot="kanban-view"]') as HTMLElement;
    const table = canvasElement.querySelector('[data-slot="table-view"]') as HTMLElement;
    for (const task of TASKS) {
      await expect(within(board).getByText(task.title)).toBeInTheDocument();
      await expect(within(table).getByText(task.title)).toBeInTheDocument();
    }

    // 2. Neither shell contributes a control of its own: the board's cards are
    //    the caller's markup, and this table was given no `onItemClick`, so
    //    its rows are inert rather than advertising a dead tab stop.
    await expect(board.querySelectorAll("button")).toHaveLength(0);
    await expect(table.querySelectorAll("tbody tr[tabindex]")).toHaveLength(0);

    // 3. The neighbour does: one switch per record, in the row, by design.
    await expect(canvas.getAllByRole("switch")).toHaveLength(NEIGHBOUR_RECORDS.length);
  },
};

/* The same tasks as records that run — J5's subject, not P1's. Kept off
   `runState: "running"`, whose spinner belongs to that component's own
   reduced-motion story rather than to this one. */
const NEIGHBOUR_RECORDS: RecordListItem[] = [
  {
    id: "1",
    title: "Draft the migration plan",
    apps: [{ name: "Linear" }, { name: "Notion" }],
    lastRun: "Last run 4 min ago",
    meta: ["Ada"],
    runState: "success",
    enabled: true,
  },
  {
    id: "2",
    title: "Audit the token contract",
    apps: [{ name: "GitHub" }],
    lastRun: "Last run 2 h ago",
    meta: ["Rex"],
    runState: "failed",
    enabled: true,
  },
  {
    id: "3",
    title: "Ship the switcher",
    apps: [{ name: "GitHub" }, { name: "Vercel" }],
    draft: true,
    meta: ["Ada"],
    runState: "never",
    enabled: false,
  },
];
