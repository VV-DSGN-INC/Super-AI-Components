"use client";

import { useState } from "react";

import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";

/**
 * Live examples for filter-bar.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so filter-bar.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * example that needs a handler — and for this component that is all of them,
 * since the bar reports intent and holds nothing — lives here and crosses into
 * the docs module as a zero-prop element.
 */

const FACETS = ["Image", "Video", "Upscale"];

export function ControlledFacetRow() {
  const [applied, setApplied] = useState<string[]>(["Image"]);
  const toggle = (facet: string) =>
    setApplied((current) =>
      current.includes(facet) ? current.filter((f) => f !== facet) : [...current, facet],
    );

  return (
    <div className="flex flex-col gap-3">
      <FilterBar>
        {FACETS.map((facet) => (
          <FilterChip
            key={facet}
            active={applied.includes(facet)}
            onClick={() => toggle(facet)}
            onRemove={applied.includes(facet) ? () => toggle(facet) : undefined}
          >
            {facet}
          </FilterChip>
        ))}
        <FiltersButton onClick={() => {}} />
      </FilterBar>
      <p className="text-foreground text-sm">
        Applied: <span className="font-medium">{applied.join(", ") || "(nothing — click a chip)"}</span>
      </p>
    </div>
  );
}

export function AppliedFacetsAreRemovable() {
  const [applied, setApplied] = useState(["Image", "v7", "Last 7 days"]);
  return (
    <FilterBar>
      {applied.map((facet) => (
        <FilterChip
          key={facet}
          active
          onClick={() => {}}
          onRemove={() => setApplied((current) => current.filter((f) => f !== facet))}
        >
          {facet}
        </FilterChip>
      ))}
      <AddFilterChip onClick={() => {}}>Style</AddFilterChip>
      <FiltersButton onClick={() => {}} />
    </FilterBar>
  );
}

export function WrappedLabelLosesRemoveName() {
  // The wrong way: a label wrapped in an element. FilterChip builds each remove
  // button's accessible name from `typeof children === "string"` only, so both
  // X buttons below are named "Remove filter" — identical, and unusable by
  // anyone tabbing the row or listening to it.
  return (
    <FilterBar>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        <span className="font-medium">Image</span>
      </FilterChip>
      <FilterChip active onClick={() => {}} onRemove={() => {}}>
        <span className="font-medium">v7</span>
      </FilterChip>
    </FilterBar>
  );
}

export function DisabledChipKeepsLiveRemove() {
  // The wrong way: `disabled` spreads onto the toggle button only. The remove
  // button is a sibling built from `onRemove`, so the chip below cannot be
  // switched off and can still be deleted — by mouse or by Tab.
  return (
    <FilterBar>
      <FilterChip active disabled onClick={() => {}} onRemove={() => {}}>
        Image
      </FilterChip>
      <FilterChip disabled onClick={() => {}}>
        Video
      </FilterChip>
    </FilterBar>
  );
}

export function RowGrownPastTheLadder() {
  // The wrong way: nine facets in a bar that wraps. There is no overflow count
  // in this component, so the row keeps growing downwards and the library it is
  // meant to be filtering gets pushed off the fold.
  const facets = [
    "Image",
    "v7",
    "Last 7 days",
    "Cinematic",
    "Upscale",
    "Portrait",
    "Owned by me",
    "Starred",
    "Prompt contains: golden hour",
  ];
  return (
    <div className="w-72 rounded-md border p-2">
      <FilterBar>
        {facets.map((facet) => (
          <FilterChip key={facet} active onClick={() => {}} onRemove={() => {}}>
            {facet}
          </FilterChip>
        ))}
      </FilterBar>
    </div>
  );
}
