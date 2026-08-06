import type { ComponentDocs } from "@/lib/component-docs";

import {
  ClickableRowWithControlsInside,
  FoldersAndFilesInOneTable,
  RowActionsInAnOverflowMenu,
  SelectionModeWithABulkBar,
  SelectionModeWithoutAHandler,
} from "./asset-library.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j1-asset-library.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./asset-library.examples
 * client sidecar and are referenced here as zero-prop elements.
 */
export const AssetLibraryDocs: ComponentDocs = {
  whatItIs:
    "The surface a product's saved work lives on: a header with its actions, a search field, a row of filter chips, a list/grid switch, and one table that holds folders and files together. Rows expose their actions through an overflow menu, and turning on selection mode swaps those menus for checkboxes and reveals a bulk-action bar.",
  whyItMatters:
    "Make, Spline, Canva and Claude's own Library all converge on the same surface, and they converge on the same answer to its hardest question: a folder is a row, not a second pane. The moment folders get their own rail, browsing stops being about finding your work and starts being about knowing where you filed it — the user is now doing storage management on the product's behalf. Keeping both kinds in one table means one sort order, one selection model, one set of columns, and one mental model: everything here is a thing you made, and some of those things contain others. The second convergence is quieter but just as consistent: rows do not carry visible toolbars. A library row is a target you are aiming at, and three buttons per row turn scanning fifty assets into scanning a hundred and fifty controls.",
  evidence: ["Make scenarios", "Spline files", "Canva projects", "Claude Library"],
  anatomy: [
    {
      slot: "section-header",
      note: "A12 `section-header`, holding the title, the live item count, and your header actions (Upload, New folder).",
    },
    {
      slot: "asset-library-search",
      note: "The search field, with an sr-only label. Controlled — it reports what you typed and filters nothing itself.",
    },
    {
      slot: "filter-bar",
      note: "A5 `filter-bar`. Your A5 `filter-chip`s sit at the start of it, the view switch is pushed to its end.",
    },
    {
      slot: "asset-library-view-toggle",
      note: "The list/grid switch. A toggle group, single-select, with sr-only labels on each icon button.",
    },
    {
      slot: "asset-library-bulk-actions",
      note: "The bulk bar. Selection mode only — a toolbar carrying select-all, the live count and your bulk buttons.",
    },
    {
      slot: "asset-library-table",
      note: "The one table. Folders and files share its single `tbody`, its columns and its sort.",
    },
    {
      slot: "asset-library-row",
      note: "One `tr` per item, addressed by `data-asset-id` and tagged `data-kind=\"file\" | \"folder\"`. A plain row: it carries no click handler of its own.",
    },
    {
      slot: "asset-library-name",
      note: "The interactive target — a link when the item has an `href`, a button when you pass `onOpen`, plain text otherwise.",
    },
    {
      slot: "asset-library-row-actions",
      note: "The overflow trigger. Revealed on hover and on focus-within, and stood down entirely in selection mode.",
    },
    {
      slot: "asset-library-select",
      note: "The row's checkbox cell. Exists only in selection mode.",
    },
    {
      slot: "asset-library-grid",
      note: "Grid view's container. The same items, both kinds, in one grid — each cell an `asset-library-tile` built on A8 `preview-tile`.",
    },
    {
      slot: "asset-library-empty",
      note: "Wraps L1 `empty-state`. It replaces the table, never the header, search or chips.",
    },
  ],
  usage:
    "Hand it one `items` array containing both kinds; mark a folder with `kind: \"folder\"` and give it an `itemCount` instead of a `size`. The component sorts folders above files and renders both through the same columns — do not pre-split the list or render two of these side by side. Opening is yours to define: give an item an `href` to navigate, or pass `onOpen` to open in place. Row actions are a render callback, `rowActions`, returning `DropdownMenuItem`s — return nothing for an item that has none and the trigger disappears for that row. Selection is fully controlled, exactly as F2 `generation-grid` does it: hold `selectedIds` yourself and update it from `onSelectionChange`. Search and filter chips are presentation only — the component owns the field and the chips row, you own the list it is given, so client-side and server-side filtering look identical from here.",
  dos: [
    {
      text: "Keep folders and files in one table, and let a folder fill the same columns a file does — Folder in the type column, its item count where a size would be.",
      example: <FoldersAndFilesInOneTable />,
    },
    {
      text: "Put every row action behind the one overflow menu, so a fifty-row library is fifty targets rather than a hundred and fifty buttons.",
      example: <RowActionsInAnOverflowMenu />,
    },
    {
      text: "Let selection mode take the row over: checkboxes appear, the overflow menu stands down, and the bulk bar states the count out loud.",
      example: <SelectionModeWithABulkBar />,
    },
  ],
  donts: [
    {
      text: "Don't make the row itself clickable while it also holds a checkbox and a menu trigger — that is a nested interactive, and it fails the accessibility gate the moment either control renders.",
      example: <ClickableRowWithControlsInside />,
    },
    {
      text: "Don't turn on selection mode without `onSelectionChange` — the checkboxes and the bulk bar render, but nothing can be ticked and the count stays at zero forever.",
      example: <SelectionModeWithoutAHandler />,
    },
  ],
  pitfalls: [
    "The component does not filter. Typing in its search field fires `onSearchChange` and nothing else — if the list does not narrow, it is because you have not narrowed `items`. The same is true of the chips: `filters` is a slot, not a query.",
    "Folders are hoisted above files regardless of the order you pass, so a caller sorting by modified date will see its folders jump to the top. That partition is the one ordering rule the merged table imposes; everything within each kind keeps your order.",
    "Selection mode suppresses the overflow menu on purpose — the two affordances are never live at once, as in F2 `generation-grid`. If a bulk operation has no equivalent in the row menu, it needs a button in `bulkActions`, because there is no other way to reach it while selecting.",
    "Missing metadata renders an em-dash, never a zero or a blank. A file with no `size` and a folder with no `itemCount` both read as deliberately unknown rather than as empty.",
    "Passing `data-slot` to this component replaces `asset-library` on the root and silently breaks anything keyed to it. Address rows with `data-asset-id` and `data-kind` instead — they are there for exactly that.",
    "A12 `section-header` documents its `action` slot as navigation (\"View all\" — a link, never a button). This is the one surface where that slot legitimately carries acting buttons: Upload and New folder are the header's whole point. Composing A12 anyway was deliberate, so the library header and every other section header in the product stay one component.",
  ],
};
