import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { UnitInput } from "@/registry/super-ai/field-row";
import { PropertyInspector, PropertyRow, type PropertySection } from "@/registry/super-ai/property-inspector";
import { PropertyInspectorDocs } from "@/content/components/property-inspector.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const row = (label: string, unit: string, value: number) => (
  <PropertyRow key={label} label={label}>
    {(id) => <UnitInput id={id} unit={unit} defaultValue={value} />}
  </PropertyRow>
);

/**
 * One schema, keyed by element type. Selecting a different object is a lookup,
 * not a different panel.
 */
const SECTIONS: Record<string, PropertySection[]> = {
  text: [
    { id: "layout", label: "Layout", content: [row("Width", "px", 320), row("Height", "px", 64)] },
    { id: "typography", label: "Typography", content: [row("Size", "pt", 18), row("Leading", "%", 140)] },
    { id: "appearance", label: "Appearance", content: [row("Opacity", "%", 100)] },
  ],
  image: [
    { id: "layout", label: "Layout", content: [row("Width", "px", 640), row("Height", "px", 360)] },
    { id: "adjustments", label: "Adjustments", content: [row("Blur", "px", 0)] },
    { id: "appearance", label: "Appearance", content: [row("Opacity", "%", 100)] },
  ],
};

const SELECTION_LABELS: Record<string, string> = { text: "Heading", image: "Hero image" };

const meta: Meta<typeof PropertyInspector> = {
  title: "Super AI/Property Inspector",
  component: PropertyInspector,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PropertyInspectorDocs) } },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PropertyInspector>;

/**
 * The element type picks the variant. Switching selection also proves the
 * collapsed-state memory: collapse Layout on the text object, switch to the
 * image, switch back.
 */
export const PerElementType: Story = {
  args: { sections: SECTIONS, elementType: "text", selectionLabel: SELECTION_LABELS.text },
  render: function PerElementTypeStory(args) {
    const [type, setType] = useState<string>("text");
    return (
      <div className="space-y-3">
        <div className="flex gap-1">
          {Object.keys(SECTIONS).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(key)}
              className="border-border data-[active=true]:bg-primary data-[active=true]:text-primary-foreground rounded-md border px-2 py-1 text-xs"
              data-active={type === key}
            >
              {SELECTION_LABELS[key]}
            </button>
          ))}
        </div>
        <PropertyInspector {...args} elementType={type} selectionLabel={SELECTION_LABELS[type]} />
      </div>
    );
  },
};

/** Collapsible groups over A6 rows — Appearance starts closed. */
export const GroupedSections: Story = {
  args: {
    elementType: "image",
    selectionLabel: SELECTION_LABELS.image,
    sections: {
      image: [
        SECTIONS.image[0],
        SECTIONS.image[1],
        { ...SECTIONS.image[2], defaultOpen: false },
      ],
    },
  },
};

/**
 * Two scopes. The group reset on the section header clears the whole section;
 * the row reset at the end of each A6 row puts one value back.
 */
export const Reset: Story = {
  args: { elementType: "text", selectionLabel: SELECTION_LABELS.text },
  render: function ResetStory(args) {
    const [width, setWidth] = useState(480);
    const [height, setHeight] = useState(64);
    const layoutModified = width !== 320 || height !== 64;
    return (
      <PropertyInspector
        {...args}
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              state: layoutModified ? "modified" : "default",
              onReset: () => {
                setWidth(320);
                setHeight(64);
              },
              content: (
                <>
                  <PropertyRow
                    label="Width"
                    state={width !== 320 ? "modified" : "default"}
                    onReset={() => setWidth(320)}
                  >
                    {(id) => <UnitInput id={id} unit="px" value={width} onValueChange={setWidth} />}
                  </PropertyRow>
                  <PropertyRow
                    label="Height"
                    state={height !== 64 ? "modified" : "default"}
                    onReset={() => setHeight(64)}
                  >
                    {(id) => <UnitInput id={id} unit="px" value={height} onValueChange={setHeight} />}
                  </PropertyRow>
                </>
              ),
            },
            SECTIONS.text[1],
          ],
        }}
      />
    );
  },
};

/**
 * Nothing selected — the default view of a real editor. Canvas-level rows stay
 * editable rather than the panel going blank.
 */
export const Empty: Story = {
  args: {
    elementType: null,
    sections: SECTIONS,
    emptyContent: (
      <>
        <PropertyRow label="Canvas" hint="Canvas size stays editable with nothing selected.">
          {(id, describedBy) => <UnitInput id={id} aria-describedby={describedBy} unit="px" defaultValue={1920} />}
        </PropertyRow>
        <PropertyRow label="Grid">{(id) => <UnitInput id={id} unit="px" defaultValue={8} />}</PropertyRow>
      </>
    ),
  },
};
