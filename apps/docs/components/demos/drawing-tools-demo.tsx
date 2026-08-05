"use client";

import * as React from "react";
import {
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  MoveUpRight,
  PaintBucket,
  Pencil,
  PenTool,
  Slash,
  Square,
  Triangle,
} from "lucide-react";

import {
  DrawingTools,
  type DrawingBrush,
  type DrawingMode,
  type DrawingSwatch,
  type DrawingToolOption,
} from "@/registry/super-ai/drawing-tools";

const TOOLS: DrawingToolOption[] = [
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
  { id: "fill", label: "Fill", icon: <PaintBucket /> },
  { id: "eraser", label: "Eraser", icon: <Eraser /> },
];

const SHAPES: DrawingToolOption[] = [
  { id: "rectangle", label: "Rectangle", icon: <Square /> },
  { id: "ellipse", label: "Ellipse", icon: <Circle /> },
  { id: "triangle", label: "Triangle", icon: <Triangle /> },
  {
    id: "line",
    label: "Line",
    icon: <Slash />,
    variants: [
      { id: "line", label: "Line", icon: <Slash /> },
      { id: "arrow", label: "Arrow", icon: <MoveUpRight /> },
    ],
  },
];

const SWATCHES: DrawingSwatch[] = [
  { id: "ink", name: "Ink", value: "rgb(24, 24, 27)" },
  { id: "slate", name: "Slate", value: "rgb(100, 116, 139)" },
  { id: "coral", name: "Coral", value: "rgb(255, 122, 89)" },
  { id: "amber", name: "Amber", value: "rgb(245, 158, 11)" },
  { id: "moss", name: "Moss", value: "rgb(52, 143, 106)" },
  { id: "sky", name: "Sky", value: "rgb(56, 152, 236)" },
  { id: "violet", name: "Violet", value: "rgb(139, 92, 246)" },
  { id: "paper", name: "Paper", value: "rgb(250, 250, 249)" },
];

export default function DrawingToolsDemo() {
  const [mode, setMode] = React.useState<DrawingMode>("draw");
  const [tool, setTool] = React.useState("pencil");
  const [shape, setShape] = React.useState("rectangle");
  const [brush, setBrush] = React.useState<DrawingBrush>({
    size: 24,
    hardness: 60,
    opacity: 100,
  });
  const [swatch, setSwatch] = React.useState("coral");
  const [coverage, setCoverage] = React.useState(0);

  return (
    <div className="w-full max-w-sm">
      <DrawingTools
        tools={TOOLS}
        activeToolId={tool}
        onToolChange={setTool}
        shapes={SHAPES}
        activeShapeId={shape}
        onShapeChange={setShape}
        brush={brush}
        onBrushChange={setBrush}
        swatches={SWATCHES}
        activeSwatchId={swatch}
        onSwatchChange={setSwatch}
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          // Stand-in for a real canvas reporting how much has been brushed.
          setCoverage(next === "mask" ? 22 : 0);
        }}
        maskCoverage={coverage}
        maskTargetLabel="Inpaint"
        onClearMask={() => setCoverage(0)}
      />
    </div>
  );
}
