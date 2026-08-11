"use client";

import { RecordsShell } from "@/registry/super-ai/records-shell";

const FOLDERS = [
  { id: "marketing", name: "Marketing", count: 12, modified: "2 days ago" },
  { id: "revops", name: "Revenue ops", count: 5, modified: "Yesterday" },
];

const RECORDS = [
  {
    id: "digest",
    title: "Daily briefing digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    runState: "success" as const,
    lastRun: "Last run 4 min ago",
    meta: ["Marketing", "9 operations"],
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "lead-sync",
    title: "Lead sync to CRM",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }],
    runState: "failed" as const,
    lastRun: "Last run 2 hours ago",
    meta: ["Revenue ops", "14 operations"],
    enabled: true,
    actions: [{ id: "logs", label: "View run log" }],
  },
  {
    id: "churn-watch",
    title: "Churn-risk watchlist",
    apps: [{ name: "Stripe" }, { name: "Linear" }],
    runState: "running" as const,
    lastRun: "Started 30 seconds ago",
    meta: ["Revenue ops"],
    enabled: true,
  },
  {
    id: "onboarding",
    title: "Onboarding follow-ups",
    apps: [{ name: "Intercom" }],
    runState: "never" as const,
    draft: true,
    meta: ["Marketing"],
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

export default function RecordsShellDemo() {
  return (
    <RecordsShell
      className="h-[42rem]"
      title="Scenarios"
      switcher={<div className="px-2 text-sm font-medium">Northwind</div>}
      createLabel="New scenario"
      onCreate={() => {}}
      folders={FOLDERS}
      records={RECORDS}
      filters={[
        { id: "failing", label: "Failing", active: true, onRemove: () => {} },
        { id: "mine", label: "Owned by me" },
      ]}
      addFilterLabel="filter"
      onAddFilter={() => {}}
      sort="recent"
      feedback={{ state: "idle" }}
    />
  );
}
