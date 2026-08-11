import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RecordsShell } from "./records-shell";

const REGIONS = ["sidebar", "header", "filter-sort", "record-rows"];

const RECORDS = [
  {
    id: "digest",
    title: "Daily digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }],
    runState: "success" as const,
    lastRun: "4 min ago",
    enabled: true,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
  {
    id: "lead-sync",
    title: "Lead sync",
    apps: [{ name: "HubSpot" }],
    runState: "failed" as const,
    lastRun: "2 hours ago",
    enabled: false,
  },
];

const FOLDERS = [
  { id: "marketing", name: "Marketing", count: 12, modified: "2 days ago" },
  { id: "ops", name: "Operations", count: 3, modified: "Yesterday" },
];

const region = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-region="${name}"]`) as HTMLElement;

describe("RecordsShell", () => {
  it.each(REGIONS)("renders the %s region", (name) => {
    const { container } = render(<RecordsShell />);
    expect(container.querySelector(`[data-region="${name}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<RecordsShell className="test-class" />);
    expect(document.querySelector('[data-slot="records-shell"]')!.className).toContain("test-class");
  });

  // "These records execute, so the enable toggle is the primary control and
  // belongs in the row, not behind an overflow menu." The shell composes J5
  // rather than laying out its own rows, which is what makes that guarantee
  // structural instead of a thing this file has to re-decide.
  it("composes J5 record rows rather than rendering its own", () => {
    render(<RecordsShell records={RECORDS} />);
    expect(document.querySelectorAll('[data-slot="record-list-row"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="record-list-toggle"]')).toHaveLength(2);
  });

  it("keeps the enable toggle in the row, named after its record, never in the overflow menu", async () => {
    render(<RecordsShell records={RECORDS} />);
    const row = document.querySelector('[data-record-id="digest"]') as HTMLElement;
    // In the row, addressable by the record it enables.
    expect(within(row).getByRole("switch", { name: "Enable Daily digest" })).toBeInTheDocument();

    // And not tidied away behind the kebab: opening it yields actions, no switch.
    await userEvent.click(screen.getByRole("button", { name: "More actions for Daily digest" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByRole("switch")).not.toBeInTheDocument();
  });

  it("routes the toggle through J5's own control", async () => {
    const onEnabledChange = vi.fn();
    render(<RecordsShell records={RECORDS} onEnabledChange={onEnabledChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Enable Lead sync" }));
    expect(onEnabledChange).toHaveBeenCalledWith("lead-sync", true);
  });

  // "Run status in the subtitle (last run, draft, failing) is what makes the
  // list operational rather than decorative." It belongs beside the last-run
  // text, not in a column of its own.
  it("keeps run status in the subtitle beside the last run", () => {
    render(<RecordsShell records={RECORDS} />);
    const row = document.querySelector('[data-record-id="lead-sync"]') as HTMLElement;
    const subtitle = row.querySelector('[data-slot="record-list-subtitle"]') as HTMLElement;
    expect(within(subtitle).getByText("Last run failed")).toBeVisible();
    expect(within(subtitle).getByText("2 hours ago")).toBeVisible();
  });

  // The spec names J1 in *folder* mode. Every row it renders here is a folder;
  // a file row would mean the shell had drifted into being a stored-asset
  // browser, which is exactly the confusion O10 exists to avoid.
  it("composes J1 in folder mode, above the records, inside the same region", () => {
    const { container } = render(<RecordsShell folders={FOLDERS} records={RECORDS} />);
    const rows = region(container, "record-rows");
    const folderRows = rows.querySelectorAll('[data-slot="asset-library-row"]');
    expect(folderRows).toHaveLength(2);
    folderRows.forEach((row) => expect(row.getAttribute("data-kind")).toBe("folder"));

    // One surface, folders first — not a separate pane.
    const library = rows.querySelector('[data-slot="asset-library"]')!;
    const list = rows.querySelector('[data-slot="record-list"]')!;
    expect(library.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens a folder through J1's own name control", async () => {
    const onOpenFolder = vi.fn();
    render(<RecordsShell folders={FOLDERS} onOpenFolder={onOpenFolder} />);
    await userEvent.click(screen.getByRole("button", { name: "Marketing" }));
    expect(onOpenFolder).toHaveBeenCalledWith("marketing");
  });

  it("uses J1's search field as the page search", async () => {
    const onSearchChange = vi.fn();
    render(<RecordsShell folders={FOLDERS} onSearchChange={onSearchChange} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search records and folders" }), "l");
    expect(onSearchChange).toHaveBeenCalledWith("l");
  });

  // "Header + create": the create action is the header's reason to exist, so it
  // lives there rather than floating over the rows.
  it("puts the create action in the header region", async () => {
    const onCreate = vi.fn();
    const { container } = render(
      <RecordsShell title="Scenarios" createLabel="New scenario" onCreate={onCreate} />,
    );
    const header = region(container, "header");
    expect(within(header).getByRole("heading", { name: "Scenarios" })).toBeVisible();
    await userEvent.click(within(header).getByRole("button", { name: "New scenario" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("puts A5 chips and the sort control in the filter-sort region", async () => {
    const onToggle = vi.fn();
    const { container } = render(
      <RecordsShell
        filters={[{ id: "failing", label: "Failing", active: true, onToggle }]}
        sortOptions={[
          { value: "recent", label: "Last run" },
          { value: "name", label: "Name" },
        ]}
        sort="name"
      />,
    );
    const bar = region(container, "filter-sort");
    expect(bar.querySelector('[data-slot="filter-bar"]')).not.toBeNull();
    expect(bar.querySelector('[data-slot="filters-button"]')).not.toBeNull();

    // The chip's state is programmatic, not just a colour.
    const chip = within(bar).getByRole("button", { name: "Failing" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith("failing");

    // The sort trigger says what the list is sorted by without being opened.
    const sort = within(bar).getByRole("combobox", { name: "Sort by" });
    expect(sort).toHaveTextContent("Name");
  });

  // Day one: the folder table and the record list are empty at the same time,
  // and both fall to L1 rather than vanishing.
  it("falls to L1 for both folders and records on day one", () => {
    const { container } = render(<RecordsShell />);
    const rows = region(container, "record-rows");
    expect(rows.querySelectorAll('[data-slot="empty-state"]')).toHaveLength(2);
    expect(screen.getByText("No folders yet")).toBeVisible();
    expect(screen.getByText("No records yet")).toBeVisible();
  });

  it("falls to L1 in the sidebar when no nav is supplied", () => {
    const { container } = render(<RecordsShell />);
    expect(region(container, "sidebar").querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it("drops the record empty state as soon as there is a record", () => {
    const { container } = render(<RecordsShell records={RECORDS} />);
    const rows = region(container, "record-rows");
    expect(within(rows).queryByText("No records yet")).toBeNull();
    expect(rows.querySelector('[data-slot="record-list"]')).not.toBeNull();
  });

  // The record region scrolls, so it needs its own tab stop and a name
  // (axe `scrollable-region-focusable`).
  it("gives the scrolling record region a name and a tab stop", () => {
    const { container } = render(<RecordsShell title="Scenarios" />);
    const rows = region(container, "record-rows");
    expect(rows).toHaveAttribute("tabindex", "0");
    expect(rows).toHaveAccessibleName("Scenarios");
  });

  it("renders N1 in the record region when the list asks to be rated", () => {
    const { container } = render(<RecordsShell records={RECORDS} feedback={{ state: "idle" }} />);
    const rows = region(container, "record-rows");
    expect(rows.querySelector('[data-slot="feedback"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Helpful" })).toBeVisible();
  });

  it("does not render N1 when no feedback is wired", () => {
    render(<RecordsShell records={RECORDS} />);
    expect(document.querySelector('[data-slot="feedback"]')).toBeNull();
  });

  // "Distinct from O7 because the objects are runnable rather than stored."
  // J1's list/grid switch is suppressed: a grid of folder tiles above a table
  // of live automations is the misleading layout the spec warns about.
  it("pins J1 to list view and suppresses its view switch", () => {
    render(<RecordsShell folders={FOLDERS} />);
    const library = document.querySelector('[data-slot="asset-library"]')!;
    expect(library).toHaveAttribute("data-view", "list");
    // A class assertion, deliberately. The suppression is a `hidden` descendant
    // variant on J1's own view toggle, and jsdom applies no stylesheet — the
    // button is still in the tree here, so its absence cannot be asserted. This
    // is the only observable that catches the variant being dropped; it is not
    // a licence to assert classes anywhere else in this file.
    expect(library.className).toContain("[&_[data-slot=asset-library-view-toggle]]:hidden");
  });
});
