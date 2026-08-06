import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterPanel, type FilterPanelSection } from "./filter-panel";

const SECTIONS: FilterPanelSection[] = [
  {
    id: "format",
    label: "Format",
    facets: [
      { value: "portrait", label: "Portrait", count: 128 },
      { value: "landscape", label: "Landscape", count: 64 },
      // The dead end. Present, counted, and unusable.
      { value: "panorama", label: "Panorama", count: 0 },
    ],
  },
  {
    id: "model",
    label: "Model",
    facets: [
      { value: "v7", label: "v7", count: 812 },
      { value: "v6", label: "v6", count: 240 },
    ],
  },
];

const LONG_SECTION: FilterPanelSection[] = [
  {
    id: "style",
    label: "Style",
    visibleCount: 3,
    facets: Array.from({ length: 24 }, (_, i) => ({
      value: `style-${i}`,
      label: `Style ${i}`,
      count: 24 - i,
    })),
  },
];

describe("FilterPanel", () => {
  it("renders the facet-counts state: every facet carries its count, and a zero says so before you click", () => {
    render(<FilterPanel sections={SECTIONS} />);

    // The count is not decoration beside the label — it is part of the
    // control's accessible name, so it reaches a screen-reader user too.
    expect(screen.getByRole("checkbox", { name: "Portrait 128" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Landscape 64" })).toBeInTheDocument();

    // Zero: disabled *and* a rendered 0 *and* a text reason. Not an opacity,
    // not a colour.
    const empty = screen.getByRole("checkbox", { name: /Panorama/ });
    // Base UI renders the checkbox as a span, so `disabled` surfaces as
    // aria-disabled + data-disabled rather than the native attribute.
    expect(empty).toHaveAttribute("aria-disabled", "true");
    expect(empty).toHaveAttribute("data-disabled");
    expect(empty).toHaveAccessibleName("Panorama 0 no matches");

    const row = document.querySelector('[data-slot="filter-panel-facet"][data-value="panorama"]')!;
    expect(row).toHaveAttribute("data-empty", "true");
    expect(within(row as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("gives each checkbox group a name, so the facets are navigable as a set", () => {
    render(<FilterPanel sections={SECTIONS} />);

    const format = screen.getByRole("group", { name: /Format/ });
    expect(within(format).getAllByRole("checkbox")).toHaveLength(3);
    // The group is named by its A12 header, not by a bare div.
    expect(format.querySelector('[data-slot="section-header"]')).not.toBeNull();
  });

  it("renders the see-more state as a real button whose name carries the remaining count", async () => {
    const user = userEvent.setup();
    render(<FilterPanel sections={LONG_SECTION} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);

    // 24 facets, 3 shown, 21 hidden — and the button says which, qualified by
    // its section so six of these down a rail are still tellable apart.
    const more = screen.getByRole("button", { name: "Show 21 more in Style" });
    expect(more).toHaveAttribute("data-remaining", "21");

    await user.click(more);
    expect(screen.getAllByRole("checkbox")).toHaveLength(24);

    const fewer = screen.getByRole("button", { name: "Show fewer in Style" });
    await user.click(fewer);
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("renders the collapsed-section state, remembers it, and never hides live filters behind it", async () => {
    const user = userEvent.setup();
    render(<FilterPanel sections={SECTIONS} defaultSelected={{ format: ["portrait"] }} />);

    const trigger = screen.getByRole("button", { name: /^Format/ });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox", { name: "Portrait 128" })).not.toBeInTheDocument();
    // The other section is untouched — collapse is per-section, not global.
    expect(screen.getByRole("checkbox", { name: "v7 812" })).toBeInTheDocument();

    // A section collapsed over an applied filter must not read as an empty one.
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    // Reopening restores what was there; the memory is the component's.
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("checkbox", { name: "Portrait 128" })).toBeChecked();
  });

  it("hands collapse state out through openSections so a host can persist it", async () => {
    const user = userEvent.setup();
    const onOpenSectionsChange = vi.fn();
    render(
      <FilterPanel sections={SECTIONS} openSections={["model"]} onOpenSectionsChange={onOpenSectionsChange} />,
    );

    // Controlled: only "model" is open, regardless of what the panel would
    // have chosen for itself.
    expect(screen.getByRole("button", { name: /^Format/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("checkbox", { name: "v7 812" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Format/ }));
    expect(onOpenSectionsChange).toHaveBeenCalledWith(["model", "format"]);
    // Still controlled — the panel did not move on its own.
    expect(screen.getByRole("button", { name: /^Format/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the saved-searches state as its own region, not one more facet group", async () => {
    const user = userEvent.setup();
    const onSavedSearchSelect = vi.fn();
    render(
      <FilterPanel
        sections={SECTIONS}
        savedSearches={[
          { id: "upscales", label: "Upscales this month", count: 42 },
          { id: "liked", label: "Liked v7", count: 18 },
        ]}
        activeSavedSearchId="upscales"
        onSavedSearchSelect={onSavedSearchSelect}
      />,
    );

    const saved = screen.getByRole("group", { name: "Saved searches" });
    // A saved search replaces the filter set, so it is a button — never a
    // checkbox that narrows alongside the facets.
    expect(within(saved).queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(saved).getAllByRole("button")).toHaveLength(2);

    // Active is stated programmatically and in text, not by a colour.
    const active = within(saved).getByRole("button", { name: /Upscales this month/ });
    expect(active).toHaveAttribute("aria-current", "true");
    expect(active).toHaveAccessibleName("Upscales this month, 42, active");

    await user.click(within(saved).getByRole("button", { name: /Liked v7/ }));
    expect(onSavedSearchSelect).toHaveBeenCalledWith("liked");
  });

  it("renders the view-options state as named radio groups, kept apart from the facets", async () => {
    const user = userEvent.setup();
    const onViewOptionChange = vi.fn();
    render(
      <FilterPanel
        sections={SECTIONS}
        viewOptions={[
          {
            id: "sort",
            label: "Sort",
            options: [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
            ],
          },
          {
            id: "layout",
            label: "Layout",
            defaultValue: "list",
            options: [
              { value: "grid", label: "Grid" },
              { value: "list", label: "List" },
            ],
          },
        ]}
        onViewOptionChange={onViewOptionChange}
      />,
    );

    const sort = screen.getByRole("radiogroup", { name: "Sort" });
    expect(within(sort).getByRole("radio", { name: "Newest" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();

    await user.click(within(sort).getByRole("radio", { name: "Oldest" }));
    expect(onViewOptionChange).toHaveBeenCalledWith("sort", "oldest");

    // View options govern presentation, so they live outside the facet block.
    expect(document.querySelector('[data-slot="filter-panel-view-options"]')).not.toBeNull();
    expect(
      document.querySelector('[data-slot="filter-panel-view-options"] [data-slot="filter-panel-facet"]'),
    ).toBeNull();
  });

  it("reports selection by section and clears every facet from one A11 affordance", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onClearAll = vi.fn();
    render(<FilterPanel sections={SECTIONS} onSelectedChange={onSelectedChange} onClearAll={onClearAll} />);

    const clear = screen.getByRole("button", { name: "Clear all filters" });
    // Mounted but inert with nothing to clear, so the header never reflows.
    expect(clear).toBeDisabled();
    expect(clear).toHaveAttribute("data-slot", "reset-affordance");

    await user.click(screen.getByRole("checkbox", { name: "Portrait 128" }));
    expect(onSelectedChange).toHaveBeenLastCalledWith({ format: ["portrait"] });

    await user.click(screen.getByRole("checkbox", { name: "v6 240" }));
    expect(onSelectedChange).toHaveBeenLastCalledWith({ format: ["portrait"], model: ["v6"] });

    await user.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(onSelectedChange).toHaveBeenLastCalledWith({});
    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox", { name: "Portrait 128" })).not.toBeChecked();
  });

  it("passes className through", () => {
    render(<FilterPanel className="test-class" />);
    expect(document.querySelector('[data-slot="filter-panel"]')!.className).toContain("test-class");
  });
});
