"use client";

import { ReferenceStrip, type ReferenceStripItem } from "@/registry/super-ai/reference-strip";
import { PreviewScene } from "@/registry/super-ai/preview-scene";

/**
 * Live examples for reference-strip.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.dos`, `docs.donts`,
 * etc. directly, so reference-strip.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop
 * element (e.g. `<TypedRoleLabels />`), so a prop like `onAdd` never has to
 * be serialized across the server/client boundary — it's created and
 * consumed entirely inside this client module. See
 * workspace-switcher.docs.tsx + workspace-switcher.examples.tsx for the
 * pattern this follows.
 */

const PLAIN_ITEMS: ReferenceStripItem[] = [
  {
    id: "one",
    thumbnail: <PreviewScene subject="landscape" treatment="line" variant={1} label="Concept sketch of a lighthouse" />,
  },
  {
    id: "two",
    thumbnail: <PreviewScene subject="landscape" grade="warm" variant={2} label="Photo of a coastline at dusk" />,
  },
];

const ROLE_ITEMS: ReferenceStripItem[] = [
  {
    id: "first-frame",
    role: "first-frame",
    thumbnail: <PreviewScene subject="city" treatment="soft" variant={4} label="First frame of the shot" />,
  },
  { id: "last-frame", role: "last-frame" },
];

export function TypedRoleLabels() {
  return <ReferenceStrip items={ROLE_ITEMS} onAdd={() => {}} />;
}

export function EmptySlotStaysVisible() {
  return <ReferenceStrip items={ROLE_ITEMS} onAdd={() => {}} />;
}

export function RemovableReferences() {
  return <ReferenceStrip items={PLAIN_ITEMS} onAdd={() => {}} />;
}

/** Anti-pattern: role conveyed only by icon/colour, no text label — exactly
    what `showRole` in `ReferenceStrip` exists to avoid. Not the real
    component, on purpose. */
export function ColorOnlyRoleBadge() {
  return (
    <div className="flex gap-3">
      {["bg-chart-1", "bg-chart-2"].map((swatch) => (
        <div key={swatch} className="flex flex-col items-center gap-1">
          <div className="bg-muted relative size-20 overflow-hidden rounded-lg">
            <img
              />
            <span className={`absolute top-1 right-1 size-2 rounded-full ${swatch}`} aria-hidden />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Anti-pattern: the slot disappears once its image is removed, instead of
    staying present as an empty, still-attachable placeholder (D2). */
export function EmptySlotCollapsedAway() {
  return <ReferenceStrip items={[ROLE_ITEMS[0]]} onAdd={() => {}} />;
}
