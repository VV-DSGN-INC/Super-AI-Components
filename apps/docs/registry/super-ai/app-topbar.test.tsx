import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppTopbar } from "./app-topbar";

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

  it("renders the private-session state: an element passed to privacy renders as given", () => {
    // A stand-in for N15's PrivateSessionChip: B7 imports no sibling, so its
    // own test does not either. The story renders the real chip.
    render(
      <AppTopbar
        context="document"
        title="Q3 Roadmap"
        privacy={
          <span data-slot="private-session-chip" data-state="active">
            Private session
          </span>
        }
      />,
    );
    const leading = document.querySelector('[data-slot="app-topbar-leading"]')!;
    expect(leading.querySelector('[data-slot="private-session-chip"]')).toHaveTextContent("Private session");
    // The element replaces B7's own chip rather than nesting inside it.
    expect(document.querySelector('[data-slot="app-topbar-privacy"]')).toBeNull();
  });

  it("lets two chips share the slot as a fragment", () => {
    render(
      <AppTopbar
        context="editor"
        title="Standup notes"
        privacy={
          <>
            <span data-slot="private-session-chip">Private session</span>
            <span data-slot="capture-consent">Recording</span>
          </>
        }
      />,
    );
    const leading = document.querySelector('[data-slot="app-topbar-leading"]')!;
    expect(leading.querySelector('[data-slot="private-session-chip"]')).toBeInTheDocument();
    expect(leading.querySelector('[data-slot="capture-consent"]')).toBeInTheDocument();
  });
});
