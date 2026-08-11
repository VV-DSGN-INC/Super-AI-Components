import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#p1-data-views.
 * Plain data read by a Server Component.
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
    },
    {
      text: "Pass `getDateRange` and `renderChip` together, and let the switcher hide the time views when you cannot.",
    },
  ],
  donts: [
    {
      text: 'Don\'t give each view its own grouping config — that is how four definitions of "done" end up on one screen.',
    },
    {
      text: "Don't rely on tone colour to distinguish groups; `info` and `success` share a surface and differ only by mark.",
    },
  ],
  pitfalls: [
    "Groups that do not cover the full domain silently drop items from the board, feed and timeline. The time views count the strays and render an `unplaced-notice`; the board and feed do not, so an item matching no group simply is not there. Write a catch-all group rather than relying on the notice.",
    "Tone is carried by mark shape first and colour second. This system has two chromatic tokens, so `neutral`, `info` and `success` all resolve to the same bar surface and are separated by the mark alone. If you restyle a group header, do not reintroduce a tinted background — the pairing that was there before failed contrast at 4.34:1.",
    "The marks are `aria-hidden`, so the tone word reaches assistive tech only through `withTone()` in the accessible name. A custom header that renders `GROUP_TONE_MARK` without also composing the name drops the tone for screen-reader users entirely.",
    "`TimeCapability` is both-or-neither at the type level, but data arriving from an API is not type-checked. `hasTimeCapability()` is the runtime guard, and a calendar asked for without the pair falls through to the feed rather than rendering nothing — that fallback is deliberate, and a blank region means you bypassed it.",
    "All date bucketing is local-time. A due date at 23:00 local belongs to that local day, and parsing an ISO date string with `new Date()` would move it a day west of Greenwich; use `parseLocalDate` for calendar dates.",
    "The timeline's zoom is component state and is deliberately not persisted — it is a reading posture, not a preference. Persisting it would add a third axis this component has not argued for.",
  ],
};
