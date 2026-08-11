import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RecordList, type RecordListItem } from "./record-list";

const RECORDS: RecordListItem[] = [
  {
    id: "1",
    title: "Daily digest",
    apps: [{ name: "Gmail" }, { name: "Notion" }, { name: "Slack" }],
    lastRun: "Last run 4 min ago",
    meta: ["Marketing"],
    runState: "success",
    enabled: true,
    actions: [
      { id: "duplicate", label: "Duplicate" },
      { id: "delete", label: "Delete", destructive: true },
    ],
  },
  {
    id: "2",
    title: "Lead sync",
    apps: [{ name: "HubSpot" }, { name: "Google Sheets" }],
    lastRun: "Last run 2 h ago",
    runState: "failed",
    enabled: false,
    actions: [{ id: "duplicate", label: "Duplicate" }],
  },
  {
    id: "3",
    title: "Invoice parser",
    apps: [{ name: "Stripe" }],
    draft: true,
    runState: "never",
    enabled: false,
  },
];

const rowFor = (title: string) => screen.getByRole("row", { name: new RegExp(title) });

describe("RecordList", () => {
  it("renders the app-icon-cluster state", () => {
    render(<RecordList records={RECORDS} />);
    const cluster = within(rowFor("Daily digest")).getByRole("list", {
      name: "Apps in Daily digest",
    });
    // Data, not decoration: every app this record touches is readable.
    expect(within(cluster).getByText("Gmail")).toBeInTheDocument();
    expect(within(cluster).getByText("Notion")).toBeInTheDocument();
    expect(within(cluster).getByText("Slack")).toBeInTheDocument();
    expect(within(cluster).getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders the metadata state", () => {
    render(<RecordList records={RECORDS} />);
    const cell = rowFor("Daily digest").querySelector('[data-slot="record-list-record"]')!;
    const subtitle = cell.querySelector('[data-slot="record-list-subtitle"]')!;
    expect(within(subtitle as HTMLElement).getByText("Last run 4 min ago")).toBeInTheDocument();
    expect(within(subtitle as HTMLElement).getByText("Marketing")).toBeInTheDocument();
  });

  it("renders the enable-toggle state", () => {
    render(<RecordList records={RECORDS} />);
    const toggle = within(rowFor("Daily digest")).getByRole("switch", { name: "Enable Daily digest" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
    expect(
      within(rowFor("Lead sync")).getByRole("switch", { name: "Enable Lead sync" }),
    ).not.toBeChecked();
  });

  it("renders the run-status state", () => {
    render(<RecordList records={RECORDS} />);
    expect(within(rowFor("Daily digest")).getByText("Last run OK")).toBeInTheDocument();
    expect(within(rowFor("Lead sync")).getByText("Last run failed")).toBeInTheDocument();
    expect(within(rowFor("Invoice parser")).getByText("Never run")).toBeInTheDocument();
  });

  it("renders the overflow-menu state", async () => {
    const onSelect = vi.fn();
    render(
      <RecordList
        records={[{ ...RECORDS[0], actions: [{ id: "duplicate", label: "Duplicate", onSelect }] }]}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "More actions for Daily digest" }),
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("passes className through", () => {
    render(<RecordList records={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="record-list"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions
  // ---------------------------------------------------------------------------

  it("keeps the enable toggle in the row, not in the overflow menu", async () => {
    render(<RecordList records={RECORDS} />);
    // One switch per record, each inside its own row — the primary control is
    // reachable without opening anything.
    expect(screen.getAllByRole("switch")).toHaveLength(3);
    const row = rowFor("Daily digest");
    expect(within(row).getByRole("switch", { name: "Enable Daily digest" })).toBeInTheDocument();

    // And it is not duplicated inside the menu.
    await userEvent.click(within(row).getByRole("button", { name: "More actions for Daily digest" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByRole("switch")).not.toBeInTheDocument();
    expect(within(menu).queryByText(/enable/i)).not.toBeInTheDocument();
  });

  it("leaves the row inert so the toggle and the menu are not nested interactives", async () => {
    const onOpen = vi.fn();
    render(<RecordList records={RECORDS} onOpen={onOpen} />);
    const row = rowFor("Daily digest");

    // The <tr> is not a control and does not pretend to be one.
    expect(row.tagName).toBe("TR");
    expect(row).not.toHaveAttribute("role");
    expect(row).not.toHaveAttribute("tabindex");
    expect(row).not.toHaveAttribute("aria-pressed");

    // Neither the switch nor the overflow trigger sits inside another control.
    const toggle = within(row).getByRole("switch", { name: "Enable Daily digest" });
    const overflow = within(row).getByRole("button", { name: "More actions for Daily digest" });
    expect(toggle.parentElement!.closest("a,button")).toBeNull();
    expect(overflow.parentElement!.closest("a,button")).toBeNull();

    // Clicking row chrome opens nothing; only the title does.
    await userEvent.click(within(row).getByText("Last run 4 min ago"));
    expect(onOpen).not.toHaveBeenCalled();
    await userEvent.click(within(row).getByRole("button", { name: "Daily digest" }));
    expect(onOpen).toHaveBeenCalledWith("1");
  });

  it("makes the record title the interactive element", () => {
    const { rerender } = render(<RecordList records={[RECORDS[0]]} onOpen={() => {}} />);
    expect(screen.getByRole("button", { name: "Daily digest" })).toBeInTheDocument();

    rerender(<RecordList records={[{ ...RECORDS[0], href: "/scenarios/1" }]} onOpen={() => {}} />);
    // href wins over onOpen: a real link is navigable, middle-clickable, copyable.
    expect(screen.getByRole("link", { name: "Daily digest" })).toHaveAttribute(
      "href",
      "/scenarios/1",
    );

    rerender(<RecordList records={[RECORDS[0]]} />);
    expect(screen.queryByRole("button", { name: "Daily digest" })).not.toBeInTheDocument();
    expect(screen.getByText("Daily digest")).toBeInTheDocument();
  });

  it("names every switch and every overflow trigger after its own record", () => {
    render(<RecordList records={RECORDS} />);
    for (const title of ["Daily digest", "Lead sync", "Invoice parser"]) {
      expect(screen.getByRole("switch", { name: `Enable ${title}` })).toBeInTheDocument();
    }
    // Never a column of identical "Enable" controls.
    expect(screen.queryByRole("switch", { name: "Enable" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More actions for Daily digest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More actions for Lead sync" })).toBeInTheDocument();
  });

  it("announces each app once — the mark is hidden, the name is not", () => {
    render(<RecordList records={[RECORDS[1]]} />);
    const cluster = screen.getByRole("list", { name: "Apps in Lead sync" });
    // Exactly one readable occurrence per app: the initials beside it are
    // aria-hidden, so the name is never announced twice or fused into "GSGoogle Sheets".
    expect(within(cluster).getAllByText("Google Sheets")).toHaveLength(1);
    for (const item of within(cluster).getAllByRole("listitem")) {
      expect(item.querySelector("[aria-hidden]")).not.toBeNull();
    }
  });

  it("keeps collapsed app names announced when the cluster overflows", () => {
    render(<RecordList records={[RECORDS[0]]} maxApps={1} />);
    const cluster = screen.getByRole("list", { name: "Apps in Daily digest" });
    expect(within(cluster).getByText("+2")).toBeInTheDocument();
    // The two hidden marks did not take their names with them.
    expect(within(cluster).getByText("Notion, Slack")).toBeInTheDocument();
  });

  it("puts last-run and draft in the subtitle rather than a column of their own", () => {
    render(<RecordList records={RECORDS} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).not.toContain("Last run");
    expect(headers).not.toContain("Status");

    const draftRow = rowFor("Invoice parser");
    const subtitle = draftRow.querySelector('[data-slot="record-list-subtitle"]')!;
    expect(within(subtitle as HTMLElement).getByText("Draft")).toBeInTheDocument();
    expect(within(subtitle as HTMLElement).getByText("Never run")).toBeInTheDocument();
  });

  it("never conveys run status by colour alone", () => {
    render(<RecordList records={RECORDS} />);
    for (const [title, text] of [
      ["Daily digest", "Last run OK"],
      ["Lead sync", "Last run failed"],
      ["Invoice parser", "Never run"],
    ] as const) {
      const status = within(rowFor(title)).getByText(text);
      // Words, plus an icon shape beside them.
      expect(status.querySelector("svg")).not.toBeNull();
    }
  });

  it("reports the record id and the new value when the toggle is flipped", async () => {
    const onEnabledChange = vi.fn();
    render(<RecordList records={RECORDS} onEnabledChange={onEnabledChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Enable Lead sync" }));
    expect(onEnabledChange).toHaveBeenCalledWith("2", true);
    await userEvent.click(screen.getByRole("switch", { name: "Enable Daily digest" }));
    expect(onEnabledChange).toHaveBeenLastCalledWith("1", false);
  });

  it("keeps a disabled toggle visible rather than removing the control", () => {
    render(<RecordList records={[{ ...RECORDS[0], toggleDisabled: true }]} />);
    // Base UI's Switch renders a span with role="switch", so "disabled" is
    // aria-disabled, not the HTML attribute.
    expect(screen.getByRole("switch", { name: "Enable Daily digest" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("omits the overflow trigger entirely when a record has no actions", () => {
    render(<RecordList records={RECORDS} />);
    expect(
      within(rowFor("Invoice parser")).queryByRole("button", { name: /More actions/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^More actions/ })).toHaveLength(2);
  });

  it("reads an app-less record as deliberate, not as an empty cell", () => {
    render(<RecordList records={[{ ...RECORDS[0], apps: [] }]} />);
    expect(screen.getByText("No apps")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /^Apps in/ })).not.toBeInTheDocument();
  });

  it("lets a caller override the run-status wording", () => {
    render(<RecordList records={[{ ...RECORDS[1], runLabel: "Last run failed — auth expired" }]} />);
    expect(screen.getByText("Last run failed — auth expired")).toBeInTheDocument();
  });
});
