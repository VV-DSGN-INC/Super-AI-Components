"use client";

import { Brush, Image as ImageIcon, LayoutTemplate, Settings, Shapes, Sparkles, Type } from "lucide-react";
import { useState } from "react";

import { PropertyRow } from "@/registry/super-ai/property-inspector";
import { StudioShell, type StudioShellProps } from "@/registry/super-ai/studio-shell";
import { Input } from "@/components/ui/input";

const MODALITIES = [
  { id: "templates", label: "Templates", icon: <LayoutTemplate /> },
  { id: "elements", label: "Elements", icon: <Shapes /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "media", label: "Media", icon: <ImageIcon />, badge: "new" as const },
  { id: "draw", label: "Draw", icon: <Brush /> },
];

const PINNED = [{ id: "settings", label: "Settings", icon: <Settings /> }];

const SWATCHES = [
  { id: "ink", name: "Ink", value: "var(--foreground)" },
  { id: "paper", name: "Paper", value: "var(--background)" },
  { id: "brand", name: "Brand primary", value: "var(--primary)" },
  { id: "quiet", name: "Quiet grey", value: "var(--muted)" },
];

const FRAMES = ["Title", "Problem", "Approach", "Results"].map((name, index) => ({
  id: `p${index + 1}`,
  label: `${index + 1}. ${name}`,
}));

const INSPECTOR_SECTIONS: NonNullable<StudioShellProps["inspector"]>["sections"] = {
  text: [
    {
      id: "type",
      label: "Type",
      state: "modified",
      onReset: () => {},
      content: (
        <>
          <PropertyRow label="Font" state="modified" onReset={() => {}}>
            {(id) => <Input id={id} defaultValue="Geist Sans" />}
          </PropertyRow>
          <PropertyRow label="Size" hint="Points at 100% zoom">
            {(id, describedBy) => (
              <Input id={id} aria-describedby={describedBy} defaultValue="48" inputMode="numeric" />
            )}
          </PropertyRow>
        </>
      ),
    },
    {
      id: "layout",
      label: "Layout",
      content: (
        <PropertyRow label="X">{(id) => <Input id={id} defaultValue="120" inputMode="numeric" />}</PropertyRow>
      ),
    },
  ],
};

export default function StudioShellDemo() {
  const [modality, setModality] = useState("templates");
  const [frame, setFrame] = useState("p1");
  const [style, setStyle] = useState<string | string[]>("editorial");
  const [tool, setTool] = useState("brush");
  const [swatch, setSwatch] = useState("ink");
  const [brush, setBrush] = useState({ size: 24, hardness: 70, opacity: 100 });

  return (
    <StudioShell
      className="h-[42rem]"
      title="Series A deck"
      topbar={{ zoomLabel: "72%", savedLabel: "Saved just now" }}
      modalities={MODALITIES}
      pinnedModalities={PINNED}
      activeModalityId={modality}
      onModalityChange={setModality}
      toolPanels={{
        templates: {
          searchable: true,
          searchPlaceholder: "Search templates",
          presets: {
            label: "Styles",
            items: [
              { id: "editorial", label: "Bold editorial" },
              { id: "pastel", label: "Soft pastel" },
              { id: "mono", label: "Monospace brief" },
              { id: "dark", label: "Dark keynote" },
            ],
            value: style,
            onValueChange: setStyle,
          },
        },
        elements: {
          sections: [
            {
              id: "shapes",
              title: "Shapes",
              count: 4,
              items: [
                { id: "rect", label: "Rectangle", onSelect: () => {} },
                { id: "circle", label: "Ellipse", onSelect: () => {} },
                { id: "line", label: "Line", onSelect: () => {} },
                { id: "arrow", label: "Arrow", onSelect: () => {} },
              ],
            },
          ],
        },
        text: {
          sections: [
            {
              id: "styles",
              title: "Text styles",
              items: [
                { id: "heading", label: "Heading", onSelect: () => {} },
                { id: "body", label: "Body", onSelect: () => {} },
              ],
            },
          ],
        },
        media: {
          presets: {
            label: "Looks",
            content: "filter",
            items: [
              { id: "warm", label: "Warm film" },
              { id: "cool", label: "Cool matte" },
              { id: "bw", label: "Black and white" },
            ],
          },
          results: {
            label: "Generated",
            items: [
              { id: "r1", state: "done", label: "A quiet harbour at dawn", footer: <span>Ready</span> },
              { id: "r2", state: "streaming", progress: 62, label: "The same harbour at dusk" },
            ],
          },
        },
        draw: {
          sections: [
            {
              id: "brushes",
              title: "Brushes",
              items: [
                { id: "ink", label: "Ink pen", onSelect: () => {} },
                { id: "marker", label: "Marker", onSelect: () => {} },
              ],
            },
          ],
          drawing: {
            tools: [
              { id: "brush", label: "Brush", icon: <Brush /> },
              { id: "shape", label: "Shape", icon: <Shapes /> },
            ],
            activeToolId: tool,
            onToolChange: setTool,
            brush,
            onBrushChange: setBrush,
            swatches: SWATCHES,
            activeSwatchId: swatch,
            onSwatchChange: setSwatch,
          },
        },
      }}
      selection={{ type: "text", label: "Heading" }}
      toolbar={{
        actions: [
          { id: "font", label: "Font", showLabel: true },
          { id: "colour", label: "Colour", showLabel: true },
          { id: "align", label: "Align", icon: <Type /> },
        ],
        aiIcon: <Sparkles />,
        onAction: () => {},
        onAiSelect: () => {},
      }}
      inspector={{ sections: INSPECTOR_SECTIONS }}
      frames={FRAMES}
      frameKind="slides"
      activeFrameId={frame}
      onFrameChange={setFrame}
      onAddFrame={() => {}}
    >
      <div className="bg-card text-card-foreground flex aspect-video w-full max-w-2xl flex-col justify-center gap-3 rounded-lg border p-10 shadow-sm">
        <p className="text-3xl font-semibold">Northwind, Series A</p>
        <p className="text-muted-foreground text-sm">The calm position is uncontested. Here is what it is worth.</p>
      </div>
    </StudioShell>
  );
}
