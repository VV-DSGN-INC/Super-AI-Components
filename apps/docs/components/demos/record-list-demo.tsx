"use client";

import * as React from "react";

import { RecordList, type RecordListItem } from "@/registry/super-ai/record-list";

const INITIAL: RecordListItem[] = [
  {
    id: "1",
    title: "Daily digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    lastRun: "Last run 4 min ago",
    meta: ["Marketing", "12 operations"],
    runState: "success",
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "history", label: "Run history" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "2",
    title: "Lead sync",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }, { name: "Slack" }],
    lastRun: "Last run 2 h ago",
    meta: ["Sales"],
    runState: "failed",
    runLabel: "Last run failed — auth expired",
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "3",
    title: "Invoice parser",
    apps: [{ name: "Stripe" }, { name: "Xero" }, { name: "Dropbox" }, { name: "Airtable" }, { name: "Slack" }],
    lastRun: "Running since 12:04",
    runState: "running",
    enabled: true,
    actions: [{ id: "stop", label: "Stop run", destructive: true }],
  },
  {
    id: "4",
    title: "Weekly recap",
    apps: [{ name: "Linear" }, { name: "Notion" }],
    draft: true,
    runState: "never",
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

export default function RecordListDemo() {
  const [records, setRecords] = React.useState(INITIAL);

  return (
    <RecordList
      label="Scenarios"
      records={records}
      maxApps={4}
      // The toggle is the primary control, so it changes state from the list.
      onEnabledChange={(id, enabled) =>
        setRecords((current) => current.map((r) => (r.id === id ? { ...r, enabled } : r)))
      }
      onOpen={() => {}}
    />
  );
}
