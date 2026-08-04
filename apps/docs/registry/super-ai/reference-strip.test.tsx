import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReferenceStrip, type ReferenceStripItem } from "./reference-strip";

describe("ReferenceStrip", () => {
  it("renders the empty state", async () => {
    const onAdd = vi.fn();
    render(<ReferenceStrip items={[]} onAdd={onAdd} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "empty");
    expect(document.querySelector('[data-slot="reference-strip-empty"]')).toBeInTheDocument();
    expect(screen.getByText("No references yet")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add reference/i }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("renders the filled state", async () => {
    const onRemove = vi.fn();
    const items: ReferenceStripItem[] = [
      { id: "ref-1", thumbnail: { src: "/refs/one.png", alt: "Concept sketch of a lighthouse" }, onRemove },
      { id: "ref-2", thumbnail: { src: "/refs/two.png", alt: "Photo of a coastline" } },
    ];
    render(<ReferenceStrip items={items} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "filled");
    expect(root).toHaveAttribute("role", "region");

    const thumbnail = screen.getByAltText("Concept sketch of a lighthouse");
    expect(thumbnail.tagName).toBe("IMG");
    expect(thumbnail).toHaveAttribute("src", "/refs/one.png");

    // Plain (roleless) items show no role label text.
    expect(document.querySelector('[data-slot="reference-strip-role"]')).not.toBeInTheDocument();

    // Remove is a per-slot control with a real accessible name.
    await userEvent.click(screen.getByRole("button", { name: /remove reference/i }));
    expect(onRemove).toHaveBeenCalledOnce();

    // Keyboard-reachable scroll affordances (Carousel base).
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next slide/i })).toBeInTheDocument();
  });

  it("renders the with-roles state", async () => {
    const onMove = vi.fn();
    const onAdd = vi.fn();
    const items: ReferenceStripItem[] = [
      { id: "first", role: "first-frame", thumbnail: { src: "/refs/first.png", alt: "First frame of the shot" } },
      { id: "last", role: "last-frame" }, // empty typed slot — stays visible rather than collapsing
      { id: "char", role: "character", thumbnail: { src: "/refs/char.png", alt: "Reference of the main character" } },
    ];
    render(<ReferenceStrip items={items} onMove={onMove} onAdd={onAdd} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "with-roles");

    // Role labels are real text, not colour-only.
    expect(screen.getByText("First frame")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();

    // The empty "last frame" slot is still present and actionable, not collapsed out of the strip.
    const emptySlotButton = screen.getByRole("button", { name: /last frame/i });
    await userEvent.click(emptySlotButton);
    expect(onAdd).toHaveBeenCalledWith("last-frame");

    // Reorder controls carry real accessible names.
    await userEvent.click(screen.getByRole("button", { name: /move first frame right/i }));
    expect(onMove).toHaveBeenCalledWith("first", "right");
    // The first slot can't move further left.
    expect(screen.getByRole("button", { name: /move first frame left/i })).toBeDisabled();
  });

  it("passes className through", () => {
    render(<ReferenceStrip className="test-class" />);
    expect(document.querySelector('[data-slot="reference-strip"]')!.className).toContain("test-class");
  });
});
