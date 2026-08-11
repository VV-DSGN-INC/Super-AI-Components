import type { ComponentDocs } from "@/lib/component-docs";
import {
  RunStatusAsAColouredDot,
  RunStatusInTheSubtitle,
  ToggleBehindTheKebab,
  ToggleInTheRow,
} from "./records-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O10 `records-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./records-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const RecordsShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a list of things that run: projects, scenarios, zaps, workflows. A product rail on the left, a header carrying the name of the list and the button that adds to it, a row of filters and a sort control, and then the rows themselves — folders first, then the records, each with its enable toggle and its last run in plain words. It is a block, not a component: it owns arrangement and nothing else. The rail is B1, the folders are J1 in folder mode, the rows are J5, the filters are A5, the empty cases are L1 and the rating is N1, and every one of them keeps its own props, state model and accessibility contract.",
  whyItMatters:
    "Make, Zapier, n8n and Spline all land on the same page, and the reason is that these objects execute. A stored-asset browser can afford to be a wall of thumbnails; a list of live automations cannot, because the two questions you arrive with are \"is this on?\" and \"did the last run work?\". So the enable toggle is the primary control and it sits in the row — never behind an overflow menu, where switching an automation off becomes two clicks and a guess — and the run status sits in the subtitle beside the timestamp, because \"last run failed\" and \"two hours ago\" are one sentence. Everything else on the page is in service of finding the row you want: folders above, filters and sort across the top, a search that covers both lists.",
  evidence: ["Make scenarios", "Zapier zaps", "n8n workflows", "Spline projects"],
  anatomy: [
    {
      slot: 'data-region="sidebar"',
      note: "B1 app-sidebar. Product navigation, or L1 when nothing is pinned.",
    },
    {
      slot: 'data-region="header"',
      note: "Sidebar trigger, list name, record count, and the create action.",
    },
    {
      slot: 'data-region="filter-sort"',
      note: "A5 filter-bar chips plus the filters button, with the sort select trailing.",
    },
    {
      slot: 'data-region="record-rows"',
      note: "The scroll container: J1 folders, then J5 records or L1, then N1.",
    },
    { slot: "records-shell", note: "Root. Contains its own fixed descendants so the shell can be embedded." },
    { slot: "records-shell-count", note: "How many records the list currently holds." },
    { slot: "records-shell-sort", note: "The sort control. `records-shell-sort-trigger` is the named button." },
    { slot: "records-shell-feedback", note: "N1 with its caption, at the foot of the record region." },
  ],
  usage:
    "Reach for it when the objects your product lists are runnable rather than stored — if they are stored, O7 is the shell you want, and using this one would promise an execution model you do not have. Everything is a prop or a slot: `records` fills the rows and is forwarded whole to J5, `folders` fills the folder table, `filters` fills the chips, and `nav` fills the rail. Wire `onEnabledChange` before anything else; it is the primary control of the page and a shell rendered without it is a screenshot. Give every record a `runState` and a `lastRun` — a row with neither says nothing about whether the automation is healthy, which is the only thing the list is for. `search` and `onSearchChange` are controlled and the shell does no filtering: hand it the folders and records that already match, exactly as J1 documents.",
  dos: [
    {
      text: "Keep the enable toggle in the row, named after the record it enables.",
      example: <ToggleInTheRow />,
    },
    {
      text: "Put run status in the subtitle, as an icon shape and a word, beside the time it happened.",
      example: <RunStatusInTheSubtitle />,
    },
  ],
  donts: [
    {
      text: "Don't demote the toggle into an overflow menu — turning a live automation off is the fastest thing this page has to do.",
      example: <ToggleBehindTheKebab />,
    },
    {
      text: "Don't reduce run status to a coloured dot; colour alone carries no meaning, no timestamp and no accessible name.",
      example: <RunStatusAsAColouredDot />,
    },
  ],
  pitfalls: [
    "The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a preview or an app region — if you re-wrap or restyle the root, keep that containment or the rail will pin itself to the browser's left edge. The trade-off is that the rail keeps its full `h-svh` height and is clipped to the shell's, which is why this shell exposes no promo or footer slot at all: anything B1 bottom-anchors falls below the clip whenever the shell is shorter than the viewport, which is the default embedded case.",
    "J1 has no way to turn off its list/grid switch. `view` can be pinned — the shell pins it to `list` — but the control still renders and still invites a press that now does nothing, so the shell suppresses it with a `hidden` descendant variant on J1's own class list. If you restyle the folder table, keep that variant or a grid of folder tiles reappears above a table of records.",
    "J1 owns the search field and does no filtering. The shell surfaces it as the page search because it sits above both lists, but nothing narrows automatically: `onSearchChange` tells you what was typed and you hand back the `folders` and `records` that match. Wiring the field without wiring the filtering produces a search box that does nothing, which is worse than having none.",
    "J5 renders one `<table>` and exposes no per-row slot, so there is nowhere to hang a per-record affordance the component does not already have — no per-row feedback, no per-row status sibling of the kind chat-shell renders under a thread. That is why N1 rates the list rather than a record. If you need per-record feedback, the fix belongs in J5, not in a fork of it here.",
    "The record region is the scroll container, which is why it is a `section` with `tabIndex={0}` and a name taken from the header's heading. Moving the overflow onto an inner wrapper without moving those with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the list.",
    "The sort control's trigger renders the raw `value` unless it is given children, so an unlabelled select shows `recent` instead of \"Last run\". The shell resolves the label from `sortOptions`; if you pass your own options make sure every `value` you might set also has an entry, or the trigger falls back to the word \"Sort by\".",
    "`sort` is optional-controlled and `records`, `folders` and `filters` are not controlled at all — the shell holds no list state. It will happily render filter chips that are `active` over a record list that was never filtered, which looks correct and lies. Filter your data where it lives.",
  ],
};
