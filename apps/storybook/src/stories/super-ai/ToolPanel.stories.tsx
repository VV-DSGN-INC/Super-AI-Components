import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolPanelDocs } from "@/content/components/tool-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { ToolPanel, type ToolPanelProps, type ToolPanelSection } from "@/registry/super-ai/tool-panel";

// Thumbnail stand-in. preview-tile's frame is bg-muted (pre-Wave-1.5
// legacy — see a11y-baseline.md), so tile content is text-foreground, never
// text-muted-foreground, which measures 4.34:1 on that fill.
function Swatch({ label }: { label: string }) {
  return (
    // aria-hidden: a thumbnail is decoration. Without this the tile's
    // accessible name computes as "Dashed line Dashed line" — the swatch text
    // plus A8's overlay label — and every exact-name query misses.
    <span
      aria-hidden
      className="text-foreground flex h-full w-full items-center justify-center p-1 text-center text-[0.6rem]"
    >
      {label}
    </span>
  );
}

function withThumbnails(items: { id: string; label: string; state?: "loading" }[]) {
  return items.map((item) => ({ ...item, thumbnail: <Swatch label={item.label} />, onSelect: () => {} }));
}

const SHAPES = withThumbnails([
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "triangle", label: "Triangle" },
  { id: "star", label: "Star" },
  { id: "arrow", label: "Arrow" },
  { id: "blob", label: "Blob" },
]);

const LINES = withThumbnails([
  { id: "solid", label: "Solid line" },
  { id: "dashed", label: "Dashed line" },
  { id: "curved", label: "Curved line" },
]);

const CURATED: ToolPanelSection[] = [
  {
    id: "recent",
    title: "Recently used",
    count: 3,
    action: (
      <a href="#recent" className="underline underline-offset-2">
        View all
      </a>
    ),
    items: SHAPES.slice(0, 3),
  },
  { id: "shapes", title: "Shapes", count: SHAPES.length, collapsible: true, items: SHAPES },
  { id: "lines", title: "Lines", count: LINES.length, collapsible: true, defaultOpen: false, items: LINES },
];

const PROMPT = (
  <form className="flex items-center gap-2" onSubmit={(event) => event.preventDefault()}>
    <Input aria-label="Describe an element to generate" placeholder="Describe an element…" />
    <Button type="submit" size="sm">
      Generate
    </Button>
  </form>
);

function PanelFrame(args: ToolPanelProps) {
  return (
    <div className="h-[30rem] w-72">
      <ToolPanel {...args} />
    </div>
  );
}

// The search field reports the query; the host filters. This wrapper is what
// a real consumer writes, and what the Search story exercises.
function SearchablePanel(args: ToolPanelProps) {
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return args.sections;
    return args.sections
      .map((section) => ({ ...section, items: section.items?.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((section) => (section.items?.length ?? 0) > 0)
      .map((section) => ({ ...section, count: section.items?.length }));
  }, [args.sections, query]);

  return <PanelFrame {...args} sections={sections} searchValue={query} onSearchChange={setQuery} />;
}

const meta: Meta<typeof ToolPanel> = {
  title: "Super AI/Tool Panel",
  component: ToolPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ToolPanelDocs) } },
  render: (args) => <PanelFrame {...args} />,
};

export default meta;
type Story = StoryObj<typeof ToolPanel>;

export const Search: Story = {
  args: {
    label: "Elements",
    sections: CURATED,
    searchable: true,
    searchLabel: "Search elements",
    searchPlaceholder: "Search elements",
    empty: <p className="text-foreground text-sm">Nothing matches that search.</p>,
  },
  render: (args) => <SearchablePanel {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search elements" });

    await userEvent.type(search, "line");
    // The panel reports the query and the host narrows the sections.
    await expect(canvas.queryByText("Recently used")).not.toBeInTheDocument();
    await expect(canvas.getByText("Lines")).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    await expect(canvas.getByText("Nothing matches that search.")).toBeInTheDocument();
  },
};

export const CuratedSections: Story = {
  args: { label: "Elements", sections: CURATED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Each heading is A12; "View all" is a link because it navigates.
    await expect(canvas.getByRole("link", { name: "View all" })).toBeInTheDocument();
    await expect(canvas.getByText("Recently used")).toBeInTheDocument();

    // A collapsed section renders none of its content.
    await expect(canvas.queryByRole("button", { name: "Dashed line" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Lines/ }));
    await expect(canvas.getByRole("button", { name: "Dashed line" })).toBeInTheDocument();
  },
};

export const DockedPrompt: Story = {
  args: { label: "Elements", sections: CURATED, prompt: PROMPT },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dock = canvasElement.querySelector('[data-slot="tool-panel-prompt"]')!;
    const body = canvasElement.querySelector('[data-slot="tool-panel-sections"]')!;

    await expect(canvas.getByRole("textbox", { name: "Describe an element to generate" })).toBeInTheDocument();
    // Pinned: a sibling of the scrolling body, so it cannot scroll away.
    await expect(body.contains(dock)).toBe(false);
  },
};

export const Tabs: Story = {
  args: {
    label: "Library",
    searchable: true,
    searchLabel: "Search library",
    tabsLabel: "Library categories",
    tabs: [
      { value: "elements", label: "Elements" },
      { value: "uploads", label: "Uploads" },
    ],
    sections: [
      { id: "shapes", title: "Shapes", tab: "elements", count: SHAPES.length, items: SHAPES },
      {
        id: "uploads",
        title: "Your uploads",
        tab: "uploads",
        count: 2,
        items: withThumbnails([
          { id: "logo", label: "logo.svg" },
          { id: "art", label: "cover-art.png", state: "loading" },
        ]),
      },
    ],
    prompt: PROMPT,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.queryByText("Your uploads")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("tab", { name: "Uploads" }));
    await expect(canvas.getByText("Your uploads")).toBeInTheDocument();
    // A tile still waiting on its thumbnail says so in text, not by shimmer
    // alone — and is not pickable.
    await expect(canvas.queryByRole("button", { name: /cover-art/ })).not.toBeInTheDocument();
    await expect(canvas.getByText(/loading/)).toBeInTheDocument();
  },
};
