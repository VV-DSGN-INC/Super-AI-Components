import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/switch";

import type { SettingsRowData } from "./settings-dialog";
import { SettingsShell, type SettingsShellSection } from "./settings-shell";

const REGIONS = ["grouped-nav", "breadcrumb", "info-callout", "setting-sections", "code-block"];

const toggle = (id: string, label: string, description: string): SettingsRowData => ({
  id,
  label,
  description,
  control: ({ controlId, labelId, descriptionId }) => (
    <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
  ),
});

const SECTIONS: SettingsShellSection[] = [
  {
    id: "general",
    label: "General",
    group: "Account",
    rows: [
      toggle("autosave", "Autosave drafts", "Keep a copy of every prompt while you type."),
      toggle("sounds", "Completion sounds", "Play a chime when a long generation finishes."),
    ],
    callout: { title: "Personal", description: "These settings follow you across workspaces." },
  },
  {
    id: "mcp",
    label: "MCP",
    group: "Workspace",
    tier: "Pro",
    rows: [toggle("mcp-autoconnect", "Auto-connect servers", "Reconnect known MCP servers on load.")],
    gated: [
      {
        id: "remote-servers",
        label: "Remote MCP servers",
        description: "Connect servers that run outside this machine.",
        state: "locked",
        tier: "Pro",
      },
    ],
    code: {
      label: "MCP server configuration",
      language: "json",
      value: '{\n  "mcpServers": {}\n}',
    },
  },
  {
    id: "plans",
    label: "Plans",
    group: "Billing",
    tier: "Pro",
    rows: [toggle("invoices", "Email invoices", "Send a PDF invoice after each renewal.")],
    pricing: {
      plans: [
        { name: "Free", monthly: 0, yearly: 0 },
        { name: "Pro", monthly: 20, yearly: 16, current: true },
      ],
    },
  },
];

const USAGE = [{ label: "Generations", used: 820, limit: 1000 }];

