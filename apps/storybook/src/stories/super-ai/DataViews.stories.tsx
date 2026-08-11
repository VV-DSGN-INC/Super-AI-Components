import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DataViews,
  type BaseDataViewsConfig,
  type ColumnDef,
  type TimeCapability,
  type ViewGroup,
  type ViewItem,
  type ViewMode,
} from "@/registry/super-ai/data-views";
import { DataViewsDocs } from "@/content/components/data-views.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

interface Task {
  id: string;
  title: string;
  owner: string;
  bucket: "todo" | "doing" | "review" | "done";
  start: Date;
  end?: Date;
}

/* Fixed dates, not offsets from today: a calendar story that moves with the
   clock produces a different screenshot every day and a flaky a11y run. */
const d = (day: number) => new Date(2026, 7, day);

const TASKS: Task[] = [
  { id: "1", title: "Draft the migration plan", owner: "Ada", bucket: "doing", start: d(3), end: d(7) },
  { id: "2", title: "Audit the token contract", owner: "Rex", bucket: "review", start: d(5), end: d(8) },
  { id: "3", title: "Ship the switcher", owner: "Ada", bucket: "todo", start: d(9) },
  { id: "4", title: "Retire the old board", owner: "Wu", bucket: "done", start: d(4), end: d(6) },
  { id: "5", title: "Write the runbook", owner: "Wu", bucket: "doing", start: d(8), end: d(12) },
];

const GROUPS: ViewGroup<Task>[] = [
  { id: "todo", label: "To do", match: (t) => t.bucket === "todo" },
  { id: "doing", label: "In progress", tone: "info", match: (t) => t.bucket === "doing" },
  { id: "review", label: "In review", tone: "warning", match: (t) => t.bucket === "review" },
  { id: "done", label: "Done", tone: "success", match: (t) => t.bucket === "done" },
];

const COLUMNS: ColumnDef<Task>[] = [
  { id: "title", header: "Task", cell: (t) => t.title },
  { id: "owner", header: "Owner", cell: (t) => t.owner, width: "w-28" },
  { id: "bucket", header: "Status", cell: (t) => t.bucket, width: "w-28" },
];

const config = {
  items: TASKS,
  groups: GROUPS,
  columns: COLUMNS,
  renderCard: (t: Task) => (
    <div className="bg-background rounded-md border p-2 text-sm">
      <span className="block font-medium">{t.title}</span>
      <span className="text-muted-foreground block text-xs">{t.owner}</span>
    </div>
  ),
  renderRow: (t: Task) => (
    <span className="flex items-center gap-2">
      <span className="font-medium">{t.title}</span>
      <span className="text-muted-foreground text-xs">{t.owner}</span>
    </span>
  ),
  getDateRange: (t: Task) => ({ start: t.start, end: t.end }),
  renderChip: (t: Task) => <span>{t.title}</span>,
};

/* Storybook's arg inference cannot see through `DataViewsProps`.
   That type is a UNION — the both-or-neither time pair means a config either
   has `getDateRange` + `renderChip` or has neither — and `StoryObj` collapses a
   union-typed args object to `never`, so every story's `args` fails to
   assign. It type-checks inside apps/docs, which never compiles this file;
   only the root `pnpm typecheck` (turbo, both packages) catches it.

   The fix is a wrapper whose props are the INTERSECTION arm: these stories all
   supply the time pair, so nothing is lost, and the real component is still
   what renders and what axe audits. */
type DataViewsStoryProps<T extends ViewItem> = BaseDataViewsConfig<T> &
  TimeCapability<T> & {
    items: T[];
    viewMode: ViewMode;
    selectedId?: string | null;
    onItemClick?: (item: T) => void;
    className?: string;
  };

function DataViewsStory(props: DataViewsStoryProps<Task>) {
  return <DataViews {...props} />;
}

const meta = {
  title: "Super AI/Data Views",
  component: DataViewsStory,
  parameters: {
    layout: "padded",
    docs: { page: componentDocsPage(DataViewsDocs) },
  },
  decorators: [
    (Story) => (
      <div className="h-[520px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataViewsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kanban: Story = { args: { ...config, viewMode: "kanban" } };

export const Table: Story = { args: { ...config, viewMode: "table" } };

export const Feed: Story = { args: { ...config, viewMode: "list" } };

export const Calendar: Story = { args: { ...config, viewMode: "calendar" } };

export const Timeline: Story = { args: { ...config, viewMode: "timeline" } };

/**
 * All four tones on one board. `info` and `success` deliberately share a
 * surface — the mark is what separates them, and the tone word rides in each
 * column's accessible name.
 */
export const GroupTone: Story = { args: { ...config, viewMode: "kanban" } };
