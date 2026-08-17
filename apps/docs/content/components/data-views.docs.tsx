import type { ComponentDocs } from "@/lib/component-docs";
import {
  OneGroupingEveryView,
  PerViewGroupings,
  SwitcherHidesTimeViews,
  ToneColourAloneIsNotADistinction,
} from "./data-views.examples";

/**
 * Seeded from docs/design-system/component-specs.md#p1-data-views.
 * Plain data read by a Server Component.
 *
 * No "use client" here: component-docs.tsx destructures this object directly.
 * Every view shell takes render callbacks, which cannot cross the
 * server/client boundary from this file — so the live examples live in the
 * ./data-views.examples client sidecar and arrive here as zero-prop elements.
 */
export const DataViewsDocs: ComponentDocs = {
  whatItIs:
    "One collection rendered five ways — feed, board, table, calendar and timeline — from a single config. A section declares its groups, its card, its columns and its row once; the switcher picks a shell by `viewMode`. The component is fully controlled and stores nothing.",
  whyItMatters:
    "Records get browsed differently by different people on different days: the same sprint is a board to whoever is moving work, a table to whoever is auditing it, and a timeline to whoever is planning around it. Every product in the records slice — Linear, Notion, Asana, Airtable, Monday, ClickUp, Height — ships that switch, which is why it is a component rather than a per-screen decision. The part worth copying is that the views share one config: adding a sixth view means adding one shell and one contract, and touching no section. Rebuilt per screen, a switcher drifts into five subtly different definitions of what a group is.",
  evidence: ["Linear", "Notion", "Airtable"],
  anatomy: [
    {
      slot: "view-switcher",
      note: "The radiogroup. Arrow keys move within the offered views, not the global list.",
    },
    {
      slot: "kanban-view",
      note: "Groups as columns. The card owns its own click; the shell never wraps it.",
    },
    { slot: "kanban-column", note: "One group. Header is untinted — tone rides on a mark." },
    { slot: "feed-view", note: "Groups as sticky section headers over a single scroll." },
    { slot: "table-view", note: 'A `role="grid"`, because its rows are the clickable surface.' },
    {
      slot: "calendar-view",
      note: "A month grid. Spans are bars across the days they cover, not marks on a start day.",
    },
    { slot: "timeline-view", note: "Groups as lanes against a horizontal axis. Read-only by design." },
    { slot: "timeline-bar", note: "One record. Carries `data-shape` (bar or milestone) and `data-clipped`." },
    { slot: "unplaced-notice", note: "Says out loud how many items a time view could not place." },
  ],
  usage:
    "Give every item a stable `id` — it is the selection key in all five views. Groups must cover the full domain of whatever they group by: an item matching no group is absent from the grouped views, which is why the time views count and announce what they could not place. Supply `getDateRange` and `renderChip` together or not at all; the type makes half a pair a compile error, and a section without the pair simply never offers calendar or timeline. Hold `viewMode` yourself, or install the `use-view-mode` contract to persist it per section — the component never writes to storage.",
  dos: [
    {
      text: "Declare groups once and let every view read them — columns, sections, lanes and bar tone are the same partition.",
      example: <OneGroupingEveryView />,
    },
    {
      text: "Pass `getDateRange` and `renderChip` together, and let the switcher hide the time views when you cannot.",
      example: <SwitcherHidesTimeViews />,
    },
  ],
  donts: [
    {
      text: 'Don\'t give each view its own grouping config — that is how four definitions of "done" end up on one screen.',
      example: <PerViewGroupings />,
    },
    {
      text: "Don't rely on tone colour to distinguish groups; `info` and `success` share a surface and differ only by mark.",
      example: <ToneColourAloneIsNotADistinction />,
    },
  ],
  accessibility: {
    keyboard: [
      "The switcher is one tab stop. It is a `radiogroup` with a roving tabindex, and the arrow keys move **and select** in the same press — so arrowing from List to Timeline re-renders the whole collection four times on the way. Left/Right and Up/Down both work and both wrap; Home and End do not.",
      "Every other view spends tab stops per item, with no roving tabindex anywhere. A 200-row feed is 200 tab stops, a table with `onItemClick` is one per row, and a calendar or timeline is one per bar. Paginate or virtualise before you hand a keyboard user a long collection.",
      "Table rows are focusable only when `onItemClick` is supplied — a read-only table refuses to advertise a tab stop that does nothing. Enter and Space activate a row, Space is prevented from scrolling the page, and a control inside a cell keeps its own keys because the handler ignores events that did not originate on the row.",
      'Both the table and the calendar are `role="grid"` without grid keyboard support. A grid promises arrow-key travel between cells and there is none in either — Tab is the only way through, which is the gap between what the role advertises and what the component does.',
      '**The timeline\'s zoom control cannot be operated by keyboard.** Its three buttons are `role="radio"` with a roving tabindex, but the group has no `onKeyDown`: only the checked radio is tabbable and no arrow key moves off it, so Week, Month and Quarter are mouse-only. The switcher directly above it implements exactly the handler this group is missing.',
      "The kanban board is a horizontal scroll container with no `tabIndex` of its own, and each column scrolls vertically the same way. If your `renderCard` returns something unfocusable, those scroll regions are unreachable from the keyboard entirely — the shell contributes no focusable element to them.",
      'A calendar week\'s "+3 more" is a button that expands the week, and nothing collapses it again: `expandedWeek` is only cleared by Today or by month navigation. There is no Escape.',
    ],
    screenReader: [
      'The switcher announces as a radio group named "Collection view" whose options are Board, List, Table, Calendar and Timeline — "Board" rather than "Kanban", because people recognise what they see. Its icons contribute nothing; each radio\'s name is an explicit `aria-label`.',
      'A kanban column is a `<section>` named "Review, 4 items, warning" — label, count and tone word composed by `groupAccessibleName`. That is the fullest group announcement of the five views, and the one the others are measured against.',
      "A feed section's name is set on a `<header>` nested inside a `<section>`, and the section itself is unnamed. A nested `header` carries no role of its own, so unlike a kanban column the feed's group name is not reliably exposed — the count and the tone word can be lost with it.",
      "Every tone mark is `aria-hidden`, so tone reaches assistive tech only where `withTone()` composed it into a name. A timeline lane says its tone through an `sr-only` span; a custom header that renders `GROUP_TONE_MARK` without composing the name says nothing at all.",
      'Calendar and timeline bars build their names by walking the node your `renderChip` returned. That walk reads `props.children` only, so a chip that carries its text in a prop instead — an icon-only badge, or a component that formats internally — yields an empty string and the bar announces as ", 4 August 2026" with no subject. Return text as children.',
      "A split calendar bar announces the whole record's range, not its segment's, so a task crossing Sunday into Monday is heard as one task rather than two.",
      'Today is marked with a filled circle and nothing else — there is no `aria-current`, so "which day is today" is a purely visual channel in the calendar. Out-of-month cells are likewise distinguished only by fill.',
      'The weekday strip is a plain grid outside the `role="grid"`, so it never functions as column headers; each cell carries its own full date as an `aria-label` instead, which is the mitigation.',
      '`unplaced-notice` is `role="status"`, so "3 unscheduled" is announced when items fall out of a time view. Nothing equivalent exists for the board or the feed — an item matching no group is simply absent there, silently.',
      "Switching view swaps the entire collection with no live region and no announcement. A screen-reader user who changes view hears the radio's new state and nothing about the 40 records that just re-rendered.",
    ],
    focus: [
      "The switcher restores focus itself: after an arrow key it re-queries `[data-view]` on the next frame and focuses the newly selected radio. That query only succeeds if the parent actually re-rendered with the new mode — hold `viewMode` in state, or focus stays on the old button.",
      "Changing view unmounts the previous shell wholesale. A row, cell or bar that had focus goes with it and focus falls to `<body>`, so a keyboard user who switches from the middle of a long feed restarts at the top of the page.",
      'Expanding a calendar week unmounts the "+3 more" button that was just pressed — the segments it was hiding take its place — so focus falls to `<body>` there too.',
      "`onItemClick` moves no focus. If it opens a detail panel, that is the panel's job or yours; the shells report the click and nothing else.",
      "Feed rows, table rows, calendar bars, timeline bars and both radio groups all carry explicit `focus-visible` styling, and both bar types raise their z-index while focused so the ring is not clipped by a neighbour. The kanban board is the exception: cards are yours, so their focus style is yours too.",
    ],
  },
  pitfalls: [
    "Groups that do not cover the full domain silently drop items from the board, feed and timeline. The time views count the strays and render an `unplaced-notice`; the board and feed do not, so an item matching no group simply is not there. Write a catch-all group rather than relying on the notice.",
    "Tone is carried by mark shape first and colour second. This system has two chromatic tokens, so `neutral`, `info` and `success` all resolve to the same bar surface and are separated by the mark alone. If you restyle a group header, do not reintroduce a tinted background — the pairing that was there before failed contrast at 4.34:1.",
    "The marks are `aria-hidden`, so the tone word reaches assistive tech only through `withTone()` in the accessible name. A custom header that renders `GROUP_TONE_MARK` without also composing the name drops the tone for screen-reader users entirely.",
    "`TimeCapability` is both-or-neither at the type level, but data arriving from an API is not type-checked. `hasTimeCapability()` is the runtime guard, and a calendar asked for without the pair falls through to the feed rather than rendering nothing — that fallback is deliberate, and a blank region means you bypassed it.",
    "All date bucketing is local-time. A due date at 23:00 local belongs to that local day, and parsing an ISO date string with `new Date()` would move it a day west of Greenwich; use `parseLocalDate` for calendar dates.",
    "The timeline's zoom is component state and is deliberately not persisted — it is a reading posture, not a preference. Persisting it would add a third axis this component has not argued for.",
  ],
};
