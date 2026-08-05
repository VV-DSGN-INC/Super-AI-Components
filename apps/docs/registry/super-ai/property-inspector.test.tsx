import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PropertyInspector, PropertyRow, type PropertySection } from "./property-inspector";
import { UnitInput } from "./field-row";

const textSections: PropertySection[] = [
  {
    id: "layout",
    label: "Layout",
    content: (
      <PropertyRow label="Width">{(id) => <UnitInput id={id} unit="px" defaultValue={320} readOnly />}</PropertyRow>
    ),
  },
  {
    id: "typography",
    label: "Typography",
    content: (
      <PropertyRow label="Size">{(id) => <UnitInput id={id} unit="pt" defaultValue={18} readOnly />}</PropertyRow>
    ),
  },
];

const imageSections: PropertySection[] = [
  {
    id: "layout",
    label: "Layout",
    content: (
      <PropertyRow label="Width">{(id) => <UnitInput id={id} unit="px" defaultValue={640} readOnly />}</PropertyRow>
    ),
  },
  {
    id: "adjustments",
    label: "Adjustments",
    content: (
      <PropertyRow label="Blur">{(id) => <UnitInput id={id} unit="px" defaultValue={0} readOnly />}</PropertyRow>
    ),
  },
];

const sections = { text: textSections, image: imageSections };

describe("PropertyInspector", () => {
  it("renders the per-element-type state: the element type picks the variant, no fork at the call site", () => {
    const { rerender } = render(<PropertyInspector elementType="text" selectionLabel="Heading" sections={sections} />);

    // Text: Layout + Typography.
    expect(screen.getByRole("button", { name: "Typography" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adjustments" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Heading");

    // Same component, same `sections` data, different type — Adjustments now,
    // Typography gone. The caller changed one string.
    rerender(<PropertyInspector elementType="image" selectionLabel="Hero image" sections={sections} />);
    expect(screen.getByRole("button", { name: "Adjustments" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Typography" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Hero image");
  });

  it("renders the grouped-sections state as collapsible groups over A6 rows", async () => {
    const user = userEvent.setup();
    render(<PropertyInspector elementType="text" sections={sections} />);

    const layout = screen.getByRole("button", { name: "Layout" });
    expect(layout).toHaveAttribute("aria-expanded", "true");
    // Rows are real A6 field-rows, not a restyled grid.
    expect(document.querySelectorAll('[data-slot="field-row"]')).toHaveLength(2);
    expect(screen.getByLabelText("Width")).toBeInTheDocument();

    await user.click(layout);
    expect(layout).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Width")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Size")).toBeInTheDocument();
  });

  it("remembers collapsed state per element type", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PropertyInspector elementType="text" sections={sections} />);

    await user.click(screen.getByRole("button", { name: "Layout" }));
    expect(screen.getByRole("button", { name: "Layout" })).toHaveAttribute("aria-expanded", "false");

    // An image's Layout is a different section instance and must stay open...
    rerender(<PropertyInspector elementType="image" sections={sections} />);
    expect(screen.getByRole("button", { name: "Layout" })).toHaveAttribute("aria-expanded", "true");

    // ...and coming back to text must restore the collapse, not reset it.
    rerender(<PropertyInspector elementType="text" sections={sections} />);
    expect(screen.getByRole("button", { name: "Layout" })).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the reset state at both scopes: group on the section header, row at the end of each A6 row", async () => {
    const user = userEvent.setup();
    const onResetGroup = vi.fn();
    const onResetRow = vi.fn();

    render(
      <PropertyInspector
        elementType="text"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              state: "modified",
              onReset: onResetGroup,
              content: (
                <PropertyRow label="Width" state="modified" onReset={onResetRow}>
                  {(id) => <UnitInput id={id} unit="px" defaultValue={480} readOnly />}
                </PropertyRow>
              ),
            },
          ],
        }}
      />,
    );

    // Group scope: A11 at scope="group", inside the section header.
    const groupReset = screen.getByRole("button", { name: "Reset Layout" });
    expect(groupReset).toHaveAttribute("data-slot", "reset-affordance");
    expect(groupReset).toHaveAttribute("data-state", "modified");
    expect(groupReset.closest('[data-slot="section-header"]')).not.toBeNull();

    // Row scope: A11 at the end of the A6 row, in field-row's own reset slot.
    const rowReset = screen.getByRole("button", { name: "Reset Width" });
    expect(rowReset.closest('[data-slot="field-row-reset"]')).not.toBeNull();
    expect(rowReset.closest('[data-slot="field-row"]')).not.toBeNull();

    // The two scopes are independent — clicking one never fires the other.
    await user.click(rowReset);
    expect(onResetRow).toHaveBeenCalledTimes(1);
    expect(onResetGroup).not.toHaveBeenCalled();

    await user.click(groupReset);
    expect(onResetGroup).toHaveBeenCalledTimes(1);
    expect(onResetRow).toHaveBeenCalledTimes(1);
  });

  it("keeps a row's reset mounted and disabled at default, so the row never reflows", () => {
    render(
      <PropertyInspector
        elementType="text"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              content: (
                <PropertyRow label="Width">{(id) => <UnitInput id={id} unit="px" defaultValue={320} readOnly />}</PropertyRow>
              ),
            },
          ],
        }}
      />,
    );

    const rowReset = screen.getByRole("button", { name: "Reset Width" });
    expect(rowReset).toBeDisabled();
    expect(rowReset).toHaveAttribute("data-state", "default");
  });

  it("keeps a collapsed group's modification visible without relying on colour alone", async () => {
    const user = userEvent.setup();
    render(
      <PropertyInspector
        elementType="text"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              state: "modified",
              onReset: vi.fn(),
              content: <PropertyRow label="Width">{(id) => <UnitInput id={id} unit="px" readOnly />}</PropertyRow>,
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Layout" }));

    const section = document.querySelector('[data-slot="property-inspector-section"]')!;
    expect(within(section as HTMLElement).getByText("Layout modified")).toBeInTheDocument();
    expect(section.querySelector('[data-slot="reset-affordance-dot"]')).toHaveAttribute("data-state", "modified");
  });

  it("renders the empty state as a useful default view, not a shrug", () => {
    render(
      <PropertyInspector
        emptyContent={
          <PropertyRow label="Canvas">{(id) => <UnitInput id={id} unit="px" defaultValue={1920} readOnly />}</PropertyRow>
        }
      />,
    );

    // The header's live status names the state exactly once...
    expect(screen.getByRole("status")).toHaveTextContent("Nothing selected");
    // ...and the body says what to do about it.
    expect(screen.getByText("Select an object on the canvas to edit its properties.")).toBeInTheDocument();
    // Canvas-level properties stay reachable with nothing selected.
    expect(screen.getByLabelText("Canvas")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="property-inspector-sections"]')).toBeNull();
  });

  it("lets a composed A6 row keep its own data-slot", () => {
    render(
      <PropertyInspector
        elementType="text"
        sections={{
          text: [
            {
              id: "layout",
              label: "Layout",
              content: <PropertyRow label="Width">{(id) => <UnitInput id={id} unit="px" readOnly />}</PropertyRow>,
            },
          ],
        }}
      />,
    );

    expect(document.querySelector('[data-slot="field-row"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="section-header"]')).not.toBeNull();
  });

  it("passes className through", () => {
    render(<PropertyInspector className="test-class" />);
    expect(document.querySelector('[data-slot="property-inspector"]')!.className).toContain("test-class");
  });
});
