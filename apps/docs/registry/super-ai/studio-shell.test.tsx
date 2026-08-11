import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StudioShell, type StudioShellProps } from "./studio-shell";

const REGIONS = ["modality-rail", "topbar", "tool-panel", "canvas", "inspector", "page-strip"];

const MODALITIES = [
  { id: "design", label: "Design", icon: <svg /> },
  { id: "draw", label: "Draw", icon: <svg /> },
];

const TOOL_PANELS: StudioShellProps["toolPanels"] = {
  design: {
    presets: {
      label: "Styles",
      items: [
        { id: "bold", label: "Bold editorial" },
        { id: "soft", label: "Soft pastel" },
      ],
    },
    results: {
      label: "Generated",
      items: [{ id: "r1", state: "done", label: "A quiet harbour at dawn" }],
    },
  },
  draw: {
    sections: [{ id: "brushes", title: "Brushes", items: [{ id: "ink", label: "Ink pen" }] }],
    drawing: {
      tools: [{ id: "brush", label: "Brush", icon: <svg /> }],
      activeToolId: "brush",
    },
  },
};

const FRAMES = [
  { id: "p1", label: "1. Title" },
  { id: "p2", label: "2. Problem" },
];

const INSPECTOR: StudioShellProps["inspector"] = {
  sections: {
    text: [{ id: "type", label: "Type", content: <p>Type rows</p> }],
  },
};

function renderShell(props: StudioShellProps = {}) {
  return render(
    <StudioShell
      modalities={MODALITIES}
      activeModalityId="design"
      toolPanels={TOOL_PANELS}
      frames={FRAMES}
      activeFrameId="p1"
      inspector={INSPECTOR}
      {...props}
    />,
  );
}

