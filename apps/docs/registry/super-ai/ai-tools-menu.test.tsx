import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AiToolsMenu, type AiToolGroup, type ToolSelection } from "./ai-tools-menu";

const SELECTION: ToolSelection = { label: "Hero image", type: "Image" };

const IMAGE_GROUPS: AiToolGroup[] = [
  {
    id: "edit",
    label: "Edit",
    actions: [
      { id: "remove-bg", title: "Remove background", description: "Cut out the subject" },
      { id: "expand", title: "Magic expand", description: "Extend the frame", cost: { amount: 17 } },
    ],
  },
  {
    id: "generate",
    label: "Generate",
    actions: [
      { id: "variations", title: "Variations", cost: { amount: 55 } },
      { id: "upscale", title: "Upscale", cost: { amount: 900, per: "min" } },
      { id: "relight", title: "Relight", cost: { amount: 120 }, locked: true },
    ],
  },
  {
    id: "careful",
    label: "Careful",
    destructive: true,
    actions: [
      { id: "replace-all", title: "Replace every layer", description: "Cannot be undone" },
      { id: "regenerate", title: "Regenerate from scratch", cost: { amount: 2400 } },
    ],
  },
];

const TEXT_GROUPS: AiToolGroup[] = [
  { id: "rewrite", label: "Rewrite", actions: [{ id: "shorten", title: "Shorten" }] },
];

const rows = (root: HTMLElement) => [...root.querySelectorAll("[data-tool-action]")] as HTMLElement[];

const groups = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-slot="ai-tools-menu-group"]')] as HTMLElement[];

