import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";
import { ArtifactGridDocs } from "@/content/components/artifact-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ArtifactGrid> = {
  title: "Super AI/Artifact Grid",
  component: ArtifactGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ArtifactGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof ArtifactGrid>;

const SESSIONS: ArtifactGridSession[] = [
  {
    id: "pricing",
    label: "Pricing page rewrite",
    items: [
      {
        id: "a1",
        type: "document",
        title: "Untitled document",
        excerpt:
          "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#a1",
      },
      {
        id: "a2",
        type: "react",
        excerpt: "export function PricingTable({ plans }: PricingTableProps) { … }",
        editedAgo: "Edited yesterday",
        viewCount: 38,
        visibility: "shared",
        href: "#a2",
      },
      {
        id: "a3",
        type: "data-table",
        excerpt: "Plan · Seats · Monthly · Annual · Support SLA — the comparison grid, 5 columns by 4 rows.",
        editedAgo: "Edited yesterday",
        viewCount: 6,
        visibility: "private",
        href: "#a3",
      },
    ],
  },
  {
    id: "churn",
    label: "Churn analysis",
    items: [
      {
        id: "b1",
        type: "chart",
        excerpt: "Cohort retention by signup month, 2024 Q1 through Q4. Month-3 is where the cliff is.",
        editedAgo: "Edited 3 days ago",
        viewCount: 91,
        visibility: "shared",
        href: "#b1",
      },
    ],
  },
];

/** The badge and the facet row are two renders of the same `type` value. */
export const TypeBadge: Story = {
  args: { sessions: SESSIONS },
};

/** The excerpt is the largest text and the accessible name of the card's link. */
export const Excerpt: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Pricing page rewrite",
        items: [
          {
            id: "a1",
            type: "document",
            title: "Untitled document",
            excerpt:
              "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable, and everything below it exists to make it look generous.",
            href: "#excerpt",
          },
        ],
      },
    ],
  },
};

export const EditedAgo: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Pricing page rewrite",
        items: [
          {
            id: "a1",
            type: "document",
            excerpt: "Three tiers, and the middle one is the default.",
            editedAgo: "Edited 2 hours ago",
            href: "#edited",
          },
        ],
      },
    ],
  },
};

/** Reach carries its unit — "1,204 views", never a bare number. */
export const ViewCount: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Churn analysis",
        items: [
          {
            id: "b1",
            type: "chart",
            excerpt: "Cohort retention by signup month. Month-3 is where the cliff is.",
            viewCount: 1204,
            href: "#views",
          },
        ],
      },
    ],
  },
};

/** Each visibility gets its own icon shape and its own visible word. */
export const PrivacyIcon: Story = {
  args: {
    sessions: [
      {
        id: "s",
        label: "Shared workspace",
        items: [
          {
            id: "p1",
            type: "document",
            excerpt: "Draft messaging for the launch announcement.",
            visibility: "private",
            viewCount: 1,
            href: "#private",
          },
          {
            id: "p2",
            type: "document",
            excerpt: "Reviewed messaging, circulated to the marketing channel.",
            visibility: "shared",
            viewCount: 38,
            href: "#shared",
          },
          {
            id: "p3",
            type: "document",
            excerpt: "Published announcement, live on the changelog.",
            visibility: "public",
            viewCount: 1204,
            href: "#public",
          },
        ],
      },
    ],
  },
};
