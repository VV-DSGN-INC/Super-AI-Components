import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WhatsNew, type WhatsNewEntry } from "./whats-new";

const entries: WhatsNewEntry[] = [
  {
    id: "layers",
    title: "Layer groups",
    date: "12 March 2026",
    dateTime: "2026-03-12",
    summary: "Nest layers and move them as one.",
    stage: "New",
    media: <img alt="Grouped layers in the canvas sidebar" src="/layers.png" />,
    cta: { label: "Open layers", onAction: () => {} },
  },
  {
    id: "voices",
    title: "Custom voices",
    date: "28 February 2026",
    summary: "Train a voice from a 30-second sample.",
  },
  {
    id: "batch",
    title: "Batch export",
    date: "14 February 2026",
  },
];

const unreadEntries: WhatsNewEntry[] = [
  { ...entries[0], unread: true },
  { ...entries[1], unread: true },
  entries[2],
];

describe("WhatsNew", () => {
  it("renders the entry-list state", () => {
    render(<WhatsNew entries={entries} defaultOpen />);

    // Two panes, programmatically associated — a tablist of entries beside the
    // tabpanel it controls, not two loose divs.
    const list = screen.getByRole("tablist", { name: "Updates" });
    expect(list).toHaveAttribute("aria-orientation", "vertical");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("data-slot", "whats-new-entry");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");

    // Every entry carries its date in the list, not only in the detail.
    expect(tabs[0]).toHaveTextContent("12 March 2026");
    expect(tabs[1]).toHaveTextContent("28 February 2026");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].getAttribute("id"));
    // The scrollable detail pane is keyboard-reachable.
    expect(panel).toHaveAttribute("tabindex", "0");
  });

  it("renders the entry-detail state", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<WhatsNew entries={entries} defaultOpen onSelect={onSelect} />);

    // Hero media does the explaining, and the detail repeats the date.
    const detail = screen.getByRole("tabpanel");
    expect(detail).toHaveAttribute("data-slot", "whats-new-detail");
    expect(detail.querySelector('[data-slot="whats-new-media"]')).not.toBeNull();
    expect(screen.getByAltText("Grouped layers in the canvas sidebar")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(detail).toHaveTextContent("Nest layers and move them as one.");

    // Selecting swaps the detail; only the selected panel is mounted.
    await user.click(screen.getByRole("tab", { name: /Custom voices/ }));
    expect(onSelect).toHaveBeenCalledWith("voices");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Train a voice from a 30-second sample.");
    expect(screen.queryByText("Nest layers and move them as one.")).not.toBeInTheDocument();
  });

  it("renders the unread state", async () => {
    const user = userEvent.setup();
    const onEntryRead = vi.fn();
    render(<WhatsNew entries={unreadEntries} onEntryRead={onEntryRead} />);

    // Unread dots drive the badge on the trigger, and the badge says so in
    // words — a count alone would be a colour-only signal.
    const trigger = screen.getByRole("button", { name: /What's new/ });
    expect(trigger).toHaveAccessibleName(/What's new\s*2\s*unread/);
    expect(onEntryRead).not.toHaveBeenCalled();

    await user.click(trigger);

    // Reading one entry clears one dot: the component reports the read and
    // never persists it, so both entries stay dotted here.
    expect(onEntryRead).toHaveBeenCalledTimes(1);
    expect(onEntryRead).toHaveBeenCalledWith("layers");

    expect(document.querySelectorAll('[data-slot="whats-new-unread"]')).toHaveLength(2);
    // The dot is never the only signal — it carries text for a screen reader.
    expect(screen.getAllByText("Unread")).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: /Custom voices/ }));
    expect(onEntryRead).toHaveBeenCalledTimes(2);
    expect(onEntryRead).toHaveBeenLastCalledWith("voices");

    // An entry already reported reports once per open session, not per render.
    await user.click(screen.getByRole("tab", { name: /Layer groups/ }));
    expect(onEntryRead).toHaveBeenCalledTimes(2);
  });

  it("drops the badge entirely when nothing is unread", () => {
    render(<WhatsNew entries={entries} triggerLabel="Updates" />);
    expect(screen.getByRole("button", { name: "Updates" })).toHaveAccessibleName("Updates");
  });

  it("renders the entry-cta state", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const withCta: WhatsNewEntry[] = [
      { ...entries[0], cta: { label: "Open layers", onAction } },
      entries[1],
    ];
    render(<WhatsNew entries={withCta} defaultOpen />);

    // The CTA is an action that lands you in the feature, not a link out: it
    // is a button, it has no href, and it fires in-app.
    const cta = screen.getByRole("button", { name: "Open layers" });
    expect(cta).toHaveAttribute("data-slot", "whats-new-cta");
    expect(cta).not.toHaveAttribute("href");
    await user.click(cta);
    expect(onAction).toHaveBeenCalledTimes(1);

    // An entry without a CTA renders none.
    await user.click(screen.getByRole("tab", { name: /Custom voices/ }));
    expect(screen.queryByRole("button", { name: "Open layers" })).not.toBeInTheDocument();
  });

  it("keeps selection controllable and the trigger replaceable", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <WhatsNew
        entries={entries}
        selectedId="batch"
        onSelect={onSelect}
        trigger={<button>Changelog</button>}
      />,
    );

    // A host-supplied trigger replaces the built-in one and still opens the dialog.
    await user.click(screen.getByRole("button", { name: "Changelog" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Batch export");

    // Controlled: the click reports, the host decides.
    await user.click(screen.getByRole("tab", { name: /Layer groups/ }));
    expect(onSelect).toHaveBeenCalledWith("layers");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Batch export");
  });

  it("passes className through", () => {
    render(<WhatsNew entries={entries} defaultOpen className="test-class" />);
    expect(document.querySelector('[data-slot="whats-new"]')!.className).toContain("test-class");
  });
});
