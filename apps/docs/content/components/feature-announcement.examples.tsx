"use client";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";

/**
 * Live examples for feature-announcement.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so feature-announcement.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a zero-prop
 * element, so a handler like `onDismiss` never has to be serialized across the
 * server/client boundary.
 *
 * The two "don't" examples are deliberately static mock-ups rather than real
 * FeatureAnnouncement renders: a real `level="modal"` announcement would open a
 * portalled dialog over the docs page the moment you scrolled to it.
 */

export function ChipForATweak() {
  return (
    <FeatureAnnouncement
      id="example-export-limit"
      level="dismissible-chip"
      stage="v2.4"
      title="Exports now run up to 4K"
      onDismiss={() => {}}
    />
  );
}

export function StageBadgeSetsExpectations() {
  return (
    <FeatureAnnouncement
      id="example-voice-library"
      level="inline-card"
      stage="Beta"
      title="Shared voice library"
      description="Voices you clone are available to the whole workspace. Quality varies while it is in beta."
      ctaLabel="Open the library"
      onCtaClick={() => {}}
      onDismiss={() => {}}
    />
  );
}

/** Don't: a modal for news a chip could carry. */
export function ModalForATweak() {
  return (
    <div className="w-full max-w-md rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-heading text-base font-medium">Exports now run up to 4K</p>
        <span aria-hidden className="text-muted-foreground">
          ✕
        </span>
      </div>
      <p className="text-muted-foreground">No plan change needed.</p>
      <div className="-mx-4 -mb-4 mt-4 flex justify-end rounded-b-xl border-t bg-muted/50 p-4">
        <span className="rounded-lg bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground">
          Got it
        </span>
      </div>
    </div>
  );
}

/** Don't: a bare coloured dot standing in for the stage. */
export function ColourOnlyNewDot() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-card py-1 pr-1 pl-2.5 text-sm text-card-foreground ring-1 ring-foreground/10">
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="font-medium">Shared voice library</span>
      <span aria-hidden className="px-1.5 text-muted-foreground">
        ✕
      </span>
    </div>
  );
}
