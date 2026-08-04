import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { RecentGridDocs } from "@/content/components/recent-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof RecentGrid> = {
  title: "Super AI/Recent Grid",
  component: RecentGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecentGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof RecentGrid>;

const RECENT_ITEMS = [
  { id: "1", title: "Q3 Launch Trailer", durationLabel: "12:04", editedAgo: "Edited 19 hours ago" },
  { id: "2", title: "Brand Explainer", durationLabel: "3:41", editedAgo: "Edited 2 days ago" },
  { id: "3", title: "Onboarding Walkthrough", editedAgo: "Edited 5 days ago" },
  { id: "4", title: "Untitled Project" },
];

export const Grid: Story = {
  args: { items: RECENT_ITEMS, layout: "grid" },
};

export const List: Story = {
  args: { items: RECENT_ITEMS, layout: "list" },
};

export const DurationBadge: Story = {
  args: { items: [{ id: "1", title: "Q3 Launch Trailer", durationLabel: "12:04" }] },
};

export const EditedAgo: Story = {
  args: { items: [{ id: "1", title: "Q3 Launch Trailer", editedAgo: "Edited 19 hours ago" }] },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyTitle: "No recent projects",
    emptyDescription: "Projects you open or create will show up here.",
  },
};

export const HoverActions: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Q3 Launch Trailer",
        durationLabel: "12:04",
        editedAgo: "Edited 19 hours ago",
        actions: (
          <Button variant="secondary" size="icon-sm" aria-label="Project actions" className="size-7">
            <MoreHorizontal />
          </Button>
        ),
      },
    ],
  },
};
