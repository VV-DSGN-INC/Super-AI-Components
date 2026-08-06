"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FilterPanel, type FilterPanelSection } from "@/registry/super-ai/filter-panel";

/**
 * Live examples for filter-panel.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose: the docs
 * module is plain data read by a Server Component, so anything carrying an
 * event handler has to be created and consumed entirely in here and cross the
 * boundary as a zero-prop element.
 */

const TYPE_SECTION: FilterPanelSection[] = [
  {
    id: "type",
    label: "Type",
    facets: [
      { value: "image", label: "Image", count: 1284 },
      { value: "video", label: "Video", count: 96 },
      { value: "3d", label: "3D", count: 0 },
    ],
  },
];

export function CountsAndDeadEnds() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <FilterPanel title={null} sections={TYPE_SECTION} defaultSelected={{ type: ["image"] }} />
    </div>
  );
}

export function ZeroHiddenBehindDimming() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <p className="pb-2 text-sm font-semibold">Type</p>
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox /> Image
        </label>
        <label className="flex items-center gap-2">
          <Checkbox /> Video
        </label>
        {/* No count, still clickable, and the only hint that it is a dead end
            is that it looks a bit faint. */}
        <label className="flex items-center gap-2 opacity-40">
          <Checkbox /> 3D
        </label>
      </div>
    </div>
  );
}

export function SavedSearchesInTheirOwnBlock() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <FilterPanel
        title={null}
        sections={TYPE_SECTION}
        savedSearches={[
          { id: "upscales", label: "Upscales this month", count: 42 },
          { id: "brief", label: "Client brief", count: 7 },
        ]}
        activeSavedSearchId="upscales"
      />
    </div>
  );
}

export function SavedSearchesAsAFacetGroup() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <FilterPanel
        title={null}
        // Wrong shape: a saved search replaces the filter set, so modelling it
        // as checkboxes invites two of them to be ticked at once.
        sections={[
          {
            id: "saved",
            label: "Saved searches",
            facets: [
              { value: "upscales", label: "Upscales this month", count: 42 },
              { value: "brief", label: "Client brief", count: 7 },
            ],
          },
          ...TYPE_SECTION,
        ]}
        defaultSelected={{ saved: ["upscales", "brief"] }}
      />
    </div>
  );
}
