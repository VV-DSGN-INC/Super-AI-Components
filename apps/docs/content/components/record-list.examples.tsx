"use client";

import { RecordList, type RecordListItem } from "@/registry/super-ai/record-list";

/** Live examples for record-list.docs.tsx — client sidecar, see the docs module. */

const BASE: RecordListItem = {
  id: "1",
  title: "Daily digest",
  apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
  lastRun: "Last run 4 min ago",
  meta: ["Marketing"],
  runState: "success",
  enabled: true,
  actions: [
    { id: "duplicate", label: "Duplicate" },
    { id: "delete", label: "Delete", destructive: true },
  ],
};

const READABLE: RecordListItem[] = [
  BASE,
  {
    id: "2",
    title: "Lead sync",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }],
    lastRun: "Last run 2 h ago",
    runState: "failed",
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

/** Same two records, stripped of everything that makes them identifiable. */
const BARE: RecordListItem[] = [
  { id: "1", title: "Daily digest", enabled: true },
  { id: "2", title: "Lead sync", enabled: false },
];

const DRAFT_IN_SUBTITLE: RecordListItem[] = [
  {
    id: "3",
    title: "Invoice parser",
    apps: [{ name: "Stripe" }, { name: "Xero" }],
    draft: true,
    runState: "never",
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

/** Buried behind the menu: the toggle is gone, an action pretends to replace it. */
const TOGGLE_IN_MENU: RecordListItem[] = [
  {
    ...BASE,
    toggleDisabled: true,
    actions: [
      { id: "enable", label: "Turn scenario off" },
      { id: "duplicate", label: "Duplicate" },
    ],
  },
];

/** DO — apps, last run and the toggle all readable from the list. */
export function RowsCarryTheirApps() {
  return <RecordList label="Scenarios" records={READABLE} onEnabledChange={() => {}} />;
}

/** DO — draft and last-run state live in the subtitle, under the title. */
export function StateInTheSubtitle() {
  return <RecordList label="Scenarios" records={DRAFT_IN_SUBTITLE} onEnabledChange={() => {}} />;
}

/** DON&apos;T — titles alone. Nothing here says what these records touch or when they last ran. */
export function TitlesOnly() {
  return <RecordList label="Scenarios" records={BARE} onEnabledChange={() => {}} />;
}

/** DON&apos;T — the primary control demoted to a menu item two clicks away. */
export function ToggleHiddenInTheMenu() {
  return <RecordList label="Scenarios" records={TOGGLE_IN_MENU} onEnabledChange={() => {}} />;
}
