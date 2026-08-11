"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type { FilterSelection } from "@/registry/super-ai/filter-panel";
import { LibraryShell, type LibraryShellProps } from "@/registry/super-ai/library-shell";

const FACETS: LibraryShellProps["facets"] = [
  {
    id: "type",
    label: "Type",
    facets: [
      { value: "image", label: "Image", count: 1284 },
      { value: "video", label: "Video", count: 96 },
      { value: "audio", label: "Audio", count: 18 },
      { value: "3d", label: "3D", count: 0 },
    ],
  },
  {
    id: "model",
    label: "Model",
    visibleCount: 3,
    facets: [
      { value: "v7", label: "Aurora v7", count: 812 },
      { value: "v6", label: "Aurora v6", count: 401 },
      { value: "sketch", label: "Sketch", count: 121 },
      { value: "legacy", label: "Legacy", count: 64 },
    ],
  },
  {
    id: "format",
    label: "Format",
    facets: [
      { value: "portrait", label: "Portrait", count: 604 },
      { value: "landscape", label: "Landscape", count: 588 },
      { value: "square", label: "Square", count: 206 },
    ],
  },
];

const SAVED_SEARCHES = [
  { id: "upscaled", label: "Upscaled keepers", count: 42 },
  { id: "client", label: "Client-ready", count: 17 },
];

/**
 * Decorative frames — the archive's thumbnails are the caller's, and these
 * stand in. Solid semantic fills rather than gradients: axe cannot resolve a
 * gradient to a colour, so a gradient thumbnail leaves the tile's overlay
 * label permanently "incomplete" in the contrast report.
 */
const swatch = (tint: string) => <div aria-hidden className={`h-full w-full ${tint}`} />;

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";

/** Derived from the string, so a reworded prompt cannot silently skew the span. */
const spanFor = (phrase: string) => ({
  start: PROMPT.indexOf(phrase),
  end: PROMPT.indexOf(phrase) + phrase.length,
});

const GROUPS: LibraryShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "a1",
        name: "Red bicycle, sunlit wall",
        thumbnail: swatch("bg-primary/20"),
        prompt: PROMPT,
        highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
        params: [
          { label: "Seed", value: "4471", copyable: true },
          { label: "Sampler", value: "Euler a" },
          { label: "Steps", value: "32" },
          { label: "Model", value: "Aurora v7" },
        ],
      },
      { id: "a2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
      { id: "a3", name: "Rain on glass", thumbnail: swatch("bg-accent") },
      { id: "a4", name: "Market stall", thumbnail: swatch("bg-muted") },
      { id: "a5", name: "Bridge at noon", thumbnail: swatch("bg-primary/10") },
      { id: "a6", name: "Studio portrait", thumbnail: swatch("bg-card") },
    ],
  },
  {
    id: "last-week",
    label: "Last week",
    items: [
      { id: "b1", name: "Harbour at dusk", thumbnail: swatch("bg-primary/30") },
      { id: "b2", name: "Neon alley", thumbnail: swatch("bg-secondary") },
      { id: "b3", name: "Paper texture", thumbnail: swatch("bg-muted") },
      { id: "b4", name: "Upscaling", state: "loading" as const },
    ],
  },
];

export default function LibraryShellDemo() {
  const [selectedFacets, setSelectedFacets] = React.useState<FilterSelection>({ type: ["image"] });
  const [search, setSearch] = React.useState("");

  return (
    <LibraryShell
      className="h-[42rem]"
      title="Library"
      headerActions={
        <Button size="sm" variant="outline">
          Upload
        </Button>
      }
      search={search}
      onSearchChange={setSearch}
      facets={FACETS}
      selectedFacets={selectedFacets}
      onSelectedFacetsChange={setSelectedFacets}
      savedSearches={SAVED_SEARCHES}
      groups={GROUPS}
      onCopyPrompt={() => {}}
      onRemix={() => {}}
      onEditAsset={() => {}}
      onSpanSelect={() => {}}
    />
  );
}
