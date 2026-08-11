"use client";

import { Input } from "@/components/ui/input";
import { PresetGrid } from "@/registry/super-ai/preset-grid";
import { PropertyInspector, PropertyRow } from "@/registry/super-ai/property-inspector";
import { ToolPanel } from "@/registry/super-ai/tool-panel";

/**
 * Live examples for studio-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onValueChange` never has to cross the
 * server/client boundary.
 *
 * These are fragments of the shell, not whole shells: four full editors stacked
 * down a documentation page teach nothing the live preview at the top of the
 * page does not already teach.
 */

const PRESETS = [
  { id: "editorial", label: "Bold editorial" },
  { id: "pastel", label: "Soft pastel" },
  { id: "mono", label: "Monospace brief" },
];

function PanelFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-72 w-64">{children}</div>;
}

/** Do — E4 keeps its radiogroup semantics, so the chosen preset is programmatic. */
export function PresetsKeepTheirChosenness() {
  return (
    <PanelFrame>
      <ToolPanel
        label="Templates tools (example)"
        sections={[
          {
            id: "styles",
            title: "Styles",
            count: PRESETS.length,
            render: () => (
              <PresetGrid items={PRESETS} defaultValue="editorial" className="grid-cols-2 sm:grid-cols-2" />
            ),
          },
        ]}
      />
    </PanelFrame>
  );
}

/**
 * Don&apos;t — flattened into the panel&apos;s own insert tiles, the presets
 * become one-shot actions and nothing records which one is in force.
 */
export function PresetsFlattenedIntoInsertTiles() {
  return (
    <PanelFrame>
      <ToolPanel
        label="Templates tools (anti-example)"
        columns={2}
        sections={[
          {
            id: "styles",
            title: "Styles",
            count: PRESETS.length,
            items: PRESETS.map((preset) => ({ ...preset, onSelect: () => {} })),
          },
        ]}
      />
    </PanelFrame>
  );
}

/** Do — nothing selected still leaves the document-level properties editable. */
export function InspectorStaysUsefulWhenEmpty() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <PropertyInspector
        emptyDescription="Select an object on the canvas to edit it."
        emptyContent={
          <>
            <PropertyRow label="Canvas width">
              {(id) => <Input id={id} defaultValue="1920" inputMode="numeric" />}
            </PropertyRow>
            <PropertyRow label="Background">{(id) => <Input id={id} defaultValue="Paper" />}</PropertyRow>
          </>
        }
      />
    </div>
  );
}

/** Don&apos;t — the most common state of the panel is a dead end. */
export function InspectorGoesBlankWhenEmpty() {
  return (
    <div className="w-64 rounded-lg border p-3">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h3 className="text-foreground text-sm font-semibold">Properties</h3>
      </div>
      <p className="text-muted-foreground py-8 text-center text-sm">No selection</p>
    </div>
  );
}
