import type { Meta, StoryObj } from "@storybook/react-vite";
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
  type DrawingSwatch,
  type DrawingToolOption,
} from "@/registry/super-ai/drawing-tools";
import { DrawingToolsDocs } from "@/content/components/drawing-tools.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

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

const meta: Meta<typeof DrawingTools> = {
  title: "Super AI/Drawing Tools",
  component: DrawingTools,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DrawingToolsDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[22rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    tools: TOOLS,
    activeToolId: "pencil",
    onToolChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DrawingTools>;

/** Flat, icon-only, and one click deep. The pencil carries its alternates on a flyout beside it. */
export const ToolRail: Story = {};

/** The same rail on a second axis. Shapes are their own choice, not a tool that hides shapes. */
export const ShapeRail: Story = {
  args: {
    shapes: SHAPES,
    activeShapeId: "rectangle",
    onShapeChange: () => {},
  },
};

/** Size, hardness and opacity as A6 field-row instances — the grid the inspector uses. */
export const BrushControls: Story = {
  args: {
    brush: { size: 24, hardness: 60, opacity: 100 },
    onBrushChange: () => {},
  },
};

/** Every colour is named. Selection is a check and a pressed state, never the ring alone. */
export const SwatchGrid: Story = {
  args: {
    swatches: SWATCHES,
    activeSwatchId: "coral",
    onSwatchChange: () => {},
  },
};

/** The bridge to generation: the brushed region is the input inpainting receives. */
export const MaskMode: Story = {
  args: {
    mode: "mask",
    onModeChange: () => {},
    brush: { size: 48, hardness: 20, opacity: 100 },
    onBrushChange: () => {},
    swatches: SWATCHES,
    activeSwatchId: "coral",
    maskCoverage: 22,
    maskTargetLabel: "Inpaint",
    onClearMask: () => {},
  },
};
