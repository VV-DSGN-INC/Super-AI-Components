import { Bold, Crop, Italic, Link2, Palette, Scissors, Trash2, Type, Volume2, Wand2 } from "lucide-react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContextToolbar, MAX_TOOLBAR_ACTIONS, type ContextToolbarAction } from "./context-toolbar";

const action = (id: string, label: string, icon: React.ReactNode): ContextToolbarAction => ({
  id,
  label,
  icon,
});

const TEXT_ACTIONS = [
  action("bold", "Bold", <Bold />),
  action("italic", "Italic", <Italic />),
  action("link", "Link", <Link2 />),
];

const IMAGE_ACTIONS = [
  action("crop", "Crop", <Crop />),
  action("remove-bg", "Remove background", <Scissors />),
];

const SHAPE_ACTIONS = [action("fill", "Fill", <Palette />), action("text", "Add text", <Type />)];

const MEDIA_ACTIONS = [action("trim", "Trim", <Scissors />), action("volume", "Volume", <Volume2 />)];

/** Twelve — deliberately past the spec's ceiling of eight. */
const TWELVE_ACTIONS = Array.from({ length: 12 }, (_, i) =>
  action(`a${i}`, `Action ${i}`, <Wand2 />),
);

function toolbar() {
  return screen.getByRole("toolbar");
}

