import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppTopbar } from "./app-topbar";

describe("AppTopbar", () => {
  it("renders the document-context state leading with breadcrumb + privacy", () => {
    render(
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        breadcrumb={[
          { label: "Projects", href: "/projects" },
          { label: "Q3 Roadmap" },
        ]}
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
});
