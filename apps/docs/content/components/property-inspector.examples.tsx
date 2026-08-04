"use client";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { PropertyInspector, PropertyRow } from "@/registry/super-ai/property-inspector";

/**
 * Live examples for property-inspector.docs.tsx.
 *
 * Client sidecar, for the same reason as workspace-switcher's: the docs module
 * is plain data read by a Server Component and cannot carry "use client" or
 * inline event handlers. Every export here is zero-prop.
 */

export function GoodTwoScopes() {
  return (
    <PropertyInspector
      elementType="text"
      selectionLabel="Heading"
      sections={{
        text: [
          {
            id: "layout",
            label: "Layout",
            state: "modified",
            onReset: () => {},
            content: (
              <>
                <PropertyRow label="Width" state="modified" onReset={() => {}}>
                  {(id) => <UnitInput id={id} unit="px" defaultValue={480} />}
                </PropertyRow>
                <PropertyRow label="Height">{(id) => <UnitInput id={id} unit="px" defaultValue={64} />}</PropertyRow>
              </>
            ),
          },
        ],
      }}
    />
  );
}

export function BadRowWithoutReset() {
  return (
    <PropertyInspector
      elementType="text"
      selectionLabel="Heading"
      sections={{
        text: [
          {
            id: "layout",
            label: "Layout",
            state: "modified",
            onReset: () => {},
            // Hand-rolled rows: the group reset is the only way back, so a
            // single drifted value costs you every other value in the section.
            content: (
              <>
                <FieldRow label="Width">{(id) => <UnitInput id={id} unit="px" defaultValue={480} />}</FieldRow>
                <FieldRow label="Height">{(id) => <UnitInput id={id} unit="px" defaultValue={64} />}</FieldRow>
              </>
            ),
          },
        ],
      }}
    />
  );
}

export function GoodUsefulEmpty() {
  return (
    <PropertyInspector
      emptyDescription="Select an object on the canvas to edit its properties."
      emptyContent={
        <>
          <PropertyRow label="Canvas">{(id) => <UnitInput id={id} unit="px" defaultValue={1920} />}</PropertyRow>
          <PropertyRow label="Grid">{(id) => <UnitInput id={id} unit="px" defaultValue={8} />}</PropertyRow>
        </>
      }
    />
  );
}

export function BadEmptyShrug() {
  return <PropertyInspector emptyDescription="No properties." />;
}
