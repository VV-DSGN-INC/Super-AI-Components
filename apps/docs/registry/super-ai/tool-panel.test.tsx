import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToolPanel, type ToolPanelSection } from "./tool-panel";

const SHAPES: ToolPanelSection[] = [
  {
    id: "shapes",
    title: "Shapes",
    count: 3,
    items: [
      { id: "circle", label: "Circle" },
      { id: "square", label: "Square" },
      { id: "arrow", label: "Arrow" },
    ],
  },
];

const CURATED: ToolPanelSection[] = [
  {
    id: "recent",
    title: "Recently used",
    count: 2,
    action: <a href="#recent">View all</a>,
    items: [
      { id: "star", label: "Star" },
      { id: "burst", label: "Burst" },
    ],
  },
  {
    id: "lines",
    title: "Lines",
    count: 1,
    collapsible: true,
    items: [{ id: "dashed", label: "Dashed line" }],
  },
];

describe("ToolPanel", () => {
  it("renders the search state", async () => {
    const onSearchChange = vi.fn();
    render(<ToolPanel sections={SHAPES} searchable searchLabel="Search elements" onSearchChange={onSearchChange} />);

    const search = screen.getByRole("searchbox", { name: "Search elements" });
    await userEvent.type(search, "ci");
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith("ci");

    // The field is pinned in the header, not inside the scrolling body — it
    // stays reachable however far down the sections you are.
    const header = document.querySelector('[data-slot="tool-panel-header"]')!;
    expect(header).toContainElement(search);
    expect(document.querySelector('[data-slot="tool-panel-sections"]')).not.toContainElement(search);
  });

  it("renders the search state's empty result", () => {
    // Filtering belongs to the host: section content can be an opaque render
    // callback, so the panel can't see most of what it shows. It renders the
    // `empty` slot for whatever the host filtered down to nothing.
    render(<ToolPanel sections={[]} searchable empty={<p>No elements match</p>} />);

    expect(screen.getByText("No elements match")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tool-panel-section"]')).toBeNull();
  });

  it("renders the curated-sections state", async () => {
    render(<ToolPanel sections={CURATED} />);

    // Every heading is A12 — it keeps its own data-slot, which is what makes
    // the composition visible in the DOM.
    expect(document.querySelectorAll('[data-slot="section-header"]')).toHaveLength(2);
    expect(screen.getByText("Recently used")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="section-header-count"]')).toHaveLength(2);

    // "View all" navigates, it does not act (A12).
    const viewAll = screen.getByRole("link", { name: "View all" });
    expect(viewAll).toBeInTheDocument();

    // Every cell is A8.
    expect(document.querySelectorAll('[data-slot="preview-tile"]')).toHaveLength(3);
    expect(screen.getByText("Star")).toBeInTheDocument();

    // A collapsed section stops rendering its content — the lazy half of
    // "infinite section lists must lazy-render".
    const trigger = screen.getByRole("button", { expanded: true });
    await userEvent.click(trigger);
    expect(screen.queryByText("Dashed line")).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="preview-tile"]')).toHaveLength(2);
  });

  it("never calls a hidden section's render callback", async () => {
    const render1 = vi.fn(() => <p>Effect controls</p>);
    render(
      <ToolPanel
        sections={[{ id: "effects", title: "Effects", collapsible: true, defaultOpen: false, render: render1 }]}
      />,
    );

    // Section content is a callback, not a node, precisely so a closed
    // section costs nothing to declare.
    expect(render1).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Effects/ }));
    expect(render1).toHaveBeenCalled();
    expect(screen.getByText("Effect controls")).toBeInTheDocument();
  });

  it("renders the docked-prompt state", () => {
    render(<ToolPanel sections={SHAPES} prompt={<button type="button">Generate</button>} />);

    const root = document.querySelector('[data-slot="tool-panel"]')!;
    const dock = document.querySelector('[data-slot="tool-panel-prompt"]')!;
    const body = document.querySelector('[data-slot="tool-panel-sections"]')!;

    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
    expect(root).toHaveAttribute("data-docked-prompt", "true");

    // The load-bearing sentence: the prompt is what makes this a modality
    // panel rather than an asset browser, so it is pinned — a sibling of the
    // scrolling body, never inside it.
    expect(dock.parentElement).toBe(root);
    expect(body).not.toContainElement(dock as HTMLElement);
  });

  it("renders the tabs state", async () => {
    const onTabChange = vi.fn();
    render(
      <ToolPanel
        sections={[
          { id: "shapes", title: "Shapes", tab: "elements", items: [{ id: "circle", label: "Circle" }] },
          { id: "photos", title: "Photos", tab: "media", items: [{ id: "beach", label: "Beach" }] },
        ]}
        tabs={[
          { value: "elements", label: "Elements" },
          { value: "media", label: "Media" },
        ]}
        tabsLabel="Panel categories"
        onTabChange={onTabChange}
      />,
    );

    expect(screen.getByRole("tablist", { name: "Panel categories" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Shapes")).toBeInTheDocument();
    // An inactive tab's sections are not rendered at all.
    expect(screen.queryByText("Photos")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Media" }));
    expect(onTabChange).toHaveBeenCalledWith("media");
    expect(screen.getByText("Photos")).toBeInTheDocument();
    expect(screen.queryByText("Shapes")).not.toBeInTheDocument();
  });

  it("gives the scrolling body its own focus stop", () => {
    render(<ToolPanel sections={SHAPES} label="Elements" />);

    // axe `scrollable-region-focusable`: the element that scrolls has to be
    // keyboard reachable and named.
    const body = screen.getByRole("group", { name: "Elements" });
    expect(body).toHaveAttribute("data-slot", "tool-panel-sections");
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("wraps A8 in exactly one interactive element per tile", async () => {
    const onSelect = vi.fn();
    render(
      <ToolPanel
        sections={[
          {
            id: "shapes",
            title: "Shapes",
            items: [
              { id: "circle", label: "Circle", onSelect },
              { id: "square", label: "Square", selected: true, onSelect: () => {} },
              { id: "pending", label: "Pending art", state: "loading", onSelect: () => {} },
            ],
          },
        ]}
      />,
    );

    const circle = screen.getByRole("button", { name: "Circle" });
    await userEvent.click(circle);
    expect(onSelect).toHaveBeenCalledTimes(1);
    // A8's own frame stays inert, so the tile is never a button in a button.
    expect(circle.querySelectorAll("button")).toHaveLength(0);

    // An insert tile acts; only a toggle tile claims a pressed state.
    expect(circle).not.toHaveAttribute("aria-pressed");
    expect(screen.getByRole("button", { name: "Square" })).toHaveAttribute("aria-pressed", "true");

    // Selection is never conveyed by the ring alone, and a loading tile is
    // not pickable — its state is in the accessible text, not the shimmer.
    expect(screen.queryByRole("button", { name: /Pending art/ })).not.toBeInTheDocument();
    expect(screen.getByText(/loading/)).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ToolPanel sections={SHAPES} className="test-class" />);
    expect(document.querySelector('[data-slot="tool-panel"]')!.className).toContain("test-class");
  });
});
