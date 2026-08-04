import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/switch";

import { SettingsDialog, type SettingsSectionData } from "./settings-dialog";

const TOGGLE_SECTIONS: SettingsSectionData[] = [
  {
    id: "general",
    label: "General",
    rows: [
      {
        id: "autosave",
        label: "Autosave drafts",
        description: "Keep a copy of every prompt while you type, recoverable for 30 days.",
        control: ({ controlId, labelId, descriptionId }) => (
          <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
        ),
      },
      {
        id: "sounds",
        label: "Completion sounds",
        description: "Play a chime when a long generation finishes in a background tab.",
        control: ({ controlId, labelId, descriptionId }) => (
          <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
        ),
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    tier: "Pro",
    rows: [
      {
        id: "invoices",
        label: "Email invoices",
        description: "Send a PDF invoice to the workspace owner after each renewal.",
        control: ({ controlId, labelId, descriptionId }) => (
          <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
        ),
      },
    ],
  },
];

const DESTRUCTIVE_SECTIONS: SettingsSectionData[] = [
  {
    id: "account",
    label: "Account",
    rows: [
      {
        id: "telemetry",
        label: "Share usage data",
        description: "Send anonymised feature usage so the team can prioritise work.",
        control: ({ controlId, labelId, descriptionId }) => (
          <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
        ),
      },
      {
        id: "delete",
        label: "Delete workspace",
        description: "Removes every project, render and API key. This cannot be undone.",
        destructiveAction: { label: "Delete workspace" },
      },
    ],
  },
];

/** Structure of the row grid, independent of generated ids. */
function rowShape() {
  return Array.from(document.querySelectorAll('[data-slot="settings-dialog-row"]')).map((row) => ({
    className: row.className,
    slots: Array.from(row.querySelectorAll("[data-slot]")).map((el) => el.getAttribute("data-slot")),
  }));
}

describe("SettingsDialog", () => {
  it("renders the dialog state", async () => {
    render(
      <SettingsDialog
        sections={TOGGLE_SECTIONS}
        title="Settings"
        description="Workspace preferences"
        trigger={<button>Open settings</button>}
      />,
    );

    // The frame is a real modal, opened from its trigger.
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Settings" })).toBeInTheDocument();

    const root = document.querySelector('[data-slot="settings-dialog"]')!;
    expect(root.getAttribute("data-variant")).toBe("dialog");

    // A modal has nowhere to put a result you cannot deep-link to: no search.
    expect(document.querySelector('[data-slot="settings-dialog-search"]')).toBeNull();
  });

  it("renders the full-page state with settings search and deep-linkable sections", async () => {
    function Harness() {
      const [search, setSearch] = React.useState("");
      return (
        <SettingsDialog
          variant="full-page"
          sections={TOGGLE_SECTIONS}
          search={search}
          onSearchChange={setSearch}
        />
      );
    }
    render(<Harness />);

    const root = document.querySelector('[data-slot="settings-dialog"]')!;
    expect(root.getAttribute("data-variant")).toBe("full-page");
    expect(screen.queryByRole("dialog")).toBeNull();

    // Deep-linkable: the visible section carries a stable, prefix-derived id.
    expect(document.querySelector("#settings-general")).not.toBeNull();

    // Search filters the row set and announces the count.
    await userEvent.type(screen.getByRole("searchbox", { name: "Search settings" }), "chime");
    expect(screen.getByRole("status")).toHaveTextContent("1 setting matches");
    expect(screen.getByText("Completion sounds")).toBeInTheDocument();
    expect(screen.queryByText("Autosave drafts")).toBeNull();
  });

  it("renders the toggle-rows state: every row is label + description + control", () => {
    render(<SettingsDialog variant="full-page" sections={TOGGLE_SECTIONS} />);

    const rows = document.querySelectorAll('[data-slot="settings-dialog-row"]');
    expect(rows).toHaveLength(2); // only the active section's panel is mounted

    for (const row of rows) {
      expect(row.querySelector('[data-slot="settings-dialog-row-label"]')).not.toBeNull();
      // The description is structural, not optional decoration.
      expect(row.querySelector('[data-slot="settings-dialog-row-description"]')!.textContent).toBeTruthy();
      expect(row.querySelector('[data-slot="settings-dialog-row-control"]')).not.toBeNull();
    }

    // The control is named by the row label and described by the row description.
    const toggle = screen.getByRole("switch", { name: "Autosave drafts" });
    const describedBy = toggle.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)!.textContent).toContain("recoverable for 30 days");
  });

  it("renders the destructive-rows state as text in the control column, never a filled button", async () => {
    const onAction = vi.fn();
    const sections: SettingsSectionData[] = [
      {
        ...DESTRUCTIVE_SECTIONS[0],
        rows: [
          DESTRUCTIVE_SECTIONS[0].rows[0],
          {
            id: "delete",
            label: "Delete workspace",
            description: "Removes every project, render and API key. This cannot be undone.",
            destructiveAction: { label: "Delete workspace", onAction },
          },
        ],
      },
    ];
    render(<SettingsDialog variant="full-page" sections={sections} />);

    const destructiveRow = document.querySelector('[data-row-id="delete"]')!;
    expect(destructiveRow.getAttribute("data-destructive")).toBe("true");

    // It lives in the control column, beside the benign toggle's column.
    const control = destructiveRow.querySelector('[data-slot="settings-dialog-row-control"]')!;
    const action = within(control as HTMLElement).getByRole("button", { name: "Delete workspace" });
    expect(action.getAttribute("data-slot")).toBe("settings-dialog-destructive-action");

    // Text, not a filled button: no background utility in any state, and no
    // `bg-destructive/NN` tint under `text-destructive` (4.0:1, under 4.5).
    expect(action.className).toContain("text-destructive");
    expect(action.className).not.toMatch(/(^|:)bg-/);

    await userEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders the tier-badged-nav state with the tier as a word, not a colour", async () => {
    render(<SettingsDialog variant="full-page" sections={TOGGLE_SECTIONS} />);

    const billingTab = screen.getByRole("tab", { name: /Billing/ });
    // The word is inside the tab's accessible name, so it survives a screen
    // reader and a colourblind reader alike.
    expect(billingTab).toHaveAccessibleName("Billing Pro");
    expect(billingTab.querySelector('[data-slot="settings-dialog-tier"]')!.textContent).toBe("Pro");

    // Nav and panel are programmatically associated, not merely adjacent.
    const generalTab = screen.getByRole("tab", { name: "General" });
    expect(generalTab).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(generalTab.getAttribute("id"));
    expect(generalTab.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));

    await userEvent.click(billingTab);
    expect(billingTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(billingTab.getAttribute("id"));
  });

  it("keeps the row grid identical between the dialog and full-page variants", () => {
    const dialog = render(<SettingsDialog sections={DESTRUCTIVE_SECTIONS} open onOpenChange={() => {}} />);
    const dialogRows = rowShape();
    expect(dialogRows).toHaveLength(2);
    dialog.unmount();

    render(<SettingsDialog variant="full-page" sections={DESTRUCTIVE_SECTIONS} />);
    const fullPageRows = rowShape();

    // The variant changes the frame and whether search exists — never the grid.
    expect(fullPageRows).toEqual(dialogRows);
  });

  it("reports section changes and honours a controlled section", async () => {
    const onSectionChange = vi.fn();
    render(
      <SettingsDialog
        variant="full-page"
        sections={TOGGLE_SECTIONS}
        sectionId="billing"
        onSectionChange={onSectionChange}
      />,
    );

    expect(screen.getByRole("tab", { name: "Billing Pro" })).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("#settings-billing")).not.toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "General" }));
    expect(onSectionChange).toHaveBeenCalledWith("general");
    // Controlled: the component did not move on its own.
    expect(screen.getByRole("tab", { name: "Billing Pro" })).toHaveAttribute("aria-selected", "true");
  });

  it("passes className through", () => {
    render(<SettingsDialog variant="full-page" sections={TOGGLE_SECTIONS} className="test-class" />);
    expect(document.querySelector('[data-slot="settings-dialog"]')!.className).toContain("test-class");
  });
});
