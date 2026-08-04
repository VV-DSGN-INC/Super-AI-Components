"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { UnitInput } from "@/registry/super-ai/field-row";
import { PropertyInspector, PropertyRow, type PropertySection } from "@/registry/super-ai/property-inspector";

type ElementType = "text" | "image";

const DEFAULTS: Record<ElementType, Record<string, number>> = {
  text: { width: 320, height: 64, size: 18, lineHeight: 140, opacity: 100 },
  image: { width: 640, height: 360, blur: 0, opacity: 100 },
};

const SELECTION_LABELS: Record<ElementType, string> = {
  text: "Heading",
  image: "Hero image",
};

export default function PropertyInspectorDemo() {
  const [selected, setSelected] = useState<ElementType | null>("text");
  const [values, setValues] = useState<Record<ElementType, Record<string, number>>>(() => ({
    text: { ...DEFAULTS.text, size: 24 },
    image: { ...DEFAULTS.image },
  }));

  const set = (type: ElementType, key: string, value: number) =>
    setValues((prev) => ({ ...prev, [type]: { ...prev[type], [key]: value } }));

  const resetKeys = (type: ElementType, keys: string[]) =>
    setValues((prev) => ({
      ...prev,
      [type]: keys.reduce((acc, key) => ({ ...acc, [key]: DEFAULTS[type][key] }), prev[type]),
    }));

  const row = (type: ElementType, key: string, label: string, unit: string, hint?: string) => {
    const modified = values[type][key] !== DEFAULTS[type][key];
    return (
      <PropertyRow
        key={key}
        label={label}
        hint={hint}
        state={modified ? "modified" : "default"}
        onReset={() => resetKeys(type, [key])}
      >
        {(id, describedBy) => (
          <UnitInput
            id={id}
            aria-describedby={describedBy}
            unit={unit}
            value={values[type][key]}
            onValueChange={(next) => set(type, key, next)}
          />
        )}
      </PropertyRow>
    );
  };

  const groupState = (type: ElementType, keys: string[]) =>
    keys.some((key) => values[type][key] !== DEFAULTS[type][key]) ? ("modified" as const) : ("default" as const);

  const section = (
    type: ElementType,
    id: string,
    label: string,
    keys: string[],
    content: ReactNode,
  ): PropertySection => ({
    id,
    label,
    state: groupState(type, keys),
    onReset: () => resetKeys(type, keys),
    content,
  });

  const sections: Record<string, PropertySection[]> = {
    text: [
      section("text", "layout", "Layout", ["width", "height"], (
        <>
          {row("text", "width", "Width", "px")}
          {row("text", "height", "Height", "px")}
        </>
      )),
      section("text", "typography", "Typography", ["size", "lineHeight"], (
        <>
          {row("text", "size", "Size", "pt")}
          {row("text", "lineHeight", "Leading", "%", "Line height as a percentage of the type size.")}
        </>
      )),
      section("text", "appearance", "Appearance", ["opacity"], <>{row("text", "opacity", "Opacity", "%")}</>),
    ],
    image: [
      section("image", "layout", "Layout", ["width", "height"], (
        <>
          {row("image", "width", "Width", "px")}
          {row("image", "height", "Height", "px")}
        </>
      )),
      section("image", "adjustments", "Adjustments", ["blur"], <>{row("image", "blur", "Blur", "px")}</>),
      section("image", "appearance", "Appearance", ["opacity"], <>{row("image", "opacity", "Opacity", "%")}</>),
    ],
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
      <div className="flex shrink-0 flex-col items-start gap-1 sm:w-40">
        <p className="text-muted-foreground text-xs font-medium">Canvas selection</p>
        <Button
          variant={selected === null ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={selected === null}
          onClick={() => setSelected(null)}
        >
          Nothing
        </Button>
        {(Object.keys(SELECTION_LABELS) as ElementType[]).map((type) => (
          <Button
            key={type}
            variant={selected === type ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={selected === type}
            onClick={() => setSelected(type)}
          >
            {SELECTION_LABELS[type]}
          </Button>
        ))}
        <p className="text-muted-foreground pt-2 text-xs">
          Collapse a section, switch selection, and switch back — the collapse is remembered per element type.
        </p>
      </div>

      <div className="border-border w-full rounded-lg border p-3">
        <PropertyInspector
          elementType={selected}
          selectionLabel={selected ? SELECTION_LABELS[selected] : undefined}
          sections={sections}
          emptyContent={
            <PropertyRow label="Canvas" hint="Canvas size stays editable with nothing selected.">
              {(id, describedBy) => (
                <UnitInput id={id} aria-describedby={describedBy} unit="px" defaultValue={1920} readOnly />
              )}
            </PropertyRow>
          }
        />
      </div>
    </div>
  );
}
