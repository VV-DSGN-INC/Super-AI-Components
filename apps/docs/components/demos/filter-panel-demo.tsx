"use client";

import { useMemo, useState } from "react";

import {
  FilterPanel,
  type FilterPanelSection,
  type FilterSelection,
} from "@/registry/super-ai/filter-panel";

const SECTIONS: FilterPanelSection[] = [
  {
    id: "type",
    label: "Type",
    facets: [
      { value: "image", label: "Image", count: 1284 },
      { value: "video", label: "Video", count: 96 },
      { value: "upscale", label: "Upscale", count: 312 },
      // Nothing behind this one. The panel says so before the click.
      { value: "3d", label: "3D", count: 0 },
    ],
  },
  {
    id: "model",
    label: "Model",
    facets: [
      { value: "v7", label: "v7", count: 812 },
      { value: "v6.1", label: "v6.1", count: 407 },
      { value: "niji-6", label: "niji 6", count: 268 },
      { value: "v5.2", label: "v5.2", count: 91 },
    ],
  },
  {
    id: "style",
    label: "Style",
    // 12 styles, 4 on screen. The rest are one button away.
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
      { value: "pixel", label: "Pixel", count: 22 },
      { value: "claymation", label: "Claymation", count: 14 },
      { value: "blueprint", label: "Blueprint", count: 9 },
      { value: "risograph", label: "Risograph", count: 4 },
    ],
  },
  {
    id: "rating",
    label: "Rating",
    defaultOpen: false,
    facets: [
      { value: "liked", label: "Liked", count: 264 },
      { value: "unrated", label: "Unrated", count: 1002 },
    ],
  },
];

const SAVED_SEARCHES = [
  { id: "upscales", label: "Upscales this month", count: 42 },
  { id: "liked-v7", label: "Liked v7 cinematic", count: 18 },
  { id: "client-brief", label: "Client brief — moodboard", count: 7 },
];

export default function FilterPanelDemo() {
  const [selected, setSelected] = useState<FilterSelection>({ model: ["v7"] });
  const [savedSearch, setSavedSearch] = useState<string | null>(null);
  // The host owns the persisted copy. The panel remembers within its own
  // lifetime; surviving a reload is this state's job, not the panel's.
  const [openSections, setOpenSections] = useState<string[]>(["type", "model", "style"]);
  const [sort, setSort] = useState("newest");

  const applied = useMemo(
    () => Object.values(selected).reduce((total, values) => total + values.length, 0),
    [selected],
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="w-72 rounded-lg border p-4">
        <FilterPanel
          sections={SECTIONS}
          selected={selected}
          onSelectedChange={(next) => {
            setSelected(next);
            setSavedSearch(null);
          }}
          openSections={openSections}
          onOpenSectionsChange={setOpenSections}
          savedSearches={SAVED_SEARCHES}
          activeSavedSearchId={savedSearch}
          onSavedSearchSelect={(id) => {
            setSavedSearch(id);
            // A saved search replaces the filter set — it does not narrow it.
            setSelected(id === "liked-v7" ? { model: ["v7"], style: ["cinematic"], rating: ["liked"] } : {});
          }}
          viewOptions={[
            {
              id: "sort",
              label: "Sort",
              value: sort,
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
          ]}
          onViewOptionChange={(groupId, value) => {
            if (groupId === "sort") setSort(value);
          }}
          onClearAll={() => setSavedSearch(null)}
        />
      </div>
      <p role="status" className="text-muted-foreground text-xs">
        {applied === 0 ? "No filters applied." : `${applied} filter${applied === 1 ? "" : "s"} applied.`}{" "}
        Sorted by {sort}.
      </p>
    </div>
  );
}
