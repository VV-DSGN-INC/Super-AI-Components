import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { AssetLibrary, type AssetLibraryItem } from "./asset-library";

const FILES: AssetLibraryItem[] = [
  { id: "f1", name: "Brand kit.png", type: "Image", size: "2.4 MB", modified: "2 days ago" },
  { id: "f2", name: "Launch cut.mp4", type: "Video", size: "184 MB", modified: "Yesterday" },
];

const FOLDERS: AssetLibraryItem[] = [
  { id: "d1", name: "Campaign", kind: "folder", itemCount: 12, modified: "Today" },
  { id: "d2", name: "Archive", kind: "folder", itemCount: 1, modified: "Last month" },
];

const rows = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-slot="asset-library-row"]')) as HTMLElement[];

const actions = () => <DropdownMenuItem>Rename</DropdownMenuItem>;

describe("AssetLibrary", () => {
  it("renders the file state", () => {
    const { container } = render(<AssetLibrary items={FILES} />);

    const [first, second] = rows(container);
    expect(first).toHaveAttribute("data-kind", "file");
    expect(within(first).getByText("Brand kit.png")).toBeInTheDocument();
    // A file states its own type and size in the shared columns.
    expect(within(first).getByText("Image")).toBeInTheDocument();
    expect(within(first).getByText("2.4 MB")).toBeInTheDocument();
    expect(within(second).getByText("Video")).toBeInTheDocument();
  });

  it("renders the folder state", () => {
    const { container } = render(<AssetLibrary items={FOLDERS} />);

    const [first] = rows(container);
    expect(first).toHaveAttribute("data-kind", "folder");
    // "Folder" is a word in the Type column, so the kind never rests on the
    // glyph (which is aria-hidden) or on colour.
    expect(within(first).getByText("Folder")).toBeInTheDocument();
    // A folder counts its contents where a file states its size — same column.
    expect(within(first).getByText("12 items")).toBeInTheDocument();
    expect(within(rows(container)[1]).getByText("1 item")).toBeInTheDocument();
  });

  it("renders the mixed state — folders and files share one table", () => {
    const { container } = render(<AssetLibrary items={[FILES[0], FOLDERS[0], FILES[1]]} />);

    // The load-bearing claim: one table, one body, no separate folder pane.
    expect(container.querySelectorAll("table")).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="asset-library-table"]')).toHaveLength(1);
    expect(container.querySelectorAll("tbody")).toHaveLength(1);

    // Folders are hoisted above files, and every row lives in that one body.
    const all = rows(container);
    expect(all.map((row) => row.dataset.kind)).toEqual(["folder", "file", "file"]);
    expect(all.map((row) => row.dataset.assetId)).toEqual(["d1", "f1", "f2"]);
    for (const row of all) expect(row.closest("tbody")).toBe(container.querySelector("tbody"));
  });

  it("renders the empty state", () => {
    const { container } = render(
      <AssetLibrary items={[]} filters={<span>Images</span>} />,
    );

    expect(container.querySelector('[data-slot="asset-library-empty"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument();
    expect(container.querySelector("table")).toBeNull();
    // Header, search and chips survive: whatever emptied the list has to stay
    // reachable so it can be undone.
    expect(container.querySelector('[data-slot="section-header"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Search assets")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="filter-bar"]')).toBeInTheDocument();
  });

  it("renders the selection-mode state", async () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <AssetLibrary
        items={[...FOLDERS, ...FILES]}
        rowActions={actions}
        selectionMode
        selectedIds={["d1"]}
        onSelectionChange={onSelectionChange}
        bulkActions={<button type="button">Delete</button>}
      />,
    );

    // The bulk bar is revealed, and reports the live count.
    const bar = screen.getByRole("toolbar", { name: "Bulk actions, 1 selected" });
    expect(within(bar).getByText("1 selected")).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Delete" })).toBeInTheDocument();

    // Hover affordances are swapped for checkboxes: one per row, plus select-all.
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByRole("checkbox", { name: "Select Campaign" })).toBeChecked();

    await userEvent.click(screen.getByRole("checkbox", { name: "Select Brand kit.png" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["d1", "f1"]);

    // Selection is controlled — the component keeps no second copy.
    expect(container.querySelector('[data-asset-id="d1"]')).toHaveAttribute("data-state", "selected");
  });

  it("puts row actions in an overflow menu, not a row toolbar", async () => {
    const { container } = render(<AssetLibrary items={FILES} rowActions={actions} />);

    const row = rows(container)[0];
    // Exactly one action control on the row, and it opens a menu.
    const trigger = within(row).getByRole("button", { name: "Actions for Brand kit.png" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(within(row).getAllByRole("button")).toHaveLength(1);

    await userEvent.click(trigger);
    expect(await screen.findByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
  });

  it("keeps the overflow trigger keyboard reachable rather than display:none", () => {
    const { container } = render(<AssetLibrary items={FILES} rowActions={actions} />);

    const trigger = within(rows(container)[0]).getByRole("button", {
      name: "Actions for Brand kit.png",
    });
    expect(trigger.className).toContain("opacity-0");
    expect(trigger.className).toContain("group-focus-within/row:opacity-100");
    expect(trigger.className).not.toContain("hidden");
  });

  it("stands the overflow menu down in selection mode — both are never live at once", () => {
    const { container } = render(
      <AssetLibrary items={FILES} rowActions={actions} selectionMode selectedIds={[]} />,
    );

    expect(screen.queryByRole("button", { name: "Actions for Brand kit.png" })).toBeNull();
    expect(container.querySelectorAll('[data-slot="asset-library-row-actions"]')).toHaveLength(0);
    expect(within(rows(container)[0]).getByRole("checkbox")).toBeInTheDocument();
  });

  it("leaves the row a plain tr and makes the name the interactive target", () => {
    const onOpen = vi.fn();
    const { container } = render(
      <AssetLibrary items={FILES} onOpen={onOpen} rowActions={actions} />,
    );

    const row = rows(container)[0];
    // No nested interactives: the row is not a button and carries no role.
    expect(row.tagName).toBe("TR");
    expect(row).not.toHaveAttribute("role");
    const name = within(row).getByRole("button", { name: "Brand kit.png" });
    expect(name.closest("button, a")).toBe(name);
  });

  it("renders a name as a link when the item navigates", () => {
    const { container } = render(
      <AssetLibrary items={[{ id: "f1", name: "Brand kit.png", href: "/assets/f1" }]} />,
    );

    const link = within(rows(container)[0]).getByRole("link", { name: "Brand kit.png" });
    expect(link).toHaveAttribute("href", "/assets/f1");
  });

  it("switches to grid view and keeps both kinds in one container", async () => {
    const { container } = render(<AssetLibrary items={[...FILES, ...FOLDERS]} />);

    await userEvent.click(screen.getByRole("button", { name: "Grid view" }));

    expect(container.querySelector("table")).toBeNull();
    const grid = container.querySelector('[data-slot="asset-library-grid"]')!;
    const tiles = grid.querySelectorAll('[data-slot="asset-library-tile"]');
    expect(tiles).toHaveLength(4);
    expect(Array.from(tiles).map((tile) => (tile as HTMLElement).dataset.kind)).toEqual([
      "folder",
      "folder",
      "file",
      "file",
    ]);
    expect(container.querySelector('[data-slot="asset-library"]')).toHaveAttribute("data-view", "grid");
  });

  it("renders missing metadata as an em-dash, never a zero", () => {
    const { container } = render(<AssetLibrary items={[{ id: "f1", name: "Untitled" }]} />);

    const row = rows(container)[0];
    expect(within(row).getByText("File")).toBeInTheDocument();
    expect(within(row).getAllByText("—")).toHaveLength(2);
  });

  it("owns the search field but does not filter the list", async () => {
    const onSearchChange = vi.fn();
    const { container } = render(
      <AssetLibrary items={FILES} search="" onSearchChange={onSearchChange} />,
    );

    await userEvent.type(screen.getByLabelText("Search assets"), "b");
    expect(onSearchChange).toHaveBeenCalledWith("b");
    // Filtering is the caller's: the items handed in are the items rendered.
    expect(rows(container)).toHaveLength(2);
  });

  it("selects and clears every item from the bulk bar", async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <AssetLibrary
        items={FILES}
        selectionMode
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["f1", "f2"]);

    rerender(
      <AssetLibrary
        items={FILES}
        selectionMode
        selectedIds={["f1", "f2"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("composes A12, A5 and L1 rather than restyling them", () => {
    const { container } = render(
      <AssetLibrary
        items={FILES}
        title="Assets"
        headerActions={<button type="button">Upload</button>}
        filters={<span>Images</span>}
      />,
    );

    // Each composed component keeps its own data-slot.
    expect(container.querySelector('[data-slot="section-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="section-header-count"]')).toHaveTextContent("2");
    expect(container.querySelector('[data-slot="filter-bar"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<AssetLibrary items={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="asset-library"]')!.className).toContain("test-class");
  });
});
