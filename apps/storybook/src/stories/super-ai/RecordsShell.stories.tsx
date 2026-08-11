import type { Meta, StoryObj } from "@storybook/react-vite";

import { RecordsShell, type RecordsShellProps } from "@/registry/super-ai/records-shell";
import { RecordsShellDocs } from "@/content/components/records-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const FOLDERS: RecordsShellProps["folders"] = [
  { id: "marketing", name: "Marketing", count: 12, modified: "2 days ago" },
  { id: "revops", name: "Revenue ops", count: 5, modified: "Yesterday" },
  { id: "archive", name: "Archive", count: 41, modified: "3 months ago" },
];

const RECORDS: RecordsShellProps["records"] = [
  {
    id: "digest",
    title: "Daily briefing digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    runState: "success",
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
    runState: "failed",
    lastRun: "Last run 2 hours ago",
    meta: ["Revenue ops", "14 operations"],
    enabled: true,
    actions: [{ id: "logs", label: "View run log" }],
  },
  {
    id: "churn-watch",
    title: "Churn-risk watchlist",
    apps: [{ name: "Stripe" }, { name: "Linear" }, { name: "Intercom" }, { name: "Notion" }, { name: "Slack" }],
    runState: "running",
    lastRun: "Started 30 seconds ago",
    meta: ["Revenue ops"],
    enabled: true,
  },
  {
    id: "onboarding",
    title: "Onboarding follow-ups",
    apps: [{ name: "Intercom" }],
    runState: "never",
    draft: true,
    meta: ["Marketing"],
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
];

const FULL_ARGS: RecordsShellProps = {
  title: "Scenarios",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  createLabel: "New scenario",
  onCreate: () => {},
  folders: FOLDERS,
  records: RECORDS,
  onEnabledChange: () => {},
  onOpenRecord: () => {},
  onOpenFolder: () => {},
  filters: [
    { id: "failing", label: "Failing", active: true, onToggle: () => {}, onRemove: () => {} },
    { id: "mine", label: "Owned by me", onToggle: () => {} },
  ],
  addFilterLabel: "filter",
  onAddFilter: () => {},
  onOpenFilters: () => {},
  sort: "recent",
  onSortChange: () => {},
};

const meta: Meta<typeof RecordsShell> = {
  title: "Super AI/Records Shell",
  component: RecordsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(RecordsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecordsShell>;

/** The working shell: folders, four scenarios, one failing, one mid-run, one draft. */
export const Scenarios: Story = { args: FULL_ARGS };

/**
 * Day one. No folders, no records, nothing pinned in the rail — three empty
 * affordances at once, which is the version most new users actually see. The
 * header keeps its create button, because the empty state's CTA and the header's
 * are the same verb. Mandatory export for the block contract.
 */
export const Empty: Story = {
  args: {
    title: "Scenarios",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    createLabel: "New scenario",
    onCreate: () => {},
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the header trigger becomes the only way in, and
 * the folder table, the filter row and the record rows take the full width.
 * Mandatory export for the block contract — a shell is a layout, and layout is
 * what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * The operational read. Every row states how its last run went — succeeded,
 * failed, running, never — in an icon shape and in words, in the subtitle beside
 * the time. This is what separates the shell from a stored-asset list.
 */
export const RunStates: Story = {
  args: {
    ...FULL_ARGS,
    folders: [],
    filters: [{ id: "failing", label: "Failing", active: true, onToggle: () => {} }],
  },
};

/**
 * Rated. N1 sits at the foot of the record region, asking about the list rather
 * than any one record — J5 renders a single table with no per-row slot, so
 * per-record feedback is not reachable without forking it.
 */
export const Rated: Story = {
  args: {
    ...FULL_ARGS,
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
  },
};