describe("ContextToolbar", () => {
  it("renders the text state as a named toolbar whose icon-only actions have real names", () => {
    render(<ContextToolbar selection="text" actions={TEXT_ACTIONS} onAction={vi.fn()} />);

    const bar = toolbar();
    expect(bar).toHaveAttribute("data-selection", "text");
    // A canvas can hold several of these; an unnamed one is indistinguishable.
    expect(bar).toHaveAccessibleName("Text selection actions");

    // Icons are decorative. The name comes from sr-only text in the DOM, never
    // from the tooltip alone.
    for (const label of ["Bold", "Italic", "Link"]) {
      expect(within(bar).getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders the image state and reports the selection kind programmatically", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ContextToolbar selection="image" actions={IMAGE_ACTIONS} onAction={onAction} />);

    const bar = toolbar();
    expect(bar).toHaveAttribute("data-selection", "image");
    expect(bar).toHaveAccessibleName("Image selection actions");

    await user.click(within(bar).getByRole("button", { name: "Remove background" }));
    expect(onAction).toHaveBeenCalledWith("remove-bg");
  });

  it("renders the shape state and lets a caller name the toolbar itself", () => {
    render(
      <ContextToolbar selection="shape" label="Rectangle actions" actions={SHAPE_ACTIONS} onAction={vi.fn()} />,
    );

    const bar = toolbar();
    expect(bar).toHaveAttribute("data-selection", "shape");
    expect(bar).toHaveAccessibleName("Rectangle actions");
    expect(within(bar).getByRole("button", { name: "Add text" })).toBeInTheDocument();
  });

  it("renders the media state below the selection and opens its menus away from it", () => {
    render(
      <ContextToolbar selection="media" placement="below" actions={MEDIA_ACTIONS} onAction={vi.fn()} />,
    );

    const bar = toolbar();
    expect(bar).toHaveAttribute("data-selection", "media");
    // Placement is expressed, not measured — a host reads this to position.
    expect(bar).toHaveAttribute("data-placement", "below");
    expect(within(bar).getByRole("button", { name: "Trim" })).toBeInTheDocument();
  });

  it("renders the overflow state: the cap bites and the rest collapse into a menu", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ContextToolbar actions={TWELVE_ACTIONS} onAction={onAction} />);

    const bar = toolbar();
    // Eight buttons in the bar — the AI entry plus seven actions — regardless
    // of the twelve that were supplied. Plus the overflow trigger, which is an
    // affordance rather than an action.
    expect(within(bar).getAllByRole("button")).toHaveLength(MAX_TOOLBAR_ACTIONS + 1);
    expect(within(bar).getByRole("button", { name: "Action 6" })).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: "Action 7" })).not.toBeInTheDocument();
    expect(bar).toHaveAttribute("data-overflow-count", "5");

    const trigger = within(bar).getByRole("button", { name: "More actions" });
    // The slot survives the tooltip/menu-trigger composition, so the anatomy
    // the guidance documents is the anatomy in the DOM.
    expect(trigger).toHaveAttribute("data-slot", "context-toolbar-overflow");
    await user.click(trigger);

    const item = await screen.findByRole("menuitem", { name: "Action 7" });
    await user.click(item);
    expect(onAction).toHaveBeenCalledWith("a7");
  });

  it("clamps maxActions to the spec's ceiling — a caller cannot widen the bar", () => {
    const { rerender } = render(<ContextToolbar actions={TWELVE_ACTIONS} maxActions={12} />);
    expect(within(toolbar()).getAllByRole("button")).toHaveLength(MAX_TOOLBAR_ACTIONS + 1);

    // A tighter bar is allowed; a wider one is not.
    rerender(<ContextToolbar actions={TWELVE_ACTIONS} maxActions={4} />);
    expect(within(toolbar()).getAllByRole("button")).toHaveLength(5);
    expect(toolbar()).toHaveAttribute("data-overflow-count", "9");
  });

  it("puts the AI entry first whatever order the actions arrived in", () => {
    render(
      <ContextToolbar
        actions={[...TEXT_ACTIONS, { id: "ai", label: "Generate", icon: <Wand2 /> }]}
        onAction={vi.fn()}
      />,
    );

    const bar = toolbar();
    const buttons = within(bar).getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("data-slot", "context-toolbar-ai");
    expect(buttons[0]).toHaveAccessibleName("AI tools");
  });

  it("keeps the AI entry out of overflow even when every other action collapses", () => {
    render(<ContextToolbar actions={TWELVE_ACTIONS} maxActions={1} />);

    const bar = toolbar();
    const buttons = within(bar).getAllByRole("button");
    // The AI entry and the overflow trigger. Nothing else survives.
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("data-slot", "context-toolbar-ai");
    expect(bar).toHaveAttribute("data-overflow-count", "12");
  });

  it("opens the supplied ai-tools-menu slot from the AI entry", async () => {
    const user = userEvent.setup();
    render(
      <ContextToolbar
        actions={TEXT_ACTIONS}
        aiMenu={<div data-testid="ai-tools-menu">Rewrite · Summarise · Translate</div>}
      />,
    );

    const entry = within(toolbar()).getByRole("button", { name: "AI tools" });
    expect(entry).toHaveAttribute("data-slot", "context-toolbar-ai");

    await user.click(entry);
    expect(await screen.findByTestId("ai-tools-menu")).toBeInTheDocument();
    // The slot is a seam for I4, never an import of it.
    expect(document.querySelector('[data-slot="context-toolbar-ai-menu"]')).toBeInTheDocument();
  });

  it("falls back to onAiSelect when no menu slot is supplied", async () => {
    const onAiSelect = vi.fn();
    const user = userEvent.setup();
    render(<ContextToolbar actions={TEXT_ACTIONS} aiLabel="Ask AI" onAiSelect={onAiSelect} />);

    await user.click(within(toolbar()).getByRole("button", { name: "Ask AI" }));
    expect(onAiSelect).toHaveBeenCalledTimes(1);
  });

  it("does not fire onAction for a disabled action", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <ContextToolbar
        actions={[{ id: "delete", label: "Delete", icon: <Trash2 />, disabled: true }]}
        onAction={onAction}
      />,
    );

    // A disabled toolbar item stays focusable and reports aria-disabled rather
    // than the native attribute — otherwise arrow-key travel along the toolbar
    // would skip it and a keyboard user would never learn it exists.
    const button = within(toolbar()).getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("draws a label beside the icon when asked, without changing the accessible name", () => {
    render(
      <ContextToolbar
        actions={[{ id: "edit", label: "Edit", icon: <Wand2 />, showLabel: true }]}
        onAction={vi.fn()}
      />,
    );

    const button = within(toolbar()).getByRole("button", { name: "Edit" });
    expect(button).toHaveTextContent("Edit");
    expect(button.querySelector(".sr-only")).toBeNull();
  });

  it("passes className through", () => {
    render(<ContextToolbar className="test-class" />);
    expect(document.querySelector('[data-slot="context-toolbar"]')!.className).toContain("test-class");
  });
});
