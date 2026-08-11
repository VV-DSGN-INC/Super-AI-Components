import type { Meta, StoryObj } from "@storybook/react-vite";

import { DetailFields, DetailViewShell, type DetailChannel } from "@/registry/super-ai/detail-view-shell";
import { DetailViewShellDocs } from "@/content/components/detail-view-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const ATTRIBUTES = (
  <DetailFields
    fields={[
      { id: "owner", label: "Owner", value: "Ada Lovelace" },
      { id: "status", label: "Status", value: "In review" },
      { id: "due", label: "Due", value: "12 August 2026" },
      { id: "estimate", label: "Estimate", value: "3 days" },
      { id: "repo", label: "Repository", value: "weeeha/DS-WebApp-Shells" },
      { id: "branch", label: "Branch", value: "feat/arrangements-tier" },
    ]}
  />
);

const comments = (
  <ol className="flex flex-col gap-3 p-4 text-sm">
    <li>
      <p className="font-medium">Ada</p>
      <p className="text-muted-foreground">Split the timeline work out of this one.</p>
    </li>
    <li>
      <p className="font-medium">Rex</p>
      <p className="text-muted-foreground">Done — it is tracked separately now.</p>
    </li>
  </ol>
);

const ONE_CHANNEL: DetailChannel[] = [
  { id: "comments", label: "Comments", count: 2, content: comments },
];

/**
 * The running reference app ships one channel, so the level-2 strip exists only
 * here and in the tests. Inventing product-shaped Files/Changelog fixtures was
 * rejected upstream and stays rejected — these two are named for what they are.
 */
const TWO_CHANNELS: DetailChannel[] = [
  { id: "comments", label: "Comments", count: 2, content: comments },
  {
    id: "history",
    label: "History",
    count: 1,
    content: <p className="text-muted-foreground p-4 text-sm">Moved to In review by Rex.</p>,
  },
];

const HEADER = (
  <header className="flex items-center gap-2 border-b px-4 py-3">
    <h2 className="text-sm font-medium">Draft the migration plan</h2>
  </header>
);

const base = {
  open: true,
  onOpenChange: () => {},
  header: HEADER,
  attributes: ATTRIBUTES,
  ariaLabel: "Draft the migration plan",
};

const meta = {
  title: "Super AI/Detail View Shell",
  component: DetailViewShell,
  parameters: {
    layout: "padded",
    docs: { page: componentDocsPage(DetailViewShellDocs) },
  },
} satisfies Meta<typeof DetailViewShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Popup: Story = { args: { ...base, mode: "popup", conversation: ONE_CHANNEL } };

export const Overlay: Story = { args: { ...base, mode: "overlay", conversation: ONE_CHANNEL } };

export const Fullscreen: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL },
  decorators: [
    (Story) => (
      <div className="h-[520px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** Wide enough for attributes and conversation side by side. */
export const TwoColumn: Story = {
  args: { ...base, mode: "fullscreen", conversation: TWO_CHANNELS },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[960px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** Below 720px of container width, the conversation becomes a tab. */
export const CollapsedTabs: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL, collapse: "tabs" },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[420px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

/** The same width, with the conversation stacked under the attributes instead. */
export const CollapsedStack: Story = {
  args: { ...base, mode: "fullscreen", conversation: ONE_CHANNEL, collapse: "stack" },
  decorators: [
    (Story) => (
      <div className="h-[520px] w-[420px] rounded-lg border">
        <Story />
      </div>
    ),
  ],
};
