import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DrawingTools, type DrawingSwatch, type DrawingToolOption } from "./drawing-tools";

const Icon = () => <svg aria-hidden="true" />;

const TOOLS: DrawingToolOption[] = [
  { id: "select", label: "Select", icon: <Icon /> },
  {
    id: "pencil",
    label: "Pencil",
    icon: <Icon />,
    variants: [
      { id: "pencil-soft", label: "Soft pencil", icon: <Icon /> },
      { id: "pencil-marker", label: "Marker", icon: <Icon /> },
    ],
  },
  { id: "eraser", label: "Eraser", icon: <Icon /> },
];

const SHAPES: DrawingToolOption[] = [
  { id: "rectangle", label: "Rectangle", icon: <Icon /> },
  {
    id: "line",
    label: "Line",
    icon: <Icon />,
    variants: [{ id: "line-arrow", label: "Arrow", icon: <Icon /> }],
  },
];

const SWATCHES: DrawingSwatch[] = [
  { id: "ink", name: "Ink", value: "rgb(20, 20, 24)" },
  { id: "coral", name: "Coral", value: "rgb(255, 122, 89)" },
];

const BRUSH = { size: 24, hardness: 60, opacity: 100 };

describe("DrawingTools", () => {
  it("renders the tool-rail state", () => {
    const { container } = render(<DrawingTools tools={TOOLS} activeToolId="pencil" />);

    const rail = screen.getByRole("group", { name: "Tool" });
    expect(rail).toHaveAttribute("data-slot", "drawing-tools-tool-rail");

    // Icon-only buttons still carry real accessible names — the icons are
    // aria-hidden and the name ships as (visually hidden) button content.
    expect(within(rail).getByRole("button", { name: "Select" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Pencil" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(rail).getByRole("button", { name: "Eraser" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(container.querySelectorAll('[data-slot="drawing-tools-tool"]')).toHaveLength(3);
  });

  it("renders the shape-rail state", async () => {
    const onToolChange = vi.fn();
    const onShapeChange = vi.fn();
    render(
      <DrawingTools
        tools={TOOLS}
        activeToolId="select"
        onToolChange={onToolChange}
        shapes={SHAPES}
        activeShapeId="rectangle"
        onShapeChange={onShapeChange}
      />,
    );

    const shapeRail = screen.getByRole("group", { name: "Shape" });
    expect(shapeRail).toHaveAttribute("data-slot", "drawing-tools-shape-rail");
    expect(within(shapeRail).getByRole("button", { name: "Rectangle" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // The two rails are separate axes: choosing a shape never reports a tool.
    await userEvent.click(within(shapeRail).getByRole("button", { name: "Line" }));
    expect(onShapeChange).toHaveBeenCalledWith("line");
    expect(onToolChange).not.toHaveBeenCalled();
  });

  it("renders the brush-controls state", () => {
    const onBrushChange = vi.fn();
    const { container } = render(
      <DrawingTools tools={TOOLS} brush={BRUSH} onBrushChange={onBrushChange} />,
    );

    const brush = container.querySelector('[data-slot="drawing-tools-brush"]') as HTMLElement;
    expect(within(brush).getByText("Size")).toBeInTheDocument();
    expect(within(brush).getByText("Hardness")).toBeInTheDocument();
    expect(within(brush).getByText("Opacity")).toBeInTheDocument();

    // Each control reports the whole brush, so a caller holds one object.
    fireEvent.change(screen.getByRole("spinbutton", { name: "Size value" }), {
      target: { value: "48" },
    });
    expect(onBrushChange).toHaveBeenCalledWith({ size: 48, hardness: 60, opacity: 100 });
  });

  it("renders the swatch-grid state", async () => {
    const onSwatchChange = vi.fn();
    render(
      <DrawingTools
        tools={TOOLS}
        swatches={SWATCHES}
        activeSwatchId="coral"
        onSwatchChange={onSwatchChange}
      />,
    );

    const grid = screen.getByRole("group", { name: "Colour" });
    expect(grid).toHaveAttribute("data-slot", "drawing-tools-swatch-grid");

    // A swatch is named, never identified by its fill alone, and its selected
    // state is programmatic rather than a ring you have to see.
    expect(within(grid).getByRole("button", { name: "Coral" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(grid).getByRole("button", { name: "Ink" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await userEvent.click(within(grid).getByRole("button", { name: "Ink" }));
    expect(onSwatchChange).toHaveBeenCalledWith("ink");
  });

  it("renders the mask-mode state", () => {
    const { container } = render(
      <DrawingTools
        tools={TOOLS}
        brush={BRUSH}
        swatches={SWATCHES}
        mode="mask"
        maskCoverage={18}
        maskTargetLabel="Inpaint"
      />,
    );

    expect(container.querySelector('[data-slot="drawing-tools"]')).toHaveAttribute(
      "data-mode",
      "mask",
    );
    expect(container.querySelector('[data-slot="drawing-tools-mask"]')).toBeInTheDocument();

    // The point of mask mode: it names what the mask is input to.
    expect(screen.getByText(/Masked region feeds Inpaint/)).toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Mask covers 18% of the canvas");
    expect(status).toHaveTextContent("Inpaint regenerates only that region");
  });

  it("passes className through", () => {
    render(<DrawingTools tools={TOOLS} className="test-class" />);
    expect(document.querySelector('[data-slot="drawing-tools"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (spec I5)
  // ---------------------------------------------------------------------------

  it("switches tool in exactly one click, for every tool on the rail", async () => {
    const onToolChange = vi.fn();
    render(<DrawingTools tools={TOOLS} activeToolId="select" onToolChange={onToolChange} />);

    const rail = screen.getByRole("group", { name: "Tool" });
    for (const [index, name] of ["Pencil", "Eraser"].entries()) {
      await userEvent.click(within(rail).getByRole("button", { name }));
      // One click, one commit — no menu opened on the way.
      expect(onToolChange).toHaveBeenCalledTimes(index + 1);
    }
    expect(onToolChange.mock.calls.map(([id]) => id)).toEqual(["pencil", "eraser"]);
  });

  it("hangs the flyout off a sibling trigger rather than nesting it in the tool button", async () => {
    const { container } = render(<DrawingTools tools={TOOLS} activeToolId="select" />);

    const trigger = screen.getByRole("button", { name: "Show Pencil alternates" });
    // No nested interactive: the trigger is beside the tool button, not inside it.
    expect(trigger.closest('[data-slot="drawing-tools-tool"]')).toBeNull();
    container.querySelectorAll('[data-slot="drawing-tools-tool"]').forEach((tool) => {
      expect(tool.querySelector("button")).toBeNull();
    });

    // Tools without alternates get no trigger at all — the affordance means
    // "there is something else here", so it cannot be decoration.
    expect(screen.queryByRole("button", { name: "Show Eraser alternates" })).toBeNull();

    await userEvent.click(trigger);
    const flyout = await screen.findByRole("group", { name: "Pencil alternates" });
    // A flyout, not a nested menu: nothing inside it opens a further level.
    expect(flyout.querySelector('[data-slot="drawing-tools-flyout-trigger"]')).toBeNull();
    expect(within(flyout).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Soft pencil",
      "Marker",
    ]);
  });

  it("makes the rail button become the chosen alternate, so returning to it is one click", async () => {
    const onToolChange = vi.fn();
    const { rerender } = render(
      <DrawingTools tools={TOOLS} activeToolId="select" onToolChange={onToolChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Show Pencil alternates" }));
    const flyout = await screen.findByRole("group", { name: "Pencil alternates" });
    await userEvent.click(within(flyout).getByRole("button", { name: "Marker" }));
    expect(onToolChange).toHaveBeenCalledWith("pencil-marker");

    rerender(
      <DrawingTools tools={TOOLS} activeToolId="pencil-marker" onToolChange={onToolChange} />,
    );

    // The rail slot is now Marker — pressed, named, and one click away. Nobody
    // has to walk the flyout again to get back to the tool they were using.
    const rail = screen.getByRole("group", { name: "Tool" });
    const marker = within(rail).getByRole("button", { name: "Marker" });
    expect(marker).toHaveAttribute("aria-pressed", "true");
    expect(within(rail).queryByRole("button", { name: "Pencil" })).toBeNull();

    // Away to another tool and back: the slot still reads Marker, and one click
    // on it commits Marker — the flyout is never re-entered.
    onToolChange.mockClear();
    await userEvent.click(within(rail).getByRole("button", { name: "Select" }));
    expect(onToolChange).toHaveBeenCalledWith("select");
    rerender(<DrawingTools tools={TOOLS} activeToolId="select" onToolChange={onToolChange} />);

    const back = within(screen.getByRole("group", { name: "Tool" })).getByRole("button", {
      name: "Marker",
    });
    expect(back).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(back);
    expect(onToolChange).toHaveBeenLastCalledWith("pencil-marker");
  });

  it("builds size, hardness and opacity as A6 field-row instances", () => {
    const { container } = render(<DrawingTools tools={TOOLS} brush={BRUSH} />);
    const brush = container.querySelector('[data-slot="drawing-tools-brush"]')!;

    // The spec's reason for this: the brush and the property inspector share
    // one grid. If these stop being field-rows, they have stopped sharing it.
    expect(brush.querySelectorAll('[data-slot="field-row"]')).toHaveLength(3);
    expect(
      [...brush.querySelectorAll('[data-slot="field-row-label"]')].map((n) => n.textContent),
    ).toEqual(["Size", "Hardness", "Opacity"]);
    expect(screen.getByRole("spinbutton", { name: "Hardness value" })).toHaveValue(60);
  });

  it("stands the swatch grid down in mask mode and keeps the brush", () => {
    const { container, rerender } = render(
      <DrawingTools tools={TOOLS} brush={BRUSH} swatches={SWATCHES} activeSwatchId="ink" />,
    );
    expect(screen.getByRole("group", { name: "Colour" })).toBeInTheDocument();

    rerender(
      <DrawingTools
        tools={TOOLS}
        brush={BRUSH}
        swatches={SWATCHES}
        activeSwatchId="ink"
        mode="mask"
      />,
    );
    // A mask is a region, not a stroke — colour has nothing to mean here.
    expect(screen.queryByRole("group", { name: "Colour" })).toBeNull();
    // The brush is still how you paint the region, so it stays.
    expect(container.querySelector('[data-slot="drawing-tools-brush"]')).toBeInTheDocument();
  });

  it("tells the reader that brushing is what produces the inpaint input", () => {
    render(<DrawingTools tools={TOOLS} mode="mask" maskTargetLabel="Inpaint" />);
    // Nothing brushed yet: the empty state is instruction, not a blank panel.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Brush a region — that region is the input Inpaint receives.",
    );
  });

  it("offers the draw/mask switch only when a caller can receive the change", async () => {
    const { unmount } = render(<DrawingTools tools={TOOLS} mode="draw" />);
    expect(screen.queryByRole("group", { name: "Canvas mode" })).toBeNull();
    unmount();

    const onModeChange = vi.fn();
    render(<DrawingTools tools={TOOLS} mode="draw" onModeChange={onModeChange} />);
    const modes = screen.getByRole("group", { name: "Canvas mode" });
    await userEvent.click(within(modes).getByRole("button", { name: "Mask" }));
    expect(onModeChange).toHaveBeenCalledWith("mask");
  });

  it("never lets a rail land on no tool at all", async () => {
    const onToolChange = vi.fn();
    render(<DrawingTools tools={TOOLS} activeToolId="eraser" onToolChange={onToolChange} />);

    // Base UI's toggle group reports an empty array when the active item is
    // pressed again. A canvas always has a tool, so that commit is dropped.
    await userEvent.click(screen.getByRole("button", { name: "Eraser" }));
    expect(onToolChange).not.toHaveBeenCalled();
  });

  it("clears the mask through a real control rather than a gesture nobody can find", async () => {
    const onClearMask = vi.fn();
    render(<DrawingTools tools={TOOLS} mode="mask" maskCoverage={40} onClearMask={onClearMask} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear mask" }));
    expect(onClearMask).toHaveBeenCalledTimes(1);
  });
});
