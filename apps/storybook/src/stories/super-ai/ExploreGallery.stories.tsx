import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExploreGallery, type ExploreGalleryItem } from "@/registry/super-ai/explore-gallery";
import { ExploreGalleryDocs } from "@/content/components/explore-gallery.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Swatch({ tone }: { tone: "primary" | "secondary" | "muted" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "bg-primary/25 size-full"
          : tone === "secondary"
            ? "bg-secondary size-full"
            : "bg-muted size-full"
      }
    />
  );
}

const ITEMS: ExploreGalleryItem[] = [
  {
    id: "1",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@lumen",
    metric: "1.2k",
    prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
    media: <Swatch tone="primary" />,
  },
  {
    id: "2",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    type: "image",
    typeLabel: "Image",
    author: "@fold",
    metric: "840",
    prompt: "layered paper-cut forest, warm rim light",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "3",
    title: "Chrome jellyfish",
    aspectRatio: "1 / 1",
    type: "video",
    typeLabel: "Video",
    author: "@drift",
    metric: "3.4k",
    prompt: "chrome jellyfish drifting through black water, slow motion",
    media: <Swatch tone="muted" />,
  },
  {
    id: "4",
    title: "Brutalist greenhouse",
    aspectRatio: "4 / 5",
    type: "image",
    typeLabel: "Image",
    author: "@cass",
    metric: "612",
    prompt: "brutalist concrete greenhouse, overgrown, golden hour",
    media: <Swatch tone="secondary" />,
  },
  {
    id: "5",
    title: "Tide pool macro",
    aspectRatio: "3 / 2",
    type: "image",
    typeLabel: "Image",
    author: "@sable",
    metric: "298",
    prompt: "tide pool macro photography, iridescent shells",
    media: <Swatch tone="muted" />,
  },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TYPES = [
  { value: "all", label: "All", count: 240 },
  { value: "image", label: "Images", count: 180 },
  { value: "video", label: "Video", count: 60 },
];

const meta: Meta<typeof ExploreGallery> = {
  title: "Super AI/Explore Gallery",
  component: ExploreGallery,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ExploreGalleryDocs) } },
  decorators: [
    (Story) => (
      <div className="h-[34rem] w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { items: ITEMS, className: "h-full" },
};

export default meta;
type Story = StoryObj<typeof ExploreGallery>;

/** Axis one on its own: ordering the whole feed, removing nothing from it. */
export const SortTabs: Story = {
  args: { sorts: SORTS, defaultSort: "hot", dockedPrompt: false },
};

/** Axis two, alongside the first — two controls, two names, never merged. */
export const TypePills: Story = {
  args: { sorts: SORTS, types: TYPES, defaultType: "all", dockedPrompt: false },
};

/** The next page is a focusable button with a live count, not a scroll position. */
export const InfiniteScroll: Story = {
  args: {
    sorts: SORTS,
    types: TYPES,
    defaultType: "all",
    totalCount: 240,
    hasMore: true,
    dockedPrompt: false,
  },
};

/** The prompt bar lives above the feed, so a tile's Remix converts in place. */
export const DockedPrompt: Story = {
  args: { sorts: SORTS, types: TYPES, defaultType: "all", totalCount: 240, hasMore: true },
};