describe("AiToolsMenu", () => {
  it("renders the grouped-rows state", () => {
    const { container } = render(
      <AiToolsMenu presentation="inline" selection={SELECTION} groups={IMAGE_GROUPS} />,
    );
    // Grouped by intent — three groups, each an addressable region.
    const rendered = groups(container);
    expect(rendered).toHaveLength(3);
    expect(rendered.map((g) => g.getAttribute("aria-label"))).toEqual([
      "Edit",
      "Generate",
      "Careful",
    ]);
    // Every action still renders, as an A9 row rather than a bespoke one.
    expect(rows(container)).toHaveLength(7);
    expect(container.querySelectorAll('[data-slot="entity-row"]')).toHaveLength(7);
    expect(screen.getByText("Remove background")).toBeInTheDocument();
  });

  it("renders the cost-chips state", () => {
    const { container } = render(
      <AiToolsMenu presentation="inline" selection={SELECTION} groups={IMAGE_GROUPS} />,
    );
    // A chip on every row that spends, and none on the rows that do not.
    expect(container.querySelectorAll('[data-slot="cost-chip"]')).toHaveLength(5);
    expect(screen.getByText(/17 credits/)).toBeInTheDocument();
    // The rate form survives, because the text comes from formatCost.
    expect(screen.getByText(/900 credits\/min/)).toBeInTheDocument();
  });

  it("renders the destructive-group state", () => {
    const { container } = render(
      <AiToolsMenu presentation="inline" selection={SELECTION} groups={IMAGE_GROUPS} />,
    );
    const destructive = container.querySelector<HTMLElement>(
      '[data-slot="ai-tools-menu-group"][data-destructive]',
    )!;
    expect(destructive).toHaveAttribute("aria-label", "Careful");
    expect(within(destructive).getByText("Replace every layer")).toBeInTheDocument();
    // Below a rule: the element immediately before it is the separator.
    expect(destructive.previousElementSibling).toHaveAttribute("role", "separator");
  });

  it("passes className through", () => {
    render(<AiToolsMenu groups={TEXT_GROUPS} className="test-class" />);
    expect(document.querySelector('[data-slot="ai-tools-menu"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: the spec's decisions, not its descriptions.
  // ---------------------------------------------------------------------------

  it("sinks expensive or destructive groups below every ordinary group", () => {
    // Declared first by the caller; still rendered last, so the rule above it
    // is structural rather than something each caller has to get right.
    const { container } = render(
      <AiToolsMenu presentation="inline" groups={[IMAGE_GROUPS[2], IMAGE_GROUPS[0], IMAGE_GROUPS[1]]} />,
    );
    expect(groups(container).map((g) => g.getAttribute("aria-label"))).toEqual([
      "Edit",
      "Generate",
      "Careful",
    ]);
    expect(groups(container).at(-1)).toHaveAttribute("data-destructive");
  });

  it("puts a rule between every group so no group runs into the next", () => {
    const { container } = render(<AiToolsMenu presentation="inline" groups={IMAGE_GROUPS} />);
    // Three groups, no selection header: two rules.
    expect(container.querySelectorAll('[role="separator"]')).toHaveLength(2);
  });

  it("does not signal destructive with colour alone", () => {
    const { container } = render(
      <AiToolsMenu presentation="inline" groups={IMAGE_GROUPS} selection={SELECTION} />,
    );
    const destructiveRow = rows(container).find((r) => r.dataset.toolAction === "replace-all")!;
    // A programmatic state and a readable group name, not a red tint.
    expect(destructiveRow).toHaveAttribute("data-destructive");
    expect(screen.getByText("Careful")).toBeInTheDocument();
    expect(destructiveRow.className).not.toMatch(/destructive/);
  });

  it("names the surface after the selection, because the selection is the prompt context", () => {
    render(<AiToolsMenu presentation="inline" selection={SELECTION} groups={IMAGE_GROUPS} />);
    expect(screen.getByRole("group", { name: "AI tools for Hero image" })).toBeInTheDocument();
  });

  it("states what it is acting on", () => {
    const { container } = render(
      <AiToolsMenu presentation="inline" selection={SELECTION} groups={TEXT_GROUPS} />,
    );
    const header = container.querySelector<HTMLElement>('[data-slot="ai-tools-menu-selection"]')!;
    expect(within(header).getByText("Hero image")).toBeInTheDocument();
    expect(within(header).getByText("Selected Image")).toBeInTheDocument();
  });

  it("falls back to a generic name when nothing is selected", () => {
    const { container } = render(<AiToolsMenu presentation="inline" groups={TEXT_GROUPS} />);
    expect(container.querySelector('[data-slot="ai-tools-menu-selection"]')).toBeNull();
    expect(screen.getByRole("group", { name: "AI tools" })).toBeInTheDocument();
  });

  it("changes its row set with the selected object type", () => {
    // Data-driven, like F4: the same component, a different array.
    const { container, rerender } = render(<AiToolsMenu presentation="inline" groups={IMAGE_GROUPS} />);
    expect(rows(container).some((r) => r.dataset.toolAction === "remove-bg")).toBe(true);

    rerender(<AiToolsMenu presentation="inline" groups={TEXT_GROUPS} />);
    expect(rows(container).map((r) => r.dataset.toolAction)).toEqual(["shorten"]);
  });

  it("renders as a menu behind a trigger", async () => {
    render(<AiToolsMenu groups={IMAGE_GROUPS} selection={SELECTION} presentation="menu" />);
    await userEvent.click(screen.getByRole("button", { name: "AI tools" }));
    expect(await screen.findByRole("menu", { name: "AI tools for Hero image" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(7);
    // Groups and their rule survive inside the menu.
    expect(screen.getAllByRole("separator").length).toBeGreaterThanOrEqual(2);
  });

  it("uses the caller's own element as the trigger rather than wrapping it", async () => {
    render(<AiToolsMenu groups={TEXT_GROUPS} trigger={<button type="button">Magic Studio</button>} />);
    expect(screen.queryByRole("button", { name: "AI tools" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Magic Studio" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });

  it("does not nest a button inside a menu item", async () => {
    render(<AiToolsMenu groups={TEXT_GROUPS} />);
    await userEvent.click(screen.getByRole("button", { name: "AI tools" }));
    const item = (await screen.findAllByRole("menuitem"))[0];
    // A9 renders a plain div inside the menu item; the item is the control.
    expect(item.querySelector("button")).toBeNull();
  });

  it("keeps locked rows visible with their price, but not actionable", async () => {
    const onAction = vi.fn();
    const { container } = render(
      <AiToolsMenu presentation="inline" groups={IMAGE_GROUPS} onAction={onAction} />,
    );
    const locked = rows(container).find((r) => r.hasAttribute("data-locked"))!;
    // Never the padlock alone.
    expect(within(locked).getByText("Locked")).toBeInTheDocument();
    // Still priced, so an upgrade prompt has a subject.
    expect(within(locked).getByText(/120 credits/)).toBeInTheDocument();
    // Not a button at all — A9 only becomes one when given a handler.
    expect(locked.tagName).toBe("DIV");
    await userEvent.click(locked);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("reports the chosen action inline", async () => {
    const onAction = vi.fn();
    render(<AiToolsMenu presentation="inline" groups={IMAGE_GROUPS} onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: /Magic expand/ }));
    expect(onAction).toHaveBeenCalledWith("expand");
  });

  it("reports the chosen action from the menu", async () => {
    const onAction = vi.fn();
    render(<AiToolsMenu groups={IMAGE_GROUPS} onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: "AI tools" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Variations/ }));
    expect(onAction).toHaveBeenCalledWith("variations");
  });
});