describe("StudioShell", () => {
  // Six, not five. The topbar was missing from the spec's own `Regions:` line
  // until the 2026-08-08 wireframe reconciliation — the wireframe drew it and
  // `Filled by:` had always named B7.
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<StudioShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<StudioShell className="test-class" />);
    expect(document.querySelector('[data-slot="studio-shell"]')!.className).toContain("test-class");
  });

  // ---- composition, per composed component ------------------------------

  it("composes B4 for the rail rather than rendering its own buttons", () => {
    const { container } = renderShell();
    const rail = container.querySelector('[data-region="modality-rail"]')!;
    expect(rail.getAttribute("data-slot")).toBe("modality-rail");
    expect(rail.querySelectorAll('[data-slot="modality-rail-item"]')).toHaveLength(2);
  });

  it("selects a modality through B4's own control", async () => {
    const onModalityChange = vi.fn();
    renderShell({ onModalityChange });
    await userEvent.click(screen.getByRole("button", { name: "Draw" }));
    expect(onModalityChange).toHaveBeenCalledWith("draw");
  });

  // B7 in `editor` context: a studio is where you change a document, not where
  // you navigate to one, so the topbar leads with zoom and history.
  it("composes B7 in editor context", () => {
    const { container } = renderShell({ title: "Launch deck" });
    const topbar = container.querySelector('[data-region="topbar"]')!;
    expect(topbar.getAttribute("data-slot")).toBe("app-topbar");
    expect(topbar.querySelector('[data-slot="app-topbar-zoom"]')).not.toBeNull();
    expect(topbar.querySelector('[data-slot="app-topbar-history"]')).not.toBeNull();
    expect(within(topbar as HTMLElement).getByText("Launch deck")).toBeVisible();
  });

  it("composes I1 for the tool panel, with E4 and F1 as its sections", () => {
    const { container } = renderShell();
    const panel = container.querySelector('[data-region="tool-panel"]')!;
    expect(panel.querySelector('[data-slot="tool-panel"]')).not.toBeNull();
    // E4 keeps its own radiogroup semantics — flattening presets into I1's own
    // insert-style tiles would throw away exactly that.
    expect(panel.querySelector('[data-slot="preset-grid"]')).not.toBeNull();
    expect(within(panel as HTMLElement).getByRole("radio", { name: /Bold editorial/ })).toBeInTheDocument();
    expect(panel.querySelector('[data-slot="result-card"]')).not.toBeNull();
  });

  it("composes I5 inside the tool panel, outside its scroll region", () => {
    const { container } = renderShell({ activeModalityId: "draw" });
    const panel = container.querySelector('[data-region="tool-panel"]')!;
    const drawing = panel.querySelector('[data-slot="drawing-tools"]')!;
    expect(drawing).not.toBeNull();
    // A brush you have to scroll back to is not a brush: I5 is a sibling of
    // I1's scrolling body, never a child of it.
    expect(drawing.closest('[data-slot="tool-panel-sections"]')).toBeNull();
  });

  it("composes H5 for the page strip", () => {
    const { container } = renderShell();
    const strip = container.querySelector('[data-region="page-strip"]')!;
    expect(strip.querySelector('[data-slot="frame-strip"]')).not.toBeNull();
    expect(strip.querySelectorAll('[data-slot="frame-strip-item"]')).toHaveLength(2);
    expect(screen.getByRole("button", { name: "1. Title" })).toHaveAttribute("aria-current", "true");
  });

  it("selects a page through H5's own frame control", async () => {
    const onFrameChange = vi.fn();
    renderShell({ onFrameChange });
    await userEvent.click(screen.getByRole("button", { name: "2. Problem" }));
    expect(onFrameChange).toHaveBeenCalledWith("p2");
  });

  it("composes I2 for the inspector", () => {
    const { container } = renderShell({ selection: { type: "text", label: "Heading" } });
    const inspector = container.querySelector('[data-region="inspector"]')!;
    expect(inspector.querySelector('[data-slot="property-inspector"]')).not.toBeNull();
    expect(inspector.querySelector('[data-slot="property-inspector-section"]')).not.toBeNull();
    expect(screen.getByText("Type rows")).toBeVisible();
  });

  // ---- the spec's load-bearing sentences ---------------------------------

  // "The rail selects which tool panel is shown. It never changes the canvas —
  // that separation is what keeps the shell legible." Enforced by the data
  // model: `toolPanels` is keyed by modality, the canvas is one `children`.
  it("swaps the tool panel on rail selection and leaves the canvas untouched", () => {
    const canvas = <p>Artboard</p>;
    const { container, rerender } = render(
      <StudioShell modalities={MODALITIES} activeModalityId="design" toolPanels={TOOL_PANELS}>
        {canvas}
      </StudioShell>,
    );
    const panel = () => container.querySelector('[data-region="tool-panel"]')!;
    const canvasHtml = container.querySelector('[data-region="canvas"]')!.innerHTML;
    expect(panel().querySelector('[data-slot="preset-grid"]')).not.toBeNull();

    rerender(
      <StudioShell modalities={MODALITIES} activeModalityId="draw" toolPanels={TOOL_PANELS}>
        {canvas}
      </StudioShell>,
    );
    expect(panel().querySelector('[data-slot="preset-grid"]')).toBeNull();
    expect(panel().querySelector('[data-slot="drawing-tools"]')).not.toBeNull();
    expect(container.querySelector('[data-region="canvas"]')!.innerHTML).toBe(canvasHtml);
  });

  // The rail and the panel it drives are linked by name, not only by position.
  it("names the tool panel after the active modality", () => {
    renderShell();
    expect(screen.getByRole("group", { name: "Design tools" })).toBeInTheDocument();
  });

  // "The inspector is selection-driven and must ship an empty state, because
  // 'nothing selected' is the most common state." That is the default render.
  it("falls to I2's own empty state with nothing selected", () => {
    const { container } = renderShell();
    const inspector = container.querySelector('[data-region="inspector"]')!;
    expect(inspector.querySelector('[data-slot="property-inspector-empty"]')).not.toBeNull();
    expect(inspector.querySelector('[data-slot="property-inspector-section"]')).toBeNull();
  });

  // One selection object, two consumers: I3 only exists while something is
  // selected, and I2 switches variant off the same value.
  it("shows I3 only while something is selected, and drives I2 from the same selection", () => {
    const { container, rerender } = render(<StudioShell inspector={INSPECTOR} />);
    expect(container.querySelector('[data-slot="context-toolbar"]')).toBeNull();

    rerender(<StudioShell inspector={INSPECTOR} selection={{ type: "text", label: "Heading" }} />);
    const toolbar = container.querySelector('[data-slot="context-toolbar"]')!;
    expect(toolbar).toHaveAttribute("data-selection", "text");
    expect(toolbar.closest('[data-region="canvas"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="property-inspector"]')).toHaveAttribute(
      "data-element-type",
      "text",
    );
  });

  // I3 owns the AI entry at index 0 and the eight-action cap; the shell only
  // forwards actions to it.
  it("routes canvas actions through I3's own controls", async () => {
    const onAction = vi.fn();
    render(
      <StudioShell
        selection={{ type: "image", label: "Photo" }}
        toolbar={{ actions: [{ id: "crop", label: "Crop" }], onAction }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(onAction).toHaveBeenCalledWith("crop");
  });

  // The canvas is a scroll container with no controls of its own when empty, so
  // it carries the tab stop and the name itself (axe scrollable-region-focusable).
  it("gives the scrolling canvas a name and a tab stop", () => {
    const { container } = renderShell({ canvasLabel: "Artboard" });
    const surface = container.querySelector('[data-slot="studio-shell-canvas-surface"]')!;
    expect(surface).toHaveAttribute("tabindex", "0");
    expect(surface).toHaveAccessibleName("Artboard");
  });

  // Day one: nothing chosen, nothing drawn, nothing added. Every region still
  // mounts and each shows an empty affordance rather than disappearing.
  it("mounts every region on day one and falls to an empty affordance in each", () => {
    const { container } = render(<StudioShell />);
    for (const region of REGIONS) {
      expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
    const panel = container.querySelector('[data-region="tool-panel"]')!;
    const canvas = container.querySelector('[data-region="canvas"]')!;
    const strip = container.querySelector('[data-region="page-strip"]')!;
    const inspector = container.querySelector('[data-region="inspector"]')!;
    expect(panel.querySelector('[data-slot="tool-panel-empty"]')).not.toBeNull();
    expect(canvas.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(strip.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(inspector.querySelector('[data-slot="property-inspector-empty"]')).not.toBeNull();
  });

  // H5's own add tile is the page strip's empty affordance — L1 only stands in
  // when there is nothing to show *and* no way to make one.
  it("prefers H5's add tile to L1 when a page can be added", () => {
    const { container } = render(<StudioShell onAddFrame={() => {}} />);
    const strip = container.querySelector('[data-region="page-strip"]')!;
    expect(strip.querySelector('[data-slot="frame-strip-add"]')).not.toBeNull();
    expect(strip.querySelector('[data-slot="empty-state"]')).toBeNull();
  });

  it("drops the canvas empty state as soon as there is something on it", () => {
    const { container } = renderShell({ children: <p>Artboard</p> });
    const canvas = container.querySelector('[data-region="canvas"]')!;
    expect(canvas.querySelector('[data-slot="empty-state"]')).toBeNull();
    expect(screen.getByText("Artboard")).toBeVisible();
  });
});
