import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArtifactShell, type ArtifactShellProps } from "@/registry/super-ai/artifact-shell";
import { ArtifactShellDocs } from "@/content/components/artifact-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const NAV = (
  <SidebarNav
    aria-label="Library"
    activeId="all"
    sections={[
      {
        label: "Library",
        items: [
          { id: "all", label: "All artifacts", count: 6 },
          { id: "shared", label: "Shared with me" },
          { id: "public", label: "Published" },
        ],
      },
    ]}
  />
);

const GROUPS: ArtifactShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    sessions: [
      {
        id: "brand-audit",
        label: "Brand audit for Northwind",
        items: [
          {
            id: "a1",
            excerpt:
              "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
            type: "markdown",
            editedAgo: "Edited 4 minutes ago",
            visibility: "private",
          },
          {
            id: "a2",
            excerpt:
              "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
            type: "code",
            editedAgo: "Edited 9 minutes ago",
            viewCount: 3,
            visibility: "shared",
          },
        ],
      },
      {
        id: "pricing",
        label: "Pricing page copy",
        items: [
          {
            id: "a3",
            excerpt:
              "Three tiers. The middle one is the one we want people to pick, so it carries the annual saving and the word most people search for.",
            type: "markdown",
            editedAgo: "Edited 40 minutes ago",
            visibility: "private",
          },
        ],
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    sessions: [
      {
        id: "onboarding",
        label: "Onboarding email rewrite",
        items: [
          {
            id: "a4",
            excerpt:
              "Welcome — you are three minutes from your first render. Everything below is optional; the one thing that matters is picking a starting point.",
            type: "html",
            editedAgo: "Edited Tuesday",
            viewCount: 128,
            visibility: "public",
          },
          {
            id: "a5",
            excerpt:
              "export function WelcomeCard({ name }: { name: string }) { return <Card>Hello {name}</Card> }",
            type: "react",
            editedAgo: "Edited Tuesday",
            visibility: "shared",
          },
          {
            id: "a6",
            excerpt:
              "Drop-off is concentrated in the second step, where we ask for a workspace name before showing anything worth naming.",
            type: "markdown",
            editedAgo: "Edited Monday",
            viewCount: 12,
            visibility: "private",
          },
        ],
      },
    ],
  },
];

const FULL_ARGS: ArtifactShellProps = {
  title: "Artifacts",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  nav: NAV,
  groups: GROUPS,
  onOpenFilters: () => {},
};

const meta: Meta<typeof ArtifactShell> = {
  title: "Super AI/Artifact Shell",
  component: ArtifactShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(ArtifactShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArtifactShell>;

/** The working index: two recency buckets, three sessions, five type facets. */
export const Index: Story = { args: FULL_ARGS };

/**
 * Day one. Nothing generated, nothing in the library — two empty affordances at
 * once, and the search field and facet row still mounted so both are
 * discoverable before there is anything to scope. Mandatory export for the
 * block contract.
 */
export const Empty: Story = {
  args: {
    title: "Artifacts",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the header trigger becomes the only way in, the
 * facet row wraps, and the grid drops to a single column — which is the width at
 * which the excerpt reads best anyway. Mandatory export for the block contract:
 * a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width like any
 * other. The narrow layout here is verified by hand, not by a gate.
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

/** A type facet applied: the same `type` value that stamps J4's badges. */
export const Filtered: Story = { args: { ...FULL_ARGS, activeType: "markdown" } };

/**
 * Searched by what the artifacts say rather than what they are called — the
 * whole reason the card leads with its excerpt.
 */
export const Searched: Story = { args: { ...FULL_ARGS, defaultQuery: "reassurance" } };

/** Nothing matches. L1 in its emptied form, announced rather than silent. */
export const NoResults: Story = { args: { ...FULL_ARGS, defaultQuery: "quarterly forecast" } };

/**
 * K1 above the index: a passage that has just been generated, still holding its
 * Keep / Edit / Regenerate / Discard verbs and not yet filed under a bucket.
 */
export const WithDraft: Story = {
  args: {
    ...FULL_ARGS,
    draftLabel: "Just generated",
    draft: {
      label: "Generated from the brand audit",
      children: (
        <p>
          Northwind should lead every page with the calm claim and let the speed claim arrive
          second. Competitors have taken the fast lane and left the reassuring one open.
        </p>
      ),
      onKeep: () => {},
      onEdit: () => {},
      onRegenerate: () => {},
      onDiscard: () => {},
    },
  },
};
