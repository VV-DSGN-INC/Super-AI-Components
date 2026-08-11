import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brush, Image as ImageIcon, LayoutTemplate, Settings, Shapes, Sparkles, Type } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PropertyRow } from "@/registry/super-ai/property-inspector";
import { StudioShell, type StudioShellProps } from "@/registry/super-ai/studio-shell";
import { StudioShellDocs } from "@/content/components/studio-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MODALITIES = [
  { id: "templates", label: "Templates", icon: <LayoutTemplate /> },
  { id: "elements", label: "Elements", icon: <Shapes /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "media", label: "Media", icon: <ImageIcon />, badge: "new" as const },
  { id: "draw", label: "Draw", icon: <Brush /> },
];

const PINNED = [{ id: "settings", label: "Settings", icon: <Settings /> }];

const FRAMES = ["Title", "Problem", "Approach", "Results"].map((name, index) => ({
  id: `p${index + 1}`,
  label: `${index + 1}. ${name}`,
}));

const TOOL_PANELS: StudioShellProps["toolPanels"] = {
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
      defaultValue: "editorial",
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
      defaultValue: "warm",
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
      activeToolId: "brush",
      onToolChange: () => {},
      brush: { size: 24, hardness: 70, opacity: 100 },
      onBrushChange: () => {},
      swatches: [
        { id: "ink", name: "Ink", value: "var(--foreground)" },
        { id: "brand", name: "Brand primary", value: "var(--primary)" },
      ],
      activeSwatchId: "ink",
      onSwatchChange: () => {},
    },
  },
};

const INSPECTOR: StudioShellProps["inspector"] = {
  sections: {
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
  },
};

const ARTBOARD = (
  <div className="bg-card text-card-foreground flex aspect-video w-full max-w-2xl flex-col justify-center gap-3 rounded-lg border p-10 shadow-sm">
    <p className="text-3xl font-semibold">Northwind, Series A</p>
    <p className="text-muted-foreground text-sm">The calm position is uncontested. Here is what it is worth.</p>
  </div>
);

const FULL_ARGS: StudioShellProps = {
  title: "Series A deck",
  topbar: { zoomLabel: "72%", savedLabel: "Saved just now" },
  modalities: MODALITIES,
  pinnedModalities: PINNED,
  activeModalityId: "templates",
  onModalityChange: () => {},
  toolPanels: TOOL_PANELS,
  selection: { type: "text", label: "Heading" },
  toolbar: {
    actions: [
      { id: "font", label: "Font", showLabel: true },
      { id: "colour", label: "Colour", showLabel: true },
      { id: "align", label: "Align", icon: <Type /> },
    ],
    aiIcon: <Sparkles />,
    onAction: () => {},
    onAiSelect: () => {},
  },
  inspector: INSPECTOR,
  frames: FRAMES,
  frameKind: "slides",
  activeFrameId: "p1",
  onFrameChange: () => {},
  onAddFrame: () => {},
  children: ARTBOARD,
};

const meta: Meta<typeof StudioShell> = {
  title: "Super AI/Studio Shell",
  component: StudioShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(StudioShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StudioShell>;

/** The working editor: a template panel, a selected heading, an artboard, four pages. */
export const Editing: Story = { args: FULL_ARGS };

/**
 * Nothing selected — the state the editor actually sits in most of the time.
 * The inspector falls to its own empty affordance and the floating toolbar does
 * not render at all, while the canvas and the panel carry on unchanged.
 */
export const NothingSelected: Story = {
  args: { ...FULL_ARGS, selection: undefined },
};

/**
 * The draw modality: I5 pinned below the panel, outside its scroll region.
 * The canvas is byte-for-byte the same node it was under Templates — the rail
 * chooses the panel and nothing else.
 */
export const Drawing: Story = {
  args: { ...FULL_ARGS, activeModalityId: "draw", selection: { type: "shape", label: "Rectangle" } },
};

/** The media modality generating: E4 looks above, F1 result cards below. */
export const Generating: Story = {
  args: { ...FULL_ARGS, activeModalityId: "media", selection: { type: "image", label: "Photo" } },
};

/**
 * Day one. No document, no selection, no pages — four empty affordances at
 * once: I1's, L1 on the canvas, I2's, and H5's own add tile standing in for the
 * page strip. Mandatory export for the block contract, and the version most new
 * users actually see.
 */
export const Empty: Story = {
  args: {
    title: "Untitled design",
    topbar: { zoomLabel: "100%" },
    modalities: MODALITIES,
    pinnedModalities: PINNED,
    onModalityChange: () => {},
    onAddFrame: () => {},
  },
};

/**
 * Narrow viewport. Below `md` the three middle regions stack into one scrolling
 * column — tool panel, canvas, page strip, inspector — rather than being
 * hidden, so nothing becomes unreachable. Mandatory export for the block
 * contract: a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API.
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing while
 * looking configured, so `options` is declared explicitly here and the
 * selection cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};
