import type { ComponentDocs } from "@/lib/component-docs";
import {
  RowsCarryTheirApps,
  StateInTheSubtitle,
  TitlesOnly,
  ToggleHiddenInTheMenu,
} from "./record-list.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j5-record-list.
 * Plain data read by a Server Component; examples live in the client sidecar.
 */
export const RecordListDocs: ComponentDocs = {
  whatItIs:
    "A table of records that run — scenarios, zaps, workflows, scheduled projects. Each row carries the apps it touches as a cluster of named marks, its draft and last-run state in the subtitle beneath the title, an on/off switch, and an overflow menu for everything else.",
  whyItMatters:
    "Automation lists are not browsed, they are audited: the question is always which of these is on, and did the last one work. So the enable toggle is the primary control and lives in the row itself — Make, Zapier and n8n all put it there, because moving it to a detail page turns 'pause the broken one' into a four-click errand. The app cluster is the second half of that: people recognise a scenario by what it connects long before they read its name, which is why the cluster carries real app names rather than decorative logos. And last-run and draft belong in the subtitle rather than their own columns, because \"Last run failed\" and \"4 min ago\" are one sentence about one event; splitting them across columns makes the reader reassemble it.",
  evidence: ["Make scenarios", "Zapier zaps", "n8n workflows"],
  anatomy: [
    { slot: "record-list", note: "The table wrapper." },
    {
      slot: "record-list-row",
      note: "One record. Inert by design — it carries `data-record-id`, `data-enabled` and `data-run-state`, but no click handler.",
    },
    {
      slot: "record-list-title",
      note: "The row's interactive element: a link with `href`, a button with `onOpen`, plain text with neither.",
    },
    {
      slot: "record-list-subtitle",
      note: "Everything the title is not: run status, last run, draft, folder, operation count.",
    },
    { slot: "record-list-run-status", note: "An icon shape and the state in words, so nothing rests on colour." },
    { slot: "record-list-meta", note: "One span per subtitle fragment, separated by middots." },
    { slot: "record-list-apps", note: "The cluster, a labelled list. Each mark is hidden; each app name is not." },
    { slot: "record-list-app", note: "One app: a decorative mark plus a readable name." },
    { slot: "record-list-app-overflow", note: "The `+N` mark. The names it covers stay in the accessible text." },
    { slot: "record-list-apps-empty", note: "An em-dash and an announced \"No apps\" — deliberate, not blank." },
    { slot: "record-list-toggle", note: "The primary control, named after its own record." },
    { slot: "record-list-overflow", note: "The actions cell. Empty when a record supplies no actions." },
  ],
  usage:
    "Give every record an `apps` array with real names — the marks fall back to initials, so a name alone is enough to make the cluster useful. Put timing in `lastRun` and set `draft` rather than inventing a column for either; anything else you want under the title goes in `meta`. Set `runState` and the component supplies both the icon and the words; use `runLabel` when you can say something more specific (\"Last run failed — auth expired\"). Handle `onEnabledChange` and treat it as the main verb of the screen. Pass `href` when a record has a page of its own, `onOpen` when it opens in place; the row itself stays inert either way, which is what lets a switch and a menu live inside it.",
  dos: [
    {
      text: "Show what each record touches and when it last ran, from the list itself.",
      example: <RowsCarryTheirApps />,
    },
    {
      text: "Keep draft and last-run state in the subtitle, under the title they describe.",
      example: <StateInTheSubtitle />,
    },
  ],
  donts: [
    {
      text: "Don't ship a list of titles — nothing tells you which integration broke or whether it ever ran.",
      example: <TitlesOnly />,
    },
    {
      text: "Don't demote the toggle into the overflow menu; enabling is the reason the list exists.",
      example: <ToggleHiddenInTheMenu />,
    },
  ],
  accessibility: {
    keyboard: [
      "One to three tab stops per row: the title (focusable only when you pass `href` or `onOpen` — with neither it is a `<span>`), the enable switch, and the overflow trigger (present only when that record has `actions`). Ten records is anywhere between ten and thirty stops.",
      "`toggleDisabled` puts a real `disabled` on the switch, so it leaves the tab order entirely. The control stays visible and greyed, which is the point, but a keyboard user tabs straight past the row's primary control.",
      "Space toggles the switch; Enter or Space opens the overflow menu, and inside it the vendored Base UI `DropdownMenu` supplies arrow keys, Home/End, typeahead and Escape.",
      "The `<tr>` is inert and handles no keys. There is no arrow-key movement between rows, no Home/End to the first or last record, and no way to activate a row other than the title itself.",
      "No column is sortable and none is focusable — the header is four plain `<th>`s.",
    ],
    screenReader: [
      "The table is named by an sr-only `<caption>` carrying `label` (default \"Records\") and has four column headers: Record, Apps, Enabled, and an sr-only \"Actions\". In a screen reader's table mode, \"Enabled\" is therefore announced alongside each switch.",
      "The app cluster is a `<ul>` named \"Apps in <title>\". Each mark is `aria-hidden` and each name sits in sr-only text beside it, so the cluster announces as a list of app names rather than a row of unnamed images.",
      "The `+N` mark works the same way: it is `aria-hidden` and the names it covers stay in the sr-only text behind it, so `maxApps` costs a screen-reader user nothing.",
      "A record with no apps announces \"No apps\" rather than silence — the em-dash is `aria-hidden` and the words sit behind it.",
      "Run status is an `aria-hidden` icon plus the words from the state table, so \"Last run failed\" is read as text and the red triangle carries nothing on its own.",
      "Each switch is named `Enable <title>` and never renames itself, so an already-on record announces as \"Enable Daily digest, switch, on\" — the verb is fixed and `aria-checked` carries the state. Two records with the same title produce two identically named switches and two identically named overflow triggers.",
      "There is no live region. The switch announces its own state change, but only once your `onEnabledChange` handler feeds a new `enabled` back in — an optimistic UI that does not, or a request that fails quietly, leaves the announced state wrong with nothing to correct it.",
    ],
    focus: [
      "Nothing in this component moves focus. Opening the overflow menu moves focus into it and closing it returns focus to the trigger, but that is Base UI's behaviour, not the list's.",
      "Deleting a record through an overflow action unmounts the row while focus is inside the closing menu, and nothing restores it — focus falls to `<body>`. Move it to a neighbouring row's title inside your action's `onSelect`.",
      "The title carries an explicit `focus-visible:ring-2` in both its link and its button form, and the switch and overflow trigger inherit the vendored primitives' rings. Everything focusable in a row is visible on focus without work at the call site.",
    ],
  },
  pitfalls: [
    "The `<tr>` is deliberately inert and has no `onClick`. Adding one would nest the switch and the overflow trigger inside a control, which axe fails and which makes every toggle click ambiguous — put navigation on the title instead.",
    "App marks are `aria-hidden` and the names sit in sr-only text beside them. If you pass an `icon` that carries its own label or `alt` text, the name is announced twice; pass a decorative node.",
    "Collapsing the cluster with `maxApps` hides marks, not names — the covered apps stay in the accessible text behind the `+N`. Setting `maxApps` to 1 is a layout choice, never a way to shorten what a screen reader hears.",
    "`aria-label` on each switch is generated from the record title, so a list of records with identical titles produces identical control names. Titles here are user-facing identifiers; treat duplicates as a data problem.",
    "Subtitle text is a foreground tint rather than `text-muted-foreground`, because the row's hover background is `bg-muted/50` and muted text on a muted surface measures 4.34:1. If you restyle the subtitle, do not reach for the muted token.",
    "A record with no `actions` renders no overflow trigger at all, so a row can end up with the toggle as its only control. That is intentional, but check it is not simply a forgotten prop.",
  ],
};
