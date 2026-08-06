// `Meta` is a declared state of this component, so the story export owns that
// identifier and Storybook's own Meta type is imported under an alias.
import type { Meta as StorybookMeta, StoryObj } from "@storybook/react-vite";

import { RecordList, type RecordListItem } from "@/registry/super-ai/record-list";
import { RecordListDocs } from "@/content/components/record-list.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const RECORDS: RecordListItem[] = [
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
    apps: [
      { name: "Stripe" },
      { name: "Xero" },
      { name: "Dropbox" },
      { name: "Airtable" },
      { name: "Slack" },
    ],
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

const meta: StorybookMeta<typeof RecordList> = {
  title: "Super AI/Record List",
  component: RecordList,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecordListDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Scenarios",
    records: RECORDS,
    onEnabledChange: () => {},
    onOpen: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RecordList>;

/** What a record touches, read before its name. Marks are decorative; the app names are announced. */
export const AppIconCluster: Story = {
  args: { records: RECORDS, maxApps: 3 },
};

/** Folder, operation count and timing sit under the title — never in columns of their own. */
export const Meta: Story = {
  args: { records: [RECORDS[0]] },
};

/** The primary control, in the row. Each switch is named after the record it enables. */
export const EnableToggle: Story = {
  args: { records: [RECORDS[0], RECORDS[3]] },
};

/** Icon shape and words together: OK, failed, running, never run. */
export const RunStatus: Story = {
  args: { records: RECORDS },
};

/** Everything that is not enabling. The row stays inert so the menu can live inside it. */
export const OverflowMenu: Story = {
  args: { records: [RECORDS[0]] },
};
