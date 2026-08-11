import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LibraryShell, type LibraryShellProps } from "./library-shell";

// Kebab-case, exactly as the manifest declares them. The gate only greps the
// source for these strings, so this is the render-time version of that check.
const REGIONS = ["facet-rail", "header", "dense-grid"];

const FACETS: LibraryShellProps["facets"] = [
  {
    id: "format",
    label: "Format",
    facets: [
      { value: "portrait", label: "Portrait", count: 128 },
      { value: "landscape", label: "Landscape", count: 64 },
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

const GROUPS: LibraryShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    items: [
      { id: "a1", name: "Red bicycle", prompt: "A red bicycle leaning on a sunlit wall" },
      { id: "a2", name: "Blue awning" },
    ],
  },
  {
    id: "last-week",
    label: "Last week",
    items: [{ id: "a3", name: "Harbour at dusk" }],
  },
];

const grid = () => document.querySelector('[data-slot="generation-grid-grid"]')!;

describe("LibraryShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<LibraryShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<LibraryShell className="test-class" />);
    expect(document.querySelector('[data-slot="library-shell"]')!.className).toContain("test-class");
  });

  // Every region stays mounted with nothing in it — a region that appears from
  // nowhere cannot teach that it exists.
  it("mounts every region on an archive with no assets and no facets", () => {
    const { container } = render(<LibraryShell />);
    for (const region of REGIONS) {
      expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
  });

  // ---- composition ---------------------------------------------------------

  it("composes J2 filter-panel in the rail rather than its own checkboxes", () => {
    const { container } = render(<LibraryShell facets={FACETS} />);
    const rail = container.querySelector('[data-region="facet-rail"]')!;
    expect(rail.querySelector('[data-slot="filter-panel"]')).not.toBeNull();
    expect(rail.querySelectorAll('[data-slot="filter-panel-facet"]')).toHaveLength(4);
  });

  // "Facet counts are what make the rail usable at scale. Without them every
  // filter click is a gamble." J2 folds the count into the checkbox's own
  // accessible name; composing J2 whole is what keeps that true here.
  it("keeps the facet count inside the checkbox's accessible name", () => {
    render(<LibraryShell facets={FACETS} />);
    expect(screen.getByRole("checkbox", { name: "Portrait 128" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "v7 812" })).toBeInTheDocument();
  });

  it("composes J1 asset-library for the header and its search field", async () => {
    const onSearchChange = vi.fn();
    const { container } = render(<LibraryShell onSearchChange={onSearchChange} />);
    const header = container.querySelector('[data-region="header"]')!;
    expect(header.querySelector('[data-slot="asset-library"]')).not.toBeNull();
    expect(header.querySelector('[data-slot="asset-library-search"]')).not.toBeNull();

    await userEvent.type(within(header as HTMLElement).getByRole("searchbox"), "b");
    expect(onSearchChange).toHaveBeenCalledWith("b");
  });

  it("composes F2 generation-grid, with one A3 date-section per group", () => {
    const { container } = render(<LibraryShell groups={GROUPS} />);
    const region = container.querySelector('[data-region="dense-grid"]')!;
    expect(region.querySelector('[data-slot="generation-grid"]')).not.toBeNull();
    // A3 is reached through F2, which is the point: the shell never renders a
    // date heading of its own.
    expect(region.querySelectorAll('[data-slot="date-section"]')).toHaveLength(2);
    expect(screen.getByText("Today")).toBeVisible();
    expect(screen.getByText("Last week")).toBeVisible();
  });

  it("renders every cell as an A8 preview-tile", () => {
    render(<LibraryShell groups={GROUPS} />);
    expect(document.querySelectorAll('[data-slot="preview-tile"]')).toHaveLength(3);
    expect(document.querySelector('[data-asset-id="a1"]')).not.toBeNull();
  });

  // ---- the spec's load-bearing sentences ------------------------------------

  // "Dense by default. This is an archive you scan, not a gallery you browse."
  // F2 exposes density only as a column count on one element, so the class list
  // is the single observable that separates dense from roomy. Asserting a class
  // is normally the wrong instinct; here it is the only thing that can catch a
  // shell that quietly ships at gallery density.
  it("opens at F2's densest column count", () => {
    render(<LibraryShell groups={GROUPS} />);
    expect(grid().className).toContain("lg:grid-cols-8");
  });

  // "…thumbnail size is a user preference, not a brand decision." The control
  // is in the rail, it is a real control, and it moves the grid.
  it("lets the reader change thumbnail size from the rail", async () => {
    const onDensityChange = vi.fn();
    render(<LibraryShell groups={GROUPS} onDensityChange={onDensityChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Large" }));
    expect(onDensityChange).toHaveBeenCalledWith("comfortable");
    expect(grid().className).toContain("lg:grid-cols-4");
  });

  // "Clicking any tile opens F3, which is where the provenance contract pays
  // off." The tile's own frame is the control — there is no second affordance.
  it("opens F3 from the tile itself", async () => {
    render(<LibraryShell groups={GROUPS} />);
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Red bicycle" }));
    expect(document.querySelector('[data-slot="asset-detail"]')).not.toBeNull();
    expect(screen.getByText(/A red bicycle leaning on a sunlit wall/)).toBeVisible();
  });

  it("reports the opened asset when the lightbox is controlled", async () => {
    const onOpenAssetChange = vi.fn();
    render(<LibraryShell groups={GROUPS} openAssetId={null} onOpenAssetChange={onOpenAssetChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Harbour at dusk" }));
    expect(onOpenAssetChange).toHaveBeenCalledWith("a3");
    // Controlled and unmoved: the shell keeps no second copy of the open id.
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
  });

  // The rail and the header are two views of one filter set. A selection made
  // in the rail has to be visible — and clearable — from the header.
  it("mirrors selected facets into the header as A5 chips", async () => {
    const { container } = render(
      <LibraryShell facets={FACETS} defaultSelectedFacets={{ format: ["portrait"] }} />,
    );
    const header = container.querySelector('[data-region="header"]')!;
    const chip = within(header as HTMLElement).getByRole("button", { name: "Portrait" });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      within(header as HTMLElement).getByRole("button", { name: "Remove Portrait filter" }),
    );
    expect(within(header as HTMLElement).queryByRole("button", { name: "Portrait" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Portrait 128" })).not.toBeChecked();
  });

  it("reports a facet cleared from the header, not just from the rail", async () => {
    const onSelectedFacetsChange = vi.fn();
    render(
      <LibraryShell
        facets={FACETS}
        selectedFacets={{ format: ["portrait"], model: ["v7"] }}
        onSelectedFacetsChange={onSelectedFacetsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove Portrait filter" }));
    expect(onSelectedFacetsChange).toHaveBeenCalledWith({ model: ["v7"] });
  });

  // ---- select mode ----------------------------------------------------------

  // F2's rule, applied to the tile: select mode replaces the open action rather
  // than layering a checkbox over it, so the two are never live at once.
  it("selects instead of opening while select mode is on", async () => {
    const onSelectionChange = vi.fn();
    render(
      <LibraryShell
        groups={GROUPS}
        selectMode
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
        bulkActions={<button type="button">Delete</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Blue awning" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a2"]);
    expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
    expect(screen.getByRole("toolbar", { name: /bulk actions/i })).toBeVisible();
  });

  // ---- empty ----------------------------------------------------------------

  // "Empty is an in-grid tile, not a page takeover" (F2). The shell keeps the
  // columns and puts L1 in the first cell.
  it("falls to L1 as an in-grid tile when the archive is empty", () => {
    const { container } = render(<LibraryShell facets={FACETS} />);
    const region = container.querySelector('[data-region="dense-grid"]')!;
    const empty = region.querySelector('[data-slot="empty-state"]')!;
    expect(empty).not.toBeNull();
    expect(empty).toHaveAttribute("data-size", "in-grid");
    expect(screen.getByText("Nothing saved yet")).toBeVisible();
  });

  // An archive narrowed to nothing is a different problem from an empty
  // archive, and the copy has to say which one you are looking at.
  it("says the filters emptied the view, not that the archive is empty", () => {
    render(<LibraryShell facets={FACETS} defaultSelectedFacets={{ format: ["portrait"] }} />);
    expect(screen.getByText("No matches")).toBeVisible();
    expect(screen.queryByText("Nothing saved yet")).toBeNull();
  });

  // ---- a11y -----------------------------------------------------------------

  // Both panes scroll, so both need a tab stop and a name (axe
  // `scrollable-region-focusable`).
  it("gives both scrolling panes a name and a tab stop", () => {
    const { container } = render(<LibraryShell groups={GROUPS} />);
    for (const [region, name] of [
      ["facet-rail", "Filters"],
      ["dense-grid", "Assets"],
    ]) {
      const node = container.querySelector(`[data-region="${region}"]`)!;
      expect(node).toHaveAttribute("tabindex", "0");
      expect(node).toHaveAccessibleName(name);
    }
  });

  // A8 renders a `below` label as a sibling of its frame button, which would
  // leave the control nameless whenever the thumbnail is decorative. The
  // overlay placement is what keeps the name inside the button.
  it("names each tile's control even when the thumbnail is decorative", () => {
    render(
      <LibraryShell
        groups={[
          {
            id: "today",
            label: "Today",
            items: [{ id: "a1", name: "Red bicycle", thumbnail: <div aria-hidden /> }],
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Red bicycle" })).toBeInTheDocument();
  });
});
