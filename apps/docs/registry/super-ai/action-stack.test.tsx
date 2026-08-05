import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionStack, type AssetAction } from "./action-stack";

const VIDEO_ACTIONS: AssetAction[] = [
  { id: "extend", title: "Extend", description: "Add 4 seconds", cost: { amount: 55 } },
  { id: "upscale", title: "Upscale", description: "To 4K", cost: { amount: 900, per: "min" } },
  { id: "lipsync", title: "Use in Lip sync", cost: { amount: 120 }, locked: true },
];

const IMAGE_ACTIONS: AssetAction[] = [
  { id: "variations", title: "Variations", cost: { amount: 17 } },
  { id: "inpaint", title: "Inpaint" },
];

const rows = (root: HTMLElement) =>
  [...root.querySelectorAll("[data-action-id]")] as HTMLElement[];

describe("ActionStack", () => {
  it("renders the menu state", async () => {
    render(<ActionStack actions={VIDEO_ACTIONS} presentation="menu" />);
    await userEvent.click(screen.getByRole("button", { name: "Use this result" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("renders the inline state", () => {
    const { container } = render(<ActionStack actions={VIDEO_ACTIONS} presentation="inline" />);
    expect(container.querySelector('[data-slot="action-stack"]')).toHaveAttribute(
      "data-presentation",
      "inline",
    );
    expect(rows(container)).toHaveLength(3);
    // A9 keeps its own slot — the row is visibly an entity-row in the DOM.
    expect(container.querySelectorAll('[data-slot="entity-row"]')).toHaveLength(3);
    // No trigger: the rows are the surface.
    expect(screen.queryByRole("button", { name: "Use this result" })).not.toBeInTheDocument();
  });

  it("renders the cost-per-action state", () => {
    const { container } = render(<ActionStack actions={VIDEO_ACTIONS} presentation="inline" />);
    // Every row that has a cost shows one — chaining is where credits vanish.
    expect(container.querySelectorAll('[data-slot="cost-chip"]')).toHaveLength(3);
    expect(screen.getByText(/55 credits/)).toBeInTheDocument();
    // The rate form survives, because the text comes from formatCost.
    expect(screen.getByText(/900 credits\/min/)).toBeInTheDocument();
  });

  it("renders the locked-rows state", () => {
    const { container } = render(<ActionStack actions={VIDEO_ACTIONS} presentation="inline" />);
    const locked = rows(container).find((r) => r.hasAttribute("data-locked"))!;
    // Never the padlock alone.
    expect(within(locked).getByText("Locked")).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ActionStack actions={IMAGE_ACTIONS} className="test-class" />);
    expect(document.querySelector('[data-slot="action-stack"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("renders a chip for every row that has a cost, and none for rows without", () => {
    const { container } = render(<ActionStack actions={IMAGE_ACTIONS} presentation="inline" />);
    const [withCost, withoutCost] = rows(container);
    expect(within(withCost).getByText(/17 credits/)).toBeInTheDocument();
    expect(withoutCost.querySelector('[data-slot="cost-chip"]')).toBeNull();
  });

  it("changes its row set with the asset type", () => {
    // Data-driven, not a variant per media kind: same component, different array.
    const { container, rerender } = render(
      <ActionStack actions={VIDEO_ACTIONS} presentation="inline" />,
    );
    expect(rows(container).some((r) => r.textContent?.includes("Extend"))).toBe(true);

    rerender(<ActionStack actions={IMAGE_ACTIONS} presentation="inline" />);
    const titles = rows(container).map((r) => r.textContent ?? "");
    expect(titles).toHaveLength(2);
    expect(titles.some((t) => t.includes("Extend"))).toBe(false);
    expect(titles.some((t) => t.includes("Inpaint"))).toBe(true);
  });

  it("does not make locked rows actionable", async () => {
    const onAction = vi.fn();
    const { container } = render(
      <ActionStack actions={VIDEO_ACTIONS} presentation="inline" onAction={onAction} />,
    );
    const locked = rows(container).find((r) => r.hasAttribute("data-locked"))!;
    // Not a button at all — A9 only becomes one when given a handler.
    expect(locked.tagName).toBe("DIV");
    await userEvent.click(locked);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("still shows a locked row's cost, so you can see what you would be buying", () => {
    const { container } = render(<ActionStack actions={VIDEO_ACTIONS} presentation="inline" />);
    const locked = rows(container).find((r) => r.hasAttribute("data-locked"))!;
    expect(within(locked).getByText(/120 credits/)).toBeInTheDocument();
  });

  it("reports the chosen action inline", async () => {
    const onAction = vi.fn();
    render(<ActionStack actions={IMAGE_ACTIONS} presentation="inline" onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: /Variations/ }));
    expect(onAction).toHaveBeenCalledWith("variations");
  });

  it("reports the chosen action from the menu", async () => {
    const onAction = vi.fn();
    render(<ActionStack actions={IMAGE_ACTIONS} onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: "Use this result" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Variations/ }));
    expect(onAction).toHaveBeenCalledWith("variations");
  });

  it("does not nest a button inside a menu item", async () => {
    render(<ActionStack actions={IMAGE_ACTIONS} />);
    await userEvent.click(screen.getByRole("button", { name: "Use this result" }));
    const item = (await screen.findAllByRole("menuitem"))[0];
    // A9 renders a plain div inside the menu item; the item is the control.
    expect(item.querySelector("button")).toBeNull();
  });

  it("uses the caller's own element as the trigger rather than wrapping it", async () => {
    render(
      <ActionStack actions={IMAGE_ACTIONS} trigger={<button type="button">More actions</button>} />,
    );
    expect(screen.queryByRole("button", { name: "Use this result" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });
});
