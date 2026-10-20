import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppTopbar } from "./app-topbar";

const DEEP_PATH = [
  { label: "Projects", href: "/projects" },
  { label: "Marketing", href: "/projects/marketing" },
  { label: "Campaigns" },
  { label: "Q3 planning", href: "/projects/marketing/q3" },
  { label: "Q3 Roadmap" },
];

describe("AppTopbar", () => {
  it("renders the document-context state leading with breadcrumb + privacy", () => {
    render(
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        breadcrumb={[{ label: "Projects", href: "/projects" }, { label: "Q3 Roadmap" }]}
        privacy={{ label: "Private" }}
      />,
    );
    // One component, two configurations: this is the same AppTopbar as editor-context.
    expect(document.querySelector('[data-slot="app-topbar"]')).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText("Q3 Roadmap")).toBeInTheDocument();
    // Document context does not lead with zoom/history — that's editor context.
    expect(screen.queryByRole("button", { name: /zoom in/i })).not.toBeInTheDocument();
  });

  it("renders the editor-context state leading with zoom + history", () => {
    render(
      <AppTopbar
        context="editor"
        title="Untitled scene"
        zoomLabel="100%"
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(document.querySelector('[data-slot="app-topbar"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /redo/i })).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    // Editor context does not lead with a breadcrumb — that's document context.
    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).not.toBeInTheDocument();
  });

  it("renders the privacy-chip state as icon + readable text, not colour alone", () => {
    render(
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        privacy={{ label: "Team", icon: <svg data-testid="privacy-icon" /> }}
      />,
    );
    const chip = document.querySelector('[data-slot="app-topbar-privacy"]')!;
    expect(chip).toHaveTextContent("Team");
    expect(chip.querySelector('[data-testid="privacy-icon"]')).toBeInTheDocument();
  });

  it("renders the saved-state state as text, not an icon-only indicator", () => {
    render(<AppTopbar context="document" title="Q3 Roadmap" savedLabel="Last saved 5 days ago" />);
    const saved = document.querySelector('[data-slot="app-topbar-saved"]')!;
    expect(saved).toHaveTextContent("Last saved 5 days ago");
    // A cloud glyph only raises the question this text answers — no icon here.
    expect(saved.querySelector("svg")).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<AppTopbar context="document" title="Q3 Roadmap" className="test-class" />);
    expect(document.querySelector('[data-slot="app-topbar"]')!.className).toContain("test-class");
  });

  it("keeps a deep path's middle crumbs reachable through an overflow menu between the first and current crumb", async () => {
    render(<AppTopbar context="document" title="Q3 Roadmap" breadcrumb={DEEP_PATH} />);

    // Both forms of the path are in the DOM and a container query on the bar
    // picks one. jsdom runs no CSS, so this sees both: the inline middle
    // crumbs with their hrefs, and the ellipsis button that replaces them
    // below 28rem of bar width.
    expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute("href", "/projects/marketing");
    const more = screen.getByRole("button", { name: "Show hidden path" });
    expect(more).toHaveAttribute("aria-haspopup", "menu");
    expect(more).toBe(document.querySelector('[data-slot="app-topbar-breadcrumb-overflow"]'));

    // It sits in the list between the first crumb and the first hidden one,
    // so the collapsed path reads first, ellipsis, current.
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items[0]).toContainElement(screen.getByRole("link", { name: "Projects" }));
    expect(items[1]).toContainElement(more);
    expect(items[2]).toContainElement(screen.getByRole("link", { name: "Marketing" }));
    expect(items[items.length - 1]).toContainElement(screen.getByRole("link", { name: "Q3 Roadmap" }));

    // The menu lists exactly the hidden crumbs, in path order: a link row
    // for a crumb with an href, a disabled row for one without. The first
    // and current crumbs are not repeated.
    await userEvent.click(more);
    const menu = await screen.findByRole("menu");
    expect(menu).toBe(document.querySelector('[data-slot="app-topbar-breadcrumb-overflow-menu"]'));
    const rows = within(menu).getAllByRole("menuitem");
    expect(rows.map((row) => row.textContent)).toEqual(["Marketing", "Campaigns", "Q3 planning"]);
    expect(rows[0]).toHaveAttribute("href", "/projects/marketing");
    expect(rows[1]).not.toHaveAttribute("href");
    expect(rows[1]).toHaveAttribute("aria-disabled", "true");
    expect(rows[2]).toHaveAttribute("href", "/projects/marketing/q3");
  });

  it("renders no overflow menu when the path has no middle to hide", () => {
    const { rerender } = render(
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        breadcrumb={[{ label: "Projects", href: "/projects" }, { label: "Q3 Roadmap" }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Show hidden path" })).not.toBeInTheDocument();

    rerender(<AppTopbar context="document" title="Q3 Roadmap" breadcrumb={[{ label: "Q3 Roadmap" }]} />);
    expect(screen.queryByRole("button", { name: "Show hidden path" })).not.toBeInTheDocument();
  });
});
