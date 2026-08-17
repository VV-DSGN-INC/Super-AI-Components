import type { ComponentDocs } from "@/lib/component-docs";
import {
  EmptyAsATile,
  GroupedByRelativeDate,
  MixedCellShapes,
  SelectModeWithoutAHandler,
} from "./generation-grid.examples";

/**
 * Seeded from docs/design-system/component-specs.md#f2-generation-grid.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./generation-grid.examples
 * client sidecar and are referenced here as zero-prop elements.
 */
export const GenerationGridDocs: ComponentDocs = {
  whatItIs:
    "The gallery a batch of results lands in — a responsive grid with three density settings, optional date grouping, a select mode with a bulk-action bar, and an empty state that occupies a cell rather than the page. It renders its cells through a `renderItem` callback, so it holds results, documents, templates or anything else without growing a variant for each.",
  whyItMatters:
    "Every generation product on the reference board shows the same surface — Midjourney's Organize view, Freepik's generations, Playground's history, getimg's gallery — and they all solve the same three problems. Results arrive at different times, so the grid must not reflow as they resolve. The same grid appears both as a wide library and as a narrow panel beside a composer, so density has to be a setting rather than a second component. And the moment a user wants to delete or download in bulk, per-tile hover actions become the wrong affordance and have to give way to checkboxes. Treating any of those as a fork produces three near-identical grids that drift apart; treating them as props keeps one.",
  evidence: ["Midjourney Organize", "Freepik generations", "Playground history", "getimg"],
  anatomy: [
    { slot: "generation-grid", note: "The column that stacks the bulk bar above the grid or groups." },
    {
      slot: "generation-grid-bulk-actions",
      note: "The select-mode toolbar, carrying a live count and the caller's bulk actions. Only exists in select mode.",
    },
    {
      slot: "generation-grid-selection-count",
      note: "How many items are currently selected — read from `selectedIds`, never tracked separately.",
    },
    {
      slot: "date-section",
      note: "A3 `date-section`, one per group. The grid composes it rather than reimplementing a labelled bucket.",
    },
    {
      slot: "generation-grid-grid",
      note: "The grid itself. Its column classes come only from `density` — nothing about an item's state can reach them.",
    },
    { slot: "generation-grid-item", note: "One cell, keyed by `getItemId`." },
    {
      slot: "generation-grid-empty",
      note: "The empty state's cell. A tile in the grid, not a replacement for it.",
    },
  ],
  usage:
    "Pass `items` for a flat gallery or `groups` for a date-bucketed one — relative buckets like Today and Yesterday read best at the top. Give it `getItemId` and a `renderItem` that returns whatever belongs in a cell; `renderItem` receives `selected`, `selectMode` and `toggleSelected`, so wiring an F1 `result-card` is `selectable={ctx.selectMode} selected={ctx.selected} onSelect={ctx.toggleSelected}`. Choose `density` by context rather than by content: `comfortable` beside a generation panel, `default` for a general gallery, `compact` for a dense library. Selection is fully controlled — hold `selectedIds` yourself and update it from `onSelectionChange`.",
  dos: [
    {
      text: "Group by relative date and put the newest bucket first — that is the order people scan a generation history in.",
      example: <GroupedByRelativeDate />,
    },
    {
      text: "Let the empty state be a tile inside the grid, so the surface still looks like the gallery it is about to become.",
      example: <EmptyAsATile />,
    },
  ],
  donts: [
    {
      text: "Don't turn on select mode without `onSelectionChange` — the checkboxes render but nothing can be checked, and the bulk bar reports zero forever.",
      example: <SelectModeWithoutAHandler />,
    },
    {
      text: "Don't render a different shape per item state; a pending cell that isn't the same size as a finished one makes the row jump the moment it resolves.",
      example: <MixedCellShapes />,
    },
  ],
  accessibility: {
    keyboard: [
      "The grid contributes no tab stops of its own. Every stop comes out of your `renderItem` and out of `bulkActions` — including the checkbox select mode is about, which the grid does not render.",
      'There is no roving tabindex and no arrow-key navigation between cells; `role="list"` promises none. Tab walks every focusable thing in every cell in DOM order, and at `compact` density that is eight cells per visual row with no way to skip a row.',
      "Turning select mode on inserts the bulk toolbar above the grid, which adds a tab stop ahead of every cell and pushes the grid down the page. Nothing moves focus and nothing announces it.",
      "No key does anything special. Escape does not leave select mode, and there is no Shift-click range selection — `toggleSelected` takes no modifiers.",
    ],
    screenReader: [
      'The grid is a `role="list"` of `role="listitem"` cells, so it announces its length: "list, 24 items". The empty state is a listitem too, so an empty gallery announces as a list containing one item.',
      'Grouped mode wraps each bucket in A3 `date-section`, which is a `role="group"` labelled by a `<p>` rather than a heading. "Today" and "Yesterday" are group names, so heading navigation walks straight past the buckets.',
      'The bulk toolbar\'s name carries the count — "Bulk actions, 3 selected" — and the same number is repeated as visible text inside it. Neither sits in a live region, so selecting a fourth item changes both silently.',
      "Nothing announces results arriving. The grid re-renders as cells resolve with no live region of its own, so a batch that finishes while the user is elsewhere on the page is announced as nothing.",
      "Every cell's semantics are yours. The grid puts nothing between the listitem and your `renderItem` output, so whether a result announces its state, its name or its selectedness is decided entirely by what you return.",
    ],
    focus: [
      "Cells are keyed by `getItemId`, so a re-order or a re-group moves the existing DOM node and focus survives it. Removing the item that holds focus does not — it unmounts and focus falls to `<body>`.",
      "Leaving select mode unmounts the bulk toolbar. If focus was on one of your `bulkActions` — the usual case, since a bulk delete is what ends select mode — it lands on `<body>`.",
      "The grid ships no focus styles at all. Every ring in the gallery belongs to a cell you rendered.",
    ],
  },
  pitfalls: [
    "`groups` wins over `items` when both are passed — `items` is ignored entirely rather than appended, so a grid that mysteriously shows nothing is usually one that still has an empty `groups` array on it.",
    "The empty state is decided by whether every group is empty, not by whether `groups` is empty. A grid with three groups that all have zero items renders one empty tile, not three headed sections.",
    "The grid does not import F1 `result-card` — that is deliberate, to keep two sibling components out of each other's import graph. It also means the grid cannot enforce that your cells are the same height; if you hand it mixed shapes, it will lay them out faithfully.",
    "`toggleSelected` is not in the original API sketch for `renderItem`'s context. It was added because without it `onSelectionChange` can never fire — the control that toggles an item lives in your `renderItem` output, not in the grid. If you maintain your own checkbox state alongside `selectedIds`, the two will drift.",
    "Density changes column counts at the `lg` breakpoint and steps down below it, so a `compact` grid in a narrow panel looks a lot like a `default` one. Verify density at the width you actually ship at.",
  ],
};
