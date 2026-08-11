"use client";

import { FilterPanel, type FilterPanelSection } from "@/registry/super-ai/filter-panel";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Live examples for library-shell.docs.tsx.
 *
 * A client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component and reads `docs.whatItIs`, `docs.evidence` and the rest straight
 * off the exported object, so the docs module has to stay plain
 * server-evaluable data. Every example here is a zero-prop component, so a
 * handler never has to cross the server/client boundary.
 *
 * These are fragments of the shell, not whole shells: four page shells stacked
 * down a documentation page would teach nothing the live preview at the top of
 * the page does not already teach.
 */

const COUNTED: FilterPanelSection[] = [
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

// J2 makes `count` required, so a genuinely uncounted rail cannot be built from
// it at all — which is the point of this pair. Hiding the counts is the closest
// honest stand-in for the hand-rolled checkbox list a surface reaches for when
// it skips J2.
const HIDE_COUNTS = "[&_[data-slot=filter-panel-facet-count]]:invisible";

const ASSETS = [
  { id: "a1", name: "Red bicycle" },
  { id: "a2", name: "Blue awning" },
  { id: "a3", name: "Rain on glass" },
  { id: "a4", name: "Market stall" },
  { id: "a5", name: "Bridge at noon" },
  { id: "a6", name: "Studio portrait" },
  { id: "a7", name: "Harbour at dusk" },
  { id: "a8", name: "Neon alley" },
];

function Frame({ children, width = "w-64" }: { children: React.ReactNode; width?: string }) {
  return <div className={`rounded-lg border p-3 ${width}`}>{children}</div>;
}

/** Do — every facet states what it would leave, so no click is a gamble. */
export function FacetsCarryTheirCounts() {
  return (
    <Frame>
      <FilterPanel title="Filters" sections={COUNTED} />
    </Frame>
  );
}

/** Don't — a rail of bare labels; the dead end is only found by clicking it. */
export function FacetsWithoutCounts() {
  return (
    <Frame>
      <FilterPanel title="Filters" sections={COUNTED} className={HIDE_COUNTS} />
    </Frame>
  );
}

/** Do — dense. Eight-up is a page of the archive you can actually scan. */
export function DenseByDefault() {
  return (
    <div className="w-full max-w-2xl">
      <GenerationGrid
        items={ASSETS}
        density="compact"
        getItemId={(asset) => asset.id}
        renderItem={(asset) => (
          <PreviewTile aspect="square" label={asset.name} labelPlacement="overlay" onSelect={() => {}} />
        )}
      />
    </div>
  );
}

/** Don't — gallery density in an archive: two rows of scrolling per day of work. */
export function GalleryDensityInAnArchive() {
  return (
    <div className="w-full max-w-2xl">
      <GenerationGrid
        items={ASSETS}
        density="comfortable"
        getItemId={(asset) => asset.id}
        renderItem={(asset) => (
          <PreviewTile aspect="square" label={asset.name} labelPlacement="overlay" onSelect={() => {}} />
        )}
      />
    </div>
  );
}
