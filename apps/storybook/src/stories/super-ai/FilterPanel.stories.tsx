import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { FilterPanel, type FilterPanelSection } from "@/registry/super-ai/filter-panel";
import { FilterPanelDocs } from "@/content/components/filter-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const TYPE: FilterPanelSection = {
  id: "type",
  label: "Type",
  facets: [
    { value: "image", label: "Image", count: 1284 },
    { value: "video", label: "Video", count: 96 },
    { value: "upscale", label: "Upscale", count: 312 },
    // The dead end: disabled, and still showing its zero.
    { value: "3d", label: "3D", count: 0 },
  ],
};

const MODEL: FilterPanelSection = {
  id: "model",
  label: "Model",
  facets: [
    { value: "v7", label: "v7", count: 812 },
    { value: "v6.1", label: "v6.1", count: 407 },
    { value: "niji-6", label: "niji 6", count: 268 },
  ],
};

const STYLE: FilterPanelSection = {
  id: "style",
  label: "Style",
  visibleCount: 4,
  facets: [
    { value: "cinematic", label: "Cinematic", count: 214 },
    { value: "anime", label: "Anime", count: 188 },
    { value: "illustration", label: "Illustration", count: 176 },
    { value: "photographic", label: "Photographic", count: 143 },
    { value: "isometric", label: "Isometric", count: 88 },
    { value: "watercolour", label: "Watercolour", count: 61 },
    { value: "line-art", label: "Line art", count: 54 },
    { value: "collage", label: "Collage", count: 37 },
  ],
};

const meta: Meta<typeof FilterPanel> = {
  title: "Super AI/Filter Panel",
  component: FilterPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FilterPanelDocs) } },
  decorators: [
    (Story) => (
      <div className="w-72 rounded-lg border p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

/**
 * The point of the component. Every facet carries the number of results it
 * would leave, and 3D — which would leave none — is disabled and still shows
 * its zero rather than being dimmed or dropped.
 */
export const FacetCounts: Story = {
  args: { sections: [TYPE, MODEL], defaultSelected: { model: ["v7"] } },
};

/**
 * Overflow inside one group: four styles on screen, one button naming the four
 * still hidden. Not a second section, and not an infinite list.
 */
export const SeeMore: Story = {
  args: { sections: [STYLE], defaultSelected: { style: ["cinematic"] } },
};

/**
 * Sections collapse and remember. Type is closed with a filter still applied,
 * so its header keeps saying "1 selected" — a collapsed group must never hide
 * the reason the result list is short.
 */
export const CollapsedSection: Story = {
  args: {
    sections: [TYPE, MODEL, { ...STYLE, defaultOpen: false }],
    defaultSelected: { type: ["video"] },
    defaultOpenSections: ["model"],
  },
};

/**
 * The top of the filtering scale ladder. Saved searches are their own region
 * above the facets — buttons, not checkboxes, because picking one replaces the
 * filter set instead of narrowing it.
 */
export const SavedSearches: Story = {
  args: { sections: [TYPE, MODEL] },
  render: function SavedSearchesStory(args) {
    const [active, setActive] = useState<string | null>("upscales");
    return (
      <FilterPanel
        {...args}
        savedSearches={[
          { id: "upscales", label: "Upscales this month", count: 42 },
          { id: "liked-v7", label: "Liked v7 cinematic", count: 18 },
          { id: "brief", label: "Client brief — moodboard", count: 7 },
        ]}
        activeSavedSearchId={active}
        onSavedSearchSelect={setActive}
      />
    );
  },
};

/**
 * Sort and layout change how results are shown, not which ones survive, so
 * they sit above the facets as single-select radio groups rather than
 * combinable checkboxes.
 */
export const ViewOptions: Story = {
  args: {
    sections: [TYPE],
    viewOptions: [
      {
        id: "sort",
        label: "Sort",
        defaultValue: "newest",
        options: [
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "rating", label: "Rating" },
        ],
      },
      {
        id: "layout",
        label: "Layout",
        defaultValue: "grid",
        options: [
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ],
      },
    ],
  },
};
