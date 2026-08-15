"use client";

import { useId, useState } from "react";

import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Live examples for section-header.docs.tsx.
 *
 * A client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component that reads `docs.whatItIs`, `docs.evidence` and so on directly, so
 * section-header.docs.tsx has to stay plain server-evaluable data and cannot
 * carry "use client" itself. The disclosure examples below need real state —
 * `open` / `onOpenChange` is the whole point of two of them — so they live here
 * and cross into the docs module as zero-prop elements.
 */

export function LabelledGroup() {
  const headingId = useId();
  return (
    // The header renders a div, not a heading, so the group it names has to be
    // labelled explicitly. This is what tool-panel, filter-panel and
    // asset-library all do.
    <div role="group" aria-labelledby={headingId} className="w-full max-w-sm">
      <SectionHeader
        id={headingId}
        title="Recent projects"
        count={12}
        action={
          <a href="#" className="underline underline-offset-2">
            View all
          </a>
        }
      />
      <ul className="text-muted-foreground space-y-1 text-sm">
        <li>quarterly-review.pdf</li>
        <li>launch-deck.key</li>
        <li>onboarding-script.md</li>
      </ul>
    </div>
  );
}

export function CollapseDrivesThePanel() {
  const [open, setOpen] = useState(true);
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="w-full max-w-sm">
      <SectionHeader
        id={headingId}
        size="sm"
        title="Filters"
        count={3}
        collapsible
        open={open}
        onOpenChange={setOpen}
        // Collapsed, the action slot carries the one signal that survives:
        // a section hiding live filters must not read as an empty one.
        action={
          open ? undefined : <span className="text-foreground text-xs font-medium">2 selected</span>
        }
      />
      {open ? (
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>Type: image</li>
          <li>Model: flux-1.1-pro</li>
          <li>Owner: me</li>
        </ul>
      ) : null}
    </div>
  );
}

export function ChildrenSilentlyDropped() {
  return (
    <div className="w-full max-w-sm">
      {/* The wrong way: passing the panel as children. `children` arrives in
          the spread, but the root div already has explicit JSX children, and
          explicit children always win — so this paragraph is discarded with no
          warning and no error. */}
      <SectionHeader title="Assets" count={4}>
        <p>This row never renders.</p>
      </SectionHeader>
      <p className="text-muted-foreground text-xs">
        Nothing appeared above this line. The header is one row and only one row.
      </p>
    </div>
  );
}

export function CollapseWithNoVisibleChange() {
  return (
    <div className="w-full max-w-sm">
      {/* The wrong way: `collapsible` alone, with no panel wired to it and no
          signal in the action slot. Clicking flips aria-expanded and
          data-state, and a sighted user sees nothing at all move — there is no
          chevron and the header does not own what sits beneath it. */}
      <SectionHeader size="sm" title="Filters" collapsible defaultOpen />
      <ul className="text-muted-foreground space-y-1 text-sm">
        <li>Type: image</li>
        <li>Model: flux-1.1-pro</li>
      </ul>
    </div>
  );
}
