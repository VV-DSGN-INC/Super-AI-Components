"use client";

import * as React from "react";
import {
  Brush,
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  Pencil,
  PenTool,
  Shapes,
  Square,
} from "lucide-react";

import {
  DrawingTools,
  type DrawingBrush,
  type DrawingSwatch,
  type DrawingToolOption,
} from "@/registry/super-ai/drawing-tools";

/**
 * Live examples for drawing-tools.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or handler-bearing JSX.
 */

const BRUSH: DrawingBrush = { size: 24, hardness: 60, opacity: 100 };

const SWATCHES: DrawingSwatch[] = [
  { id: "ink", name: "Ink", value: "rgb(24, 24, 27)" },
  { id: "coral", name: "Coral", value: "rgb(255, 122, 89)" },
  { id: "moss", name: "Moss", value: "rgb(52, 143, 106)" },
  { id: "sky", name: "Sky", value: "rgb(56, 152, 236)" },
];

/** DO — one rail, flat, with alternates on a flyout beside the tool. */
export function OneClickToolRail() {
  const FLAT: DrawingToolOption[] = [
    { id: "select", label: "Select", icon: <MousePointer2 /> },
    {
      id: "pencil",
      label: "Pencil",
      icon: <Pencil />,
      variants: [
        { id: "pencil", label: "Pencil", icon: <Pencil /> },
        { id: "pen", label: "Pen", icon: <PenTool /> },
        { id: "highlighter", label: "Highlighter", icon: <Highlighter /> },
      ],
    },
    { id: "shape", label: "Rectangle", icon: <Square /> },
    { id: "eraser", label: "Eraser", icon: <Eraser /> },
  ];
  const [tool, setTool] = React.useState("pencil");
  return (
    <div className="w-full max-w-xs">
      <DrawingTools tools={FLAT} activeToolId={tool} onToolChange={setTool} />
    </div>
  );
}

/** DO — mask mode names what the mask is input to, and says so before anything is brushed. */
export function MaskFeedsGeneration() {
  const [coverage, setCoverage] = React.useState(0);
  const TOOLS: DrawingToolOption[] = [
    { id: "brush", label: "Mask brush", icon: <Brush /> },
    { id: "eraser", label: "Mask eraser", icon: <Eraser /> },
  ];
  return (
    <div className="w-full max-w-xs">
      <DrawingTools
        tools={TOOLS}
        activeToolId="brush"
        brush={BRUSH}
        mode="mask"
        maskCoverage={coverage}
        maskTargetLabel="Inpaint"
        onClearMask={() => setCoverage(0)}
      />
    </div>
  );
}

/**
 * DON&apos;T — a rail of categories, where every real tool sits one flyout down.
 * Reaching the eraser now costs two clicks and a guess about which drawer it
 * lives in, which is exactly the nested-menu shape a rail exists to replace.
 */
export function CategoriesInsteadOfTools() {
  const GROUPED: DrawingToolOption[] = [
    {
      id: "draw-group",
      label: "Drawing",
      icon: <Brush />,
      variants: [
        { id: "pencil", label: "Pencil", icon: <Pencil /> },
        { id: "pen", label: "Pen", icon: <PenTool /> },
        { id: "eraser", label: "Eraser", icon: <Eraser /> },
      ],
    },
    {
      id: "shape-group",
      label: "Shapes",
      icon: <Shapes />,
      variants: [
        { id: "rectangle", label: "Rectangle", icon: <Square /> },
        { id: "ellipse", label: "Ellipse", icon: <Circle /> },
      ],
    },
  ];
  const [tool, setTool] = React.useState("draw-group");
  return (
    <div className="w-full max-w-xs">
      <DrawingTools tools={GROUPED} activeToolId={tool} onToolChange={setTool} />
    </div>
  );
}

/**
 * DON&apos;T — swatches named by their own colour value. The name is the only
 * thing a screen reader has to go on, and repeating the fill back tells it
 * nothing the fill did not already say.
 */
export function SwatchesNamedByTheirValue() {
  const NAMELESS: DrawingSwatch[] = SWATCHES.map((swatch) => ({
    ...swatch,
    name: swatch.value,
  }));
  const [swatch, setSwatch] = React.useState("coral");
  return (
    <div className="w-full max-w-xs">
      <DrawingTools
        tools={[{ id: "brush", label: "Brush", icon: <Brush /> }]}
        activeToolId="brush"
        swatches={NAMELESS}
        activeSwatchId={swatch}
        onSwatchChange={setSwatch}
      />
    </div>
  );
}
