import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DocsShell } from "./docs-shell";

const REGIONS = ["icon-rail", "doc-nav", "announcement-strip", "content-column"];

const AREAS = [
  { id: "platform", label: "Platform" },
  { id: "images", label: "Images" },
];

const NAV_SECTIONS = [
  {
    label: "Get started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "auth", label: "Authentication" },
    ],
  },
];

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    body: "Every request is a POST with a JSON body.",
  },
];

describe("DocsShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<DocsShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<DocsShell className="test-class" />);
    expect(document.querySelector('[data-slot="docs-shell"]')!.className).toContain("test-class");
  });

  // "Sectioned nav with a persistent icon rail." B1 is composed in its declared
  // `icon-rail` state, not its expanded one — the rail is a permanent 3rem
  // column, which is a different thing from a sidebar that happens to be shut.
  it("composes B1 in its icon-rail configuration", () => {
    const { container } = render(<DocsShell areas={AREAS} />);
    const rail = container.querySelector('[data-region="icon-rail"]')!;
    expect(rail.querySelector('[data-slot="app-sidebar"]')).not.toBeNull();
    const sidebar = rail.querySelector('[data-slot="sidebar"]')!;
    expect(sidebar).toHaveAttribute("data-collapsible", "icon");
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });

  // "The rail switches product area; the nav switches page within it." Two
  // jobs, two landmarks, two names — a screen-reader user has to be able to
  // tell them apart as easily as a sighted one.
  it("names the rail and the nav as two separate navigations", () => {
    render(<DocsShell areas={AREAS} navSections={NAV_SECTIONS} />);
    expect(screen.getByRole("navigation", { name: "Product areas" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeInTheDocument();
  });

  // The failure mode this block exists to prevent: one navigation concept doing
  // both jobs. Area rows may only live in the rail, page rows only in the nav.
  it("keeps area rows out of the nav and page rows out of the rail", () => {
    const { container } = render(
      <DocsShell areas={AREAS} activeAreaId="platform" navSections={NAV_SECTIONS} />,
    );
    const rail = container.querySelector('[data-region="icon-rail"]')!;
    const nav = container.querySelector('[data-region="doc-nav"]')!;
    expect(rail.querySelectorAll("[data-area-id]")).toHaveLength(2);
    expect(rail.querySelectorAll('[data-slot="sidebar-nav-item"]')).toHaveLength(0);
    expect(nav.querySelectorAll("[data-area-id]")).toHaveLength(0);
    expect(nav.querySelectorAll('[data-slot="sidebar-nav-item"]')).toHaveLength(2);
  });

  it("routes area selection and page selection to different callbacks", async () => {
    const onSelectArea = vi.fn();
    const onSelectPage = vi.fn();
    render(
      <DocsShell
        areas={AREAS}
        navSections={NAV_SECTIONS}
        onSelectArea={onSelectArea}
        onSelectPage={onSelectPage}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Images" }));
    expect(onSelectArea).toHaveBeenCalledWith("images");
    expect(onSelectPage).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Authentication" }));
    expect(onSelectPage).toHaveBeenCalledWith("auth");
    expect(onSelectArea).toHaveBeenCalledTimes(1);
  });

  // Never colour alone: both the current area and the current page carry a
  // programmatic state as well as a filled surface.
  it("marks the current area and the current page programmatically", () => {
    render(
      <DocsShell
        areas={AREAS}
        activeAreaId="platform"
        navSections={NAV_SECTIONS}
        activePageId="quickstart"
      />,
    );
    expect(screen.getByRole("button", { name: "Platform" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Images" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Quickstart" })).toHaveAttribute("aria-current", "page");
  });

  it("composes B3 rows rather than rendering its own", () => {
    const { container } = render(<DocsShell navSections={NAV_SECTIONS} activePageId="auth" />);
    const nav = container.querySelector('[data-region="doc-nav"]')!;
    expect(nav.querySelector('[data-slot="sidebar-nav"]')).not.toBeNull();
    expect(nav.querySelectorAll('[data-slot="sidebar-nav-item"]')).toHaveLength(2);
  });

  // "The announcement strip is L3 in its dismissible-chip form, pinned above
  // the content." Both halves are load-bearing: the level is fixed, and the
  // strip is above the column rather than floating over it.
  it("renders announcements as L3 dismissible chips above the content column", () => {
    const { container } = render(
      <DocsShell announcements={[{ id: "streaming", title: "Streaming responses", stage: "Beta" }]} />,
    );
    const strip = container.querySelector('[data-region="announcement-strip"]')!;
    const chip = strip.querySelector('[data-slot="feature-announcement"]')!;
    expect(chip).toHaveAttribute("data-level", "dismissible-chip");
    expect(chip).toHaveAttribute("data-announcement-id", "streaming");

    const content = container.querySelector('[data-region="content-column"]')!;
    // DOCUMENT_POSITION_FOLLOWING — the content column comes after the strip.
    expect(strip.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("dismisses through L3's own control and reports the announcement id", async () => {
    const onDismissAnnouncement = vi.fn();
    render(
      <DocsShell
        announcements={[{ id: "streaming", title: "Streaming responses" }]}
        onDismissAnnouncement={onDismissAnnouncement}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Dismiss announcement: Streaming responses" }));
    expect(onDismissAnnouncement).toHaveBeenCalledWith("streaming");
  });

  it("drops an announcement the host has already recorded as dismissed", () => {
    const { container } = render(
      <DocsShell announcements={[{ id: "streaming", title: "Streaming responses", dismissed: true }]} />,
    );
    const strip = container.querySelector('[data-region="announcement-strip"]')!;
    expect(strip.querySelector('[data-slot="feature-announcement"]')).toBeNull();
  });

  // "The content column is measured for reading, not stretched to viewport
  // width — the one place a max-width is non-negotiable." A class assertion is
  // normally the wrong instinct; here the measure *is* the requirement, and the
  // only thing that can catch its removal in jsdom.
  it("measures the content column instead of stretching it", () => {
    const { container } = render(<DocsShell />);
    const article = container.querySelector('[data-slot="docs-shell-article"]')!;
    expect(article.className).toContain("max-w-[68ch]");
    // On the article, not on the scroll container: the column still fills the
    // pane so the scrollbar stays at the pane edge.
    expect(container.querySelector('[data-region="content-column"]')!.className).not.toContain("max-w-");
  });

  it("gives the scrolling content column a name and a tab stop", () => {
    const { container } = render(<DocsShell title="Authentication" />);
    const content = container.querySelector('[data-region="content-column"]')!;
    expect(content).toHaveAttribute("tabindex", "0");
    expect(content).toHaveAccessibleName("Authentication");
  });

  it("renders sections through A12 as level-2 headings", () => {
    render(<DocsShell title="API reference" sections={SECTIONS} />);
    expect(screen.getByRole("heading", { level: 1, name: "API reference" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("Every request is a POST with a JSON body.")).toBeVisible();
  });

  it("renders section citations as K6 markers, including a broken one", () => {
    render(
      <DocsShell
        sections={[
          {
            id: "overview",
            title: "Overview",
            body: "Rate limits are per key.",
            citations: [
              { id: "c1", label: "1", source: "Rate limits", quote: "60 requests per minute." },
              { id: "c2", label: "2", state: "unresolved" as const },
            ],
          },
        ]}
      />,
    );
    expect(document.querySelectorAll('[data-slot="citation-ref"]')).toHaveLength(2);
    // An unresolved citation still renders and still says it is broken —
    // silently dropping it is how a document stops being verifiable.
    expect(screen.getByRole("button", { name: /source unavailable/i })).toBeInTheDocument();
  });

  // Day one: the nav and the content column are independently empty-able, and
  // both fall to L1. The strip has no L1 form, so it collapses instead.
  it("falls to L1 in both the nav and the content column on day one", () => {
    const { container } = render(<DocsShell />);
    const nav = container.querySelector('[data-region="doc-nav"]')!;
    const content = container.querySelector('[data-region="content-column"]')!;
    expect(nav.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(content.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it("drops the content empty state as soon as the page has a section", () => {
    const { container } = render(<DocsShell sections={SECTIONS} />);
    const content = container.querySelector('[data-region="content-column"]')!;
    expect(content.querySelector('[data-slot="empty-state"]')).toBeNull();
  });

  // The rail toggle is a real binding in the vendored sidebar (⌘/Ctrl+B). A1
  // is how the shell says so — and the trigger keeps its own visible name, so
  // the keycaps are a hint rather than the control.
  it("advertises the rail shortcut with A1 keycaps beside a real trigger", () => {
    const { container } = render(<DocsShell railShortcut={["Ctrl", "B"]} />);
    const nav = container.querySelector('[data-region="doc-nav"]')!;
    expect(nav.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
    expect(within(nav as HTMLElement).getByRole("button", { name: "Toggle Sidebar" })).toBeVisible();
  });

  it("titles the content column with the page title", () => {
    const { container } = render(<DocsShell title="Webhooks" lede="Receive events as they happen." />);
    const content = container.querySelector('[data-region="content-column"]')!;
    expect(within(content as HTMLElement).getByText("Webhooks")).toBeVisible();
    expect(within(content as HTMLElement).getByText("Receive events as they happen.")).toBeVisible();
  });
});
