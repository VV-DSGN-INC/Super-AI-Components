import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

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

/**
 * A 1200px column — comfortably past 64rem/1024px, the old `lg` breakpoint
 * and the exact container threshold this grid now uses for its third
 * column. The width a standalone consumer with no sidebar actually gives
 * this grid. Proves the container-query switch resolves the same as the old
 * sm/lg viewport breakpoints once this box has room: three columns,
 * unchanged.
 *
 * (Not the bare, unwrapped default story: Storybook's centered layout
 * decorator is itself a shrink-to-fit flex row, and this element's own
 * `@container` containment stops that ancestor from sizing it off its
 * content — the box collapses to the width of the session label instead.
 * That is a real, general hazard for any consumer who places this grid
 * inside a shrink-to-fit ancestor, e.g. a bare `flex justify-center` wrapper,
 * not a defect introduced here; an explicit width sidesteps it, the same way
 * NarrowColumn anchors its own width instead of leaving it to the canvas.)
 */
export const FullWidth: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[1200px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(3);
  },
};

/**
 * 600px — inside [448px, 640px), the band where Tailwind's *named*
 * container rung (`@md`, 28rem/448px) and the old viewport rung it stands
 * in for (`sm`, 40rem/640px) disagree. Below the real 640px threshold, so
 * this must stay at one column. A regression back to the named `@md` rung
 * would show two here instead — this story exists to catch exactly that,
 * not to exercise a state the component itself declares.
 */
export const JustBelowTwoColumns: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[600px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(1);
  },
};

/**
 * 950px — inside [896px, 1024px), the same kind of gap one rung up:
 * Tailwind's named `@4xl` (56rem/896px) versus the old `lg` (64rem/1024px)
 * it stands in for. Below the real 1024px threshold, so this must stay at
 * two columns. A regression back to the named `@4xl` rung would show three
 * here instead.
 */
export const JustBelowThreeColumns: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[950px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(2);
  },
};

/**
 * The grid in a 420px column, which is what every shell with a sidebar gives
 * it. Keyed to the viewport it would step to two columns here purely because
 * the *window* is wide, and the excerpt — the field the component is built
 * around — clamps to nothing. Keyed to its own container it stays at one.
 *
 * chat-shell and artifact-shell both carried descendant-variant overrides to
 * force this by hand before the grid measured itself.
 */
export const NarrowColumn: Story = {
  args: { sessions: SESSIONS },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <ArtifactGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelector<HTMLElement>('[data-slot="artifact-grid-items"]')!;
    const columns = getComputedStyle(items).gridTemplateColumns.split(" ").length;
    await expect(columns).toBe(1);
  },
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