/** Scoped, because M1's own (suppressed) nav and search are still in the jsdom tree. */
const region = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-region="${name}"]`) as HTMLElement;

describe("SettingsShell", () => {
  it.each(REGIONS)("renders the %s region", (name) => {
    const { container } = render(<SettingsShell sections={SECTIONS} />);
    expect(container.querySelector(`[data-region="${name}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<SettingsShell className="test-class" />);
    expect(document.querySelector('[data-slot="settings-shell"]')!.className).toContain("test-class");
  });

  // "Settings search is mandatory past about twenty settings." The five declared
  // regions are five and not six because search and the grouped nav are one
  // affordance — so the field has to be inside the nav region, not beside it.
  it("puts settings search inside the grouped-nav region", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} />);
    const nav = region(container, "grouped-nav");
    expect(within(nav).getByRole("searchbox", { name: "Search settings" })).toBeInTheDocument();
    expect(nav.querySelector('[data-slot="sidebar-nav"]')).not.toBeNull();
  });

  it("composes B3 nav rows rather than rendering its own", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="mcp" />);
    const nav = region(container, "grouped-nav");
    expect(nav.querySelectorAll('[data-slot="sidebar-nav-item"]')).toHaveLength(3);
    // Grouped, and grouped in declaration order.
    const groups = Array.from(nav.querySelectorAll('[data-slot="sidebar-nav-section"]'));
    expect(groups).toHaveLength(3);
    expect(within(nav).getByRole("link", { name: /^MCP/ })).toHaveAttribute("aria-current", "page");
  });

  // "Tier badges in the nav are a paywall placement as much as a label." The
  // word, never a colour or a dot — and it is B3's badge, not a restyled span.
  it("renders tier badges in the nav as B3 badges", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} />);
    const nav = region(container, "grouped-nav");
    const badges = Array.from(nav.querySelectorAll('[data-slot="sidebar-nav-tier"]'));
    expect(badges.map((b) => b.textContent)).toEqual(["Pro", "Pro"]);
  });

  // "Sections are deep-linkable. 'Go to Settings → Workspace → MCP' has to be a
  // URL." A tab cannot be a URL, which is why the page nav is B3 and M1's own
  // tablist is suppressed.
  it("makes every section a URL, matched by M1's own anchor id", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="mcp" />);
    const nav = region(container, "grouped-nav");
    expect(within(nav).getByRole("link", { name: /^MCP/ })).toHaveAttribute("href", "#settings-mcp");
    expect(container.querySelector("#settings-mcp")).not.toBeNull();
  });

  it("honours a custom anchorPrefix on both ends of the link", () => {
    const { container } = render(
      <SettingsShell sections={SECTIONS} sectionId="mcp" anchorPrefix="workspace-settings" />,
    );
    const nav = region(container, "grouped-nav");
    expect(within(nav).getByRole("link", { name: /^MCP/ })).toHaveAttribute(
      "href",
      "#workspace-settings-mcp",
    );
    expect(container.querySelector("#workspace-settings-mcp")).not.toBeNull();
  });

  it("selects a section through B3's own row control", async () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsShell sections={SECTIONS} onSectionChange={onSectionChange} />,
    );
    const nav = region(container, "grouped-nav");
    await userEvent.click(within(nav).getByRole("link", { name: /^MCP/ }));
    expect(onSectionChange).toHaveBeenCalledWith("mcp");
    // Uncontrolled by default, so the click also moves the page.
    expect(screen.getByText("Auto-connect servers")).toBeInTheDocument();
  });

  // M1 owns the row grid, the required description and the destructive-action
  // rendering. The shell must not grow its own copy of any of them.
  it("composes M1's full-page variant for the setting sections", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="general" />);
    const sectionsRegion = region(container, "setting-sections");
    const m1 = sectionsRegion.querySelector('[data-slot="settings-dialog"]')!;
    expect(m1.getAttribute("data-variant")).toBe("full-page");
    expect(m1.querySelectorAll('[data-slot="settings-dialog-row"]')).toHaveLength(2);
    expect(screen.getByRole("switch", { name: "Autosave drafts" })).toBeInTheDocument();
  });

  /**
   * A class assertion, which is normally the wrong instinct. It is justified
   * here because the suppression *is* the composition decision: M1's full-page
   * variant bundles a tablist and a search field, and O12 needs neither — its
   * nav is B3 (URLs, `aria-current="page"`) and its search sits in the nav
   * column. jsdom applies no CSS, so there is no rendered observable to assert
   * on; the documented overrides are the only thing that can regress here, and
   * losing them silently duplicates both controls in a real browser.
   */
  it("suppresses M1's own nav and search rather than rendering them twice", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} />);
    const m1 = container.querySelector('[data-slot="settings-dialog"]')!;
    expect(m1.className).toContain("[&_[data-slot=settings-dialog-nav]]:hidden");
    expect(m1.className).toContain("[&_[data-slot=settings-dialog-search]]:hidden");
  });

  // Search is global or it is not search: the count has to be visible from
  // whichever section you happen to be reading.
  it("reports search matches on every nav row and in a live region", async () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="general" />);
    const nav = region(container, "grouped-nav");
    await userEvent.type(within(nav).getByRole("searchbox", { name: "Search settings" }), "invoice");

    const status = within(nav)
      .getAllByRole("status")
      .filter((node) => /match/i.test(node.textContent ?? ""));
    expect(status).toHaveLength(1);
    expect(status[0].textContent).toContain("1 setting matches");

    // The match is in Billing, which is not the section on screen — B3's own
    // count badge is what makes it findable from here.
    const counts = Array.from(nav.querySelectorAll('[data-slot="sidebar-nav-count"]'));
    expect(counts.map((c) => c.textContent)).toEqual(["0", "0", "1"]);
  });

  it("lets M1 do the filtering rather than filtering rows itself", async () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="general" />);
    const nav = region(container, "grouped-nav");
    await userEvent.type(within(nav).getByRole("searchbox", { name: "Search settings" }), "chime");
    expect(screen.getByText("Completion sounds")).toBeInTheDocument();
    expect(screen.queryByText("Autosave drafts")).toBeNull();
  });

  // E7 is the thing the nav's tier badge was promising. It renders as a real
  // member-gate-row, not as a dimmed settings row.
  it("composes E7 for the features a tier badge gates", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="mcp" />);
    const sectionsRegion = region(container, "setting-sections");
    const gate = sectionsRegion.querySelector('[data-slot="member-gate-row"]')!;
    expect(gate.getAttribute("data-state")).toBe("locked");
    expect(gate.getAttribute("data-feature-id")).toBe("remote-servers");
    expect(gate.querySelector('[data-slot="member-gate-row-tier-badge"]')!.textContent).toBe("Pro");
  });

  it("composes M4 on the section where the upgrade happens", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="plans" />);
    expect(
      region(container, "setting-sections").querySelector('[data-slot="pricing-table"]'),
    ).not.toBeNull();
  });

  it("composes M3 in the nav column, in its own sidebar variant", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} usage={USAGE} />);
    const meter = region(container, "grouped-nav").querySelector('[data-slot="quota-meter"]')!;
    expect(meter).not.toBeNull();
    expect(within(meter as HTMLElement).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "820",
    );
  });

  it("renders B8 beside the breadcrumb", () => {
    const { container } = render(
      <SettingsShell sections={SECTIONS} accountMenu={<button>Open account menu</button>} />,
    );
    const header = container.querySelector('[data-slot="settings-shell-header"]')!;
    expect(within(header as HTMLElement).getByRole("button", { name: "Open account menu" })).toBeVisible();
  });

  it("trails the breadcrumb through the group to the active section", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="mcp" />);
    const crumbs = region(container, "breadcrumb");
    expect(crumbs.textContent).toContain("Settings");
    expect(crumbs.textContent).toContain("Workspace");
    expect(crumbs.querySelector('[data-slot="breadcrumb-page"]')!.textContent).toBe("MCP");
  });

  // Every region is mounted even when it has nothing to say. A region that
  // appears from nowhere cannot teach that it exists.
  it("keeps the callout and code regions mounted when the section fills neither", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="plans" />);
    expect(region(container, "info-callout").textContent).toContain("everyone in this workspace");
    expect(region(container, "code-block").textContent).toContain("nothing to copy");
  });

  it("prefers the active section's own callout over the fallback", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="general" />);
    const callout = region(container, "info-callout");
    expect(within(callout).getByRole("alert").textContent).toContain("follow you across workspaces");
  });

  // "Lovable settings is the reference implementation, including tier badges
  // and copy-ready configuration blocks."
  it("renders a copy-ready configuration block with a named copy control", () => {
    const { container } = render(<SettingsShell sections={SECTIONS} sectionId="mcp" />);
    const code = region(container, "code-block");
    expect(code.querySelector('[data-slot="settings-shell-code"]')!.textContent).toContain("mcpServers");
    // Named for what it copies, not "Copy" — and focusable, because it scrolls.
    expect(
      within(code).getByRole("button", { name: "Copy MCP server configuration" }),
    ).toBeInTheDocument();
    expect(code.querySelector('[data-slot="settings-shell-code"]')).toHaveAttribute("tabindex", "0");
  });

  // Day one: no sections at all. Both the nav column and the section column
  // fall to L1 independently rather than rendering an empty frame.
  it("falls to L1 in both the nav and the section column when there is nothing configured", () => {
    const { container } = render(<SettingsShell />);
    expect(region(container, "grouped-nav").querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(
      region(container, "setting-sections").querySelector('[data-slot="empty-state"]'),
    ).not.toBeNull();
    // Still five regions, still a usable search field.
    for (const name of REGIONS) expect(region(container, name)).not.toBeNull();
  });

  // The section column is the scroll container and, on day one, has no
  // focusable content of its own — axe scrollable-region-focusable.
  it("gives the scrolling content column a name and a tab stop", () => {
    render(<SettingsShell />);
    const content = document.querySelector('[data-slot="settings-shell-content"]')!;
    expect(content).toHaveAttribute("tabindex", "0");
    expect(content).toHaveAccessibleName("Settings content");
  });
});
